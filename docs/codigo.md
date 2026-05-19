# Traición en la Oficina — Guía del Código

> Documentación del código. Acompaña a la [Arquitectura](arquitectura.md) y al
> [Modelo de Datos](modelo-datos.md). El cliente web está en **Angular** (ver
> [migracion-angular.md](migracion-angular.md) para el detalle de la migración).

**Versión:** 0.2 · **Fecha:** 2026-05-18

---

## 1. Estructura del repositorio

```
traicionenlaoficina/
├── docs/          documentos de diseño
├── prototipo/     prototipo HTML estático (descartable)
├── server/        game server — Colyseus (Node + TypeScript)
└── web-angular/   cliente — Angular (TypeScript)
```

`server/` y `web-angular/` son **dos proyectos independientes**, cada uno con su
`package.json`. Se ejecutan a la vez: el server mantiene el estado, la web es la
interfaz. No comparten código; lo único en común es el protocolo WebSocket.

---

## 2. El game server (`server/`)

Mantiene el estado autoritativo de cada partida y lo sincroniza por WebSocket.

```
server/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts             arranque del servidor
    ├── schema/GameState.ts  estructura del estado sincronizado
    ├── rooms/GameRoom.ts     lógica de la sala
    └── challenges/           lógica de cada minijuego
```

### 2.1 `src/index.ts`
Arranca Colyseus:
- Crea el `Server` con `WebSocketTransport`.
- Registra el tipo de sala: `gameServer.define("game", GameRoom)`.
- `.filterBy(["code"])` — hace que las salas se encuentren por su **código**:
  al unirse con `{ code: "ABCDE" }`, Colyseus busca la sala creada con ese código.
- Escucha en el puerto `PORT` (default **2567**).

### 2.2 `src/schema/GameState.ts`
Define el estado **sincronizado** con `@colyseus/schema`. Solo lo que está
marcado con `@type` viaja a los clientes. Los campos están comentados como
`Paso 1` (lobby) o `Paso 2` (juego).

**`Player`** — un jugador de la sala: `id`, `token` (identidad persistente),
`nickname`, `avatar`, `ready`, `isBot`, `connected` (Paso 1); `influence`,
`decision`, `acted`, `lastDelta` (Paso 2).

**`Pairing`** — una pareja de llamada 1-a-1 (`aId`, `bId`).

**`GameState`** — `code`, `status`, `hostId`, `players` (Paso 1); `phase`,
`challengeId`, `pairings` (Paso 2).

### 2.3 `src/rooms/GameRoom.ts`
La clase `GameRoom extends Room<GameState>` — una instancia = una partida.

- **`onCreate`** — inicializa el estado y registra los **mensajes**: lobby
  (`ready`, `dev:addBots`, `dev:clearBots`, `kick`) y partida (`startGame`,
  `ack`, `decidir`).
- **`onJoin`** — reconexión por `playerToken`, o alta de un `Player` nuevo. El
  primer jugador real queda como **anfitrión** (`hostId`).
- **`onLeave`** — reserva el lugar 60 s con `allowReconnection`; reasigna el
  anfitrión si éste se va.
- **Motor de partida (Paso 2)** — `iniciarPartida`, `iniciarFase`,
  `armarParejas`, `chequearAvance`, `resolver`, `volverLobby`.
- **`addBots`** — crea jugadores `isBot` ya fichados.

### 2.4 `src/challenges/`
La lógica de cada minijuego, separada del motor. Hoy: `botonDelBonus.ts` (la
definición y la función de puntaje de *El Botón del Bonus*).

### 2.5 Scripts
| Comando | Qué hace |
|---|---|
| `npm run dev` | corre el server con recarga en caliente (`tsx watch`) |
| `npm run check` | typecheck sin compilar |
| `npm run build` / `start` | compila a `dist/` y lo ejecuta |

---

## 3. El cliente web (`web-angular/`)

App **Angular** (standalone, *zoneless*, SPA — sin servidor de renderizado).
Toda la lógica de juego vive en el cliente, porque depende de la conexión en
tiempo real.

```
web-angular/
├── angular.json
├── package.json
└── src/
    ├── index.html        HTML raíz (idioma, viewport, tema por defecto)
    ├── main.ts           arranque (bootstrapApplication)
    ├── styles.css        sistema de estilo (tokens + 2 temas)
    └── app/
        ├── app.ts / app.html   componente raíz: ruteo por fase
        ├── app.config.ts        configuración de la app
        ├── models.ts            PlayerView / StateView / PairingView
        ├── game.service.ts      conexión a Colyseus + estado (signals)
        ├── dlog.ts              logs de depuración temporales
        ├── ingreso/             crear / unirse a una sala
        ├── lobby/               lobby en vivo + modo desarrollo
        ├── theme-switcher/      conmutador de paleta
        ├── briefing/            explicación del desafío
        ├── desafio/             decisión Verde / Rojo
        └── resultado/           resultado + marcador
```

### 3.1 `game.service.ts` — el corazón del cliente
Un **servicio** Angular (`@Injectable({ providedIn: 'root' })`): una única
instancia para toda la app. Es la capa de conexión; ninguna pantalla habla con
Colyseus directo.

**Estado como signals.** Expone `estado`, `miId`, `conectado`, `cargando` y
`error` como *signals* de **solo lectura**. Internamente hay un signal privado
por cada uno que solo el servicio escribe — así la UI nunca muta el estado.

**El puente con el server.** `room.onStateChange` toma un `snapshot()` (convierte
el `Schema` de Colyseus en los objetos planos de `models.ts`) y lo guarda en el
signal `estado`. Como el signal cambió, Angular repinta solo lo que lo usa.

**Acciones:** `crearSala`, `unirseSala`, `ficharEntrada`, `agregarBots`,
`limpiarBots`, `expulsar`, `empezarPartida`, `confirmar`, `decidir`, `salir`.

**Identidad y reconexión.** `getPlayerToken()` genera un UUID persistente en
`localStorage`. Al conectar guarda el `reconnectionToken`; en el constructor del
servicio intenta reconectar solo con ese token (sobrevive a recargar la página).
Si llega un `onLeave` con código `4000` (expulsado por el anfitrión), limpia el
estado y vuelve a la pantalla de Ingreso.

### 3.2 Las pantallas (`app/*/`)
Cada una es un **componente standalone**: una clase `.ts` con la lógica y un
`.html` con la plantilla. Todas obtienen el `GameService` con `inject()` y
derivan lo que muestran con `computed()`.

- **`app`** — componente raíz; rutea con `@if`/`@else if` según `status` y
  `phase`: Ingreso → Lobby → Briefing → Desafío → Resultado.
- **`ingreso`** — crear / unirse: apodo, avatar y (para unirse) código.
- **`lobby`** — código de sala, lista de jugadores en vivo, fichaje, anfitrión,
  expulsar, panel **Modo Desarrollo** (bots).
- **`theme-switcher`** — cambia el atributo `data-theme` del `<html>`.
- **`briefing`** — reglas del desafío antes de jugarlo.
- **`desafio`** — a qué colega llamar + decisión secreta Verde / Rojo.
- **`resultado`** — Influencia ganada/perdida + marcador.

### 3.3 `dlog.ts` — logs de depuración (temporal)
Helper que imprime en consola qué función se invoca y con qué datos, con un
prefijo de color. Es **temporal**: se quita junto con sus usos (`dlog(`) cuando
la fase de desarrollo activo termine.

### 3.4 Estilo (`src/styles.css`)
Un sistema basado en **tokens** (variables CSS) con 2 paletas:
- `[data-theme="azul"]` — *Sinergia Azul* (default).
- `[data-theme="verde"]` — *Verde Acción*.

Cambiar de tema = cambiar un atributo del `<html>`.

---

## 4. Cómo se comunican web y server

```
web-angular (navegador)  ──WebSocket──▶  server (Colyseus)
   GameService                             GameRoom
```

**Del cliente al server** — mensajes con `room.send(tipo, datos)`: `ready`,
`dev:addBots`, `dev:clearBots`, `kick`, `startGame`, `ack`, `decidir`.

Opciones al unirse (`create` / `join`): `{ code, nickname, avatar, playerToken }`.

**Del server al cliente** — Colyseus sincroniza el `GameState` automáticamente.
Cada cambio dispara `room.onStateChange`, el `GameService` toma un `snapshot` y
lo guarda en un signal; Angular repinta. **No hay recarga de página.**

> Hoy el cliente recibe el estado completo. Cuando haya información secreta
> (decisiones, roles por desafío) se aplicará **estado filtrado** — ver
> [arquitectura.md §4.2](arquitectura.md).

---

## 5. Cómo correr el proyecto

Requiere Node 20+. En dos terminales:

```bash
cd server      && npm install && npm run dev   # ws://localhost:2567
cd web-angular && npm install && npm start     # http://localhost:4200
```

El cliente deduce la URL del game server del host desde el que se abrió la web
(`ws://<host>:2567`).

---

## 6. Estado y próximos pasos

**Hecho:** lobby en tiempo real, reconexión, bots, 2 paletas (Paso 1); motor de
fases + *El Botón del Bonus* (Paso 2); cliente web migrado a Angular.

**Siguiente (Paso 3):** las 5 rondas intercaladas + pantalla final — ver el
roadmap en el [GDD §10](GDD.md).
