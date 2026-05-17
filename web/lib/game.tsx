"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Client, Room } from "colyseus.js";

/**
 * URL del game server. Por defecto usa el mismo host desde el que se abrió
 * la web → anda igual en `localhost` o entrando por la IP de red (celular).
 * Se puede forzar con la variable NEXT_PUBLIC_GAME_SERVER.
 */
function endpointPorDefecto(): string {
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.hostname}:2567`;
  }
  return "ws://localhost:2567";
}

/* ---------- vistas planas del estado (para React) ---------- */

export interface PlayerView {
  id: string;
  nickname: string;
  avatar: string;
  ready: boolean;
  isBot: boolean;
  connected: boolean;
}

export interface StateView {
  code: string;
  status: string;
  players: PlayerView[];
}

interface GameContextValue {
  conectado: boolean;
  cargando: boolean;
  error: string | null;
  estado: StateView | null;
  miId: string | null;
  crearSala: (nickname: string, avatar: string) => Promise<void>;
  unirseSala: (code: string, nickname: string, avatar: string) => Promise<void>;
  ficharEntrada: (valor: boolean) => void;
  agregarBots: (n: number) => void;
  limpiarBots: () => void;
  salir: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

/* ---------- helpers ---------- */

function getPlayerToken(): string {
  if (typeof window === "undefined") return "";
  let t = localStorage.getItem("traicion.token");
  if (!t) {
    t = crypto.randomUUID();
    localStorage.setItem("traicion.token", t);
  }
  return t;
}

function genCode(): string {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += letras[Math.floor(Math.random() * letras.length)];
  }
  return code;
}

function snapshot(room: Room): StateView {
  const s = room.state as unknown as
    | {
        code?: string;
        status?: string;
        players?: { forEach: (cb: (p: PlayerView) => void) => void };
      }
    | undefined;
  const players: PlayerView[] = [];
  // El estado puede no estar sincronizado del todo en el primer instante
  // tras crear/unirse: si todavía no llegó, devolvemos lista vacía y el
  // onStateChange completará los datos enseguida.
  if (s?.players && typeof s.players.forEach === "function") {
    s.players.forEach((p) =>
      players.push({
        id: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        ready: p.ready,
        isBot: p.isBot,
        connected: p.connected,
      })
    );
  }
  return { code: s?.code ?? "", status: s?.status ?? "lobby", players };
}

/* ---------- provider ---------- */

export function GameProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<Client | null>(null);
  const roomRef = useRef<Room | null>(null);

  const [conectado, setConectado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState<StateView | null>(null);
  const [miId, setMiId] = useState<string | null>(null);

  function getClient(): Client {
    if (!clientRef.current) {
      const endpoint =
        process.env.NEXT_PUBLIC_GAME_SERVER || endpointPorDefecto();
      clientRef.current = new Client(endpoint);
    }
    return clientRef.current;
  }

  const attach = useCallback((room: Room) => {
    roomRef.current = room;
    setMiId(room.sessionId);
    setConectado(true);
    setError(null);
    setEstado(snapshot(room));

    room.onStateChange(() => setEstado(snapshot(room)));
    room.onError((_code, message) =>
      setError(message || "Error de conexión.")
    );
    room.onLeave(() => setConectado(false));

    try {
      localStorage.setItem(
        "traicion.session",
        JSON.stringify({ reconnectionToken: room.reconnectionToken })
      );
    } catch {
      /* ignore */
    }
  }, []);

  /* reconexión automática al recargar / volver */
  useEffect(() => {
    const raw =
      typeof window !== "undefined"
        ? localStorage.getItem("traicion.session")
        : null;
    if (!raw) return;
    let cancelado = false;
    (async () => {
      try {
        const { reconnectionToken } = JSON.parse(raw);
        if (!reconnectionToken) return;
        setCargando(true);
        const room = await getClient().reconnect(reconnectionToken);
        if (!cancelado) attach(room);
      } catch {
        localStorage.removeItem("traicion.session");
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [attach]);

  const crearSala = useCallback(
    async (nickname: string, avatar: string) => {
      setError(null);
      setCargando(true);
      try {
        const room = await getClient().create("game", {
          code: genCode(),
          nickname,
          avatar,
          playerToken: getPlayerToken(),
        });
        attach(room);
      } catch {
        setError("No se pudo crear la sala. ¿El servidor está corriendo?");
      } finally {
        setCargando(false);
      }
    },
    [attach]
  );

  const unirseSala = useCallback(
    async (code: string, nickname: string, avatar: string) => {
      setError(null);
      setCargando(true);
      const limpio = code.trim().toUpperCase();
      try {
        const room = await getClient().join("game", {
          code: limpio,
          nickname,
          avatar,
          playerToken: getPlayerToken(),
        });
        attach(room);
      } catch {
        setError(`No se encontró la sala «${limpio}».`);
      } finally {
        setCargando(false);
      }
    },
    [attach]
  );

  const ficharEntrada = useCallback((valor: boolean) => {
    roomRef.current?.send("ready", valor);
  }, []);

  const agregarBots = useCallback((n: number) => {
    roomRef.current?.send("dev:addBots", n);
  }, []);

  const limpiarBots = useCallback(() => {
    roomRef.current?.send("dev:clearBots");
  }, []);

  const salir = useCallback(() => {
    roomRef.current?.leave(true);
    roomRef.current = null;
    setEstado(null);
    setConectado(false);
    setMiId(null);
    try {
      localStorage.removeItem("traicion.session");
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <GameContext.Provider
      value={{
        conectado,
        cargando,
        error,
        estado,
        miId,
        crearSala,
        unirseSala,
        ficharEntrada,
        agregarBots,
        limpiarBots,
        salir,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame debe usarse dentro de <GameProvider>");
  return ctx;
}
