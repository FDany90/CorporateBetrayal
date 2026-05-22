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
- [Estado y Guía para Retomar](docs/handoff.md) — **empezá acá** si retomás el
  proyecto en otra PC o sesión: estado, flujo de trabajo y próximos pasos.

## Prototipo HTML

[`prototipo/index.html`](prototipo/index.html) — prototipo estático y clickable
(Mobile First) de las pantallas comunes. Se abre directo en el navegador.

## Proyecto (código)

Monorepo con dos partes:

- [`server/`](server/) — game server en **Colyseus** (Node + TypeScript).
- [`web/`](web/) — cliente en **Angular** (TypeScript).

### Cómo correr el proyecto (local)

Requiere **Node 20+**. En dos terminales:

```bash
# Terminal 1 — game server
cd server
npm install
npm run dev          # ws://localhost:2567

# Terminal 2 — app web
cd web
npm install
npm start            # http://localhost:4200
```

Abrí `http://localhost:4200`: creá una sala y, desde otra pestaña o dispositivo,
unite con el código. En el lobby, el panel **Modo desarrollo** agrega *bots*
(jugadores de mentira) para probar la partida solo.

El cliente deduce la URL del game server del host desde el que se abrió la web
(`ws://<host>:2567`), así que funciona igual en `localhost` o por la IP de red.

## Estado

**Paso 2 completo** — motor de fases corriendo el primer minijuego, **El Botón
del Bonus**. El bucle lobby → briefing → llamadas → resultado → marcador
funciona de punta a punta, jugable con bots.

El cliente web fue **migrado de Next.js/React a Angular** (ver
[docs/migracion-angular.md](docs/migracion-angular.md)). Próximo: las 5 rondas
intercaladas y más desafíos del catálogo.
