/* ============================================================
   El Tablero SCRUM — tercer minijuego (kind 'tablero').

   Información asimétrica + adivinar: hay K tarjetas del sprint con
   valor real Fibonacci, secreto del server. Cada jugador conoce 1
   (se la mandamos por mensaje PRIVADO al entrar a la fase) y estima
   las demás. La negociación se hace por Teams (la web no guía las
   llamadas); el tablero se va editando en vivo. Confirmar o que se
   agote el timer → resolución.

   Puntaje (por jugador):
     - por cada tarjeta NO propia acertada: +tableroPayoff Influencia
     - por cada tarjeta NO propia errada:   −tableroPayoff Influencia
     - sin estimar: 0 (no se cuenta)
   ============================================================ */

import type { ChallengeDefinition } from "./registry";

/** Escala Fibonacci (estimación SCRUM clásica). Se elige uno al azar
 *  por tarjeta cada partida — así las repeticiones no se memorizan. */
export const FIBONACCI_SP = [1, 2, 3, 5, 8, 13] as const;

/** Una tarjeta del pool: título + bajada corta (sátira corporativa). La
 *  bajada NO es secreta — todos la ven; el secreto es el valor SP. */
export interface TarjetaPool {
  nombre: string;
  descripcion: string;
}

/** Pool de tareas de sprint con sátira corporativa. El server elige
 *  K al azar para cada partida. Sumar más a gusto: el pool puede
 *  crecer sin tocar el motor. */
export const POOL_TARJETAS: readonly TarjetaPool[] = [
  {
    nombre: "Login con Google",
    descripcion: "Que los usuarios no tengan que crear otra cuenta. Otra vez.",
  },
  {
    nombre: "Migrar la base a la nube",
    descripcion: "El servidor del rack ya se muere. Hay que llevar todo a AWS.",
  },
  {
    nombre: "Rediseño del home",
    descripcion: "Diseño volvió a pedir «algo más fresco». Iteración nº 7.",
  },
  {
    nombre: "Bug del carrito",
    descripcion: "Se duplican ítems al refrescar. Reportado hace 3 sprints.",
  },
  {
    nombre: "API de pagos",
    descripcion: "Migrar de Stripe a MercadoPago porque cobra menos comisión.",
  },
  {
    nombre: "Modal de cookies GDPR",
    descripcion: "Legales mandó otro mail. Hay que mostrar el banner sí o sí.",
  },
  {
    nombre: "Refactor del backend",
    descripcion: "Sacar el código que dejó el pasante en 2019 antes de irse.",
  },
  {
    nombre: "Onboarding nuevo",
    descripcion: "Bienvenida para el 70% que abandona en los primeros 10 segundos.",
  },
  {
    nombre: "Dashboard de KPIs",
    descripcion: "Para que el CEO vea gráficos lindos en su iPad en las reuniones.",
  },
  {
    nombre: "Notificaciones push",
    descripcion: "Avisarle al usuario cosas que no quería saber.",
  },
  {
    nombre: "Integración con Slack",
    descripcion: "Nadie la pidió, pero queda bien en la página de features.",
  },
  {
    nombre: "Dark mode",
    descripcion: "La gente lo pide hace 2 años. Es solo cambiar variables. Dicen.",
  },
  {
    nombre: "Búsqueda con filtros",
    descripcion: "Que se pueda filtrar por algo más que el título, por favor.",
  },
  {
    nombre: "Tests end-to-end",
    descripcion: "QA quiere que algo no se rompa antes de la demo del viernes.",
  },
  {
    nombre: "Migración a TypeScript",
    descripcion: "Para que dejen de aparecer los bugs raros que solo pasan en prod.",
  },
];

/**
 * K tarjetas en función de la cantidad de jugadores. Reglas:
 *  - mínimo 3 (con 3 jugadores el juego degrada bien: 1 dueño por carta).
 *  - de 4 en adelante, al menos 4 tarjetas (todos tienen algo para estimar).
 *  - tope 6 para que el tablero no se vuelva ilegible.
 *  - K ≤ N siempre, así toda tarjeta tiene al menos un dueño (si nadie la
 *    conoce, adivinarla sería lotería).
 *
 * Curva: 3→3, 4→4, 5→5, 6→5, 7→6, 8+→6.
 */
export function cantidadTarjetasPorJugadores(numPlayers: number): number {
  const ideal = Math.ceil(numPlayers / 2) + 2;
  const k = Math.max(3, Math.min(6, ideal));
  return Math.min(k, numPlayers);
}

export const TABLERO_SCRUM: ChallengeDefinition = {
  id: "tablero-scrum",
  nombre: "El Tablero SCRUM",
  format: "individual",
  kind: "tablero",
  callRounds: 0, // no usa tandas; las llamadas son libres por Teams
  tableroSeconds: 120, // 2 min máximo
  tableroPayoff: 3, // ±3 Influencia por tarjeta (acierto/error)
  cardPool: [...POOL_TARJETAS],
  cardsCount: cantidadTarjetasPorJugadores,
};
