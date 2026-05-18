/* ============================================================
   Arranque del game server.
   Introducido en el PASO 1 (esqueleto). Sin cambios en el Paso 2.
   ============================================================ */
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { GameRoom } from "./rooms/GameRoom";

const port = Number(process.env.PORT) || 2567;

const gameServer = new Server({
  transport: new WebSocketTransport(),
});

// Una sala por partida; se encuentra por su código de 5 letras.
gameServer.define("game", GameRoom).filterBy(["code"]);

gameServer.listen(port);
console.log(`🎮 Game server escuchando en ws://localhost:${port}`);
