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
 * Config por defecto: 4 rondas con patrón I-G-I-G.
 *   I → El Botón del Bonus   ·   G → El Recorte
 */
export const CONFIG_DEFECTO: GameConfig = {
  rounds: [
    { tipo: "individual", challengePool: ["boton-del-bonus"] },
    { tipo: "grupal", challengePool: ["el-recorte"] },
    { tipo: "individual", challengePool: ["boton-del-bonus"] },
    { tipo: "grupal", challengePool: ["el-recorte"] },
  ],
};
