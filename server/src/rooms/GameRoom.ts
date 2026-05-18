import { Room, Client } from "colyseus";
import { GameState, Player, Pairing } from "../schema/GameState";
import { BOTON_DEL_BONUS, puntuarBoton } from "../challenges/botonDelBonus";

const AVATARS = ["🧑‍💼", "👩‍💼", "🧑‍💻", "👨‍💼", "👩‍💻", "🧔"];
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
 * PASO 2: motor de fases (briefing → calls → result) corriendo El Botón
 *         del Bonus; las fases avanzan cuando todos los jugadores actuaron.
 */
export class GameRoom extends Room<GameState> {
  maxClients = 12;

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

    // --- mensajes de partida · Paso 2 ---
    this.onMessage("startGame", () => this.iniciarPartida());

    this.onMessage("ack", (client) => {
      const p = this.state.players.get(client.sessionId);
      if (p) {
        p.acted = true;
        this.chequearAvance();
      }
    });

    this.onMessage("decidir", (client, value: string) => {
      if (this.state.phase !== "calls") return;
      if (value !== "verde" && value !== "rojo") return;
      const p = this.state.players.get(client.sessionId);
      if (p) {
        p.decision = value;
        this.chequearAvance();
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
    console.log(`[GameRoom] ${p.nickname} ingresó (${this.state.players.size})`);
  }

  async onLeave(client: Client, consented: boolean) {
    const p = this.state.players.get(client.sessionId);
    if (p) p.connected = false;

    if (consented) {
      this.state.players.delete(client.sessionId);
      this.chequearAvance();
      return;
    }
    try {
      await this.allowReconnection(client, 60);
      const back = this.state.players.get(client.sessionId);
      if (back) back.connected = true;
    } catch {
      this.state.players.delete(client.sessionId);
      this.chequearAvance();
    }
  }

  /* ---------- motor de partida · Paso 2 ---------- */

  private iniciarPartida() {
    if (this.state.status !== "lobby") return;
    if (this.state.players.size < 2) return;
    this.state.status = "playing";
    this.state.challengeId = BOTON_DEL_BONUS.id;
    this.iniciarFase("briefing");
    console.log("[GameRoom] partida iniciada");
  }

  /** Entra a una fase y prepara a los bots para que actúen solos. */
  private iniciarFase(fase: string) {
    this.state.phase = fase;
    for (const [, p] of this.state.players) p.acted = false;

    if (fase === "briefing" || fase === "result") {
      for (const [, p] of this.state.players) if (p.isBot) p.acted = true;
    }

    if (fase === "calls") {
      this.armarParejas();
      for (const [, p] of this.state.players) {
        p.decision = "";
        if (p.isBot) p.decision = Math.random() < 0.5 ? "verde" : "rojo";
      }
    }
  }

  /** Empareja a los jugadores al azar (de a dos). Si son impares, uno queda libre. */
  private armarParejas() {
    this.state.pairings.clear();
    const ids = [...this.state.players.keys()];
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    for (let i = 0; i + 1 < ids.length; i += 2) {
      const pr = new Pairing();
      pr.aId = ids[i];
      pr.bId = ids[i + 1];
      this.state.pairings.push(pr);
    }
  }

  /** Revisa si la fase actual puede avanzar. */
  private chequearAvance() {
    const fase = this.state.phase;

    if (fase === "briefing" || fase === "result") {
      for (const [, p] of this.state.players) {
        if (p.connected && !p.acted) return;
      }
      if (fase === "briefing") this.iniciarFase("calls");
      else this.volverLobby();
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
    }
  }

  /** Aplica el puntaje de El Botón del Bonus y pasa a la fase de resultado. */
  private resolver() {
    for (const [, p] of this.state.players) p.lastDelta = 0;

    for (const pr of this.state.pairings) {
      const a = this.state.players.get(pr.aId);
      const b = this.state.players.get(pr.bId);
      if (!a || !b) continue;
      const [da, db] = puntuarBoton(a.decision, b.decision);
      a.influence += da;
      a.lastDelta = da;
      b.influence += db;
      b.lastDelta = db;
    }
    this.iniciarFase("result");
    console.log("[GameRoom] desafío resuelto");
  }

  private volverLobby() {
    this.state.status = "lobby";
    this.state.phase = "lobby";
    this.state.challengeId = "";
    this.state.pairings.clear();
    for (const [, p] of this.state.players) {
      p.ready = false;
      p.decision = "";
      p.acted = false;
    }
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
