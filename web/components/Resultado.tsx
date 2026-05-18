"use client";

/* PASO 2 — pantalla de resultado del desafío + marcador de Influencia. */

import { useGame } from "@/lib/game";

export function Resultado() {
  const { estado, miId, confirmar } = useGame();
  if (!estado) return null;

  const yo = estado.players.find((p) => p.id === miId);
  const ranking = [...estado.players].sort(
    (a, b) => b.influence - a.influence
  );
  const acks = estado.players.filter((p) => p.acted).length;
  const total = estado.players.length;

  const delta = yo?.lastDelta ?? 0;
  const signo = delta > 0 ? "+" : "";

  return (
    <div className="screen">
      <div className="topbar">
        <span className="brand">
          SINERGIA<span className="dot">·</span>CORP
        </span>
        <span className="pill">💼 {yo?.influence ?? 0}</span>
      </div>
      <div className="appheader">Aprobaciones · Resultado</div>

      <div className="content">
        <h2>El Botón del Bonus — terminó</h2>

        <div className="big">
          <div className="lbl">TU INFLUENCIA</div>
          <div className="val">
            {yo?.influence ?? 0}{" "}
            <span className={delta >= 0 ? "up" : "down"}>
              ({signo}
              {delta})
            </span>
          </div>
        </div>

        <p className="muted-note">
          El número te deja sacar conclusiones de tu colega. 😏
        </p>

        <h2 style={{ marginTop: 18 }}>Marcador</h2>
        <div className="card pad0">
          {ranking.map((p, i) => (
            <div key={p.id} className="player">
              <span className="pos">{i + 1}</span>
              <div className="av">{p.avatar}</div>
              <span className="nm">
                {p.nickname}
                {p.id === miId && <span className="tag">vos</span>}
              </span>
              <span className="st">💼 {p.influence}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="actionbar">
        {yo?.acted ? (
          <p className="muted-note">
            Esperando a los demás… ({acks}/{total})
          </p>
        ) : (
          <button className="btn" onClick={confirmar}>
            CONTINUAR
          </button>
        )}
      </div>
    </div>
  );
}
