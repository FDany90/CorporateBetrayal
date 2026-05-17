import { Schema, type, MapSchema } from "@colyseus/schema";

/**
 * Un jugador de la sala. Incluye `token` (identidad persistente para
 * reconexión) e `isBot` (jugador de mentira para el modo desarrollo).
 */
export class Player extends Schema {
  @type("string") id = "";        // sessionId actual de Colyseus
  @type("string") token = "";     // identidad persistente (reconexión)
  @type("string") nickname = "";
  @type("string") avatar = "";
  @type("boolean") ready = false;
  @type("boolean") isBot = false;
  @type("boolean") connected = true;
}

/**
 * Estado de una partida. En el Paso 1 solo modela el lobby; las rondas y
 * desafíos se suman en pasos siguientes.
 */
export class GameState extends Schema {
  @type("string") code = "";
  @type("string") status = "lobby"; // lobby | in-game | finished
  @type({ map: Player }) players = new MapSchema<Player>();
}
