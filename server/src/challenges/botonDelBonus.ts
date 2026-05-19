/* ============================================================
   El Botón del Bonus — primer minijuego (definición + puntaje).
   Aísla su lógica; el motor lo consume vía el registro (registry.ts).
   ============================================================ */

import type { ChallengeDefinition } from "./registry";

/**
 * Puntaje del dilema para una pareja. Devuelve `[deltaA, deltaB]`.
 *   verde + verde → +3 / +3
 *   rojo  vs verde → +5 / 0
 *   rojo  + rojo  → +1 / +1
 */
export function puntuarBoton(decA: string, decB: string): [number, number] {
  const aTraiciona = decA === "rojo";
  const bTraiciona = decB === "rojo";
  if (!aTraiciona && !bTraiciona) return [3, 3];
  if (aTraiciona && !bTraiciona) return [5, 0];
  if (!aTraiciona && bTraiciona) return [0, 5];
  return [1, 1];
}

/**
 * El Botón del Bonus — Dilema del Prisionero en versión 1-a-1.
 *
 * Tras hablar por la llamada, cada jugador elige en secreto:
 *   "verde" = Compartir (cooperar)   ·   "rojo" = Quedárselo (traicionar)
 *
 * Es un minijuego de **llamadas**: se juega en `callRounds` tandas, cada
 * una con parejas distintas (ver emparejador.ts y el motor de GameRoom).
 */
export const BOTON_DEL_BONUS: ChallengeDefinition = {
  id: "boton-del-bonus",
  nombre: "El Botón del Bonus",
  format: "individual",
  callRounds: 3,
  puntuarPareja: puntuarBoton,
};
