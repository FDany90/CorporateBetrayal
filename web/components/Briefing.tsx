"use client";

/* PASO 2 — pantalla de briefing: explica el desafío antes de jugarlo. */

import { useGame } from "@/lib/game";

export function Briefing() {
  const { estado, miId, confirmar } = useGame();
  if (!estado) return null;

  const yo = estado.players.find((p) => p.id === miId);
  const listos = estado.players.filter((p) => p.acted).length;
  const total = estado.players.length;

  return (
    <div className="screen">
      <div className="topbar">
        <span className="brand">
          SINERGIA<span className="dot">·</span>CORP
        </span>
        <span className="pill">💼 {yo?.influence ?? 0}</span>
      </div>
      <div className="appheader">Aprobaciones · Bono del Equipo</div>

      <div className="content">
        <h1>El Botón del Bonus</h1>
        <p>
          Vas a hablar 1-a-1 con un colega por Teams. Al cerrar la llamada,
          en secreto elegís Compartir el bono o Quedártelo.
        </p>
        <div className="card">
          <div className="rule">
            <span>🟢 Compartir + 🟢 Compartir</span>
            <strong>+3 / +3</strong>
          </div>
          <div className="rule">
            <span>🔴 Quedárselo vs 🟢 Compartir</span>
            <strong>+5 / 0</strong>
          </div>
          <div className="rule">
            <span>🔴 Quedárselo + 🔴 Quedárselo</span>
            <strong>+1 / +1</strong>
          </div>
        </div>
        <p className="muted-note">El otro no ve tu elección hasta el resultado.</p>
      </div>

      <div className="actionbar">
        {yo?.acted ? (
          <p className="muted-note">
            Esperando a los demás… ({listos}/{total})
          </p>
        ) : (
          <button className="btn" onClick={confirmar}>
            ENTENDIDO
          </button>
        )}
      </div>
    </div>
  );
}
