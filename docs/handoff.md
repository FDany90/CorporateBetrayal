# Traición en la Oficina — Estado del Proyecto y Guía para Retomar

> Documento de traspaso. Si abrís el proyecto en otra PC o en una sesión
> nueva (de Claude o tuya), **empezá por acá**.

**Última actualización:** 2026-05-22 · **Hito actual:** Paso 3 completo ·
2 minijuegos · cliente Angular con lenguaje visual editorial aplicado a
**7 pantallas** (Ingreso / Lobby / Comunicado / Final / Briefing /
Desafío / Votación) · nomenclatura editorial **"Día X de Y · Tema del
día"** en todos los appheaders de juego · votación con **conteo en vivo,
Confirmar Voto y reordenamiento animado** · **sistema de animaciones**
(variantes de beat reusables, count-up numérico, reveals escalonados) ·
**herramientas de desarrollo** (devbar flotante: partida rápida, salir al
lobby, saltar fase, arrancar en un minijuego) · sistema de avatars (15
SVGs + modal) · a11y/UX mobile-first auditada (WIG Vercel) · **layout
DESKTOP** (escritorio de nogal + vade de cuero + hoja de papel + ficha
lateral de personal) como progressive enhancement sobre el mobile.

**PIVOTE (2026-05-22):** el target de esta versión pasó a ser **desktop**
(se juega en la compu del laburo, al lado de Teams). El playtest será en
desktop. La integración mobile real con llamadas será **otro proyecto**
futuro (app nativa). Ver §7 y §9.

**Próximo objetivo:** **terminar la adaptación desktop** (propagar +
afinar en las pantallas restantes) → MVP de **4 minijuegos** (2 indiv. +
2 grupales, naciendo ya responsive) → **playtest en desktop**. Ver §9.

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
| 6 — Deploy y post-MVP | 🔄 en curso (deploy de prueba VIVO: Vercel + Render, ver §5) |

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
  ni "Ronda"). El "Tema" sale de [`challenge-meta.ts`](../web/src/app/challenge-meta.ts)
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

**Layout DESKTOP** (nuevo, 2026-05-22) — *progressive enhancement* sobre el
mobile-first, todo en `web/src/styles.css` dentro de `@media (min-width:760px)`
(el corte es 760px de ancho **CSS**, no físico: con el escalado de Windows un
monitor grande puede reportar ~800px CSS — por eso 760 y no 900+):
- **Escritorio de nogal**: el fondo `--desk` se vuelve una mesa de madera
  (gradientes CSS: veta vertical + tablones + luz cenital cálida).
- **Vade de cuero oxblood/bordó**: el wrapper `.desk` es la carpeta de
  escritorio sobre la que se apoya todo, con **esquineras champagne** (8
  gradientes en `::after`) y filo de cuero (`::before`). Sombra propia.
- **Hoja de papel**: `.app` deja de ser columna-celular y se vuelve una hoja
  flexible (crece hasta 680px) con sombra dramática. `app-root` es
  `display:contents` para que el centrado flex funcione.
- **Ficha de personal lateral** (`<app-desk-context>`, en `web/src/app/desk-context/`):
  panel de contexto persistente (Legajo + avatar, Influencia, Día X de Y +
  tema, En sala). Se monta en `app.html` **solo en desktop y solo en fases
  de juego** (briefing/calls/meeting/vote/result/marcador). Se EXCLUYE en
  lobby/ingreso (van solo-hoja) y en comunicado/final (momentos teatrales a
  pantalla plena). NO muestra Influencia ajena (hay minijuegos de marcador
  oculto; el marcador se revela en su pantalla).
- **Mobile intacto**: por debajo de 760px se ve exactamente el layout de
  celular de siempre (la ficha desaparece, `display:contents` es no-op).

Todo jugable solo con bots.

---

## 5. El código

```
server/        game server — Colyseus (Node + TypeScript)
web/   cliente — Angular (TypeScript)
```

**Producción (deployado 2026-05-21):**
- **Cliente** (Vercel, root `web/`, output `dist/web/browser`):
  `https://corporate-betrayal.vercel.app`
- **Server** (Render, free tier, root `server/`):
  `wss://corporatebetrayal.onrender.com` — configurado en
  `web/src/environments/environment.ts`.
- **Cold start:** el server free de Render duerme tras ~15 min de
  inactividad; el primer acceso tarda ~30-50s en despertar. Para un
  playtest, entrá vos primero unos segundos antes de citar a los demás.
- Ambos redeployan solos al hacer `push` a `main` (auto-deploy de
  GitHub). El cliente lleva la URL del server horneada en el build.
- **Ojo (pendiente de configurar):** Vercel es inteligente y solo
  reconstruye cuando cambian archivos de `web/`. **Render, por defecto,
  redeploya el server en CADA push a `main`**, aunque el cambio sea 100%
  web — innecesario (resetea el cold-start, server no cambió). Fix: en el
  panel de Render → Settings → **Build Filters** → *Included Paths* =
  `server/**`, para que el server solo redeploye cuando cambia `server/`.

Correrlo (Node 20+, dos terminales):
```bash
cd server      && npm install && npm run dev   # ws://localhost:2567
cd web && npm install && npm start     # http://localhost:4200
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
- **Target de plataforma (decidido 2026-05-22):** **DESKTOP** para esta
  versión (se juega en la compu del laburo, al lado de Teams; las empresas
  no suelen bloquear una web nueva que no parece "un juego"). El playtest
  será en desktop. La integración mobile real con llamadas será **otro
  proyecto** futuro (app nativa iPhone/Android, encarado de nuevo). El
  desarrollo sigue siendo **mobile-first** en el código (el desktop es
  progressive enhancement encima), pero el desktop dejó de ser pulido
  post-MVP y es **parte del MVP** (antes del playtest).
- **Visual:** lenguaje **"Editorial Sinergia"** — sátira corporativa con
  estética de documentos internos (papel crema, tinta carbón, acento champagne,
  rojo apagado para el sello). Fonts: **Fraunces** (display, serif editorial)
  + **JetBrains Mono** (body, "sistema interno"). **Mobile First** en código.
  En desktop, metáfora de **"documento sobre escritorio"**: hoja de papel
  sobre un vade de cuero oxblood, sobre una mesa de nogal, con ficha de
  personal al costado (decidido y construido 2026-05-22).
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
- **Manual:** en la PC, con `F12 → emulación mobile` para el layout mobile, y
  **varias pestañas** (normal + incógnito) para simular multijugador.
- **Probar DESKTOP:** simplemente con la ventana ancha (el layout escritorio
  arranca en **760px de ancho CSS**). OJO: el ancho **CSS** no es el físico —
  con el escalado de Windows (150-250%) un monitor grande reporta ~800px CSS.
  Para verificar en consola: `window.innerWidth` y
  `getComputedStyle(document.querySelector('.app')).maxWidth` (debe dar
  `680px` en desktop, `440px` en mobile). La ficha lateral solo aparece en
  fases de juego (arrancá una partida con la devbar para verla).
- **Gotcha del dev server (nos comió tiempo el 2026-05-22):** Angular
  (`npm start`) a veces sigue sirviendo el **CSS viejo** al editar
  `styles.css` global o agregar componentes — recargar el browser NO alcanza.
  Hay que **matar el proceso** de `npm start` (Ctrl+C; o matar el puerto 4200)
  y volver a levantarlo, esperar `Compiled successfully`, y Ctrl+Shift+R. Si
  persiste, borrar `web/.angular/cache`.
- **Logs de depuración:** el cliente Angular tiene logs temporales (`dlog`,
  prefijo `[traición·…]` en consola) activos durante el desarrollo. Se quitan
  borrando `web/src/app/dlog.ts` y sus usos.
- **Probar en celular:** usar la URL pública de Vercel (ver §5), no la red
  local. (Por la red local lo bloquea el Firewall de Windows / la red
  corporativa — no es un bug; por eso se deployó.) Validado en celular el
  2026-05-21: se ve y juega bien.

---

## 9. Próximos pasos

**Objetivo inmediato: terminar desktop → 4 minijuegos → playtest en
desktop.** El deploy ya está hecho (Vercel + Render, §5). Con el pivote a
desktop (§7), el orden quedó:

1. **Terminar la adaptación desktop** (EN CURSO — lo próximo al volver):
   - El shell desktop ya está (escritorio + vade + hoja + ficha lateral, §4).
   - **Propagar y afinar** pantalla por pantalla: revisar cómo se ve cada
     una en desktop con la hoja a 680px y la ficha al lado (Briefing,
     Desafío, Votación, Reunión, Resultado, Marcador, Comunicado, Final,
     Lobby, Ingreso). Algunas pantallas pensadas para columna angosta
     pueden quedar con mucho aire o desbalanceadas en la hoja ancha —
     ajustar dónde convenga (multi-columna donde sume, anchos máximos de
     bloques, etc.). Iterar como siempre, una pantalla a la vez.
   - Afinar detalles del escritorio según gusto (saturación del bordó,
     grosor de las esquineras, cuánto cuero asoma = `padding` del `.desk`).
2. **Sumar 2 minijuegos** (de a uno por incremento, **naciendo ya responsive**):
   - Otro **individual** (kind `llamadas`, como El Botón del Bonus).
   - Otro **grupal** (kind `votacion`, como El Recorte).
   Ambos son de *kinds* ya existentes → **no tocan el motor**: solo una
   `ChallengeDefinition` nueva en `server/src/challenges/` + registro,
   su entrada en `challenge-meta.ts` (tema + selector dev) y los textos
   de su briefing. (Dani dijo que ya tiene en mente cuáles; falta elegir.)
3. **Playtest en desktop** con 3-5 amigos. Observar si el debate/voto en la
   llamada funciona; ajustar balance y copy según lo que pase.

> **Config pendiente (no bloquea):** poner el Build Filter de Render
> (`server/**`) para que los pushes web no redeployen el server (§5).

**Después del MVP / playtest:**

4. **Feedback de botones / latencia percibida** (detectado en el playtest
   en celular, 2026-05-21): al tocar un botón de acción (ENTENDIDO,
   CONFIRMAR VOTO, opciones del desafío) no se ve feedback hasta que
   cambia la pantalla — entre el tap y la respuesta del server hay un
   round-trip que en producción (Render + red) se nota y se siente
   "frizado". Solución recomendada: feedback inmediato al tap (animación
   de "press" que se completa sola) + estado "enviando…" que persiste
   hasta que llega el nuevo estado. NO retrasar el envío (sumaría lag);
   mostrar el feedback en paralelo. Alineado con WIG ("spinner during
   request"). Probablemente un estado `enviando` (signal) reusable.
5. **Temporizadores en pantalla** — desde cero (no existen en server). Cada
   fase con tiempo límite + contador visible. Plan: server primero
   (timestamp de fin de fase en `GameState` + `setTimeout`), luego UI
   (`<app-timer>` reusable).
6. **Migrar las últimas pantallas al lenguaje editorial**: **Reunión**,
   **Resultado** y **Marcador** ya tienen el appheader unificado y el
   Marcador/Resultado ya tienen animaciones; falta terminar el rediseño
   del contenido (kicker, h1 editorial) en Reunión.
7. **Resto del catálogo** — quedan minijuegos del GDD, uno por incremento.
8. **Pendiente del Paso 3** — desempate por **votación directa** en la
   pantalla final (hoy, si hay empate en el #1, comparten puesto).

**Decisiones abiertas** pendientes: ver la sección 11 del [GDD](GDD.md)
(balance de puntajes, sets de palabras/tarjetas, etc.).

---

## 10. Pendientes de Dani (revisión)

- ~~Elegir la **paleta definitiva** entre las 2 propuestas.~~ ✅ resuelto:
  paleta editorial única (papel crema + tinta + champagne + rojo).
- Revisar el prototipo HTML y los wireframes con ojo de detalle.
