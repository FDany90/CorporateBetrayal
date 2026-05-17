"use client";

import { useState } from "react";
import { useGame } from "@/lib/game";
import { ThemeSwitcher } from "./ThemeSwitcher";

const AVATARS = ["🧑‍💼", "👩‍💼", "🧑‍💻", "👨‍💼", "👩‍💻", "🧔"];

export function Ingreso() {
  const { crearSala, unirseSala, cargando, error, servidorUrl } = useGame();
  const [modo, setModo] = useState<"crear" | "unirse">("crear");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);

  const nombreOk = nickname.trim().length >= 2;
  const codeOk = code.trim().length === 5;
  const puede = modo === "crear" ? nombreOk : nombreOk && codeOk;

  function enviar() {
    if (!puede || cargando) return;
    if (modo === "crear") crearSala(nickname.trim(), avatar);
    else unirseSala(code, nickname.trim(), avatar);
  }

  return (
    <div className="screen">
      <div className="content">
        <div className="logo">S</div>
        <h1 className="center">
          SINERGIA <span style={{ color: "var(--primary)" }}>CORP</span>
        </h1>
        <p className="center">Acceso de personal · Traición en la Oficina</p>

        <div style={{ height: 14 }} />

        <div className="seg">
          <button
            className={modo === "crear" ? "on" : ""}
            onClick={() => setModo("crear")}
          >
            Crear sala
          </button>
          <button
            className={modo === "unirse" ? "on" : ""}
            onClick={() => setModo("unirse")}
          >
            Unirse
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {modo === "unirse" && (
          <div className="field">
            <label>CÓDIGO DE SALA</label>
            <input
              className="code"
              maxLength={5}
              placeholder="ABCDE"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
        )}

        <div className="field">
          <label>TU APODO</label>
          <input
            maxLength={20}
            placeholder="Cómo te ven los demás"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <label
          style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}
        >
          ELEGÍ TU AVATAR
        </label>
        <div className="avatars">
          {AVATARS.map((a) => (
            <button
              key={a}
              className={avatar === a ? "on" : ""}
              onClick={() => setAvatar(a)}
            >
              {a}
            </button>
          ))}
        </div>

        <ThemeSwitcher />

        {servidorUrl && (
          <p className="muted-note">Servidor: {servidorUrl}</p>
        )}
      </div>

      <div className="actionbar">
        <button className="btn" disabled={!puede || cargando} onClick={enviar}>
          {cargando
            ? "Conectando…"
            : modo === "crear"
              ? "CREAR SALA"
              : "INGRESAR"}
        </button>
      </div>
    </div>
  );
}
