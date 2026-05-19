# Traición en la Oficina — Guía del Código

> Guía pensada para entender el código **desde cero**: no asume que sepas
> Angular, Node ni Colyseus. Explica primero los conceptos y después recorre
> el código actual archivo por archivo. Acompaña a la
> [Arquitectura](arquitectura.md) y al [Modelo de Datos](modelo-datos.md).

**Versión:** 0.3 · **Fecha:** 2026-05-18

---

## 1. La idea en una frase

El proyecto son **dos programas separados** que se hablan en vivo:

```
   web-angular/   ─── habla por WebSocket ───►   server/
   (lo que el                                   (el "árbitro":
    jugador ve                                   tiene la verdad
    en el celular)                               de la partida)
```

- El **servidor** manda la partida: sabe quién juega, en qué ronda van, los
  puntajes. Es la autoridad — los jugadores pueden mentir, el servidor no.
- El **cliente** (la web) solo muestra lo que el servidor dice y le manda las
  acciones del jugador ("ficho entrada", "voto a Ana").

No comparten código. Lo único en común es el "idioma" con el que se hablan:
mensajes por WebSocket.

---

## 2. Conceptos base (si no programás, leé esto)

**JavaScript y TypeScript.** JavaScript es el lenguaje de la web. TypeScript es
JavaScript con *tipos*: declarás de qué clase es cada dato (texto, número,
verdadero/falso…) y el editor te avisa errores antes de ejecutar. Todo el
proyecto está en TypeScript — los archivos terminan en `.ts`.

**Node.js.** El navegador ejecuta JavaScript para mostrar páginas. Node.js es un
programa que ejecuta JavaScript *fuera* del navegador. Sirve para escribir el
lado servidor. Nuestro game server corre sobre Node.

**WebSocket.** Una página web común pide algo, recibe la respuesta y la
conversación se corta. Un WebSocket es una conexión que queda **abierta**: el
servidor y el navegador se mandan mensajes en cualquier momento, en vivo. Es lo
que hace que, cuando un jugador decide algo, el resto lo vea al instante sin
recargar.

**Colyseus** (el framework del servidor). Un *framework* es una caja de
herramientas ya hechas. Colyseus es un framework para servidores de juegos en
tiempo real. Dos ideas clave:
- **Room (sala):** una instancia de Room = una partida. Cada partida es su
  propia Room con su propia gente.
- **Estado sincronizado:** la Room tiene un **estado** (todos los datos de la
  partida). Cuando el servidor lo cambia, Colyseus manda el cambio solo a
  todos los navegadores conectados, automáticamente. No hay que programar el
  "avisarle a cada uno".

**Angular** (el framework del cliente). Framework para construir la interfaz
web. Tres ideas clave:
- **Componente:** un pedazo de pantalla. Es una clase (la lógica) + un archivo
  `.html` (lo que se ve). La app entera es un árbol de componentes.
- **Signal:** una "caja" que guarda un valor y **avisa cuando cambia**. Angular
  repinta sola la parte de la pantalla que usa ese valor. Es como una planilla
  de cálculo: si cambia una celda, las que dependen de ella se recalculan.
- **Servicio:** una clase con lógica o datos compartidos entre componentes. Se
  pide con `inject()`.

**SPA (Single Page Application).** La web es **una sola página** que cambia su
contenido según el estado, sin recargar nunca. Cambiar de "pantalla" es solo
mostrar otro componente.

---

## 3. Estructura del repositorio

```
traicionenlaoficina/
├── docs/          documentos de diseño (incluido este)
├── prototipo/     prototipo HTML estático (descartable, ya no se usa)
├── server/        game server — Colyseus (Node + TypeScript)
└── web-angular/   cliente web — Angular (TypeScript)
```

`server/` y `web-angular/` son **dos proyectos independientes**, cada uno con su
`package.json` (su lista de dependencias). Se ejecutan a la vez.

---

## 4. El servidor (`server/`)

Mantiene el estado autoritativo de cada partida y lo sincroniza por WebSocket.

```
server/src/
├── index.ts                 arranca el servidor
├── config.ts                estructura de la partida (rondas)
├── emparejador.ts            arma las parejas de las llamadas
├── schema/GameState.ts       qué datos tiene una partida
├── rooms/GameRoom.ts          la lógica de la sala (el "motor")
└── challenges/
    ├── registry.ts            catálogo de minijuegos
    ├── botonDelBonus.ts       minijuego: El Botón del Bonus
    └── elRecorte.ts           minijuego: El Recorte
```

### 4.1 `index.ts` — el arranque

Es lo primero que se ejecuta. Hace tres cosas:
1. Crea el servidor Colyseus con un `WebSocketTransport` (la "puerta" por la
   que entran las conexiones).
2. Registra el tipo de sala: `gameServer.define("game", GameRoom)` — "cuando
   alguien pida una sala 'game', usá la clase `GameRoom`".
3. `.filterBy(["code"])` — hace que las salas se busquen por su **código**: al
   unirse con `{ code: "ABCDE" }`, Colyseus encuentra la sala creada con ese
   código.
4. Escucha en el puerto **2567**.

### 4.2 `schema/GameState.ts` — los datos de una partida

Define **qué información tiene una partida**. Son clases marcadas con
decoradores `@type(...)`. La regla de Colyseus: **solo lo marcado con `@type`
se sincroniza** con los clientes.

- **`Player`** — un jugador: `id`, `token` (identidad para reconectar),
  `nickname`, `avatar`, `ready` (fichó entrada), `isBot`, `connected`, y campos
  de juego: `influence` (su puntaje), `decision` (qué eligió/votó), `acted`
  (si confirmó la pantalla actual), `lastDelta` (cuánto ganó/perdió en lo
  último).
- **`Pairing`** — una pareja de llamada 1-a-1: `aId` y `bId`. Por convención,
  `aId` es quien inicia la llamada.
- **`GameState`** — el estado completo: `code`, `status` (lobby/playing),
  `hostId` (el anfitrión), `players`, `phase` (la pantalla actual),
  `challengeId` (el minijuego de la ronda), `pairings`, `tanda`/`tandasTotal`
  (las tandas de llamadas), `ronda`/`rondasTotal`/`rondaTipo`.

> Pensalo así: `GameState` es la "planilla" de la partida. El servidor la
> edita, y Colyseus le manda los cambios a todos.

### 4.3 `rooms/GameRoom.ts` — el motor de la partida

Es el archivo más importante del servidor. Una instancia de `GameRoom` = una
partida. Tiene dos grandes partes:

**a) Manejo de jugadores y mensajes.**
- `onCreate` — al crearse la sala: arma el estado y registra qué **mensajes**
  acepta del cliente: `ready` (fichar), `dev:addBots`/`dev:clearBots` (bots),
  `kick` (expulsar), `startGame` (empezar), `ack` (confirmar una pantalla),
  `decidir` (elegir verde/rojo o votar a alguien).
- `onJoin` — entra un jugador: si trae un `token` conocido, lo **reconecta** a
  su jugador anterior; si no, crea uno nuevo. El primero en entrar queda como
  **anfitrión**.
- `onLeave` — se va un jugador: le reserva el lugar 60 segundos por si vuelve
  (reconexión); si no vuelve, lo borra.

**b) El motor de rondas.** Una partida es una secuencia de **fases** (cada fase
es una pantalla). El motor las va avanzando cuando todos los jugadores actúan:

```
lobby
  → ronda 1:  briefing → (minijuego)
  → marcador
  → ronda 2:  briefing → (minijuego)
  → marcador
  → ...
  → final
```

Métodos clave:
- `iniciarPartida` — valida (anfitrión, todos fichados) y arranca la ronda 1.
- `iniciarRonda(n)` — elige el minijuego de la ronda (del `config`) y entra al
  briefing.
- `iniciarTanda(n)` / `iniciarVotacion` — arrancan las fases internas de cada
  tipo de minijuego.
- `chequearAvance` — el corazón: cada vez que un jugador actúa, revisa si la
  fase puede avanzar (¿actuaron todos?) y pasa a la siguiente.
- `resolver` / `resolverVotacion` — calculan los puntajes del minijuego.
- `terminarRonda` — pasa al marcador, o a la pantalla final si era la última.

### 4.4 `config.ts` — la estructura de la partida

Define **cuántas rondas hay y de qué tipo**. Es una lista de `RoundSpec`, cada
una con su `tipo` (individual/grupal) y los minijuegos candidatos. `CONFIG_DEFECTO`
es 4 rondas con patrón **I-G-I-G**. Para cambiar la partida (más rondas, otro
patrón, otros minijuegos) se edita esta lista — nada es aleatorio.

### 4.5 `challenges/` — los minijuegos

El servidor no tiene el código de cada minijuego desparramado: cada minijuego
es una **ficha** (`ChallengeDefinition`) y todas viven en un **registro**.

- `registry.ts` — define qué es una `ChallengeDefinition` (`id`, `nombre`,
  `format` individual/grupal, `kind`, etc.) y arma el `CHALLENGE_REGISTRY`, el
  catálogo. El motor solo lee de acá; **no sabe** qué minijuego es cuál.
- El campo **`kind`** define el flujo del minijuego:
  - `'llamadas'` → briefing → tandas de llamadas → resultado (El Botón).
  - `'votacion'` → briefing → reunión → voto → resultado (El Recorte).
- `botonDelBonus.ts` — *El Botón del Bonus*: la ficha + `puntuarBoton` (la
  función que da los puntos de una pareja).
- `elRecorte.ts` — *El Recorte*: la ficha; `voteDelta: -5` = el más votado
  pierde 5 de Influencia.

### 4.6 `emparejador.ts` — armar las parejas

Para los minijuegos de llamadas. `roundRobinSchedule(jugadores, tandas)` arma
el **calendario** de parejas de todas las tandas, garantizando que **nadie se
empareja dos veces** (algoritmo round-robin). `maxTandas(n)` calcula cuántas
tandas distintas son posibles con `n` jugadores.

---

## 5. El cliente web (`web-angular/`)

Una app **Angular**: muestra las pantallas y le manda las acciones al servidor.
Toda la lógica de juego está en el servidor; el cliente solo dibuja y avisa.

```
web-angular/src/
├── index.html              el HTML raíz (vacío; Angular lo llena)
├── main.ts                 arranca la app
├── styles.css              estilos globales (colores, 2 temas)
└── app/
    ├── app.ts / app.html    componente raíz: elige qué pantalla mostrar
    ├── app.config.ts        configuración de Angular
    ├── models.ts            las "formas" de los datos que llegan del server
    ├── game.service.ts      la conexión con el servidor (lo más importante)
    ├── dlog.ts              logs de depuración (temporal)
    └── <una carpeta por pantalla>
```

### 5.1 `game.service.ts` — el corazón del cliente

Es un **servicio** (clase compartida por toda la app). Hace de puente entre
Colyseus y las pantallas. Ninguna pantalla habla con el servidor directo: todas
pasan por acá.

Responsabilidades:
- **Conexión:** crea/se une a una sala (`crearSala`, `unirseSala`), reconecta
  sola si recargás la página.
- **Estado como signals:** guarda el estado del juego en signals de **solo
  lectura** (`estado`, `miId`, `conectado`, `cargando`, `error`). Cuando el
  servidor manda un cambio, el servicio actualiza el signal `estado` y Angular
  repinta lo necesario.
- **Acciones:** métodos que las pantallas llaman para mandar mensajes:
  `ficharEntrada`, `agregarBots`, `expulsar`, `empezarPartida`, `confirmar`,
  `decidir`, `votar`, `salir`.

La función `snapshot()` traduce el estado de Colyseus (objetos `Schema`) a los
objetos simples que las pantallas usan.

### 5.2 `models.ts` — las "formas" de los datos

Describe con interfaces TypeScript cómo se ven los datos que el cliente usa:
`PlayerView` (un jugador), `PairingView` (una pareja), `StateView` (la partida
entera). También `NOMBRE_CHALLENGE`, un mapa id → nombre legible.

### 5.3 `app.ts` / `app.html` — el componente raíz

Decide **qué pantalla mostrar** según el estado del juego (el `status` y la
`phase`):

| Situación | Pantalla |
|---|---|
| No estoy en una sala | `Ingreso` |
| `status` = lobby | `Lobby` |
| `phase` = briefing | `Briefing` |
| `phase` = calls | `Desafio` |
| `phase` = meeting | `Reunion` |
| `phase` = vote | `Votacion` |
| `phase` = result | `Resultado` |
| `phase` = marcador | `Marcador` |
| `phase` = final | `Final` |

### 5.4 Las pantallas (una carpeta por cada una)

Cada pantalla es un componente: un `.ts` (la lógica) + un `.html` (lo que se
ve). Todas piden el `GameService` con `inject()` y **derivan** lo que muestran
del estado, con `computed()` (un signal calculado a partir de otros).

| Carpeta | Pantalla |
|---|---|
| `ingreso/` | Crear o unirse a una sala (apodo, avatar, código). |
| `lobby/` | Sala de espera: jugadores en vivo, fichar, bots, anfitrión, expulsar. |
| `theme-switcher/` | Conmutador de paleta (Sinergia Azul / Verde Acción). |
| `briefing/` | Explicación del minijuego de la ronda. |
| `desafio/` | El Botón: a quién llamar + decisión Verde/Rojo. |
| `reunion/` | El Recorte: la reunión grupal. |
| `votacion/` | El Recorte: el voto secreto. |
| `resultado/` | Resultado de la tanda/minijuego + marcador. |
| `marcador/` | Marcador entre rondas. |
| `final/` | Ranking final ("Empleado del Mes"). |

### 5.5 `styles.css` — el estilo

Un sistema de **tokens** (variables CSS: colores, tamaños). Hay 2 paletas que se
cambian con un atributo del HTML (`data-theme`): *Sinergia Azul* (default) y
*Verde Acción*. Todas las pantallas reusan los mismos tokens.

### 5.6 `dlog.ts` — logs de depuración (temporal)

Un ayudante que imprime en la consola del navegador qué función se ejecuta y
con qué datos (prefijo `[traición·…]`). Es **temporal**, para seguir el flujo
durante el desarrollo. Se quita borrando este archivo y sus usos (`dlog(`).

---

## 6. Cómo se comunican cliente y servidor

```
web-angular (navegador)  ──WebSocket──►  server (Colyseus)
   GameService                              GameRoom
```

**Del cliente al servidor — mensajes** (el cliente "pide" o "avisa"):
`ready`, `dev:addBots`, `dev:clearBots`, `kick`, `startGame`, `ack`, `decidir`.

**Del servidor al cliente — estado sincronizado** (automático): cada vez que el
servidor cambia el `GameState`, Colyseus manda el cambio. El `GameService` lo
recibe, actualiza su signal `estado`, y Angular repinta. **No hay recarga.**

El recorrido completo de una acción:
```
1. El jugador toca un botón.
2. La pantalla llama un método del GameService.
3. El GameService manda un mensaje al servidor (room.send).
4. El GameRoom procesa y cambia el GameState.
5. Colyseus sincroniza el estado a todos los clientes.
6. Cada GameService actualiza su signal → Angular repinta.
```

---

## 7. El flujo de una partida (de punta a punta)

```
INGRESO    → creás o te unís a una sala
LOBBY      → esperás jugadores; el anfitrión empieza cuando todos ficharon
  ┌─ por cada ronda (4 rondas, patrón I-G-I-G) ────────────────┐
  │ BRIEFING  → explicación del minijuego                       │
  │ el minijuego, según su tipo:                                │
  │   · El Botón:  [ DESAFÍO → RESULTADO ] × 3 tandas           │
  │   · El Recorte: REUNIÓN → VOTACIÓN → RESULTADO              │
  │ MARCADOR  → ranking acumulado (salvo en la última ronda)    │
  └─────────────────────────────────────────────────────────────┘
FINAL      → ranking definitivo ("Empleado del Mes") → vuelta al LOBBY
```

---

## 8. Cómo correr el proyecto

Requiere **Node 20+**. En **dos terminales** distintas:

```bash
# Terminal 1 — el servidor
cd server
npm install        # solo la primera vez (baja las dependencias)
npm run dev        # queda corriendo en ws://localhost:2567

# Terminal 2 — la web
cd web-angular
npm install        # solo la primera vez
npm start          # queda corriendo en http://localhost:4200
```

Abrí `http://localhost:4200`. El cliente deduce solo la dirección del servidor
del host de la web.

Para **probar la partida solo**: en el Lobby, el panel "Modo Desarrollo" agrega
*bots* (jugadores de mentira que actúan automáticamente).

**Verificar que el código compila:**
- Servidor: `cd server && npm run check`
- Web: `cd web-angular && npm run build`

---

## 9. Cómo agregar un minijuego nuevo

Gracias al registro, es acotado:

1. Crear `server/src/challenges/miJuego.ts` con su `ChallengeDefinition`
   (elegir un `kind` existente: `llamadas` o `votacion`).
2. Registrarlo en `server/src/challenges/registry.ts`.
3. Sumar su `id` al `challengePool` de alguna ronda en `config.ts`.
4. Agregar su nombre a `NOMBRE_CHALLENGE` en `web-angular/src/app/models.ts`.
5. Si el minijuego es de un `kind` ya existente, **el motor no se toca** y las
   pantallas ya sirven. Si introduce un `kind` nuevo, hay que sumar su flujo
   en el motor y crear sus pantallas.

---

## 10. Estado y próximos pasos

**Hecho:** lobby en tiempo real, reconexión, bots; motor de rondas (4 rondas
I-G-I-G, parametrizable); 2 minijuegos (El Botón del Bonus, El Recorte);
marcador entre rondas y pantalla final; cliente migrado a Angular.

**Siguiente:** más minijuegos del catálogo (ver el roadmap en el
[GDD §10](GDD.md) y el estado en [handoff.md](handoff.md)).
