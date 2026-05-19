/* ============================================================
   PASO 3 — registro de minijuegos enchufable.

   El motor no conoce ningún minijuego en particular: solo lee una
   ChallengeDefinition del registro. Agregar un minijuego = crear su
   definición y sumarla acá. Ver modelo-datos.md §4.
   ============================================================ */

import { BOTON_DEL_BONUS } from "./botonDelBonus";

export type ChallengeFormat = "individual" | "grupal";

/** La "ficha" de un minijuego (subconjunto pragmático de modelo-datos §4.1). */
export interface ChallengeDefinition {
  id: string;
  nombre: string;
  format: ChallengeFormat;
  /** Tandas de llamadas 1-a-1. 0 = el minijuego no es de llamadas. */
  callRounds: number;
  /** Puntaje de una pareja tras decidir (solo minijuegos de llamadas). */
  puntuarPareja?: (decA: string, decB: string) => [number, number];
}

/** Catálogo de minijuegos implementados. Se agregan acá. */
export const CHALLENGE_REGISTRY: Record<string, ChallengeDefinition> = {
  [BOTON_DEL_BONUS.id]: BOTON_DEL_BONUS,
};
