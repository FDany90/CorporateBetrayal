import { Room, Client } from "colyseus";
import { GameState, Player } from "../schema/GameState";

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
 * Sala = una partida. En el Paso 1 maneja el lobby: ingreso, lista de
 * jugadores en vivo, "fichar entrada" (ready), reconexión y bots de dev.
 */
export class GameRoom extends Room<GameState> {
  maxClients = 12;

  onCreate(options: JoinOptions) {
    this.state = new GameState();
    this.state.code = (options.code || genCode()).toUpperCase();
    this.setMetadata({ code: this.state.code });

    // Fichar entrada / salida (ready)
    this.onMessage("ready", (client, value: boolean) => {
      const p = this.state.players.get(client.sessionId);
      if (p) p.ready = !!value;
    });

    // Modo desarrollo: jugadores de mentira
    this.onMessage("dev:addBots", (_client, count: number) => {
      this.addBots(typeof count === "number" ? count : 3);
    });
    this.onMessage("dev:clearBots", () => {
      for (const [id, p] of this.state.players) {
        if (p.isBot) this.state.players.delete(id);
      }
    });

    console.log(`[GameRoom] creada · código ${this.state.code}`);
  }

  onJoin(client: Client, options: JoinOptions) {
    // Reconexión por token persistente (cerró el navegador, volvió, etc.)
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
      return;
    }
    // Caída inesperada: reservamos el lugar 60 s para que pueda volver.
    try {
      await this.allowReconnection(client, 60);
      const back = this.state.players.get(client.sessionId);
      if (back) back.connected = true;
    } catch {
      this.state.players.delete(client.sessionId);
    }
  }

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
