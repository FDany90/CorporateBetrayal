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

/**
 * Estado de una partida.
 * `status`: lobby | playing
 * `phase` : lobby | briefing | calls | result | meeting | vote | marcador | final
 */
export class GameState extends Schema {
  @type("string") code = "";                                 // Paso 1
  @type("string") status = "lobby";                          // Paso 1
  @type("string") hostId = "";                               // Paso 1 — anfitrión: único que puede empezar
  @type({ map: Player }) players = new MapSchema<Player>();   // Paso 1
  @type("string") phase = "lobby";                           // Paso 2
  @type("string") challengeId = "";                          // Paso 2 — minijuego de la ronda actual ("" = placeholder)
  @type([Pairing]) pairings = new ArraySchema<Pairing>();     // Paso 2
  @type("number") tanda = 0;       // Paso 2.5 — tanda de llamadas actual (1-based)
  @type("number") tandasTotal = 0; // Paso 2.5 — total de tandas del desafío
  @type("number") ronda = 0;       // Paso 3 — ronda actual (1-based)
  @type("number") rondasTotal = 0; // Paso 3 — total de rondas de la partida
  @type("string") rondaTipo = "";  // Paso 3 — "individual" | "grupal"
}
