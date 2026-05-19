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

/** El estado completo de la partida que ve la UI. */
export interface StateView {
  code: string;
  status: string;
  hostId: string;
  phase: string;
  challengeId: string;
  players: PlayerView[];
  pairings: PairingView[];
}
