/* ============================================================
   PASO 3 — registro de minijuegos enchufable.

   El motor no conoce ningún minijuego en particular: solo lee una
   ChallengeDefinition del registro. Cada minijuego declara su `kind`,
   que define su flujo de fases. Agregar un minijuego = crear su
   definición y sumarla acá. Ver modelo-datos.md §4.6.
   ============================================================ */

import { BOTON_DEL_BONUS } from "./botonDelBonus";
import { EL_RECORTE } from "./elRecorte";

export type ChallengeFormat = "individual" | "grupal";

/**
 * Tipo de minijuego — define su flujo de fases:
 *   'llamadas' → briefing → [calls → result] × tandas   (El Botón del Bonus)
 *   'votacion' → briefing → meeting → vote → result      (El Recorte)
 */
export type ChallengeKind = "llamadas" | "votacion";

/** La "ficha" de un minijuego (subconjunto pragmático de modelo-datos §4). */
export interface ChallengeDefinition {
  id: string;
  nombre: string;
  format: ChallengeFormat;
  kind: ChallengeKind;
  /** Tandas de llamadas 1-a-1 (kind 'llamadas'). */
  callRounds: number;
  /** Puntaje de una pareja tras decidir (kind 'llamadas'). */
  puntuarPareja?: (decA: string, decB: string) => [number, number];
  /** Influencia que gana/pierde el más votado (kind 'votacion'). */
  voteDelta?: number;
  /** Segundos límite de cada tanda de llamadas (kind 'llamadas'). 0/undefined
   *  = sin límite. Al vencer, quien no decidió queda en "verde" (cooperar). */
  callSeconds?: number;
  /** Segundos límite de la votación (kind 'votacion'). 0/undefined = sin
   *  límite. Al vencer, cuenta el voto ya elegido; si no eligió, se abstiene. */
  voteSeconds?: number;
}

/** Catálogo de minijuegos implementados. Se agregan acá. */
export const CHALLENGE_REGISTRY: Record<string, ChallengeDefinition> = {
  [BOTON_DEL_BONUS.id]: BOTON_DEL_BONUS,
  [EL_RECORTE.id]: EL_RECORTE,
};
