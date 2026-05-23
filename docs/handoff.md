# Traición en la Oficina — Estado del Proyecto y Guía para Retomar

> Documento de traspaso. Si abrís el proyecto en otra PC o en una sesión
> nueva (de Claude o tuya), **empezá por acá**.

**Última actualización:** 2026-05-23 · **Hito actual:** **MVP de 4
minijuegos completo** (Bono Compartido / Recorte / Tablero SCRUM /
**Reconocimiento del Mes**) — listo para playtest en desktop · cliente
Angular con lenguaje visual editorial aplicado a **9 pantallas** +
pantalla del Reconocimiento con dos ramas (jefe / espectador) +
**reveal "Memo oficial · RRHH"** en el resultado · **nombre de empresa
parametrizable** por el anfitrión (componente `<app-brand>` centraliza
el render en CAPS con `·` champagne) · **El Recorte ahora va briefing
→ vote directo** (eliminada la fase 'meeting' intermedia, redundante) ·
nomenclatura editorial **"Día X de Y · Tema del día"** · **sistema de
timers de fase** (reloj autoritativo en server) · votación con
**conteo en vivo + Confirmar Voto + reordenamiento animado** · **efecto
máquina de escribir** (directiva appReveal + Intro orquestador) en
Briefing/Comunicado/Final · **post-its escritos a mano** (Caveat) en el
Tablero SCRUM · **feedback de latencia** (barra enviando + thud de press
global) · sistema de avatars (15 SVGs + modal) · **layout DESKTOP**
(escritorio + vade + hoja + ficha lateral) como progressive enhancement
sobre el mobile · **devbar y anexo técnico ocultos a no-anfitriones** ·
a11y auditada (WIG Vercel, segunda pasada 2026-05-23).

**PIVOTE (2026-05-22):** el target de esta versión es **desktop** (se
juega en la compu del laburo, al lado de Teams). El playtest será en
desktop. La integración mobile real con llamadas será **otro proyecto**
futuro (app nativa). Ver §7 y §9.

**Próximo objetivo:** **playtest en desktop** con 3-5 amigos. Ver §9.

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
| 4 — Resto del catálogo de minijuegos | 🔄 en curso (4 de 13 — MVP cerrado) |
| 5 — Pulido (estética, onboarding) | 🔄 en curso (lenguaje editorial aplicado a 7 pantallas) |
| 6 — Deploy y post-MVP | 🔄 en curso (deploy de prueba VIVO: Vercel + Render, ver §5) |

> Además del roadmap, entre el Paso 2 y el 3 se migró el cliente web de
> Next.js/React a Angular (ver [migracion-angular.md](migracion-angular.md)).

**Qué funciona hoy:** la partida corre de punta a punta:
- **Lobby:** crear/unirse por código, lista en vivo, reconexión, anfitrión,
  expulsar jugadores. **El anexo técnico** (bots + Partida rápida) y la
  **devbar flotante** (Saltar fase / Salir al lobby) **solo las ve el
  anfitrión** — los invitados no pueden pisar la partida.
- **Nombre de empresa parametrizable** (input opcional al crear sala,
  default "Sinergia Corp", máx 30 chars). Se sincroniza vía `state.companyName`;
  el cliente lo renderiza en CAPS con `·` champagne entre palabras a través
  del componente reusable `<app-brand>` (también variante `[doc]="true"`
  para los memos de Comunicado/Final).
- **Motor de rondas:** estructura parametrizable en `server/src/config.ts`
  (hoy G-I-G-I = 4 rondas: Reconocimiento, Bono Compartido, Recorte,
  Tablero). Marcador entre rondas y pantalla final.
- **4 minijuegos (MVP cerrado):**
  - *Bono Compartido* (kind `llamadas`, individual): dilema 1-a-1 en
    tandas sin repetir pareja.
  - *El Recorte* (kind `votacion`, grupal): voto secreto, conteo en vivo.
    **Ya no tiene fase 'meeting' intermedia** — del briefing va directo a
    la planilla de voto; el debate por Teams sucede sobre la pantalla del
    voto mismo (timer 2 min, tally en vivo).
  - *El Tablero SCRUM* (kind `tablero`, individual): info asimétrica +
    adivinar.
  - ***El Reconocimiento del Mes*** (kind `reconocimiento`, grupal):
    asimetría total — un jugador sorteado es el "jefe del mes" y elige a
    quién regalarle +8 💼. **Pre-selección en vivo visible para toda la
    sala** (el `Player.decision` del jefe se sincroniza, espectadores ven
    en tiempo real a quién está considerando; el jefe sabe que su elección
    es pública). Si el jefe es bot, "piensa" 6-10 s al azar antes de
    decidir (sin esto la fase se cerraba al instante).
- **Sistema de timers de fase** (reloj autoritativo en server, ver
  `phaseEndsAt`/`phaseDurationSec` en `GameState`): 60s por llamada del
  Bono Compartido, 120s en el voto del Recorte, 120s en el Tablero,
  180s en el Reconocimiento. Banner con barra de progreso + estado
  urgente en los últimos 10s (`<app-timer>`).

**El Tablero SCRUM (kind `tablero`):** información asimétrica + adivinar.
- **3-6 tarjetas** del sprint (K = `clamp(3, ceil(N/2)+2, 6)` con tope
  K≤N) elegidas al azar de un pool de 15 (sátira corporativa: "Login con
  Google", "Migrar a la nube", etc.) con **valor real Fibonacci aleatorio
  por partida** (1/2/3/5/8/13). Cada tarjeta tiene nombre + bajada corta.
- Cada jugador **conoce 1 tarjeta** (simétrico, asignación round-robin
  barajada). El valor real es **secreto del server** — llega por mensaje
  PRIVADO `tuTablero` a cada cliente al entrar a la fase (los valores
  reales NUNCA viajan en el state sincronizado mientras se juega).
- **Llamadas libres por Teams** (la web no guía a quién llamar). Cada
  uno comparte/miente su valor; al final adivina los ajenos.
- **UI:** post-its de colores rotativos (amarillo/verde/rosa/celeste/
  naranja) escritos a mano con Caveat, con leve rotación + cinta scotch.
  Chips Fibonacci en grilla 3×2 (toggle, `aria-pressed`). Tap para
  estimar; tap de nuevo para borrar (sin estimar = 0 puntos).
- **Puntaje:** ±3 Influencia por tarjeta NO propia (acierto / error);
  sin estimar = 0. Cada tarjeta vale lo mismo (los SP solo son el dato
  a adivinar, no se traducen 1:1 a Influencia, para que ninguna tarjeta
  domine el puntaje).
- **Result reveal:** secuencia orquestada con `appReveal="stamp"` —
  cada post-it cae con el valor real estampado en rojo y un pie con
  "estimaste X · acierto/erraste · ±3". TU INFLUENCIA con count-up +
  Marcador del sprint al final.

**Sistema de typewriter / orquestación de reveals** (briefing, comunicado,
final): directiva `appReveal` + `<app-intro>` orquestador. Cada elemento
declara su modo (`type`, `fade`, `slide`, `stamp`, `kicker`, `sello`) y
opcionalmente su `revealOrder`. La directiva tipea HTML-aware
(preserva `<strong>` y `<em>`), respeta `prefers-reduced-motion`, y un
tap salta toda la secuencia. Velocidad default 90 cps configurable por
elemento con `[revealCps]`. Ver `web/src/app/reveal/` y `intro/`.

**Feedback de latencia** (mitiga el "frizado" del round-trip de Render):
- Signal `enviando` en `GameService` que se prende en `confirmar()` /
  `decidir()` y se apaga en cada `onStateChange` (con safety timeout 5s).
- **Barra global** `.enviando-bar` arriba del shell, champagne, animada
  mientras hay round-trip. Vive en el shell → sobrevive el cambio de
  pantalla, puentea el hueco visual.
- **Thud auto-completable** en `.btn`: keyframe `btnPressThud` de 240ms
  que se dispara en `pointerdown` y `keydown` Enter/Space vía un
  listener GLOBAL en `app.ts` (sin tocar componentes individuales).

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
Guidelines, ver el skill `/web-design-guidelines`; segunda pasada 2026-05-23):
- Zoom de usuario habilitado, `touch-action: manipulation` global, sin
  delay de 300ms en doble-tap.
- `:focus-visible` champagne en todos los interactivos (teclado).
- `prefers-reduced-motion` neutraliza animaciones para usuarios sensibles.
- Tap targets ≥44px en todos los botones (incluyendo chips Fibonacci del
  Tablero).
- Labels asociados a inputs (`for`/`id`), `autocomplete`/`inputmode` en
  inputs, `aria-label` en icon-only buttons.
- Modal del picker: `role="dialog" aria-modal`, cerrar con ESC, focus trap,
  autofocus al abrir, restaurar foco al cerrar.
- `aria-live="polite"` en zonas async ("Esperando a los demás…").
- `tabular-nums` en columnas numéricas, `text-wrap: balance` en headings.
- **Emojis decorativos** (`💼`, `★`) con `aria-hidden="true"` y
  `aria-label` en el contenedor → SR lee "Tu Influencia: 12" en vez de
  "maletín 12".
- **Timer del round** anuncia UNA vez al SR al entrar a urgente vía
  `<span class="sr-only" role="status">` (evita spam segundo-a-segundo).
- **Tipografía**: signo menos matemático `−` (U+2212) en deltas
  negativos vía helper `formatDelta`; ellipsis `…` (U+2026) en estados
  de carga; guillemets `«»` en frases del briefing default.
- **Press feedback con teclado**: el thud de `.btn` también se dispara
  con Enter/Space (no solo pointerdown), coherente con mouse/touch.

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

**Objetivo inmediato: playtest en desktop con 3-5 amigos.** El MVP de 4
minijuegos ya está cerrado (Botón, Recorte, Tablero SCRUM, Reconocimiento
del Mes). El deploy está vivo (Vercel + Render, §5).

1. **Playtest en desktop** con 3-5 amigos. Observar si el debate / voto /
   negociación por Teams funciona; ajustar balance, timings, copy.
   Llevar la lista de fricciones detectadas y un par de partidas grabadas
   si se puede.

> **Config pendiente (no bloquea):** poner el Build Filter de Render
> (`server/**`) para que los pushes web no redeployen el server (§5).

**Hecho recientemente** (al 2026-05-23):

- ✅ ~~Nombre de empresa parametrizable~~ — input opcional al crear sala
  ("Empresa (opcional)" en Ingreso, placeholder "Sinergia Corp"). Se
  sincroniza vía `state.companyName`; el cliente lo renderiza con
  `<app-brand>` (CSS `text-transform: uppercase` + `·` champagne entre
  palabras). Variante `[doc]="true"` para los memos del Comunicado/Final.
- ✅ ~~Devbar y anexo técnico ocultos a invitados~~ — el panel
  "Anexo técnico" del lobby (bots + Partida rápida) y el ⚙ flotante con
  Saltar fase / Salir al lobby ahora solo aparecen para el anfitrión
  (computed `soyHost`). Los invitados ya no pueden pisar la partida.
- ✅ ~~Eliminada la fase 'meeting' del Recorte~~ — era un paso intermedio
  redundante ("entren a Teams y debatan, después tocá IR A VOTAR"). Ahora
  el briefing va directo a `iniciarVotacion()` y el debate sucede sobre
  la planilla de voto misma. Borrado componente `web/src/app/reunion/`.
- ✅ ~~Rename "Botón del Bonus" → "Bono Compartido"~~ — solo strings
  user-facing (h1 del briefing, NOMBRE_CHALLENGE, label del devbar, tema
  editorial del appheader). El id `boton-del-bonus` y el `.nombre` del
  registry server-side quedan intactos (referencias técnicas).
- ✅ ~~Pre-selección en vivo del Reconocimiento del Mes~~ — la vista del
  resto (espectadores) muestra en tiempo real el bloque "Considerando a
  X" con avatar + nombre del candidato actual, que se actualiza cuando
  el jefe cambia de idea. Variantes: borde grueso + chip "vos" si soy el
  casi-elegido (tensión específica); look "confirmada" cuando el jefe
  oprime OTORGAR. Copy del jefe ajustado: "Tu pre-selección es **visible
  en sala**".
- ✅ ~~Reveal "Memo oficial · RRHH" en el Resultado del Reconocimiento~~
  — nueva rama en `resultado.html` con ficha grande del destinatario
  (avatar 128px + marco doble champagne), sello rotado "+8 💼" verde
  aprobado, pie "Por decisión de X, líder del mes". Caso degenerado
  (jefe no eligió): mensaje "no se otorgó".
- ✅ ~~Bug del bot-jefe instantáneo~~ — cuando el sorteo del Reconocimiento
  caía en un bot, decidía y confirmaba al instante y nadie veía la fase.
  Fix: `bossBotTimer` con setTimeout aleatorio de 6-10s antes de decidir
  (sensación de "está pensando"). Guards defensivos por phase/bossId.
- ✅ ~~Reconocimiento del Mes~~ — nuevo kind `reconocimiento` (asimetría
  total: un único jefe sorteado elige destinatario, +8 Influencia, no
  puede auto-elegirse). Una sola fase de 3 min. Pantalla con dos ramas:
  vista jefe (grilla de candidatos + confirmar) y vista resto (avatar
  grande del jefe con pulso único al aparecer).
- ✅ ~~Feedback de botones / latencia percibida~~ — resuelto con
  `.enviando-bar` global + thud `.btn.is-pressing` global (mouse + touch
  + teclado). Ver §4 "Feedback de latencia".
- ✅ ~~Temporizadores en pantalla~~ — implementados (reloj autoritativo en
  server + componente `<app-timer>` con barra + estado urgente).
- ✅ ~~Layout desktop~~ — escritorio + vade + hoja + ficha lateral.
- ✅ ~~Efecto máquina de escribir en briefings~~ — directiva `appReveal`
  + Intro orquestador, aplicado a Briefing/Comunicado/Final.
- ✅ ~~Tablero SCRUM~~ — nuevo kind `tablero` con info asimétrica.

**Más adelante / backlog:**

3. **Migrar las últimas pantallas al lenguaje editorial**: **Reunión**
   tiene el appheader unificado pero le falta el rediseño del contenido
   (kicker, h1 editorial). Resultado/Marcador ya tienen animaciones.
4. **Resto del catálogo** — quedan minijuegos del GDD, uno por incremento
   (post-MVP).
5. **Pendiente del Paso 3** — desempate por **votación directa** en la
   pantalla final (hoy, si hay empate en el #1, comparten puesto).
6. **Bundle budget** — el budget de 500 kB en `angular.json` se está
   excediendo por ~20 kB con la nueva paleta + Caveat + reveal system.
   Subir el budget o code-split por feature (lazy load del Tablero).
7. **`@filter` de Colyseus** para `decision` en fase `calls`: hoy las
   decisiones del Botón van en el state sincronizado (técnicamente un
   snooper con devtools podría leer la del rival antes del reveal).
   Aceptable para juego entre amigos, pero pulible.

**Decisiones abiertas** pendientes: ver la sección 11 del [GDD](GDD.md)
(balance de puntajes, sets de palabras/tarjetas, etc.).

---

## 10. Pendientes de Dani (revisión)

- ~~Elegir la **paleta definitiva** entre las 2 propuestas.~~ ✅ resuelto:
  paleta editorial única (papel crema + tinta + champagne + rojo).
- Revisar el prototipo HTML y los wireframes con ojo de detalle.
