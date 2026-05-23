/* ============================================================
   PASO 3 — registro de minijuegos enchufable.

   El motor no conoce ningún minijuego en particular: solo lee una
   ChallengeDefinition del registro. Cada minijuego declara su `kind`,
   que define su flujo de fases. Agregar un minijuego = crear su
   definición y sumarla acá. Ver modelo-datos.md §4.6.
   ============================================================ */

import { BOTON_DEL_BONUS } from "./botonDelBonus";
import { EL_RECORTE } from "./elRecorte";
import { TABLERO_SCRUM } from "./tableroScrum";
import { RECONOCIMIENTO_DEL_MES } from "./reconocimientoDelMes";

export type ChallengeFormat = "individual" | "grupal";

/**
 * Tipo de minijuego — define su flujo de fases:
 *   'llamadas'        → briefing → [calls → result] × tandas   (El Botón del Bonus)
 *   'votacion'        → briefing → meeting → vote → result      (El Recorte)
 *   'tablero'         → briefing → tablero → result             (El Tablero SCRUM)
 *   'reconocimiento'  → briefing → reconocimiento → result      (El Reconocimiento del Mes)
 *
 * 'tablero' (información asimétrica): hay K tarjetas con valor secreto. Cada
 * jugador conoce 1 (mensaje privado), el resto los estima. Se llama libre por
 * Teams; la web no guía. Acierto/error → ±X Influencia por tarjeta. Sin estimar
 * = 0 (opcional). Solo se puntúan tarjetas NO propias.
 *
 * 'reconocimiento' (asimetría total): un jugador al azar es el "jefe del mes"
 * (state.bossId) y tiene un Reconocimiento para otorgar a OTRO jugador. Los
 * demás lobbean por Teams; el jefe decide. Destinatario → +bossDelta Influencia.
 */
export type ChallengeKind = "llamadas" | "votacion" | "tablero" | "reconocimiento";

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
  // --- kind 'tablero' ---
  /** Pool de tarjetas para sortear (kind 'tablero'): cada item tiene nombre
   *  + bajada corta (sátira corporativa). El server elige `cardsCount(N)`
   *  al azar cada partida + les asigna valor Fibonacci random — así las
   *  repeticiones no se memorizan. */
  cardPool?: { nombre: string; descripcion: string }[];
  /** Cantidad de tarjetas en función del nº de jugadores. Si no se setea,
   *  el motor cae a `min(N, 6)` con piso 3. */
  cardsCount?: (numPlayers: number) => number;
  /** Segundos límite de la fase 'tablero'. 0/undefined = sin límite.
   *  Al vencer, el server toma las estimaciones actuales tal como estén. */
  tableroSeconds?: number;
  /** Influencia que se suma/resta por cada tarjeta acertada/errada. */
  tableroPayoff?: number;
  // --- kind 'reconocimiento' ---
  /** Segundos límite de la fase 'reconocimiento'. 0/undefined = sin límite.
   *  Al vencer, si el jefe no eligió, el server elige al azar entre los otros. */
  bossSeconds?: number;
  /** Influencia que gana el destinatario elegido por el jefe. */
  bossDelta?: number;
}

/** Catálogo de minijuegos implementados. Se agregan acá. */
export const CHALLENGE_REGISTRY: Record<string, ChallengeDefinition> = {
  [BOTON_DEL_BONUS.id]: BOTON_DEL_BONUS,
  [EL_RECORTE.id]: EL_RECORTE,
  [TABLERO_SCRUM.id]: TABLERO_SCRUM,
  [RECONOCIMIENTO_DEL_MES.id]: RECONOCIMIENTO_DEL_MES,
};
