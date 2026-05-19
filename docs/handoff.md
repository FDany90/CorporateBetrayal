# Traición en la Oficina — Estado del Proyecto y Guía para Retomar

> Documento de traspaso. Si abrís el proyecto en otra PC o en una sesión
> nueva (de Claude o tuya), **empezá por acá**.

**Última actualización:** 2026-05-18 · **Hito actual:** Paso 2 completo ·
cliente migrado a Angular

---

## 1. Cómo retomar

1. Cloná el repo: `https://github.com/FDany90/CorporateBetrayal`
2. Leé este documento entero.
3. Leé los documentos de diseño (carpeta `docs/`) en este orden:
   [GDD](GDD.md) → [modelo-datos](modelo-datos.md) →
   [arquitectura](arquitectura.md) → [UI-borradores](UI-borradores.md) →
   [codigo](codigo.md).
4. Para correr el proyecto, ver el [README](../README.md).

> **Si sos Claude retomando:** este doc + los `docs/` te dan el contexto
> completo. No hace falta re-discutir las decisiones de la sección 7.

---

## 2. Qué es el proyecto

Juego web de **desafíos sociales** inspirado en *Scam Line*, estilo
team-building de oficina, jugado sobre llamadas reales de Microsoft Teams.
Todos contra todos; gana quien más **Influencia** acumula. La web organiza,
distribuye información y cronometra; el juego real pasa en la voz y la mentira.
El detalle completo está en el [GDD](GDD.md).

---

## 3. Mapa de documentos

| Documento | Contenido |
|---|---|
| `docs/GDD.md` | Diseño del juego: mecánicas, catálogo de 13 desafíos, roadmap |
| `docs/modelo-datos.md` | Entidades, sistema de minijuegos enchufable |
| `docs/arquitectura.md` | Tiempo real, reconexión, infraestructura |
| `docs/UI-borradores.md` | Concepto visual (suite de apps), wireframes |
| `docs/codigo.md` | Guía del código del server y la web |
| `docs/migracion-angular.md` | Plan y registro de la migración React → Angular |
| `docs/handoff.md` | Este documento |
| `prototipo/index.html` | Prototipo HTML estático (descartable) |

---

## 4. Estado actual y roadmap

Roadmap del [GDD §10](GDD.md):

| Fase | Estado |
|---|---|
| 0 — Diseño | ✅ completo |
| 1 — Esqueleto (lobby en tiempo real) | ✅ completo |
| **2 — Bucle base (El Botón del Bonus)** | ✅ **completo (hito actual)** |
| 3 — Ronda completa (5 rondas + pantalla final) | ⏭️ siguiente |
| 4 — Resto del catálogo (13 desafíos) | pendiente |
| 5 — Pulido (estética, onboarding) | pendiente |
| 6 — Deploy y post-MVP | pendiente |

**Qué funciona hoy:** lobby (crear/unirse por código, lista en vivo,
reconexión, bots de desarrollo) y el bucle completo de un desafío —
`lobby → briefing → llamadas → resultado → marcador` — corriendo *El Botón del
Bonus*, jugable solo con bots.

---

## 5. El código

```
server/        game server — Colyseus (Node + TypeScript)
web-angular/   cliente — Angular (TypeScript)
```

Correrlo (Node 20+, dos terminales):
```bash
cd server      && npm install && npm run dev   # ws://localhost:2567
cd web-angular && npm install && npm start     # http://localhost:4200
```

Detalle de cada archivo: [codigo.md](codigo.md).

---

## 6. Cómo trabajamos (flujo)

- **Diseño antes que código.** Todo se discute y se escribe en `docs/` antes de
  construirlo. Los documentos se versionan con número (`v0.7`, etc.).
- **Construcción por pasos** del roadmap (sección 4). Cada paso es un incremento
  chico, verificado y commiteado.
- **Git:** se commitea y se hace `push` a GitHub seguido, con mensajes en
  español. Los commits terminan con la línea
  `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.
  La identidad de los commits es **Daniel Fernández
  (daniel.fernandezalb@gmail.com)** — si el git global de la PC no coincide,
  commitear con `git -c user.name="FDany90" -c user.email="daniel.fernandezalb@gmail.com" commit ...`.
- **Idioma:** todo en español rioplatense — documentos, UI, y también nombres
  de variables y comentarios del código.
- **Feedback de Dani:** suele escribir comentarios en línea dentro de los `.md`
  con el prefijo `>DANI:`; Claude los incorpora y limpia el comentario.
- **GitHub Pages** sirve el prototipo HTML en
  `https://fdany90.github.io/CorporateBetrayal/prototipo/`.

---

## 7. Decisiones clave ya cerradas (no re-litigar)

- **Stack:** Angular + Colyseus; estado en memoria; deploy previsto en hosting
  estático (web) + Railway/Fly (server). El cliente fue migrado de Next.js/React
  a Angular — ver [migracion-angular.md](migracion-angular.md).
- **Juego:** todos contra todos, sin eliminación; gana más Influencia.
- **MVP:** catálogo de 6 individuales + 7 grupales; 5 rondas (3 grupales +
  2 individuales, intercaladas); **un solo recurso** (Influencia); **sin**
  Misión Personal ni Sospecha (post-MVP).
- **Visual:** "suite de apps corporativas" (empresa ficticia *SINERGIA CORP*),
  **Mobile First**; hay 2 paletas conmutables (Sinergia Azul / Verde Acción) —
  la definitiva aún no se eligió.
- **Teams:** integración solo por **instrucciones manuales** (la web dice a
  quién llamar; sin API de Teams).
- **Minijuegos enchufables:** el motor no conoce ningún minijuego en particular
  (ver modelo-datos.md). En el Paso 2 esto está parcialmente aplicado (la lógica
  de El Botón del Bonus está en `server/src/challenges/`).

---

## 8. Cómo se testea

- **Server:** `npx tsc --noEmit` (typecheck).
- **Web:** `npm run build` (compila + typecheck).
- **Integración:** se escriben smoke tests temporales con `colyseus.js` que
  simulan un cliente (crear sala, bots, recorrer fases) y se borran después.
- **Manual:** en la PC, con `F12 → emulación mobile` para el layout, y **varias
  pestañas** (normal + incógnito) para simular multijugador.
- **Problema conocido:** probar en un **celular real por la red local NO
  funciona** (lo bloquea el Firewall de Windows / la red corporativa). **No es
  un bug** — desaparece al deployar (URLs públicas, `wss`/443). Mientras tanto
  se prueba en la PC; para probar en celular hay que deployar.

---

## 9. Próximos pasos

1. **Paso 3** — Las 5 rondas intercaladas (G-I-G-I-G) + marcador entre rondas +
   pantalla final ("Empleado del Mes") + desempate por votación directa.
2. **Paso 4** — Resto del catálogo MVP: implementar los otros 12 desafíos como
   `ChallengeDefinition`. Conviene primero formalizar el registro de minijuegos
   enchufables del [modelo-datos.md](modelo-datos.md).
3. **Paso 5** — Pulido visual (elegir paleta definitiva), onboarding/guía.
4. **Deploy** — Vercel + Railway; habilita probar en celulares reales. Se puede
   adelantar cuando se quiera mostrar a otros.

**Decisiones abiertas** pendientes: ver la sección 11 del [GDD](GDD.md)
(balance de puntajes, sets de palabras/tarjetas, etc.).

---

## 10. Pendientes de Dani (revisión)

- Elegir la **paleta definitiva** entre las 2 propuestas.
- Revisar el prototipo HTML y los wireframes con ojo de detalle.
