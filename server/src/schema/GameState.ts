/* ============================================================
   Estado sincronizado de la partida.
   PASO 1: lobby (code, status, players + campos de lobby de Player).
   PASO 2: juego  (phase, challengeId, pairings, Pairing + campos de
           juego de Player).
   ============================================================ */
import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

/** Un jugador de la sala. */
export class Player extends Schema {
  // --- lobby · Paso 1 ---
  @type("string") id = "";        // sessionId actual de Colyseus
  @type("string") token = "";     // identidad persistente (reconexión)
  @type("string") nickname = "";
  @type("string") avatar = "";
  @type("boolean") ready = false; // fichó entrada en el lobby
  @type("boolean") isBot = false;
  @type("boolean") connected = true;

  // --- juego · Paso 2 ---
  @type("number") influence = 0;  // puntaje acumulado
  @type("string") decision = "";  // "" | "verde" | "rojo" (decisión del desafío actual)
  @type("boolean") acted = false; // ack de la fase actual (briefing / result)
  @type("number") lastDelta = 0;  // cambio de influencia del último desafío
}

/** Una pareja de llamada 1-a-1 dentro de un desafío. — Paso 2 */
export class Pairing extends Schema {
  @type("string") aId = "";
  @type("string") bId = "";
}

/** Una tarjeta del Tablero SCRUM (kind 'tablero').
 *  `valorReal` arranca en 0 (oculto) durante la fase 'tablero' — el valor
 *  secreto NUNCA se sincroniza mientras se juega; cada jugador recibe el
 *  valor de SU tarjeta por mensaje PRIVADO. Al resolver, el server escribe
 *  todos los `valorReal` en el state para el reveal del resultado. */
export class Card extends Schema {
  @type("string") id = "";
  @type("string") nombre = "";
  @type("string") descripcion = "";
  @type("number") valorReal = 0;
}

/**
 * Estado de una partida.
 * `status`: lobby | playing
 * `phase` : lobby | briefing | calls | result | meeting | vote | marcador | final
 */
export class GameState extends Schema {
  @type("string") code = "";                                 // Paso 1
  @type("string") status = "lobby";                          // Paso 1
  @type("string") hostId = "";                               // Paso 1 — anfitrión: único que puede empezar
  /** Nombre de la empresa configurado por el anfitrión al crear la sala.
   *  "" = el cliente cae al default visual ("Sinergia Corp"). */
  @type("string") companyName = "";
  @type({ map: Player }) players = new MapSchema<Player>();   // Paso 1
  @type("string") phase = "lobby";                           // Paso 2
  @type("string") challengeId = "";                          // Paso 2 — minijuego de la ronda actual ("" = placeholder)
  @type([Pairing]) pairings = new ArraySchema<Pairing>();     // Paso 2
  @type("number") tanda = 0;       // Paso 2.5 — tanda de llamadas actual (1-based)
  @type("number") tandasTotal = 0; // Paso 2.5 — total de tandas del desafío
  @type("number") ronda = 0;       // Paso 3 — ronda actual (1-based)
  @type("number") rondasTotal = 0; // Paso 3 — total de rondas de la partida
  @type("string") rondaTipo = "";  // Paso 3 — "individual" | "grupal"
  // --- timers de fase ---
  // Reloj autoritativo del server. `phaseEndsAt` es el epoch ms (Date.now)
  // en que vence la fase con tiempo límite; 0 = la fase actual no tiene
  // timer. `phaseDurationSec` es la duración total, para que el cliente
  // pueda dibujar la barra de progreso (restante / total). El server tiene
  // su propio setTimeout que fuerza el avance al vencer — el cliente solo
  // muestra la cuenta regresiva.
  @type("number") phaseEndsAt = 0;
  @type("number") phaseDurationSec = 0;
  // --- Tablero SCRUM (kind 'tablero') ---
  // Tarjetas del sprint actual. Vacío fuera de la fase 'tablero'/'result'
  // de ese minijuego. Durante 'tablero': cada Card.valorReal = 0 (oculto);
  // al resolver, el server pone el valor real para el reveal.
  @type([Card]) cards = new ArraySchema<Card>();
  // --- Reconocimiento del Mes (kind 'reconocimiento') ---
  // Id del jugador que es "el jefe del mes" en la ronda actual. "" fuera
  // de la fase 'reconocimiento'. Es público (todos lo ven) para que la
  // vista "del resto" muestre quién está decidiendo.
  @type("string") bossId = "";
}
