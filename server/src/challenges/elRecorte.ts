/* ============================================================
   El Recorte — segundo minijuego (grupal, de votación).
   ============================================================ */

import type { ChallengeDefinition } from "./registry";

/**
 * El Recorte — votación / sacrificio social.
 *
 * Reunión grupal: "crisis anunciada", debate con defensas y acusaciones,
 * y luego un voto secreto. El más votado **pierde Influencia** (no se lo
 * elimina). Sin evidencia objetiva: todo es social.
 *
 * Es un minijuego de **votación** (kind 'votacion'): el motor lo corre como
 * briefing → reunión → voto → resultado.
 */
export const EL_RECORTE: ChallengeDefinition = {
  id: "el-recorte",
  nombre: "El Recorte",
  format: "grupal",
  kind: "votacion",
  callRounds: 0,
  voteDelta: -5, // el más votado pierde 5 de Influencia
};
