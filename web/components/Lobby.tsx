"use client";

/* PASO 1 — lobby (lista de jugadores, fichar, bots).
   El botón "Empezar partida" se agregó en el Paso 2. */

import { useGame } from "@/lib/game";

export function Lobby() {
  const {
    estado,
    miId,
    ficharEntrada,
    agregarBots,
    limpiarBots,
    expulsar,
    empezarPartida,
    salir,
  } = useGame();

  if (!estado) return null;

  const yo = estado.players.find((p) => p.id === miId);
  const listos = estado.players.filter((p) => p.ready).length;
  const total = estado.players.length;
  const hayBots = estado.players.some((p) => p.isBot);
  const soyHost = !!yo && yo.id === estado.hostId;
  const todosFichados = total > 0 && estado.players.every((p) => p.ready);
  const puedeEmpezar = total >= 2 && todosFichados;

  // Texto del botón "Empezar" según qué falta.
  let textoEmpezar = "EMPEZAR PARTIDA";
  if (total < 2) textoEmpezar = "Necesitás 2+ jugadores";
  else if (!todosFichados) textoEmpezar = `Faltan fichar (${listos}/${total})`;

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
                {p.id === estado.hostId && (
                  <span className="tag">anfitrión</span>
                )}
                {p.isBot && <span className="tag bot">bot</span>}
              </span>
              <span className={"st" + (p.ready ? " ready" : "")}>
                {!p.connected
                  ? "desconectado"
                  : p.ready
                    ? "✓ fichado"
                    : "· sin fichar"}
              </span>
              {soyHost && p.id !== miId && (
                <button
                  className="kick"
                  title={`Expulsar a ${p.nickname}`}
                  onClick={() => expulsar(p.id)}
                >
                  ✕
                </button>
              )}
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
        {soyHost ? (
          <button
            className="btn"
            disabled={!puedeEmpezar}
            onClick={empezarPartida}
          >
            {textoEmpezar}
          </button>
        ) : (
          <p className="muted-note">
            Esperando a que el anfitrión empiece la partida…
          </p>
        )}
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
