# Traición en la Oficina — Guía del Código

> Documentación del código del **Paso 1** (esqueleto + lobby). Acompaña a la
> [Arquitectura](arquitectura.md) y al [Modelo de Datos](modelo-datos.md).

**Versión:** 0.1 · **Fecha:** 2026-05-17

---

## 1. Estructura del repositorio

```
traicionenlaoficina/
├── docs/          documentos de diseño
├── prototipo/     prototipo HTML estático (descartable)
├── server/        game server — Colyseus (Node + TypeScript)
└── web/           cliente — Next.js + React (TypeScript)
```

`server/` y `web/` son **dos proyectos independientes**, cada uno con su
`package.json`. Se ejecutan a la vez: el server mantiene el estado, la web es la
interfaz.

---

## 2. El game server (`server/`)

Mantiene el estado autoritativo de cada partida y lo sincroniza por WebSocket.

```
server/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts            arranque del servidor
    ├── schema/GameState.ts  estructura del estado sincronizado
    └── rooms/GameRoom.ts    lógica de la sala
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
marcado con `@type` viaja a los clientes.

**`Player`** — un jugador de la sala:
| Campo | Para qué |
|---|---|
| `id` | sessionId actual de Colyseus |
| `token` | identidad **persistente** — sobrevive a reconexiones |
| `nickname`, `avatar` | datos visibles |
| `ready` | fichó entrada o no |
| `isBot` | jugador de mentira (modo desarrollo) |
| `connected` | si su conexión está viva |

**`GameState`** — el estado de la partida: `code`, `status` (`lobby` /
`in-game` / `finished`) y `players` (un `MapSchema<Player>`).

> En el Paso 1 el estado solo modela el lobby. Rondas y desafíos se suman después.

### 2.3 `src/rooms/GameRoom.ts`
La clase `GameRoom extends Room<GameState>` — una instancia = una partida.

- **`onCreate(options)`** — inicializa el estado, fija el `code`, lo publica en
  la metadata (para el `filterBy`) y registra los **mensajes** que acepta:
  - `"ready"` → marca al jugador como fichado / sin fichar.
  - `"dev:addBots"` → agrega N bots.
  - `"dev:clearBots"` → quita todos los bots.
- **`onJoin(client, options)`** — si llega un `playerToken` que ya existe,
  **reasocia** ese jugador a la nueva conexión (reconexión); si no, crea un
  `Player` nuevo.
- **`onLeave(client, consented)`** — si la caída fue inesperada, reserva el
  lugar 60 s con `allowReconnection`; si el jugador no vuelve, lo elimina.
- **`addBots(n)`** — crea jugadores `isBot` ya fichados, con nombres y avatares.
- **`genCode()`** — genera el código de 5 letras (sin letras ambiguas).

### 2.4 Scripts
| Comando | Qué hace |
|---|---|
| `npm run dev` | corre el server con recarga en caliente (`tsx watch`) |
| `npm run check` | typecheck sin compilar |
| `npm run build` / `start` | compila a `dist/` y lo ejecuta |

---

## 3. El cliente web (`web/`)

App Next.js (App Router). Toda la lógica de juego es **del lado del cliente**
(`"use client"`), porque depende de la conexión en tiempo real.

```
web/
├── app/
│   ├── layout.tsx     HTML raíz, metadata, viewport
│   ├── page.tsx       monta <GameProvider> + <Game>
│   └── globals.css    sistema de estilo (tokens + 2 temas)
├── components/
│   ├── Game.tsx       decide qué pantalla mostrar
│   ├── Ingreso.tsx    crear / unirse a una sala
│   ├── Lobby.tsx      lobby en vivo + modo desarrollo
│   └── ThemeSwitcher.tsx   conmutador de paleta
└── lib/
    └── game.tsx       conexión a Colyseus + estado (React Context)
```

### 3.1 `lib/game.tsx` — el corazón del cliente
Es la **capa de conexión**. Expone un Context con todo lo que las pantallas
necesitan; ninguna pantalla habla con Colyseus directo.

**Tipos planos para React** — `PlayerView` y `StateView` son copias simples del
estado del server. La función `snapshot(room)` convierte el `Schema` de Colyseus
en estos objetos comunes, para que React los pueda renderizar.

**`<GameProvider>`** mantiene:
- `client` / `room` — la conexión Colyseus (en `useRef`).
- `estado` — el `StateView` actual; se actualiza en cada `room.onStateChange`.
- `conectado`, `cargando`, `error`, `miId`.

Acciones expuestas:
| Función | Qué hace |
|---|---|
| `crearSala(nickname, avatar)` | genera un código y crea la sala |
| `unirseSala(code, nickname, avatar)` | se une a una sala por código |
| `ficharEntrada(valor)` | envía el mensaje `"ready"` |
| `agregarBots(n)` / `limpiarBots()` | mensajes de modo desarrollo |
| `salir()` | abandona la sala |

**Identidad y reconexión:**
- `getPlayerToken()` — genera un UUID y lo guarda en `localStorage`; es la
  identidad persistente del jugador. Se envía en cada `join`.
- Al conectar, se guarda el `reconnectionToken` en `localStorage`.
- Un `useEffect` al montar intenta **reconectar solo** con ese token: si
  recargás o cerrás la pestaña, volvés a tu sala sin hacer nada.

**`useGame()`** — hook para que cualquier componente acceda al Context.

### 3.2 Las pantallas (`components/`)
- **`Game.tsx`** — si hay `estado`, muestra `<Lobby>`; si no, `<Ingreso>`.
- **`Ingreso.tsx`** — segmento Crear / Unirse, apodo, avatar y (para unirse)
  código. Valida y llama a `crearSala` / `unirseSala`.
- **`Lobby.tsx`** — barra superior, código de sala, **lista de jugadores en
  vivo**, botón de fichar, panel **Modo Desarrollo** (bots) y salir.
- **`ThemeSwitcher.tsx`** — cambia el atributo `data-theme` del `<html>` entre
  las 2 paletas y lo recuerda en `localStorage`.

### 3.3 Estilo (`app/globals.css`)
Un sistema basado en **tokens** (variables CSS). Hay 2 paletas:
- `[data-theme="azul"]` — *Sinergia Azul* (default).
- `[data-theme="verde"]` — *Verde Acción* (acento verde, estilo del screenshot).

Cambiar de tema = cambiar un atributo. Cuando se construya el resto de la UI,
**estos mismos tokens se reutilizan** — no se rehace el estilo.

---

## 4. Cómo se comunican web y server

```
web (navegador)  ──WebSocket──▶  server (Colyseus)
   useGame()                        GameRoom
```

**Del cliente al server** — mensajes con `room.send(tipo, datos)`:
| Mensaje | Datos | Efecto |
|---|---|---|
| `ready` | `boolean` | fichar / desfichar |
| `dev:addBots` | `number` | agregar bots |
| `dev:clearBots` | — | quitar bots |

Opciones al unirse (`create` / `join`): `{ code, nickname, avatar, playerToken }`.

**Del server al cliente** — Colyseus sincroniza el `GameState` automáticamente.
Cada cambio dispara `room.onStateChange`, el cliente toma un `snapshot` y React
re-renderiza. **No hay recarga de página.**

> Hoy el cliente recibe el estado completo. Cuando haya información secreta
> (decisiones, roles por desafío) se aplicará **estado filtrado** — ver
> [arquitectura.md §6](arquitectura.md).

---

## 5. Cómo correr el proyecto

Requiere Node 20+. En dos terminales:

```bash
cd server && npm install && npm run dev   # ws://localhost:2567
cd web    && npm install && npm run dev   # http://localhost:3000
```

La URL del server se puede cambiar con la variable
`NEXT_PUBLIC_GAME_SERVER` en `web/.env.local`.

---

## 6. Estado y próximos pasos

**Hecho (Paso 1):** esqueleto, lobby en tiempo real, reconexión, bots, 2 paletas.

**Siguiente (Paso 2):** motor de fases enchufable + primer minijuego (El Botón
del Bonus) — ver el roadmap en el [GDD §10](GDD.md).
