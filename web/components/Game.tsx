"use client";

import { useGame } from "@/lib/game";
import { Ingreso } from "./Ingreso";
import { Lobby } from "./Lobby";

export function Game() {
  const { estado } = useGame();
  return <main className="app">{estado ? <Lobby /> : <Ingreso />}</main>;
}
