# Traición en la Oficina · Corporate Betrayal

Juego web de **desafíos sociales** inspirado en *Scam Line*, jugado sobre
llamadas y reuniones reales de Microsoft Teams. Todos contra todos: una oficina
donde cada jugador compite por el ascenso pisándose entre sí.

- **Jugadores:** 7–12 · **Duración:** 40–60 min
- **Contexto:** team-building de empresa · tono corporativo satírico
- **Idea central:** la web organiza, distribuye información y cronometra; el
  juego real ocurre en la voz, la negociación y la mentira.

## Documentación

- [Documento de Diseño (GDD)](docs/GDD.md) — mecánicas, catálogo de desafíos,
  economía, arquitectura e infraestructura.
- [Borradores de Pantalla (UI)](docs/UI-borradores.md) — wireframes de las
  pantallas: lobby, llamadas, votación y resultados.
- [Modelo de Datos](docs/modelo-datos.md) — entidades, sistema de minijuegos
  enchufable y mapa estado → pantalla.
- [Arquitectura e Infraestructura](docs/arquitectura.md) — tiempo real,
  reconexión, sesión recuperable y despliegue.
- [Guía del Código](docs/codigo.md) — cómo está organizado el código del
  server y de la web.

## Prototipo HTML

[`prototipo/index.html`](prototipo/index.html) — prototipo estático y clickable
(Mobile First) de las pantallas comunes. Se abre directo en el navegador.

## Proyecto (código)

Monorepo con dos partes:

- [`server/`](server/) — game server en **Colyseus** (Node + TypeScript).
- [`web/`](web/) — cliente en **Next.js + React** (TypeScript).

### Cómo correr el Paso 1 — esqueleto + lobby (local)

Requiere **Node 20+**. En dos terminales:

```bash
# Terminal 1 — game server
cd server
npm install
npm run dev          # ws://localhost:2567

# Terminal 2 — app web
cd web
npm install
npm run dev          # http://localhost:3000
```

Abrí `http://localhost:3000`: creá una sala y, desde otra pestaña o dispositivo,
unite con el código. En el lobby, el panel **Modo desarrollo** agrega *bots*
(jugadores de mentira) para probar la partida solo.

Si el game server corre en otra URL, definila en `web/.env.local`:
`NEXT_PUBLIC_GAME_SERVER=ws://mi-servidor:2567`

## Estado

**Paso 1 completo** — esqueleto Next.js + Colyseus, lobby en tiempo real
(crear/unirse por código, lista de jugadores en vivo, fichar, reconexión) y
modo desarrollo con bots. Próximo: motor de fases + primer minijuego.
