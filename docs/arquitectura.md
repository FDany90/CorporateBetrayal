# Traición en la Oficina — Arquitectura e Infraestructura (v0.2)

> Cómo se comunica el juego en tiempo real, cómo sobrevive a que un jugador
> cierre el navegador, y dónde corre todo. Acompaña al [GDD](GDD.md) y al
> [Modelo de Datos](modelo-datos.md).

**Versión:** 0.2 · **Fecha:** 2026-05-18

---

## 1. Requisitos que dirigen esta arquitectura

1. **Tiempo real sin recargar.** Las decisiones se propagan solas; nadie aprieta
   F5. La pantalla reacciona al estado del servidor.
2. **A prueba de errores del jugador.** Si cierra el navegador, da "atrás" o se
   le corta internet, el juego **sigue** y él puede **volver a su lugar**.
3. **Sesión recuperable por link.** Un link con un id que, al abrirlo, devuelve
   al jugador a su sesión activa.
4. **Notificación instantánea.** Cuando alguien decide, el resto se entera al
   instante (sin ver *qué* decidió — eso es secreto).
5. **Servidor autoritativo.** Los jugadores mienten; el cliente no.

---

## 2. Vista general

```
        [ Celular del jugador ]
        Navegador · App Angular (SPA)
                │
                │   1) descarga la web         2) WebSocket (WSS, 443)
                ▼                                  │
        ┌─────────────────┐                        ▼
        │  Hosting web    │              ┌────────────────────────┐
        │  estático       │              │  Game Server · Colyseus │
        └─────────────────┘              │  Room = 1 partida       │
                                         │  estado autoritativo    │
                                         └────────────────────────┘
                                                    │
                                            (futuro) Redis / Postgres
```

- **La web** (Angular) es una SPA estática que corre en el celular.
- **El game server** (Colyseus, Node) mantiene una **Room** por partida con el
  estado autoritativo y lo sincroniza por WebSocket.
- En paralelo, **Microsoft Teams** corre aparte (las llamadas reales). La web
  solo da instrucciones; no se integra con Teams.

---

## 3. Stack tecnológico

| Capa | Tecnología | Por qué |
|---|---|---|
| Web / UI | **Angular + TypeScript** | SPA reactiva (standalone + signals), Mobile First |
| Cliente tiempo real | **`colyseus.js`** | SDK que sincroniza el estado por WS |
| Game server | **Colyseus (Node + TypeScript)** | `Room` = partida; sync de estado, timers, reconexión de fábrica |
| Estado de partida | **En memoria** (Colyseus `Schema`) | Partidas cortas; sin BD para jugar |
| Hosting web | **Hosting estático** (Vercel / Netlify / etc.) | La SPA Angular es un build estático |
| Hosting game server | **Railway / Fly.io / Render** | Proceso Node persistente con WebSockets |
| Persistencia (futuro) | **Postgres** | Solo estadísticas de partidas terminadas |
| Presencia multi-proceso (futuro) | **Redis** | Solo si se escala a varios procesos |

> Vercel **no** puede hospedar el game server: es serverless y no mantiene
> conexiones WebSocket largas. Por eso el game server va aparte.

---

## 4. Tiempo real — cómo funciona

### 4.1 Sincronización de estado (el "sin recargar")
Colyseus mantiene el estado de la Room como un `Schema`. Cuando el servidor lo
modifica, Colyseus envía **solo el delta** (lo que cambió) por WebSocket a todos
los clientes. El cliente actualiza su copia local y Angular **re-renderiza** la
parte afectada (el estado se guarda en *signals* y la UI reacciona sola).

```
Servidor cambia round.phase  ──delta──▶  todos los clientes
                                         Angular pinta la nueva fase
```

No hay recarga de página: la web es una SPA suscrita al estado. Cambiar de fase,
de pantalla o de marcador es solo estado que cambia.

### 4.2 Notificación instantánea de decisiones
Cuando un jugador envía su decisión, el servidor actualiza el estado y eso se
propaga al instante. **Pero no se propaga el contenido secreto:**

- Se sincroniza a todos: `decisionesRecibidas: 5` (el contador "5/8").
- **No** se sincroniza: el `value` de cada `Decision` ajena.

Colyseus permite **estado filtrado** (`@filter`): cada cliente recibe una *vista*
distinta del estado. El secreto local de un minijuego y las decisiones ajenas
solo se envían a quien corresponde, y los `value` recién en la fase `result`.

### 4.3 Mensajes puntuales
Además del estado sincronizado, hay mensajes uno-a-uno para acciones:

**Cliente → Servidor:** `setReady`, `callConnected`, `callReported`,
`submitDecision { value }`, `meetingJoined`.

**Servidor → Cliente:** sync de estado (automático), `error`, y eventos breves
(`challengeStarted`, etc.). La regla: **el estado manda; los mensajes son para
acciones**.

---

## 5. Sesión recuperable y reconexión

### 5.1 Dos identidades
| Identidad | Vida | Para qué |
|---|---|---|
| `reconnectionToken` (Colyseus) | Corta (ventana de reconexión) | Reconexión transparente ante un corte de red breve |
| **`playerToken`** (propio, UUID) | Toda la vida de la sala | Identidad real del jugador. Sobrevive a cerrar el navegador |

El **`playerToken`** es la pieza clave: lo genera el cliente la primera vez, se
guarda y **siempre identifica al jugador** dentro de esa sala.

### 5.2 Dónde se guarda
- En **`localStorage`** del navegador (`{ roomCode, playerToken }`).
- Embebido en el **link recuperable**.

### 5.3 El link recuperable
Cada jugador tiene un link personal:

```
https://traicion.app/r/KPXZT#p=2f9c…   (código de sala + playerToken)
```

El `playerToken` va en el **fragmento `#`** → no viaja al servidor en los logs.
Al abrir el link, el cliente lee el token, se conecta a la Room y se re-asocia a
su `Player`.

### 5.4 Flujo: el jugador cierra el navegador / da "atrás" / se le corta
```
1. El cliente se desconecta.
2. El servidor detecta la baja → marca al Player como 'offline'
   y reserva su lugar (allowReconnection).
3. EL JUEGO SIGUE: las fases y los cronómetros no se frenan por uno.
4. El jugador vuelve a abrir la web (link recuperable o localStorage).
5. El cliente se reconecta y manda su playerToken.
6. El servidor lo encuentra, lo re-asocia a su Player ('online')
   y le envía el estado actual.
7. El jugador aparece en la pantalla de la fase en curso, como si nada.
```

### 5.5 Re-asociación en el servidor (pseudo-código)
```ts
onJoin(client, options) {
  const existing = this.state.players.find(p => p.token === options.playerToken);
  if (existing) {
    existing.sessionId = client.sessionId;   // re-asociar
    existing.connection = 'online';
  } else {
    this.state.players.push(newPlayer(options));  // jugador nuevo
  }
}
```
La identidad vive en el **estado de la Room**, no en la conexión. Una conexión
nueva se "engancha" al Player existente por token.

---

## 6. Resiliencia y manejo de fallos

- **Jugador ausente en una decisión.** La fase avanza igual cuando vence el
  cronómetro. La decisión faltante se toma como **abstención / valor por
  defecto** (definido por cada minijuego). El juego nunca se cuelga esperando.
- **Mensajes idempotentes.** Reenviar `submitDecision` no rompe nada: el
  servidor ignora una decisión ya registrada para esa fase. Cubre el doble-click
  y los reintentos tras un corte.
- **Decisión bloqueada al confirmar.** El jugador puede cambiar su elección
  *antes* de confirmar; una vez confirmada, queda fija. Evita el "me equivoqué".
- **Ciclo de vida de la Room.** Vive en memoria mientras dura la partida. Se
  destruye al terminar o tras quedar vacía un tiempo.
- **Límite conocido del MVP:** si el game server se reinicia, las partidas en
  curso se pierden (el estado es en memoria). Mitigación futura: snapshot del
  estado de la Room en Redis para recuperar ante caída. No es bloqueante para el
  MVP.

---

## 7. Infraestructura y despliegue

### 7.1 Componentes
- **Web (Angular SPA) → hosting estático** (Vercel, Netlify, etc.). El
  `ng build` genera archivos estáticos. Dominio con HTTPS.
- **Game server (Colyseus) → Railway o Fly.io.** Proceso Node siempre activo,
  con WebSocket sobre **WSS en el puerto 443**.

### 7.2 Redes corporativas y Mobile First
Muchas redes de empresa bloquean sitios o puertos raros. Mitigaciones:
- WebSocket sobre **WSS / 443** (el mismo puerto que HTTPS) → pasa la mayoría de
  los firewalls corporativos.
- **Mobile First**: el jugador usa la web en su **celular con datos móviles**,
  que no pasa por la red corporativa. Teams puede correr en la notebook.
- Dominio propio con TLS → parece un sitio normal, no un servicio sospechoso.

### 7.3 Escalado
- **MVP:** un solo proceso de game server alcanza para muchas salas en paralelo
  (la escala es team-building, no masiva).
- **Futuro:** varios procesos coordinados con **Redis** como backend de
  presencia/matchmaking de Colyseus.

### 7.4 Entornos
- `dev` (local) y `prod`. Variables de entorno separan URLs y secretos.
- Sin base de datos en el MVP. Postgres se suma solo cuando haya estadísticas.

---

## 8. Seguridad

- **Servidor autoritativo.** El cliente nunca calcula puntajes ni resuelve
  desafíos; solo manda intenciones (`submitDecision`). El servidor valida.
- **Estado filtrado.** Cada cliente recibe solo su vista (ver §4.2). Las
  decisiones ajenas y los secretos no llegan al navegador hasta que corresponde.
- **Sin login.** La credencial del jugador es el `playerToken` (no adivinable,
  UUID). El código de sala da acceso a la partida. Suficiente para un juego
  efímero de oficina.
- **Validación de mensajes.** Todo mensaje del cliente se valida contra la fase
  actual (ej.: no se acepta `submitDecision` fuera de una fase `decision`).

---

## 9. Decisiones abiertas

- [ ] Hosting del game server: ¿Railway, Fly.io o Render? (afinar al desplegar).
- [ ] ¿El link recuperable se le muestra al jugador, o el regreso es automático
      vía `localStorage` y el link queda como respaldo?
- [ ] Tiempo de la ventana de reconexión de Colyseus y del descarte de una Room
      vacía.
- [ ] ¿Snapshot de la Room en Redis ya en una v1, o se posterga?
- [ ] Límite de salas simultáneas por proceso antes de necesitar escalar.
