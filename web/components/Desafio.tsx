"use client";

import { useGame } from "@/lib/game";

export function Desafio() {
  const { estado, miId, decidir } = useGame();
  if (!estado) return null;

  const yo = estado.players.find((p) => p.id === miId);

  const pairing = estado.pairings.find(
    (pr) => pr.aId === miId || pr.bId === miId
  );
  const partnerId = pairing
    ? pairing.aId === miId
      ? pairing.bId
      : pairing.aId
    : null;
  const partner = partnerId
    ? estado.players.find((p) => p.id === partnerId)
    : null;

  // progreso: cuántos de los emparejados ya decidieron
  const enPareja = new Set<string>();
  estado.pairings.forEach((pr) => {
    enPareja.add(pr.aId);
    enPareja.add(pr.bId);
  });
  const total = estado.players.filter((p) => enPareja.has(p.id)).length;
  const decididos = estado.players.filter(
    (p) => enPareja.has(p.id) && p.decision
  ).length;

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="screen">
      <div className="topbar">
        <span className="brand">
          SINERGIA<span className="dot">·</span>CORP
        </span>
        <span className="pill">💼 {yo?.influence ?? 0}</span>
      </div>
      <div className="appheader">Aprobaciones · El Botón del Bonus</div>
      {children}
    </div>
  );

  // sin pareja (número impar de jugadores)
  if (!partner) {
    return (
      <Shell>
        <div className="content center">
          <div className="av-xl">🤷</div>
          <h2>Te quedaste sin pareja</h2>
          <p>Esta ronda no te tocó nadie. Esperá a que los demás terminen.</p>
        </div>
        <div className="actionbar">
          <p className="muted-note">
            Decidiendo… ({decididos}/{total})
          </p>
        </div>
      </Shell>
    );
  }

  const miDecision = yo?.decision ?? "";

  return (
    <Shell>
      <div className="content center">
        <p className="muted-note">📞 Llamá a tu colega por Teams</p>
        <div className="av-xl">{partner.avatar}</div>
        <h2>{partner.nickname}</h2>
        <p>Tras la llamada, decidí en secreto qué hacer con el bono:</p>

        <div className="choices">
          <button
            className={"choice" + (miDecision === "verde" ? " sel-g" : "")}
            onClick={() => decidir("verde")}
          >
            <div className="ic">🟢</div>
            <div className="t1">COMPARTIR</div>
            <div className="t2">Cooperar</div>
          </button>
          <button
            className={"choice" + (miDecision === "rojo" ? " sel-r" : "")}
            onClick={() => decidir("rojo")}
          >
            <div className="ic">🔴</div>
            <div className="t1">QUEDÁRMELO</div>
            <div className="t2">Traicionar</div>
          </button>
        </div>

        {miDecision ? (
          <p className="muted-note">
            Decisión enviada. Podés cambiarla hasta que decidan todos.
          </p>
        ) : (
          <p className="muted-note">Tu elección es secreta.</p>
        )}
      </div>

      <div className="actionbar">
        <p className="muted-note">
          Decidiendo… ({decididos}/{total})
        </p>
      </div>
    </Shell>
  );
}
