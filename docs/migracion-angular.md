# Migración del front-end: React/Next.js → Angular

> Documento de diseño y registro. Versión 1.0 · 2026-05-18
> **Estado: migración completada** (Incrementos 0–4). El cliente vive en
> `web/` y `web/` fue eliminada. Los logs de depuración (`dlog`) se
> mantienen a propósito mientras dure el desarrollo activo.

---

## 1. Objetivo y motivo

Reescribir el cliente web (`web/`, hoy Next.js + React) en **Angular moderno**.

**Motivo:** Dani va a empezar a trabajar con Angular y todavía no lo conoce.
Este proyecto es un sandbox de tamaño real, bajo riesgo y con un dominio ya
entendido — ideal para aprender el framework. No se migra porque React tenga
un problema (no lo tiene); se migra por aprendizaje + alineación con el trabajo.

**Por eso este documento también es material de estudio:** la sección 4
explica los conceptos de Angular que vamos a usar y cómo el front se conecta
con el servidor. Además, al migrar cada pantalla se comentará el código
explicando qué hace cada parte.

---

## 2. Qué se migra y qué no

| Parte                         | ¿Se migra? |
|--------------------------------|-----------|
| `server/` (Colyseus, lógica, puntajes) | ❌ Intacto |
| `colyseus.js` (cliente WebSocket) | ❌ Agnóstico al framework, se reusa igual |
| `web/app/globals.css` (tokens, temas, estilos) | ❌ Se copia tal cual |
| GDD, prototipo, docs           | ❌ No aplica |
| `web/` (componentes React + Context) | ✅ Se reescribe en Angular |

La autoridad del juego vive en el servidor: el front es solo presentación +
envío de mensajes. Por eso la migración es mecánica, no arriesgada.

---

## 3. Stack nuevo

- **Angular 19+** con **componentes standalone** (sin `NgModule`).
- **Signals** para el estado reactivo (encajan muy bien con el estado en vivo
  de Colyseus).
- **SPA pura, sin SSR.** Next.js daba renderizado en servidor que este juego
  no necesita (es una pantalla única que cambia por fase). Beneficio extra:
  desaparecen los errores de *hydration* que hubo en mobile.
- **Sin Angular Router** en el MVP: el ruteo es por estado de fase, igual que
  hoy con `Game.tsx`. Reevaluable si más adelante hace falta.
- **Forms template-driven** (`FormsModule` + `ngModel`): los formularios son
  chicos, no amerita Reactive Forms.
- Plantillas en archivos `.html` separados (no inline): más claras para
  aprender y para el tamaño que van a tener las pantallas de minijuego.

---

## 4. Conceptos de Angular que vamos a usar

Material de estudio. Cada concepto se va a ver en código real al migrar.

### 4.1 Componente

La unidad de pantalla. Es una **clase** decorada con `@Component`, que apunta
a un archivo de plantilla `.html` (lo que se ve) y opcionalmente a estilos.
La clase guarda el estado y la lógica; la plantilla lo muestra.

```ts
@Component({
  selector: 'app-lobby',          // cómo se usa: <app-lobby></app-lobby>
  standalone: true,               // no necesita NgModule
  templateUrl: './lobby.component.html',
})
export class LobbyComponent { /* estado y métodos acá */ }
```

`standalone: true` significa que el componente se basta a sí mismo: declara
qué necesita importar y se usa sin registrarlo en ningún módulo.

### 4.2 Signals (estado reactivo)

Un **signal** es una caja que contiene un valor y avisa cuando cambia. Es la
forma moderna de manejar estado en Angular.

- `const x = signal(0)` — crear.
- `x()` — leer (se llama como función).
- `x.set(5)` / `x.update(v => v + 1)` — escribir.
- `computed(() => a() + b())` — un signal **derivado**: se recalcula solo
  cuando cambian los signals que usa.
- `effect(() => ...)` — corre código cuando cambia algún signal que lee
  (p. ej. guardar algo en `localStorage`).

Cuando un signal cambia, Angular actualiza **solo** la parte de la pantalla
que lo usa. No hace falta avisarle nada.

### 4.3 Servicio + inyección de dependencias

Un **servicio** es una clase con lógica o estado que se comparte entre
componentes. Se marca con `@Injectable({ providedIn: 'root' })`, lo que crea
**una sola instancia** para toda la app.

Un componente lo pide con `inject()`:

```ts
export class LobbyComponent {
  private juego = inject(GameService);
}
```

Angular se encarga de crear el servicio y entregárselo: eso es *inyección de
dependencias*. En este proyecto, `GameService` será el dueño de la conexión
al servidor y del estado del juego; todas las pantallas lo inyectan.

### 4.4 Plantilla: mostrar datos y reaccionar

En el `.html`:

- `{{ valor() }}` — interpola un valor (si es signal, se lee con `()`).
- `(click)="metodo()"` — escucha un evento del DOM.
- `[propiedad]="expresion"` — ata una propiedad del elemento a un valor.
- `[class.activo]="condicion"` — pone/saca una clase CSS según un booleano.
- `[(ngModel)]="campo"` — ata un `<input>` a un campo en ambos sentidos.
- `@if (cond) { ... } @else { ... }` — muestra contenido condicional.
- `@for (p of lista(); track p.id) { ... }` — repite contenido por cada ítem.

### 4.5 Comunicación entre componentes

- `input()` — un dato que el componente **recibe** de su padre.
- `output()` — un evento que el componente **emite** hacia su padre.
- `<ng-content>` — hueco donde el padre inserta contenido (como el `Shell`
  que ya existe en la pantalla de Desafío).

### 4.6 Cómo se conecta el front con el servidor

El flujo completo, de la acción del usuario a la pantalla actualizada:

```
1. GameService crea un Client de colyseus.js apuntando al game server
   (ws://<host>:2567) y entra a una sala con client.create()/join().

2. El usuario toca un botón  →  el componente llama un método del
   GameService  →  el servicio hace room.send("mensaje", datos).

3. El servidor (GameRoom) procesa, cambia su estado y lo sincroniza.

4. colyseus.js dispara room.onStateChange en el cliente. El GameService
   toma un snapshot() del estado y lo guarda en el signal `estado`.

5. Como el signal cambió, Angular vuelve a pintar solo las pantallas que
   leen `estado`. El usuario ve el resultado.
```

Puntos clave:
- El **servidor es la autoridad**: el front nunca decide el resultado del
  juego, solo manda intenciones (`ready`, `decidir`, `kick`, …) y dibuja lo
  que el servidor responde.
- El puente entre "callback de Colyseus" y "pantalla de Angular" es **un
  signal**: el callback hace `estado.set(snapshot)` y Angular se encarga del
  resto.
- Todo esto vive en `GameService`; los componentes nunca tocan `colyseus.js`
  directamente.

---

## 5. Estructura de carpetas

Se crea `web/` **al lado** de `web/`. Así nunca quedamos sin un cliente
funcionando. `web/` se borra recién al final (Incremento 4).

```
web/
  angular.json
  package.json
  tsconfig.json
  src/
    index.html
    main.ts                    arranque (equivale a app/page.tsx)
    styles.css                 ← copia de web/app/globals.css
    app/
      app.component.ts / .html  raíz: <main class="app"> + ruteo por fase
      models.ts                 PlayerView / StateView / PairingView
      game.service.ts           ← reemplaza a web/lib/game.tsx
      ingreso/                  ingreso.component.ts / .html
      lobby/                    lobby.component.ts / .html
      theme-switcher/           theme-switcher.component.ts / .html
      briefing/                 briefing.component.ts / .html
      desafio/                  desafio.component.ts / .html
      resultado/                resultado.component.ts / .html
```

### Correspondencia de archivos

| Hoy (React)                  | Mañana (Angular) |
|------------------------------|------------------|
| `app/page.tsx` + `layout.tsx`| `main.ts` + `index.html` |
| `components/Game.tsx`        | `app/app.component.*` |
| `lib/game.tsx`               | `app/game.service.ts` + `app/models.ts` |
| `components/Ingreso.tsx`     | `app/ingreso/*` |
| `components/Lobby.tsx`       | `app/lobby/*` |
| `components/ThemeSwitcher.tsx`| `app/theme-switcher/*` |
| `components/Briefing.tsx`    | `app/briefing/*` |
| `components/Desafio.tsx`     | `app/desafio/*` |
| `components/Resultado.tsx`   | `app/resultado/*` |

---

## 6. El servicio de juego (`GameService`)

Es la pieza central. Reemplaza al React Context de `lib/game.tsx`.

- `@Injectable({ providedIn: 'root' })` → instancia única para toda la app.
- Envuelve el `Client` y el `Room` de `colyseus.js`.
- Expone el estado como **signals** de solo lectura:
  `estado`, `miId`, `conectado`, `cargando`, `error`, `servidorUrl`.
- En `room.onStateChange` se actualiza el signal `estado` con un `snapshot()`
  (la misma función defensiva que ya existe, se reusa casi igual).
- Métodos públicos = las mismas acciones de hoy: `crearSala`, `unirseSala`,
  `ficharEntrada`, `agregarBots`, `limpiarBots`, `expulsar`, `empezarPartida`,
  `confirmar`, `decidir`, `salir`.
- Reconexión por token: misma lógica, se ejecuta al construirse el servicio.
- `endpointPorDefecto()`: igual, pero sin el guard `typeof window` — en una
  SPA `window` siempre existe.

---

## 7. Plan incremental

Incrementos chicos y verificados, contra el **mismo servidor Colyseus** que ya
funciona. Cada incremento se prueba antes de seguir.

### Incremento 0 — Esqueleto Angular
- Crear el proyecto con Angular CLI (standalone, sin routing, CSS).
- Copiar `globals.css` a `src/styles.css`.
- `index.html`: `lang="es"`, viewport mobile, `<main class="app">`.
- **Verificación:** `ng build` OK y la app levanta en blanco con estilos.

### Incremento 1 — Conexión + Ingreso
- `models.ts`, `game.service.ts` (conexión, reconexión, snapshot, acciones).
- `app.component`: ruteo por fase (`@if`/`@switch` sobre los signals).
- `ingreso.component` + `theme-switcher.component`.
- **Verificación:** crear y unirse a una sala contra el server real; el
  cambio de tema persiste.

### Incremento 2 — Lobby
- `lobby.component`: lista de jugadores, fichar, bots, etiqueta anfitrión,
  botón de expulsar, botón empezar (solo anfitrión, solo con todos fichados).
- **Verificación:** con varias pestañas — fichar, bots, expulsar, traspaso de
  anfitrión, arranque de partida.

### Incremento 3 — Pantallas de partida
- `briefing.component`, `desafio.component`, `resultado.component`.
- **Verificación:** partida completa de El Botón del Bonus de punta a punta.

### Incremento 4 — Cierre
- Actualizar `arquitectura.md`, `handoff.md`, `README.md` y `codigo.md` al
  stack nuevo.
- Borrar `web/`.
- **Verificación:** typecheck/build final; repo sin restos de Next.js.

Cada incremento es un commit (o más) en español, push a GitHub.

---

## 8. Decisiones cerradas

1. Angular standalone + signals. Sin `NgModule`.
2. SPA, sin SSR / sin Angular Universal.
3. Sin Angular Router en el MVP — ruteo por estado de fase.
4. Forms template-driven (`ngModel`).
5. Plantillas en archivos `.html` separados.
6. `web/` nuevo al lado de `web/`; `web/` se borra en el Incremento 4.
7. `globals.css` se copia sin cambios a `src/styles.css`.

---

## 9. Riesgos y notas

- **Deploy:** Next.js iba a Vercel. Angular SPA produce un build estático que
  se publica en cualquier hosting estático (Vercel, Netlify, hasta GitHub
  Pages). Se actualizará `arquitectura.md` en el Incremento 4.
- **Aprendizaje:** como gran parte del código lo escribe Claude, en cada
  incremento se explica el *por qué* idiomático y Dani revisa la pantalla
  antes de pasar a la siguiente.
- **`colyseus.js` con Angular:** funciona sin adaptador. Las actualizaciones
  de estado llegan por callback; al volcarlas a un signal, Angular detecta el
  cambio sin trabajo extra.
- **Sin pérdida de funcionalidad:** la migración no agrega ni saca features;
  es paridad 1:1 con el `web/` actual (Paso 1 + Paso 2).
