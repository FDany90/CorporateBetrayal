import { GameProvider } from "@/lib/game";
import { Game } from "@/components/Game";

export default function Page() {
  return (
    <GameProvider>
      <Game />
    </GameProvider>
  );
}
