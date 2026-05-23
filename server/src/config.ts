/* ============================================================
   PASO 3 — configuración de la partida (estructura de rondas).

   Parametrizable: editar CONFIG_DEFECTO cambia la partida — cantidad
   de rondas, patrón individual/grupal y qué minijuegos entran en cada
   una. Nada es aleatorio. Ver modelo-datos.md §3.2.
   ============================================================ */

import { ChallengeFormat } from "./challenges/registry";

/** Una ronda: su tipo y de qué minijuegos puede salir. */
export interface RoundSpec {
  tipo: ChallengeFormat;
  challengePool: string[]; // candidatos; pool de 1 = ronda fija y determinista
}

export interface GameConfig {
  rounds: RoundSpec[]; // la estructura; rounds.length = nº de rondas
}

/**
 * Config por defecto: 2 rondas (G-I) — partida corta para iterar/probar.
 *   G → El Recorte
 *   I → El Tablero SCRUM o El Botón del Bonus (pool de 2 candidatos)
 *
 * El motor toma el PRIMER candidato no usado del pool (ver `iniciarRonda`
 * en GameRoom.ts). Como ambos arrancan sin usar, juega el primero listado:
 * **Tablero SCRUM** (el más nuevo, el que estamos probando). Para que
 * Botón vuelva a ser default, invertir el orden del pool.
 * rounds: [
  { tipo: "grupal",      challengePool: ["el-recorte"] },
  { tipo: "individual",  challengePool: ["tablero-scrum", "boton-del-bonus"] },
  { tipo: "grupal",      challengePool: ["el-recorte"] },
  { tipo: "individual",  challengePool: ["tablero-scrum", "boton-del-bonus"] },
],
 */
export const CONFIG_DEFECTO: GameConfig = {
  rounds: [
    { tipo: "individual", challengePool: [ "boton-del-bonus"] },
    { tipo: "grupal", challengePool: ["el-recorte"] },
    { tipo: "individual", challengePool: ["tablero-scrum"] },
    
    
  ],
};
