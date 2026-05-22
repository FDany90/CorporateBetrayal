import { Room, Client } from "colyseus";
import { GameState, Player, Pairing } from "../schema/GameState";
import { roundRobinSchedule, ParejaPlana } from "../emparejador";
import { CONFIG_DEFECTO, GameConfig } from "../config";
import { CHALLENGE_REGISTRY, ChallengeDefinition } from "../challenges/registry";

// Ids del catálogo de avatares — los dibuja el cliente con SVGs (ver
// web-angular/src/app/avatars.ts). El server solo persiste el id como
// string opaco; no necesita saber qué dibujo le corresponde.
const AVATARS = [
  // Empleados "estándar"
  "emp-direccion", "emp-sistemas",  "emp-rrhh",      "emp-seguridad",
  // Personalidades extremas (sátira)
  "emp-coach",     "emp-visionario","emp-quemado",   "emp-jefe",
  // Tipos de oficinista
  "emp-nerd",      "emp-viejo",     "emp-hippie",    "emp-remera",
  // Placeholders pendientes de SVG
  "emp-finanzas",  "emp-legales",   "emp-disenio",
];
const BOT_NAMES = [
  "Ana", "Beto", "Caro", "Elena", "Fede", "Gastón",
  "Inés", "Lucía", "Marcos", "Nadia", "Omar",
];

interface JoinOptions {
  code?: string;
  nickname?: string;
  avatar?: string;
  playerToken?: string;
}

/**
 * Sala = una partida.
 * PASO 1: lobby — ingreso, lista de jugadores en vivo, reconexión, bots.
 * PASO 2: motor de fases corriendo El Botón del Bonus. Tras el briefing,
 *         el desafío encadena varias tandas de llamadas:
 *         briefing → [ calls → result ] × N tandas → lobby.
 *         Las fases avanzan cuando todos los jugadores actuaron.
 */
export class GameRoom extends Room<GameState> {
  maxClients = 12;

  /* Estado del motor que vive solo en memoria del servidor (no se
     sincroniza con los clientes). Paso 3. */
  /** Configuración de la partida (estructura de rondas). */
  private config: GameConfig = CONFIG_DEFECTO;
  /** Minijuego de la ronda en curso (null en una ronda placeholder). */
  private challengeActual: ChallengeDefinition | null = null;
  /** Minijuegos ya usados en esta partida (para no repetir si se puede). */
  private usados = new Set<string>();
  /** Calendario de parejas por tanda (round-robin, sin repetir). Paso 2.5. */
  private schedule: ParejaPlana[][] = [];

  onCreate(options: JoinOptions) {
    this.state = new GameState();
    this.state.code = (options.code || genCode()).toUpperCase();
    this.setMetadata({ code: this.state.code });

    // --- mensajes de lobby · Paso 1 ---
    this.onMessage("ready", (client, value: boolean) => {
      const p = this.state.players.get(client.sessionId);
      if (p) p.ready = !!value;
    });
    this.onMessage("dev:addBots", (_c, count: number) => {
      if (this.state.status === "lobby") {
        this.addBots(typeof count === "number" ? count : 3);
      }
    });
    this.onMessage("dev:clearBots", () => {
      if (this.state.status !== "lobby") return;
      for (const [id, p] of this.state.players) {
        if (p.isBot) this.state.players.delete(id);
      }
    });

    /* ---- Atajos de desarrollo para probar pantallas sin fricción ----
       No validan anfitrión: son herramientas de prueba locales. */

    // Vuelve al lobby desde cualquier fase, sin reiniciar el server.
    this.onMessage("dev:volverLobby", () => {
      if (this.state.status === "lobby") return;
      this.volverLobby();
      console.log("[GameRoom] dev: vuelta al lobby");
    });

    // Arranca una partida ya: rellena bots hasta `minJugadores`, ficha a
    // todos y empieza. Si viene `challengeId`, juega UNA sola ronda con
    // ese minijuego (para probarlo directo); si no, usa el config normal.
    this.onMessage(
      "dev:quickStart",
      (_c, opts: { challengeId?: string } = {}) => {
        if (this.state.status !== "lobby") return;
        this.devQuickStart(opts?.challengeId);
      }
    );

    // Fuerza el avance de la fase actual: auto-completa lo que falte
    // (acks pendientes, decisiones/votos) y dispara el chequeo de avance.
    this.onMessage("dev:skipPhase", () => {
      if (this.state.status !== "playing") return;
      this.devSkipPhase();
    });

    // El anfitrión puede expulsar a un jugador del lobby (p. ej. si se cayó
    // y no queremos esperar el plazo de reconexión para empezar).
    this.onMessage("kick", (client, targetId: string) => {
      if (this.state.status !== "lobby") return;
      if (client.sessionId !== this.state.hostId) return;
      if (targetId === this.state.hostId) return; // el anfitrión no se autoexpulsa
      if (!this.state.players.has(targetId)) return;

      this.state.players.delete(targetId);
      // Si sigue conectado, cerrarle la conexión.
      const c = this.clients.find((cl) => cl.sessionId === targetId);
      if (c) c.leave(4000); // 4000 = expulsado por el anfitrión
      console.log(`[GameRoom] ${targetId} expulsado por el anfitrión`);
    });

    // --- mensajes de partida · Paso 2 ---
    // Solo el anfitrión puede empezar la partida.
    this.onMessage("startGame", (client) => this.iniciarPartida(client));

    this.onMessage("ack", (client) => {
      const p = this.state.players.get(client.sessionId);
      if (!p) return;
      // En la fase de voto, "ack" significa "confirmo mi voto y ya no lo
      // cambio" — solo es válido si efectivamente voté a alguien. Sin
      // esta validación, alguien podría confirmar sin votar y bloquear
      // el avance (el server seguiría esperando que vote).
      if (this.state.phase === "vote" && !p.decision) return;
      p.acted = true;
      this.chequearAvance();
    });

    // 'decidir' cubre dos cosas según la fase:
    //  - en 'calls' (El Botón): el valor es "verde" | "rojo".
    //  - en 'vote'  (El Recorte): el valor es el id del jugador votado.
    this.onMessage("decidir", (client, value: string) => {
      const p = this.state.players.get(client.sessionId);
      if (!p) return;

      if (this.state.phase === "calls") {
        if (value !== "verde" && value !== "rojo") return;
        p.decision = value;
        this.chequearAvance();
      } else if (this.state.phase === "vote") {
        // En vote, el voto se puede cambiar libremente hasta que el
        // jugador confirme (`ack`). Una vez confirmado, queda firme:
        // bloqueamos cambios para que no se altere el conteo en vivo
        // luego del compromiso público de "ya voté".
        if (p.acted) return;
        if (value === client.sessionId) return; // no se puede autovotar
        if (!this.state.players.has(value)) return;
        p.decision = value;
        // No tocamos `acted`: el avance lo dispara el handler "ack".
      }
    });

    console.log(`[GameRoom] creada · código ${this.state.code}`);
  }

  /* Ingreso y reconexión por token · Paso 1 */
  onJoin(client: Client, options: JoinOptions) {
    // Reconexión por token persistente.
    if (options.playerToken) {
      for (const [oldId, p] of this.state.players) {
        if (p.token === options.playerToken && !p.isBot) {
          this.state.players.delete(oldId);
          p.id = client.sessionId;
          p.connected = true;
          this.state.players.set(client.sessionId, p);
          // El sessionId cambió: si era el anfitrión, traspasar el rol.
          if (this.state.hostId === oldId) this.state.hostId = client.sessionId;
          console.log(`[GameRoom] ${p.nickname} reingresó`);
          return;
        }
      }
    }

    const p = new Player();
    p.id = client.sessionId;
    p.token = options.playerToken || client.sessionId;
    p.nickname = (options.nickname || "Sin nombre").slice(0, 20);
    p.avatar = options.avatar || AVATARS[0];
    this.state.players.set(client.sessionId, p);
    // El primer jugador real en entrar (el que creó la sala) es el anfitrión.
    if (!this.state.players.has(this.state.hostId)) {
      this.state.hostId = client.sessionId;
    }
    console.log(`[GameRoom] ${p.nickname} ingresó (${this.state.players.size})`);
  }

  async onLeave(client: Client, consented: boolean) {
    const p = this.state.players.get(client.sessionId);
    if (p) p.connected = false;

    if (consented) {
      this.state.players.delete(client.sessionId);
      this.reasignarHost();
      this.chequearAvance();
      return;
    }
    try {
      await this.allowReconnection(client, 60);
      const back = this.state.players.get(client.sessionId);
      if (back) back.connected = true;
    } catch {
      this.state.players.delete(client.sessionId);
      this.reasignarHost();
      this.chequearAvance();
    }
  }

  /** Si el anfitrión ya no está en la sala, se lo pasa a otro jugador real. */
  private reasignarHost() {
    if (this.state.players.has(this.state.hostId)) return;
    for (const [id, p] of this.state.players) {
      if (!p.isBot) {
        this.state.hostId = id;
        return;
      }
    }
    this.state.hostId = "";
  }

  /* ---------- motor de partida · Paso 3 ---------- */

  private iniciarPartida(client: Client) {
    if (this.state.status !== "lobby") return;
    // Solo el anfitrión puede empezar.
    if (client.sessionId !== this.state.hostId) return;
    if (this.state.players.size < 2) return;
    // Todos los jugadores deben haber fichado entrada (los bots ya lo están).
    for (const [, p] of this.state.players) {
      if (!p.ready) return;
    }

    this.state.status = "playing";
    this.config = CONFIG_DEFECTO;
    this.usados.clear();
    this.state.rondasTotal = this.config.rounds.length;
    this.state.ronda = 0;

    // Reiniciar puntajes para la partida nueva.
    for (const [, p] of this.state.players) {
      p.influence = 0;
      p.lastDelta = 0;
    }

    // Antes del primer briefing: pantalla "Comunicado oficial" de RR.HH.
    // que da la premisa narrativa del juego (ascenso + despido en juego).
    // Requiere ack de todos los jugadores antes de arrancar la ronda 1.
    this.iniciarFase("comunicado");
    console.log(
      `[GameRoom] partida iniciada · ${this.state.rondasTotal} rondas`
    );
  }

  /**
   * Arranca la ronda `n`: elige su minijuego del pool configurado y entra
   * al briefing. Si la ronda no tiene un minijuego implementado (ej. ronda
   * grupal por ahora), `challengeActual` queda en null y se juega como
   * placeholder.
   */
  private iniciarRonda(n: number) {
    this.state.ronda = n;
    const spec = this.config.rounds[n - 1];
    this.state.rondaTipo = spec ? spec.tipo : "";

    // Candidatos: minijuegos del pool que existen y coinciden con el tipo.
    const candidatos = spec
      ? spec.challengePool.filter((id) => {
          const def = CHALLENGE_REGISTRY[id];
          return !!def && def.format === spec.tipo;
        })
      : [];
    // Preferir uno no usado; si no hay, reusar (con 1 solo minijuego, reusa).
    const elegido =
      candidatos.find((id) => !this.usados.has(id)) ?? candidatos[0] ?? "";

    this.challengeActual = elegido ? CHALLENGE_REGISTRY[elegido] : null;
    this.state.challengeId = elegido;
    if (elegido) this.usados.add(elegido);

    // Si el minijuego es de llamadas, armar el calendario de tandas.
    this.schedule = [];
    this.state.tanda = 0;
    this.state.tandasTotal = 0;
    if (
      this.challengeActual?.kind === "llamadas" &&
      this.challengeActual.callRounds > 0
    ) {
      const ids = [...this.state.players.keys()];
      this.schedule = roundRobinSchedule(ids, this.challengeActual.callRounds);
      this.state.tandasTotal = this.schedule.length;
    }

    // Toda ronda arranca con el briefing del minijuego (su explicación).
    this.iniciarFase("briefing");
  }

  /** Entra a una fase de "ack" (briefing/result/marcador/final): resetea
   *  `acted` y deja a los bots ya confirmados. */
  private iniciarFase(fase: string) {
    this.state.phase = fase;
    for (const [, p] of this.state.players) {
      p.acted = false;
      if (p.isBot) p.acted = true;
    }
  }

  /**
   * Arranca la tanda `n` (1-based): toma las parejas del calendario, entra
   * a la fase 'calls' y resetea las decisiones (los bots deciden al azar).
   */
  private iniciarTanda(n: number) {
    this.state.tanda = n;
    this.state.phase = "calls";

    this.state.pairings.clear();
    for (const pareja of this.schedule[n - 1] ?? []) {
      const pr = new Pairing();
      pr.aId = pareja.aId;
      pr.bId = pareja.bId;
      this.state.pairings.push(pr);
    }

    for (const [, p] of this.state.players) {
      p.acted = false;
      p.decision = "";
      if (p.isBot) p.decision = Math.random() < 0.5 ? "verde" : "rojo";
    }

    // Si todas las parejas de esta tanda quedaron formadas solo por bots
    // (ej. con 3 jugadores, en la tanda donde el único humano queda sin
    // pareja), ya decidieron todos y nadie dispararía el avance: lo
    // chequeamos acá. En el caso normal (parejas con humanos) no avanza
    // hasta que esos humanos decidan.
    this.chequearAvance();
  }

  /** Cierra la ronda actual: marcador entre rondas, o pantalla final. */
  private terminarRonda() {
    this.state.pairings.clear();
    if (this.state.ronda < this.state.rondasTotal) {
      this.iniciarFase("marcador");
    } else {
      this.iniciarFase("final");
    }
  }

  /** Revisa si la fase actual puede avanzar. */
  private chequearAvance() {
    const fase = this.state.phase;

    // Fases de "ack": avanzan cuando todos los conectados confirmaron.
    if (
      fase === "comunicado" ||
      fase === "briefing" ||
      fase === "meeting" ||
      fase === "result" ||
      fase === "marcador" ||
      fase === "final"
    ) {
      for (const [, p] of this.state.players) {
        if (p.connected && !p.acted) return;
      }
      if (fase === "comunicado") {
        // Del comunicado oficial a la primera ronda.
        this.iniciarRonda(1);
      } else if (fase === "briefing") {
        // Del briefing a la primera fase del minijuego, según su kind.
        const kind = this.challengeActual?.kind;
        if (kind === "llamadas" && this.state.tandasTotal > 0) {
          this.iniciarTanda(1);
        } else if (kind === "votacion") {
          this.iniciarFase("meeting");
        } else {
          this.terminarRonda(); // ronda placeholder, sin minijuego
        }
      } else if (fase === "meeting") {
        this.iniciarVotacion(); // de la reunión al voto
      } else if (fase === "result") {
        // ¿Quedan tandas en este minijuego? → siguiente; si no, fin de ronda.
        if (this.state.tanda < this.state.tandasTotal) {
          this.iniciarTanda(this.state.tanda + 1);
        } else {
          this.terminarRonda();
        }
      } else if (fase === "marcador") {
        this.iniciarRonda(this.state.ronda + 1);
      } else {
        this.volverLobby(); // fin de la pantalla final
      }
      return;
    }

    if (fase === "calls") {
      const enPareja = new Set<string>();
      for (const pr of this.state.pairings) {
        enPareja.add(pr.aId);
        enPareja.add(pr.bId);
      }
      for (const id of enPareja) {
        const p = this.state.players.get(id);
        if (p && p.connected && !p.decision) return;
      }
      this.resolver();
      return;
    }

    if (fase === "vote") {
      // El voto avanza cuando todos los conectados CONFIRMARON
      // (`acted`). El campo `decision` se propaga en vivo a todos
      // los clientes durante la deliberación, pero el motor solo
      // mira `acted` para resolver — así un jugador puede cambiar
      // su voto sin disparar la resolución hasta que oprima Confirmar.
      for (const [, p] of this.state.players) {
        if (p.connected && !p.acted) return;
      }
      this.resolverVotacion();
    }
  }

  /** Aplica el puntaje del minijuego actual y pasa a la fase de resultado. */
  private resolver() {
    for (const [, p] of this.state.players) p.lastDelta = 0;

    const puntuar = this.challengeActual?.puntuarPareja;
    if (puntuar) {
      for (const pr of this.state.pairings) {
        const a = this.state.players.get(pr.aId);
        const b = this.state.players.get(pr.bId);
        if (!a || !b) continue;
        const [da, db] = puntuar(a.decision, b.decision);
        a.influence += da;
        a.lastDelta = da;
        b.influence += db;
        b.lastDelta = db;
      }
    }
    this.iniciarFase("result");
    console.log("[GameRoom] tanda resuelta");
  }

  /** Entra a la fase de voto: resetea decisiones; los bots votan al azar
   *  Y confirman al instante (acted=true), porque no participan de la
   *  deliberación social. Los humanos quedan con acted=false hasta que
   *  oprimen Confirmar Voto en el cliente. */
  private iniciarVotacion() {
    this.state.phase = "vote";
    this.state.pairings.clear();
    const ids = [...this.state.players.keys()];
    for (const [, p] of this.state.players) {
      p.acted = false;
      p.decision = "";
      if (p.isBot) {
        const otros = ids.filter((id) => id !== p.id);
        p.decision =
          otros[Math.floor(Math.random() * otros.length)] ?? "";
        p.acted = true; // los bots votan y confirman al instante
      }
    }
  }

  /** Cuenta los votos: el más votado recibe `voteDelta` (negativo en El
   *  Recorte). Si hay empate, lo reciben todos los empatados. */
  private resolverVotacion() {
    for (const [, p] of this.state.players) p.lastDelta = 0;

    const votos = new Map<string, number>();
    for (const [, p] of this.state.players) {
      if (p.decision) {
        votos.set(p.decision, (votos.get(p.decision) ?? 0) + 1);
      }
    }
    let max = 0;
    for (const n of votos.values()) if (n > max) max = n;

    const delta = this.challengeActual?.voteDelta ?? 0;
    if (max > 0 && delta !== 0) {
      for (const [, p] of this.state.players) {
        if ((votos.get(p.id) ?? 0) === max) {
          p.influence += delta;
          p.lastDelta = delta;
        }
      }
    }
    this.iniciarFase("result");
    console.log("[GameRoom] votación resuelta");
  }

  private volverLobby() {
    this.state.status = "lobby";
    this.state.phase = "lobby";
    this.state.challengeId = "";
    this.state.pairings.clear();
    this.state.tanda = 0;
    this.state.tandasTotal = 0;
    this.state.ronda = 0;
    this.state.rondasTotal = 0;
    this.state.rondaTipo = "";
    this.schedule = [];
    this.challengeActual = null;
    this.usados.clear();
    for (const [, p] of this.state.players) {
      p.ready = false;
      p.decision = "";
      p.acted = false;
    }
  }

  /* ---------- atajos de desarrollo ---------- */

  /** Arranca una partida sin fricción para probar. Rellena bots hasta un
   *  mínimo jugable, ficha a todos y empieza. Con `challengeId`, juega UNA
   *  sola ronda de ese minijuego entrando directo a su briefing (sin
   *  comunicado); sin él, usa el config por defecto (con comunicado). */
  private devQuickStart(challengeId?: string) {
    const MIN_JUGADORES = 3; // suficiente para parejas y votación grupal
    if (this.state.players.size < MIN_JUGADORES) {
      this.addBots(MIN_JUGADORES - this.state.players.size);
    }
    for (const [, p] of this.state.players) p.ready = true;

    this.state.status = "playing";
    this.usados.clear();
    this.state.ronda = 0;
    for (const [, p] of this.state.players) {
      p.influence = 0;
      p.lastDelta = 0;
    }

    const def = challengeId ? CHALLENGE_REGISTRY[challengeId] : null;
    if (def) {
      this.config = { rounds: [{ tipo: def.format, challengePool: [def.id] }] };
      this.state.rondasTotal = 1;
      this.iniciarRonda(1); // directo al briefing del minijuego elegido
    } else {
      this.config = CONFIG_DEFECTO;
      this.state.rondasTotal = this.config.rounds.length;
      this.iniciarFase("comunicado");
    }
    console.log(
      `[GameRoom] dev: quick start (${challengeId ?? "config normal"})`
    );
  }

  /** Fuerza el avance de la fase actual auto-completando lo que falte:
   *  decisiones en 'calls', voto+confirmación en 'vote', acks en el resto.
   *  Luego dispara el chequeo de avance normal. */
  private devSkipPhase() {
    const fase = this.state.phase;
    if (fase === "calls") {
      for (const [, p] of this.state.players) {
        if (!p.decision) p.decision = Math.random() < 0.5 ? "verde" : "rojo";
      }
    } else if (fase === "vote") {
      const ids = [...this.state.players.keys()];
      for (const [, p] of this.state.players) {
        if (!p.decision) {
          const otros = ids.filter((id) => id !== p.id);
          p.decision = otros[Math.floor(Math.random() * otros.length)] ?? "";
        }
        p.acted = true;
      }
    } else {
      for (const [, p] of this.state.players) p.acted = true;
    }
    this.chequearAvance();
    console.log(`[GameRoom] dev: salto de fase (${fase})`);
  }

  /* ---------- bots de desarrollo · Paso 1 ---------- */

  private addBots(count: number) {
    const usados = new Set(
      [...this.state.players.values()].map((p) => p.nickname)
    );
    let added = 0;
    for (const name of BOT_NAMES) {
      if (added >= count) break;
      if (this.state.players.size >= this.maxClients) break;
      if (usados.has(name)) continue;

      const id = "bot_" + Math.random().toString(36).slice(2, 8);
      const bot = new Player();
      bot.id = id;
      bot.token = id;
      bot.nickname = name;
      bot.avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
      bot.isBot = true;
      bot.ready = true;
      bot.connected = true;
      this.state.players.set(id, bot);
      added++;
    }
  }
}

/** Código de sala legible: 5 letras mayúsculas. */
function genCode(): string {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += letras[Math.floor(Math.random() * letras.length)];
  }
  return code;
}
