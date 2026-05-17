"use client";

import { useGame } from "@/lib/game";

export function Lobby() {
  const {
    estado,
    miId,
    ficharEntrada,
    agregarBots,
    limpiarBots,
    empezarPartida,
    salir,
  } = useGame();

  if (!estado) return null;

  const yo = estado.players.find((p) => p.id === miId);
  const listos = estado.players.filter((p) => p.ready).length;
  const total = estado.players.length;
  const hayBots = estado.players.some((p) => p.isBot);
  const puedeEmpezar = total >= 2;

  return (
    <div className="screen">
      <div className="topbar">
        <span className="brand">
          SINERGIA<span className="dot">·</span>CORP
        </span>
        <span className="pill">Sala {estado.code}</span>
      </div>
      <div className="appheader">Intranet · Lobby</div>

      <div className="content">
        <div className="codebox">
          <div className="lbl">CÓDIGO DE SALA</div>
          <div className="val">{estado.code}</div>
        </div>

        <h2>
          Plantilla {total} / 12 · {listos} fichados
        </h2>

        <div className="card pad0">
          {estado.players.map((p) => (
            <div
              key={p.id}
              className={"player" + (p.connected ? "" : " off")}
            >
              <div className="av">{p.avatar}</div>
              <span className="nm">
                {p.nickname}
                {p.id === miId && <span className="tag">vos</span>}
                {p.isBot && <span className="tag bot">bot</span>}
              </span>
              <span className={"st" + (p.ready ? " ready" : "")}>
                {!p.connected
                  ? "desconectado"
                  : p.ready
                    ? "✓ fichado"
                    : "· sin fichar"}
              </span>
            </div>
          ))}
        </div>

        <div className="dev">
          <div className="devtitle">🧪 MODO DESARROLLO</div>
          <div className="devrow">
            <button className="btn ghost sm" onClick={() => agregarBots(1)}>
              + 1 bot
            </button>
            <button className="btn ghost sm" onClick={() => agregarBots(3)}>
              + 3 bots
            </button>
            <button
              className="btn ghost sm"
              onClick={limpiarBots}
              disabled={!hayBots}
            >
              Quitar bots
            </button>
          </div>
        </div>
      </div>

      <div className="actionbar">
        <button
          className="btn"
          disabled={!puedeEmpezar}
          onClick={empezarPartida}
        >
          {puedeEmpezar ? "EMPEZAR PARTIDA" : "Necesitás 2+ jugadores"}
        </button>
        <div className="devrow">
          <button
            className="btn ghost sm"
            onClick={() => ficharEntrada(!yo?.ready)}
          >
            {yo?.ready ? "Cancelar fichaje" : "Fichar entrada"}
          </button>
          <button className="btn danger sm" onClick={salir}>
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
