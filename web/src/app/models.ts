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

/** Una tarjeta del Tablero SCRUM. `valorReal` es 0 durante la fase
 *  (oculto); el server lo escribe en el state al resolver, para el reveal. */
export interface CardView {
  id: string;
  nombre: string;
  descripcion: string;
  valorReal: number;
}

/** Nombre legible de cada minijuego, por su id (para títulos de la UI). */
export const NOMBRE_CHALLENGE: Record<string, string> = {
  'boton-del-bonus': 'Bono Compartido',
  'el-recorte': 'El Recorte',
  'tablero-scrum': 'El Tablero SCRUM',
  'reconocimiento-del-mes': 'El Reconocimiento del Mes',
};

/** El estado completo de la partida que ve la UI. */
export interface StateView {
  code: string;
  status: string;
  hostId: string;
  /** Nombre de la empresa (configurable por el anfitrión al crear la sala).
   *  "" = caer al default visual "Sinergia Corp". */
  companyName: string;
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
  // --- Tablero SCRUM (kind 'tablero') ---
  cards: CardView[];
  // --- Reconocimiento del Mes (kind 'reconocimiento') ---
  // Id del jugador designado "jefe del mes" en la ronda actual ("" fuera
  // de la fase 'reconocimiento'). Es público — la vista del resto lo usa
  // para destacar al jefe.
  bossId: string;
}
