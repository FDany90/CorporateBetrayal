/* ============================================================
   PASO 2 — primer minijuego. Aísla la lógica de El Botón del Bonus.
   ============================================================ */

/**
 * El Botón del Bonus — Dilema del Prisionero en versión 1-a-1.
 *
 * Tras hablar por la llamada, cada jugador elige en secreto:
 *   "verde" = Compartir (cooperar)   ·   "rojo" = Quedárselo (traicionar)
 *
 * Este módulo aísla la lógica del minijuego; cuando haya más desafíos se
 * generalizará a un registro de `ChallengeDefinition` (ver modelo-datos.md).
 */
export const BOTON_DEL_BONUS = {
  id: "boton-del-bonus",
  nombre: "El Botón del Bonus",
};

/**
 * Puntaje del dilema para una pareja. Devuelve `[deltaA, deltaB]`.
 *   verde + verde → +3 / +3
 *   rojo  vs verde → +5 / 0
 *   rojo  + rojo  → +1 / +1
 */
export function puntuarBoton(
  decA: string,
  decB: string
): [number, number] {
  const aTraiciona = decA === "rojo";
  const bTraiciona = decB === "rojo";
  if (!aTraiciona && !bTraiciona) return [3, 3];
  if (aTraiciona && !bTraiciona) return [5, 0];
  if (!aTraiciona && bTraiciona) return [0, 5];
  return [1, 1];
}
