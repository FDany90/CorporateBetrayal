# Traición en la Oficina — Modelo de Datos (v0.2)

> Versión inicial para iterar. Pensado para **agregar/quitar minijuegos sin
> tocar el motor** y para construir prototipos parciales. Acompaña al
> [GDD](GDD.md) y a los [Borradores de UI](UI-borradores.md).

**Versión:** 0.2 · **Fecha:** 2026-05-18 · **Stack:** TypeScript

---

## 1. Principios de diseño

1. **Minijuegos enchufables.** El motor no sabe qué es "El Botón del Bonus".
   Solo sabe ejecutar *fases genéricas*. Cada minijuego es una **definición de
   datos** + una **función de puntaje**. Agregar uno = crear un archivo y
   registrarlo. Quitarlo = sacarlo de una lista.
2. **Fases genéricas.** Toda partida es una máquina de estados de fases
   (`briefing`, `call-round`, `group-meeting`, `decision`, `result`…). Las
   pantallas se renderizan por **tipo de fase**, no por minijuego → ~6 pantallas
   cubren los 19 desafíos.
3. **Decisiones polimórficas.** Un único tipo `Decision` cubre votar, elegir
   jugador, repartir, etc. No hay una tabla por minijuego.
4. **Influencia como libro mayor (ledger).** Todo cambio de puntaje es una
   entrada append-only. El marcador y el "Historial" son *vistas* de ese ledger.
5. **Servidor autoritativo + secretos del lado servidor.** El cliente nunca
   recibe información que no le corresponde (ver §6).
6. **Bolsa `config` libre.** Cada minijuego puede guardar datos propios en un
   campo `config`/`secrets` sin cambiar el esquema → escala sin migraciones.

---

## 2. Vista general

```
Room (Sala)
 ├─ GameConfig         ← acá se eligen los minijuegos de la partida
 ├─ Player[]           ← jugadores
 ├─ Round[]            ← rondas
 │   └─ ChallengeInstance[]   ← un desafío en curso
 │        ├─ Phase (actual)
 │        ├─ CallPairing[]    ← llamadas 1-a-1
 │        ├─ Decision[]       ← lo que eligió cada jugador
 │        └─ ChallengeResult[]
 └─ InfluenceEntry[]   ← libro mayor de puntaje (historial)

ChallengeDefinition[]  ← REGISTRO de minijuegos (código, no estado de sala)
```

El estado vivo de una partida (`Room` y todo lo que cuelga) es **sincronizado**.
Las `ChallengeDefinition` son **código estático**: el catálogo de minijuegos.

---

## 3. Entidades del estado de partida

Tipos base:

```ts
type PlayerId   = string;   // id interno del jugador
type RoomCode   = string;   // "KPXZT"
type ChallengeId = string;  // "boton-del-bonus"
```

### 3.1 Room (Sala)

```ts
interface Room {
  code: RoomCode;
  status: 'lobby' | 'in-game' | 'finished';
  config: GameConfig;
  players: Player[];
  rounds: Round[];
  currentRoundIndex: number;
  teamsMeetingUrl?: string;   // link de la reunión grupal, fijo por sala
  influenceLedger: InfluenceEntry[];
  createdAt: number;
}
```

### 3.2 GameConfig — la estructura parametrizable de la partida

La partida es una **lista explícita de rondas**. Cada `RoundSpec` define el tipo
de la ronda y de qué minijuegos puede salir:

```ts
interface RoundSpec {
  tipo: 'individual' | 'grupal';
  challengePool: ChallengeId[];   // candidatos; uno se elige al jugar la ronda
}                                 // pool de 1 = ronda fija y determinista

interface GameConfig {
  rounds: RoundSpec[];            // la estructura; rounds.length = nº de rondas
  modoAnonimo: boolean;           // futuro; en MVP = false
}
```

- **Parametrizable:** cambiar el patrón, la cantidad de rondas o qué minijuegos
  entran = editar la lista `rounds`. **Nada es aleatorio.**
- **Por ronda:** el motor elige un minijuego del `challengePool` de esa ronda
  (sin repetir minijuegos en la partida; un pool de 1 fija la ronda).
- **Validación:** el `format` del minijuego (de su `ChallengeDefinition`, §4.1)
  debe coincidir con el `tipo` de la ronda.

Config por defecto — **4 rondas I-G-I-G**:

```ts
const CONFIG_DEFECTO: GameConfig = {
  rounds: [
    { tipo: 'individual', challengePool: ['boton-del-bonus'] },
    { tipo: 'grupal',      challengePool: [/* grupales (aún sin implementar) */] },
    { tipo: 'individual', challengePool: ['boton-del-bonus'] },
    { tipo: 'grupal',      challengePool: [/* grupales (aún sin implementar) */] },
  ],
  modoAnonimo: false,
};
```

### 3.3 Player (Jugador)

```ts
interface Player {
  id: PlayerId;
  nickname: string;
  avatarId: string;
  influence: number;                 // suma corriente (derivada del ledger)
  connection: 'online' | 'reconnecting' | 'offline';
  ready: boolean;
  // --- reservado a futuro, fuera del MVP ---
  personalMissionId?: string;        // Misión Personal (§GDD 2.2)
  // suspicion?: number;             // Sospecha, si se reactiva
}
```
> MVP: solo `influence`. `personalMissionId` y `suspicion` quedan declarados
> pero sin usar — el modelo ya está preparado para sumarlos sin migrar.

### 3.4 Round (Ronda)

```ts
interface Round {
  index: number;
  challengeInstanceIds: string[];
  status: 'pending' | 'running' | 'finished';
}
```

### 3.5 ChallengeInstance — un desafío en curso

```ts
interface ChallengeInstance {
  id: string;
  definitionId: ChallengeId;     // apunta a una ChallengeDefinition
  roundIndex: number;
  status: 'pending' | 'running' | 'finished';
  currentPhaseIndex: number;
  phaseStartedAt: number;        // para el cronómetro
  pairings: CallPairing[];       // vacío si no es de llamadas
  decisions: Decision[];
  results: ChallengeResult[];
  secrets: Record<PlayerId, unknown>;  // "secreto local" del minijuego (server-only)
}
```
`secrets` guarda el dato oculto que un minijuego le da a un jugador (ej.: "vos
recibiste los datos falsos"). Es libre por minijuego y **nunca se sincroniza
entero** (ver §6).

### 3.6 Phase (Fase)

La fase activa se deriva de `definition.phases[currentPhaseIndex]`. Tipos:

```ts
type PhaseType =
  | 'briefing'        // mostrar reglas
  | 'call-round'      // tanda de llamadas 1-a-1
  | 'group-meeting'   // todos en la reunión de Teams (debate)
  | 'decision'        // cada jugador elige algo
  | 'result'          // mostrar resultados
  | 'interlude';      // negociación libre (Fase de Pasillo)
```

### 3.7 CallPairing — una llamada 1-a-1

```ts
interface CallPairing {
  id: string;
  challengeInstanceId: string;
  callIndex: number;             // "llamada 2 de 5"
  initiatorId: PlayerId;         // el que llama (solo uno inicia)
  receiverId: PlayerId;          // el que recibe
  status: 'pending' | 'connecting' | 'in-call' | 'reported';
  startedAt?: number;
}
```

### 3.8 Decision — decisión polimórfica

```ts
type DecisionValue =
  | { kind: 'binary';        choice: string }              // "verde" | "rojo"
  | { kind: 'select-player'; targetId: PlayerId | null }   // null = abstención
  | { kind: 'allocation';    amount: number }              // reparto
  | { kind: 'free-report';   payload: Record<string, unknown> }; // reporte libre

interface Decision {
  id: string;
  challengeInstanceId: string;
  phaseIndex: number;
  playerId: PlayerId;
  pairingId?: string;            // presente en decisiones de llamada 1-a-1
  value: DecisionValue;
  submittedAt: number;
}
```
Un minijuego nuevo que necesite otra forma de decidir agrega una variante a
`DecisionValue` — nada más.

### 3.9 ChallengeResult e InfluenceEntry

```ts
interface ChallengeResult {
  playerId: PlayerId;
  influenceDelta: number;
  breakdown: { label: string; delta: number }[];  // "vs Beto: +5"
}

interface InfluenceEntry {              // libro mayor (append-only)
  playerId: PlayerId;
  roundIndex: number;
  challengeInstanceId: string;
  delta: number;
  reason: string;                       // "El Botón del Bonus · vs Beto"
  at: number;
}
```
`Player.influence` = suma del ledger. El **Historial de Traiciones** de la UI es
una vista filtrada del ledger del propio jugador: muestra *deltas y motivos*,
nunca las decisiones ajenas.

---

## 4. Sistema de minijuegos enchufable

### 4.1 ChallengeDefinition — la "ficha" de un minijuego

```ts
interface ChallengeDefinition {
  id: ChallengeId;
  name: string;                  // "El Botón del Bonus"
  scamLineOrigin?: string;       // "Dilema de los Botones"
  format: 'individual' | 'grupal' | 'hibrido';
  minPlayers: number;
  maxPlayers: number;
  phases: PhaseSpec[];           // secuencia de fases

  // asigna secretos locales al empezar (opcional)
  setup?(ctx: SetupContext): Record<PlayerId, unknown>;

  // arma las parejas de una fase 'call-round' (opcional)
  buildPairings?(ctx: PairingContext): CallPairing[];

  // función pura de puntaje: decisiones -> deltas de Influencia
  resolve(ctx: ResolveContext): ChallengeResult[];
}

interface PhaseSpec {
  type: PhaseType;
  durationSec?: number;                        // timer fijo (opcional)
  callMode?: 'parallel' | 'sequential';        // solo 'call-round'
  callRounds?: number;                         // solo 'call-round': cuántas
                                               // tandas de llamadas (default 1).
                                               // Se topea al máximo posible — §4.5
  decision?: DecisionSpec;                     // solo 'decision'
  config?: Record<string, unknown>;            // extras libres del minijuego
}

interface DecisionSpec {
  kind: DecisionValue['kind'];
  options?: { id: string; label: string }[];   // para 'binary'
  allowAbstain?: boolean;
}
```

### 4.2 El registro

```ts
// registry.ts
export const CHALLENGE_REGISTRY: Record<ChallengeId, ChallengeDefinition> = {
  'boton-del-bonus': botonDelBonus,
  'el-recorte':      elRecorte,
  // …se agregan acá
};
```

El motor solo hace: `CHALLENGE_REGISTRY[instance.definitionId]` y ejecuta sus
`phases` y su `resolve`. **No tiene `if minijuego === …` en ningún lado.**

### 4.3 Ejemplo: "El Botón del Bonus" como definición

```ts
const botonDelBonus: ChallengeDefinition = {
  id: 'boton-del-bonus',
  name: 'El Botón del Bonus',
  scamLineOrigin: 'Dilema de los Botones',
  format: 'individual',
  minPlayers: 4, maxPlayers: 12,
  phases: [
    { type: 'briefing' },
    { type: 'call-round', callMode: 'parallel', callRounds: 3, durationSec: 60,
      decision: { kind: 'binary',
        options: [ { id: 'verde', label: 'Cooperar' },
                   { id: 'rojo',  label: 'Traicionar' } ] } },
    { type: 'result' },
  ],
  resolve: ({ decisions, pairings }) => prisonersDilemmaScore(decisions, pairings),
};
```

### 4.4 Cómo se agrega o se quita un minijuego

**Agregar:** 1) crear `challenges/mi-juego.ts` con su `ChallengeDefinition`;
2) registrarlo en `CHALLENGE_REGISTRY`; 3) sumar su `id` a
`GameConfig.challengePool`. Cero cambios en el motor ni en la UI.

**Quitar:** sacar su `id` de `challengePool` (o del registro). El resto sigue.

Esto permite prototipos parciales: se puede tener 2–3 minijuegos funcionando y
el juego es jugable; el resto se agregan después.

---

## 4.5 Tandas de llamadas y emparejamiento sin repetición

Un minijuego de llamadas no es **una** llamada: es una **serie de tandas**. En
cada tanda todos se emparejan a la vez, hablan y deciden; luego se re-emparejan
para la siguiente. Lo controla `callRounds` en la fase `call-round`.

### Encadenado de tandas

El motor expande una fase `call-round` con `callRounds: N` en N ciclos:

```
briefing → [ tanda de llamadas → resultado parcial ] × N → resultado final
```

Cada tanda acumula su puntaje en el `influenceLedger` (§3.9). El "resultado
parcial" muestra el marcador corriente entre tanda y tanda; el "resultado final"
cierra el minijuego.

### Regla: ninguna pareja se repite

Entre tandas, **dos jugadores no se emparejan dos veces**. Cada uno habla con
colegas distintos en cada tanda. Esto se resuelve con un **calendario
round-robin** (método del círculo): se fija un jugador y se rota al resto.

El emparejador es un **servicio único reutilizable** —no uno por minijuego—:

```ts
// devuelve el calendario completo: una lista de parejas por tanda
roundRobinSchedule(jugadores: PlayerId[], tandas: number): CallPairing[][]
```

Para que las parejas sean aleatorias pero el calendario siga sin repeticiones,
se **baraja el orden de los jugadores una sola vez** al inicio y después se
aplica el round-robin sobre ese orden.

### Tope: `callRounds` no puede superar las combinaciones posibles

Con N jugadores hay un **máximo de tandas distintas** sin repetir parejas:

| Nº de jugadores (N) | Máx. de tandas |
|---|---|
| **N par**   | **N − 1** |
| **N impar** | **N** (en cada tanda descansa uno distinto) |

> Ej.: 4 jugadores → 3 tandas como máximo. 5 jugadores → 5. 6 → 5.

El motor calcula las **tandas efectivas** así:

```ts
const maxTandas = (n % 2 === 0) ? n - 1 : n;
const tandasEfectivas = Math.min(phase.callRounds ?? 1, maxTandas);
```

Si un minijuego pide más tandas de las posibles (`callRounds: 5` con 4
jugadores), el motor usa el tope (3) en silencio — nunca repite parejas ni se
cuelga. Subir `callRounds` alarga el minijuego solo mientras haya combinaciones
nuevas disponibles.

### Número impar de jugadores

Con N impar, en cada tanda **uno queda sin pareja** (descansa esa ronda). El
round-robin garantiza que el que descansa es distinto en cada tanda. La UI ya
contempla el caso "te quedaste sin pareja".

---

## 4.6 Implementación actual: minijuegos por `kind`

La versión implementada del registro es un subconjunto pragmático de §4.1. En
vez del `phases: PhaseSpec[]` totalmente genérico, cada `ChallengeDefinition`
declara un **`kind`** que define su flujo de fases:

| `kind`     | Flujo de fases                        | Ejemplo |
|------------|---------------------------------------|---------|
| `llamadas` | briefing → [calls → result] × tandas  | El Botón del Bonus |
| `votacion` | briefing → meeting → vote → result    | El Recorte |

El motor conoce *kinds*, no minijuegos concretos: sumar un minijuego de un kind
ya existente no toca el motor; sumar un kind nuevo es una rama nueva. Cuando el
catálogo crezca se puede migrar al `phases` totalmente genérico.

Campos de `ChallengeDefinition` (implementados): `id`, `nombre`, `format`
(individual/grupal), `kind`, `callRounds` y `puntuarPareja` (kind `llamadas`),
`voteDelta` (kind `votacion`: influencia que gana/pierde el más votado —
negativo en El Recorte).

**Voto.** En un minijuego `votacion` cada jugador vota a otro; el voto se guarda
reusando el campo `Player.decision` (el id del votado). El más votado recibe
`voteDelta` (empates: lo reciben todos los empatados).

---

## 5. Mapa estado → pantalla (UI reutilizable)

Cada **tipo de fase** se renderiza con una pantalla genérica. No hay pantallas
por minijuego:

| PhaseType | Pantalla genérica | Datos que usa |
|---|---|---|
| `briefing` | `<Briefing>` | `definition.name`, reglas |
| `call-round` | `<TarjetaLlamada>` + `<EnLlamada>` | `CallPairing` actual, timer |
| `group-meeting` | `<Reunion>` | `teamsMeetingUrl`, presentes, timer |
| `decision` | `<Decision>` | `phase.decision` (renderiza según `kind`) |
| `result` | `<Resultado>` | `ChallengeResult` del jugador |
| `interlude` | `<TarjetaLlamada>` (modo libre) | `CallPairing` |

Componentes transversales: `<BarraSuperior>`, `<ListaJugadores>` (3 modos),
`<Cronometro>`. → 19 minijuegos cubiertos con ~6 pantallas + 3 componentes.

---

## 6. Qué se sincroniza y qué no (seguridad)

Como hay jugadores que mienten, el servidor **filtra** lo que manda a cada cliente:

| Dato | Visibilidad |
|---|---|
| `Player` (apodo, avatar, conexión) | Todos |
| `Player.influence` | Todos (en MVP; oculto si `modoAnonimo`) |
| Fase actual, timers, `CallPairing` propios | El jugador involucrado |
| `ChallengeInstance.secrets[yo]` | Solo su dueño |
| `Decision.value` ajena | **Nadie** hasta la fase `result` |
| `resolve()` y puntajes | Solo en el servidor; al cliente van `ChallengeResult` ya filtrados |

Regla: el cliente recibe una **vista** del estado, no el estado completo.

---

## 7. Notas e iteración

- Este modelo es **v0.1**: cuando se filtre la lista de minijuegos, puede que
  aparezcan tipos de fase o variantes de `DecisionValue` nuevos — se agregan sin
  romper lo existente.
- En Colyseus, `Room` y lo sincronizado se modela con `Schema`; las
  `ChallengeDefinition` son módulos TS normales.
- MVP en memoria; `Postgres` (futuro) solo persiste partidas terminadas para
  estadísticas — el modelo no cambia.

### Decisiones abiertas
- [ ] ¿`challengesPerRound` fijo o variable según nº de jugadores?
- [x] El emparejador es un **servicio único** reutilizable
      (`roundRobinSchedule`), no uno por minijuego — ver §4.5.
- [ ] Reglas de reconexión: qué pasa con una `Decision` no enviada si un jugador
      se cae.
