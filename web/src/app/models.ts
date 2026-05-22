/*
 * Vistas planas del estado del juego.
 *
 * El servidor (Colyseus) sincroniza objetos Schema con muchos detalles
 * internos. Para la UI nos alcanza una copia simple e inmutable: estas
 * interfaces. El GameService convierte Schema -> View en snapshot().
 *
 * Equivale a PlayerView / PairingView / StateView de la versión React.
 */

/** Un jugador, tal como lo muestra la UI. */
export interface PlayerView {
  id: string;
  nickname: string;
  avatar: string;
  ready: boolean;
  isBot: boolean;
  connected: boolean;
  // --- campos de juego (Paso 2) ---
  influence: number;
  decision: string;
  acted: boolean;
  lastDelta: number;
}

/** Una pareja de llamada 1-a-1 dentro de un desafío. */
export interface PairingView {
  aId: string;
  bId: string;
}

/** Nombre legible de cada minijuego, por su id (para títulos de la UI). */
export const NOMBRE_CHALLENGE: Record<string, string> = {
  'boton-del-bonus': 'El Botón del Bonus',
  'el-recorte': 'El Recorte',
};

/** El estado completo de la partida que ve la UI. */
export interface StateView {
  code: string;
  status: string;
  hostId: string;
  phase: string;
  challengeId: string;
  players: PlayerView[];
  pairings: PairingView[];
  // --- tandas de llamadas (Paso 2.5) ---
  tanda: number;        // tanda actual (1-based; 0 = no empezó)
  tandasTotal: number;  // total de tandas del desafío
  // --- rondas (Paso 3) ---
  ronda: number;        // ronda actual (1-based; 0 = no empezó)
  rondasTotal: number;  // total de rondas de la partida
  rondaTipo: string;    // "individual" | "grupal"
  // --- timers de fase ---
  phaseEndsAt: number;     // epoch ms de fin de fase (0 = sin timer)
  phaseDurationSec: number; // duración total de la fase (para la barra)
}
