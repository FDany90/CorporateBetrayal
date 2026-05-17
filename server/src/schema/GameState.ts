import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

/** Un jugador de la sala. */
export class Player extends Schema {
  @type("string") id = "";        // sessionId actual de Colyseus
  @type("string") token = "";     // identidad persistente (reconexión)
  @type("string") nickname = "";
  @type("string") avatar = "";
  @type("boolean") ready = false; // fichó entrada en el lobby
  @type("boolean") isBot = false;
  @type("boolean") connected = true;

  // --- estado de juego ---
  @type("number") influence = 0;  // puntaje acumulado
  @type("string") decision = "";  // "" | "verde" | "rojo" (decisión del desafío actual)
  @type("boolean") acted = false; // ack de la fase actual (briefing / result)
  @type("number") lastDelta = 0;  // cambio de influencia del último desafío
}

/** Una pareja de llamada 1-a-1 dentro de un desafío. */
export class Pairing extends Schema {
  @type("string") aId = "";
  @type("string") bId = "";
}

/**
 * Estado de una partida.
 * `status`: lobby | playing
 * `phase` : lobby | briefing | calls | result
 */
export class GameState extends Schema {
  @type("string") code = "";
  @type("string") status = "lobby";
  @type("string") phase = "lobby";
  @type("string") challengeId = "";
  @type([Pairing]) pairings = new ArraySchema<Pairing>();
  @type({ map: Player }) players = new MapSchema<Player>();
}
