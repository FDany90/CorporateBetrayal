"use client";

import { useEffect, useState } from "react";

/** Conmutador de paleta para previsualizar las 2 propuestas de estilo. */
export function ThemeSwitcher() {
  const [tema, setTema] = useState("azul");

  useEffect(() => {
    const guardado = localStorage.getItem("traicion.tema") || "azul";
    setTema(guardado);
    document.documentElement.dataset.theme = guardado;
  }, []);

  function cambiar(t: string) {
    setTema(t);
    document.documentElement.dataset.theme = t;
    localStorage.setItem("traicion.tema", t);
  }

  return (
    <div className="themebar">
      <span>Estilo:</span>
      <button
        className={tema === "azul" ? "on" : ""}
        onClick={() => cambiar("azul")}
      >
        Sinergia Azul
      </button>
      <button
        className={tema === "verde" ? "on" : ""}
        onClick={() => cambiar("verde")}
      >
        Verde Acción
      </button>
    </div>
  );
}
