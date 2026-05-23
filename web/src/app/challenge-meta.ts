/**
 * Metadatos de UI de cada minijuego — cosas que la UI necesita mostrar
 * pero que el server no expone (y que no agregan valor al state del juego).
 *
 * Por ahora es solo el "tema del día" que usa el `appheader` editorial
 * ("DÍA 1 DE 4 · BONO DE EQUIPO"). Si en el futuro un minijuego necesita
 * más metadatos para presentarse (kicker, color de acento, etc.), se
 * suman a este mapa sin tocar el server.
 *
 * Convención: el id del minijuego (`challengeId`) viene del server
 * (ver `server/src/challenges/registry.ts`). Si llega un id desconocido
 * o vacío, devolvemos un genérico neutro — la pantalla nunca debe
 * quedarse sin texto.
 */

/** Mapa challengeId → "tema del día" para el appheader. */
const TEMAS: Record<string, string> = {
  'boton-del-bonus':         'Bono Compartido',
  'el-recorte':              'Recorte de Presupuesto',
  'tablero-scrum':           'Tablero del Sprint',
  'reconocimiento-del-mes':  'Reconocimiento del Mes',
};

/** Texto del día para el appheader. Mayúsculas las pone el CSS. */
export function temaDelDia(challengeId: string): string {
  return TEMAS[challengeId] ?? 'Jornada de Evaluación';
}

/** Minijuego disponible — para el selector "Partida rápida" del dev panel. */
export interface MinijuegoMeta {
  id: string;
  label: string;
}

/** Catálogo para el selector dev. Refleja los minijuegos del registry
 *  del server (server/src/challenges/registry.ts). Si sumás un minijuego
 *  allá, agregalo acá para poder arrancarlo directo desde el lobby. */
export const MINIJUEGOS: readonly MinijuegoMeta[] = [
  { id: 'boton-del-bonus',         label: 'Bono Compartido (individual)' },
  { id: 'el-recorte',              label: 'El Recorte (grupal)' },
  { id: 'tablero-scrum',           label: 'El Tablero SCRUM (individual)' },
  { id: 'reconocimiento-del-mes',  label: 'El Reconocimiento del Mes (grupal)' },
];
