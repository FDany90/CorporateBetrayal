import { Room, Client } from "colyseus";
import { GameState, Player, Pairing, Card } from "../schema/GameState";
import { roundRobinSchedule, ParejaPlana } from "../emparejador";
import { CONFIG_DEFECTO, GameConfig } from "../config";
import { CHALLENGE_REGISTRY, ChallengeDefinition } from "../challenges/registry";
import { FIBONACCI_SP } from "../challenges/tableroScrum";

// Ids del catálogo de avatares — los dibuja el cliente con SVGs (ver
// web/src/app/avatars.ts). El server solo persiste el id como
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
  /** Solo aplica al CREAR la sala (primer cliente). Si se omite o queda
   *  vacío, el cliente muestra el default ("Sinergia Corp"). Truncado a
   *  30 caracteres en el server por seguridad. */
  companyName?: string;
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
  /** Handle del timer de la fase con tiempo límite (calls/vote). undefined
   *  = no hay timer corriendo. Es el reloj AUTORITATIVO: al vencer, el
   *  server fuerza el avance (no depende del cliente). */
  private faseTimer?: ReturnType<typeof setTimeout>;
  /** Handle del "tiempo de decisión" del bot-jefe del Reconocimiento. Lo
   *  usamos para que la fase no se cierre al instante cuando el sorteo cae
   *  sobre un bot — los humanos tienen que poder ver la pantalla del
   *  jefe/espectador antes de que se resuelva. */
  private bossBotTimer?: ReturnType<typeof setTimeout>;
  /* ---------- Tablero SCRUM (kind 'tablero') ---------- */
  /** Dueño de cada tarjeta: playerId → cardId. Es secreto: NO se sincroniza
   *  al cliente; cada humano recibe SU `ownedCardId` por mensaje privado. */
  private ownerByPlayer = new Map<string, string>();
  /** Valor real (Fibonacci) de cada tarjeta: cardId → valor. Secreto del
   *  server hasta el reveal en `resolverTablero` (ahí se vuelca al state). */
  private cardValores = new Map<string, number>();
  /** Estimaciones por jugador: playerId → (cardId → valor Fibonacci).
   *  No se sincroniza (para que no se copien entre jugadores); se persiste
   *  en memoria y al reconectar se re-emite por mensaje privado. */
  private estimaciones = new Map<string, Map<string, number>>();

  onCreate(options: JoinOptions) {
    this.state = new GameState();
    this.state.code = (options.code || genCode()).toUpperCase();
    this.state.companyName = (options.companyName ?? "").trim().slice(0, 30);
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
      // En 'reconocimiento', el "ack" solo lo manda el jefe para confirmar
      // el destinatario elegido. Validamos: es el jefe y eligió a alguien.
      if (this.state.phase === "reconocimiento") {
        if (client.sessionId !== this.state.bossId) return;
        if (!p.decision) return;
      }
      p.acted = true;
      this.chequearAvance();
    });

    // 'estimar' es del Tablero SCRUM (kind 'tablero'): el cliente envía
    // su estimación de una tarjeta. La guardamos en memoria del server (no
    // se sincroniza para que no se copien entre jugadores).
    //   payload = { cardId: string, valor: number }
    //   valor = 0 → "sin estimar" (se borra la entrada)
    //   valor = Fibonacci válido → se guarda
    this.onMessage(
      "estimar",
      (client, payload: { cardId?: string; valor?: number } = {}) => {
        if (this.state.phase !== "tablero") return;
        const p = this.state.players.get(client.sessionId);
        if (!p) return;
        if (p.acted) return; // ya confirmó, no se toca más
        const cardId = payload.cardId ?? "";
        if (!cardId || !this.cardValores.has(cardId)) return;
        // No se puede estimar la tarjeta propia (ya la conocés).
        if (this.ownerByPlayer.get(p.id) === cardId) return;
        const valor = payload.valor ?? 0;
        let mine = this.estimaciones.get(p.id);
        if (!mine) {
          mine = new Map<string, number>();
          this.estimaciones.set(p.id, mine);
        }
        if (valor === 0) {
          mine.delete(cardId);
          return;
        }
        if (!(FIBONACCI_SP as readonly number[]).includes(valor)) return;
        mine.set(cardId, valor);
      },
    );

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
      } else if (this.state.phase === "reconocimiento") {
        // Solo el jefe puede regalar; debe elegir a otro jugador (no a sí
        // mismo); puede cambiar de idea hasta confirmar (`acted`).
        if (client.sessionId !== this.state.bossId) return;
        if (p.acted) return;
        if (value === client.sessionId) return;
        if (!this.state.players.has(value)) return;
        p.decision = value;
        // No tocamos `acted`: el avance lo dispara el handler "ack".
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
          // Su `ownerByPlayer` y `estimaciones` están indexados por el id
          // viejo: migrarlos al nuevo sessionId.
          const ownedOld = this.ownerByPlayer.get(oldId);
          if (ownedOld) {
            this.ownerByPlayer.delete(oldId);
            this.ownerByPlayer.set(client.sessionId, ownedOld);
          }
          const estOld = this.estimaciones.get(oldId);
          if (estOld) {
            this.estimaciones.delete(oldId);
            this.estimaciones.set(client.sessionId, estOld);
          }
          // Si estamos en la fase 'tablero', re-emitir su tarjeta privada
          // y sus estimaciones actuales (el cliente se reconectó y las perdió).
          if (this.state.phase === "tablero") {
            const owned = this.ownerByPlayer.get(client.sessionId);
            if (owned) {
              client.send("tuTablero", {
                ownedCardId: owned,
                ownedValor: this.cardValores.get(owned) ?? 0,
              });
            }
            const mine = this.estimaciones.get(client.sessionId);
            if (mine && mine.size > 0) {
              const obj: Record<string, number> = {};
              mine.forEach((v, k) => (obj[k] = v));
              client.send("misEstimaciones", obj);
            }
          }
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

    // Limpiar tarjetas/estimaciones de un Tablero previo (si lo hubo).
    this.limpiarTablero();
    // Limpiar el jefe del Reconocimiento de una ronda previa (si lo hubo).
    this.state.bossId = "";

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

  /* ---------- timers de fase (reloj autoritativo) ---------- */

  /** Arranca el timer de la fase actual: publica `phaseEndsAt`/`phaseDurationSec`
   *  en el estado (para que el cliente muestre la cuenta regresiva) y programa
   *  el avance forzado al vencer. Limpia cualquier timer previo. */
  private armarTimer(segundos: number) {
    this.limpiarTimer();
    if (segundos <= 0) return;
    this.state.phaseDurationSec = segundos;
    this.state.phaseEndsAt = Date.now() + segundos * 1000;
    this.faseTimer = setTimeout(() => this.alExpirarFase(), segundos * 1000);
  }

  /** Cancela el timer de fase y limpia los campos del estado. */
  private limpiarTimer() {
    if (this.faseTimer) {
      clearTimeout(this.faseTimer);
      this.faseTimer = undefined;
    }
    this.state.phaseEndsAt = 0;
    this.state.phaseDurationSec = 0;
  }

  /** Se ejecuta cuando el tiempo de la fase se agota. Auto-completa lo que
   *  falte según la fase y dispara el avance normal:
   *   - calls: quien no decidió queda en "verde" (cooperar).
   *   - vote : quien no confirmó queda confirmado; cuenta su voto actual
   *            (si no eligió a nadie, decision="" = abstención). */
  private alExpirarFase() {
    this.faseTimer = undefined;
    const fase = this.state.phase;
    if (fase === "calls") {
      for (const pr of this.state.pairings) {
        for (const id of [pr.aId, pr.bId]) {
          const p = this.state.players.get(id);
          if (p && !p.decision) p.decision = "verde";
        }
      }
      this.chequearAvance();
    } else if (fase === "vote") {
      for (const [, p] of this.state.players) {
        if (p.connected && !p.acted) p.acted = true;
      }
      this.chequearAvance();
    } else if (fase === "tablero") {
      // Tomar las estimaciones actuales tal como estén; sin estimar = 0.
      for (const [, p] of this.state.players) {
        if (p.connected && !p.acted) p.acted = true;
      }
      this.chequearAvance();
    } else if (fase === "reconocimiento") {
      // Si el jefe no eligió (o no confirmó), el server elige por él al
      // azar entre los OTROS jugadores y confirma. Si solo hay 1 jugador
      // (el propio jefe), no hay destinatario posible → cero efecto.
      const jefe = this.state.players.get(this.state.bossId);
      if (jefe && !jefe.acted) {
        if (!jefe.decision) {
          const otros = [...this.state.players.keys()].filter(
            (id) => id !== this.state.bossId,
          );
          if (otros.length > 0) {
            jefe.decision = otros[Math.floor(Math.random() * otros.length)];
          }
        }
        jefe.acted = true;
      }
      this.chequearAvance();
    }
  }

  /** Limpieza al cerrarse la sala (evita timers colgados). */
  onDispose() {
    this.limpiarTimer();
    this.limpiarBossBotTimer();
  }

  /** Cancela el timer del bot-jefe (si lo había). Se llama en cualquier
   *  transición fuera de la fase 'reconocimiento'. */
  private limpiarBossBotTimer() {
    if (this.bossBotTimer) {
      clearTimeout(this.bossBotTimer);
      this.bossBotTimer = undefined;
    }
  }

  /** Entra a una fase de "ack" (briefing/result/marcador/final): resetea
   *  `acted` y deja a los bots ya confirmados. Estas fases no tienen tiempo
   *  límite, así que cualquier timer activo se cancela. */
  private iniciarFase(fase: string) {
    this.limpiarTimer();
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

    // Tiempo límite de la llamada (1 min en El Botón). Si todos los humanos
    // deciden antes, la fase avanza sola y el timer se cancela en la
    // transición (iniciarFase limpia). Si se agota, alExpirarFase resuelve.
    this.armarTimer(this.challengeActual?.callSeconds ?? 0);

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
          // El Recorte va directo del briefing al voto: el debate sucede
          // sobre la pantalla del voto mismo (tally en vivo, con timer).
          this.iniciarVotacion();
        } else if (kind === "tablero") {
          this.iniciarTablero();
        } else if (kind === "reconocimiento") {
          this.iniciarReconocimiento();
        } else {
          this.terminarRonda(); // ronda placeholder, sin minijuego
        }
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
      return;
    }

    if (fase === "tablero") {
      // Como el voto: avanza cuando todos los conectados confirmaron.
      // Las estimaciones se persisten en memoria (no son `decision`)
      // y se resuelven contra `cardValores` (la verdad del server).
      for (const [, p] of this.state.players) {
        if (p.connected && !p.acted) return;
      }
      this.resolverTablero();
      return;
    }

    if (fase === "reconocimiento") {
      // Avanza cuando el jefe confirmó (acted=true). Los demás no actúan;
      // su rol es lobbear por voz. El handler `ack` solo deja confirmar
      // al jefe con destinatario válido (ver onMessage("ack")).
      const jefe = this.state.players.get(this.state.bossId);
      if (jefe && jefe.connected && !jefe.acted) return;
      this.resolverReconocimiento();
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

    // Tiempo límite de la votación (2 min en El Recorte). Al vencer,
    // alExpirarFase confirma a los que no confirmaron (su voto actual cuenta;
    // sin voto = abstención) y resuelve.
    this.armarTimer(this.challengeActual?.voteSeconds ?? 0);
  }

  /* ---------- Tablero SCRUM (kind 'tablero') ---------- */

  /** Entra a la fase 'tablero': elige K tarjetas del pool, les asigna valor
   *  Fibonacci real (secreto en `cardValores`), reparte un dueño por jugador
   *  (round-robin sobre tarjetas barajadas), y manda a cada humano por
   *  mensaje PRIVADO su `ownedCardId` + valor. Los bots estiman al azar y
   *  confirman al instante. */
  private iniciarTablero() {
    this.limpiarTablero();
    this.state.phase = "tablero";

    const def = this.challengeActual;
    if (!def) {
      this.terminarRonda();
      return;
    }
    const pool = def.cardPool ?? [];
    const players = [...this.state.players.values()];
    const N = players.length;
    const idealK = def.cardsCount
      ? def.cardsCount(N)
      : Math.max(3, Math.min(N, 6));
    // K ≤ N (toda tarjeta debe tener al menos un dueño) y ≤ pool.length.
    const K = Math.max(1, Math.min(idealK, N, pool.length));

    // Elegir K tarjetas únicas del pool al azar.
    const elegidas = this.barajar([...pool]).slice(0, K);

    // Crear tarjetas en el state (sin valor real visible) + valor secreto.
    for (let i = 0; i < elegidas.length; i++) {
      const card = new Card();
      card.id = `card_${i}`;
      card.nombre = elegidas[i].nombre;
      card.descripcion = elegidas[i].descripcion;
      card.valorReal = 0; // oculto durante la fase
      this.state.cards.push(card);
      const valor =
        FIBONACCI_SP[Math.floor(Math.random() * FIBONACCI_SP.length)];
      this.cardValores.set(card.id, valor);
    }

    // Asignar dueños: round-robin de jugadores barajados sobre tarjetas
    // barajadas. Si N > K, algunas tarjetas tendrán 2+ dueños (esperado).
    const cardIds = this.barajar(
      this.state.cards.map((c) => c.id),
    );
    const playersShuffled = this.barajar(players);
    playersShuffled.forEach((p, idx) => {
      this.ownerByPlayer.set(p.id, cardIds[idx % cardIds.length]);
    });

    // Resetear estado por jugador. Bots estiman al azar y confirman ya.
    for (const [, p] of this.state.players) {
      p.acted = false;
      p.decision = "";
      p.lastDelta = 0;
      if (p.isBot) {
        const owned = this.ownerByPlayer.get(p.id);
        const mine = new Map<string, number>();
        for (const c of this.state.cards) {
          if (c.id === owned) continue;
          mine.set(
            c.id,
            FIBONACCI_SP[Math.floor(Math.random() * FIBONACCI_SP.length)],
          );
        }
        this.estimaciones.set(p.id, mine);
        p.acted = true;
      }
    }

    // Mensaje PRIVADO a cada cliente humano: tu tarjeta + su valor real.
    for (const client of this.clients) {
      const owned = this.ownerByPlayer.get(client.sessionId);
      if (!owned) continue;
      client.send("tuTablero", {
        ownedCardId: owned,
        ownedValor: this.cardValores.get(owned) ?? 0,
      });
    }

    // Timer de 2 minutos (por defecto, definido en TABLERO_SCRUM).
    this.armarTimer(def.tableroSeconds ?? 0);
    // Por si la sala es solo bots, el avance es inmediato.
    this.chequearAvance();
  }

  /** Resuelve el Tablero: ±payoff por cada tarjeta NO propia según acierto/
   *  error. Sin estimar = 0. Revela `valorReal` en el state para el result. */
  private resolverTablero() {
    for (const [, p] of this.state.players) p.lastDelta = 0;
    const payoff = this.challengeActual?.tableroPayoff ?? 3;

    for (const [pid, p] of this.state.players) {
      const owned = this.ownerByPlayer.get(pid);
      const mine = this.estimaciones.get(pid);
      let delta = 0;
      for (const c of this.state.cards) {
        if (c.id === owned) continue; // la propia no se puntúa
        const est = mine?.get(c.id);
        if (est === undefined) continue; // sin estimar = 0
        const real = this.cardValores.get(c.id) ?? 0;
        if (est === real) delta += payoff;
        else delta -= payoff;
      }
      p.influence += delta;
      p.lastDelta = delta;
    }

    // Revelar valores reales en el state para que el cliente los muestre
    // en el resultado.
    for (const c of this.state.cards) {
      c.valorReal = this.cardValores.get(c.id) ?? 0;
    }

    this.iniciarFase("result");
    console.log("[GameRoom] Tablero SCRUM resuelto");
  }

  /* ---------- Reconocimiento del Mes (kind 'reconocimiento') ---------- */

  /** Entra a la fase 'reconocimiento': elige un jefe al azar entre los
   *  jugadores, deja a los demás como espectadores, y arma el timer.
   *
   *  Si el jefe es un bot, NO decide al instante: programamos una espera
   *  de 6-10 s para que los humanos puedan ver la pantalla del jefe/
   *  espectador antes de que la fase cierre (sensación de "está
   *  pensando"). Si no, la fase se resolvería sin que nadie vea nada. */
  private iniciarReconocimiento() {
    this.limpiarBossBotTimer();
    this.state.phase = "reconocimiento";
    this.state.pairings.clear();

    const ids = [...this.state.players.keys()];
    if (ids.length === 0) {
      this.terminarRonda();
      return;
    }
    // Elegir jefe al azar.
    const bossId = ids[Math.floor(Math.random() * ids.length)];
    this.state.bossId = bossId;

    for (const [, p] of this.state.players) {
      p.acted = false;
      p.decision = "";
      p.lastDelta = 0;
    }

    // Timer de la fase (3 min por defecto). Al vencer, alExpirarFase
    // elige por el jefe si no eligió y resuelve.
    this.armarTimer(this.challengeActual?.bossSeconds ?? 0);

    // Si el jefe es bot, agendamos su "decisión" en 6-10 s. Si en el
    // medio sale de la fase (devSkipPhase, volverLobby, expira el timer),
    // limpiamos el timer con limpiarBossBotTimer().
    const jefe = this.state.players.get(bossId);
    if (jefe?.isBot) {
      const espera = 6000 + Math.floor(Math.random() * 4000);
      this.bossBotTimer = setTimeout(() => {
        this.bossBotTimer = undefined;
        // Validar que seguimos en la misma fase con el mismo jefe (puede
        // haber pasado un devSkipPhase o el jefe haberse desconectado).
        if (this.state.phase !== "reconocimiento") return;
        if (this.state.bossId !== bossId) return;
        const j = this.state.players.get(bossId);
        if (!j || j.acted) return;
        const otros = [...this.state.players.keys()].filter(
          (id) => id !== bossId,
        );
        if (otros.length > 0) {
          j.decision = otros[Math.floor(Math.random() * otros.length)];
        }
        j.acted = true;
        this.chequearAvance();
      }, espera);
    }
  }

  /** Resuelve el Reconocimiento: el destinatario elegido por el jefe gana
   *  `bossDelta` Influencia. Si no hay destinatario (caso degenerado), nadie
   *  gana nada. El jefe NO se lleva el punto. */
  private resolverReconocimiento() {
    this.limpiarBossBotTimer();
    for (const [, p] of this.state.players) p.lastDelta = 0;

    const jefe = this.state.players.get(this.state.bossId);
    const delta = this.challengeActual?.bossDelta ?? 0;
    if (jefe && jefe.decision && delta !== 0) {
      const destinatario = this.state.players.get(jefe.decision);
      if (destinatario && destinatario.id !== this.state.bossId) {
        destinatario.influence += delta;
        destinatario.lastDelta = delta;
      }
    }

    this.iniciarFase("result");
    console.log("[GameRoom] Reconocimiento del Mes resuelto");
  }

  /** Limpia tarjetas + dueños + valores + estimaciones del Tablero. Se
   *  llama al cerrar el minijuego (terminar ronda, volver al lobby) y al
   *  entrar a una nueva instancia de tablero. */
  private limpiarTablero() {
    this.state.cards.clear();
    this.ownerByPlayer.clear();
    this.cardValores.clear();
    this.estimaciones.clear();
  }

  /** Fisher–Yates sin mutar el array original (devuelve copia barajada). */
  private barajar<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
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
    this.limpiarTimer();
    this.limpiarBossBotTimer();
    this.limpiarTablero();
    this.state.status = "lobby";
    this.state.phase = "lobby";
    this.state.challengeId = "";
    this.state.bossId = "";
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
    } else if (fase === "reconocimiento") {
      // Auto-elegir destinatario al azar para el jefe (y confirmar). Los
      // demás también quedan acted=true por simetría (no afecta nada).
      const ids = [...this.state.players.keys()];
      const jefe = this.state.players.get(this.state.bossId);
      if (jefe && !jefe.decision) {
        const otros = ids.filter((id) => id !== this.state.bossId);
        jefe.decision = otros[Math.floor(Math.random() * otros.length)] ?? "";
      }
      for (const [, p] of this.state.players) p.acted = true;
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
