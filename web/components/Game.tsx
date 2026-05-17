"use client";

import { useGame } from "@/lib/game";
import { Ingreso } from "./Ingreso";
import { Lobby } from "./Lobby";
import { Briefing } from "./Briefing";
import { Desafio } from "./Desafio";
import { Resultado } from "./Resultado";

export function Game() {
  const { estado } = useGame();

  let pantalla: React.ReactNode;
  if (!estado) pantalla = <Ingreso />;
  else if (estado.status === "lobby") pantalla = <Lobby />;
  else if (estado.phase === "briefing") pantalla = <Briefing />;
  else if (estado.phase === "calls") pantalla = <Desafio />;
  else if (estado.phase === "result") pantalla = <Resultado />;
  else pantalla = <Lobby />;

  return <main className="app">{pantalla}</main>;
}
