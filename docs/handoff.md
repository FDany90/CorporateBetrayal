# Traición en la Oficina — Estado del Proyecto y Guía para Retomar

> Documento de traspaso. Si abrís el proyecto en otra PC o en una sesión
> nueva (de Claude o tuya), **empezá por acá**.

**Última actualización:** 2026-05-21 · **Hito actual:** Paso 3 completo ·
2 minijuegos · cliente Angular con lenguaje visual editorial aplicado a
**7 pantallas** (Ingreso / Lobby / Comunicado / Final / Briefing /
Desafío / Votación) · nomenclatura editorial **"Día X de Y · Tema del
día"** en todos los appheaders de juego · votación con **conteo en vivo,
Confirmar Voto y reordenamiento animado** · **sistema de animaciones**
(variantes de beat reusables, count-up numérico, reveals escalonados) ·
**herramientas de desarrollo** (devbar flotante: partida rápida, salir al
lobby, saltar fase, arrancar en un minijuego) · sistema de avatars (15
SVGs + modal) · a11y/UX mobile-first auditada (WIG Vercel)

**Próximo objetivo:** MVP de **4 minijuegos** (2 individuales + 2 grupales)
→ **deploy + playtest** con amigos. Ver §9.

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
| 2 — Bucle base (El Botón del Bonus) | ✅ completo |
| **3 — Motor de rondas + marcador + pantalla final** | ✅ **completo (hito actual)** |
| 4 — Resto del catálogo de minijuegos | 🔄 en curso (2 de 13) |
| 5 — Pulido (estética, onboarding) | 🔄 en curso (lenguaje editorial aplicado a 7 pantallas) |
| 6 — Deploy y post-MVP | pendiente |

> Además del roadmap, entre el Paso 2 y el 3 se migró el cliente web de
> Next.js/React a Angular (ver [migracion-angular.md](migracion-angular.md)).

**Qué funciona hoy:** la partida corre de punta a punta:
- **Lobby:** crear/unirse por código, lista en vivo, reconexión, anfitrión,
  expulsar jugadores, bots de desarrollo.
- **Motor de rondas:** 4 rondas con patrón I-G-I-G (parametrizable en
  `server/src/config.ts`), marcador entre rondas y pantalla final.
- **2 minijuegos:** *El Botón del Bonus* (individual, llamadas 1-a-1 en
  tandas sin repetir pareja) y *El Recorte* (grupal, votación).

**Lenguaje visual "Editorial Sinergia"** aplicado a siete pantallas:
- **Ingreso** — formulario con tipografía editorial (Fraunces + JetBrains Mono),
  selector de avatar grande clickeable que abre un modal pantalla-completa.
- **Lobby** — "memorándum interno" con folio, expediente (código de sala
  grande), planilla de convocados con puntos guía, anexo técnico para bots.
- **Comunicado** — premisa narrativa del juego (nueva pantalla, fase
  `'comunicado'` del server): plan de optimización con 1 ascenso + 1
  desvinculación en juego. Sello "CONFIDENCIAL" cayendo diagonal. El
  botón ENTENDIDO vive **dentro** del papel (sin actionbar separado).
- **Final** — "circular oficial" con papel crema, grano, sombra dramática,
  sello rojo "ASCENSO APROBADO" cayendo al final con scale+rotate.
- **Briefing** — memo interno del día: kicker, h1 grande, bajada narrativa,
  *Matriz de pagos* editorial (chips verde/rojo con puntaje + bajada por
  caso) para el Botón del Bonus; *aviso destacado* "Reunión obligatoria
  en Teams" con ícono multi-persona para El Recorte. Variante `intro-slow`
  (700ms entre beats) — ritmo de lectura.
- **Desafío** — "Dictamen secreto" del Botón del Bonus: kicker de rol
  (pulso champagne si me toca llamar), ficha del colega con marco doble
  + sombra champagne, *section-head con ícono de teléfono* SVG entre
  avatar y nombre, dos opciones grandes (verde/rojo) con sello "Elegido"
  girado al seleccionar.
- **Votación** — "Acta interna" del Recorte: planilla con cabecera
  (Candidato / Votos), filas con avatar + nombre + tag "Tu voto" + tally
  en vivo. Yo aparezco en la lista (con tag "vos", rayado diagonal, no
  clickeable). Botón **CONFIRMAR VOTO** definitivo; el voto se cambia
  libremente hasta confirmar.

Sistema editorial común a las pantallas de juego:
- **Appheader** uniforme: `Día X de Y · Tema del día` (sin "Aprobaciones"
  ni "Ronda"). El "Tema" sale de [`challenge-meta.ts`](../web-angular/src/app/challenge-meta.ts)
  — un mapa cliente `challengeId → tema editorial`. Cubre Briefing,
  Desafío, Votación, Resultado, Marcador.
- **Lenguaje narrativo del Recorte**: ya no es "recorte de personal", es
  "**recorte de presupuesto**": no alcanza para todos los bonos, se vota
  a quién dejar sin bono. Más coherente con la mecánica (nadie eliminado,
  solo se pierde Influencia).

**Sistema de avatars:** 15 ilustraciones SVG cartoon (cabeza grande, cuello
corto, marco redondo) con personalidades reconocibles (Dirección, Sistemas,
RR.HH., Seguridad, Coach, Visionario, Quemado, Jefe, Nerd, Viejo, Hippie,
Remera, Finanzas, Legales, Diseño). Componente `<app-avatar>` reusable +
modal `<app-avatar-picker>` pantalla-completa.

**Accesibilidad y UX mobile-first** (auditado contra Vercel Web Interface
Guidelines, ver el skill `/web-design-guidelines`):
- Zoom de usuario habilitado, `touch-action: manipulation` global, sin
  delay de 300ms en doble-tap.
- `:focus-visible` champagne en todos los interactivos (teclado).
- `prefers-reduced-motion` neutraliza animaciones para usuarios sensibles.
- Tap targets ≥40-44px en todos los botones.
- Labels asociados a inputs (`for`/`id`), `autocomplete`/`inputmode` en
  inputs, `aria-label` en icon-only buttons.
- Modal del picker: `role="dialog" aria-modal`, cerrar con ESC, focus trap,
  autofocus al abrir, restaurar foco al cerrar.
- `aria-live="polite"` en zonas async ("Esperando a los demás…").
- `tabular-nums` en columnas numéricas, `text-wrap: balance` en headings.

Todo jugable solo con bots.

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
- **MVP:** catálogo de 6 individuales + 7 grupales; estructura de rondas
  **parametrizable** (`config.ts`) — por defecto 4 rondas I-G-I-G; **un solo
  recurso** (Influencia); **sin** Misión Personal ni Sospecha (post-MVP).
- **Visual:** lenguaje **"Editorial Sinergia"** — sátira corporativa con
  estética de documentos internos (papel crema, tinta carbón, acento champagne,
  rojo apagado para el sello). Fonts: **Fraunces** (display, serif editorial)
  + **JetBrains Mono** (body, "sistema interno"). **Mobile First**.
  Las paletas conmutables Azul/Verde se retiraron — paleta única definitiva.
  Intensidad modulada: pantallas funcionales con papel claro; pantalla Final
  con grano + sombra dramática + sello rojo (pico teatral del juego).
- **Teams:** integración solo por **instrucciones manuales** (la web dice a
  quién llamar; sin API de Teams).
- **Minijuegos enchufables:** implementado. Cada minijuego es una
  `ChallengeDefinition` en `server/src/challenges/` registrada en `registry.ts`.
  El motor no conoce minijuegos concretos: solo *kinds* (`llamadas`, `votacion`).
  Ver [modelo-datos §4.6](modelo-datos.md).

---

## 8. Cómo se testea

- **Server:** `npm run check` (typecheck con `tsc --noEmit`).
- **Web:** `npm run build` / `ng build` (compila + typecheck).
- **Manual:** en la PC, con `F12 → emulación mobile` para el layout, y **varias
  pestañas** (normal + incógnito) para simular multijugador.
- **Logs de depuración:** el cliente Angular tiene logs temporales (`dlog`,
  prefijo `[traición·…]` en consola) activos durante el desarrollo. Se quitan
  borrando `web-angular/src/app/dlog.ts` y sus usos.
- **Problema conocido:** probar en un **celular real por la red local NO
  funciona** (lo bloquea el Firewall de Windows / la red corporativa). **No es
  un bug** — desaparece al deployar (URLs públicas, `wss`/443). Mientras tanto
  se prueba en la PC; para probar en celular hay que deployar.

---

## 9. Próximos pasos

**Objetivo inmediato: MVP de 4 minijuegos → deploy → playtest.** Decisión
de scope (2026-05-21): con 4 juegos (2 individuales + 2 grupales) alcanza
para un primer playtest entre amigos. Recién ahí se valida que el loop
social engancha, antes de seguir expandiendo el catálogo.

1. **Sumar 2 minijuegos** (de a uno por incremento):
   - Otro **individual** (kind `llamadas`, como El Botón del Bonus).
   - Otro **grupal** (kind `votacion`, como El Recorte).
   Ambos son de *kinds* ya existentes → **no tocan el motor**: solo una
   `ChallengeDefinition` nueva en `server/src/challenges/` + registro,
   su entrada en `challenge-meta.ts` (tema + selector dev) y los textos
   de su briefing.
2. **Deploy** — hosting estático (web) + Railway/Fly (server). Habilita
   probar en celulares reales (hoy bloqueado por el firewall en red local).
3. **Playtest** con 3-5 amigos. Observar si el debate/voto en la llamada
   funciona; ajustar balance y copy según lo que pase.

**Después del MVP / playtest:**

4. **Temporizadores en pantalla** — desde cero (no existen en server). Cada
   fase con tiempo límite + contador visible. Plan: server primero
   (timestamp de fin de fase en `GameState` + `setTimeout`), luego UI
   (`<app-timer>` reusable).
5. **Migrar las últimas pantallas al lenguaje editorial**: **Reunión**,
   **Resultado** y **Marcador** ya tienen el appheader unificado y el
   Marcador/Resultado ya tienen animaciones; falta terminar el rediseño
   del contenido (kicker, h1 editorial) en Reunión.
6. **Resto del catálogo** — quedan minijuegos del GDD, uno por incremento.
7. **Pendiente del Paso 3** — desempate por **votación directa** en la
   pantalla final (hoy, si hay empate en el #1, comparten puesto).

**Decisiones abiertas** pendientes: ver la sección 11 del [GDD](GDD.md)
(balance de puntajes, sets de palabras/tarjetas, etc.).

---

## 10. Pendientes de Dani (revisión)

- ~~Elegir la **paleta definitiva** entre las 2 propuestas.~~ ✅ resuelto:
  paleta editorial única (papel crema + tinta + champagne + rojo).
- Revisar el prototipo HTML y los wireframes con ojo de detalle.
