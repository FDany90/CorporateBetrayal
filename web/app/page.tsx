/* PASO 1 — punto de entrada: monta el proveedor de juego y la app. */
import { GameProvider } from "@/lib/game";
import { Game } from "@/components/Game";

export default function Page() {
  return (
    <GameProvider>
      <Game />
    </GameProvider>
  );
}
