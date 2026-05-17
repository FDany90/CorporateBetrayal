# Traición en la Oficina — Documento de Diseño (GDD)

> Juego web de desafíos sociales **inspirado en *Scam Line***, jugado sobre
> llamadas y reuniones reales de Microsoft Teams. Todos contra todos.

**Versión:** 0.4 (borrador de diseño) · **Fecha:** 2026-05-16

---

## 1. Visión general

| Campo | Definición |
|---|---|
| **Género** | Desafíos sociales / engaño y manipulación (free-for-all) |
| **Inspiración** | *Scam Line* — competencia psicológica por teléfono |
| **Jugadores** | 7–12 por partida |
| **Duración** | 40–60 min |
| **Estructura** | Todos contra todos — **gana quien más Influencia acumula** |
| **Eliminación** | Ninguna — todos juegan todas las rondas |
| **Contexto** | Team-building de empresa — apto oficina |
| **Tono** | Corporativo satírico (humor de oficina, jerga, jefes absurdos) |
| **Plataforma** | Web (sin instalar nada, sin login) |
| **Comunicación** | Microsoft Teams — llamadas 1-a-1 y reunión grupal |
| **Anfitrión** | Ninguno — la web arbitra todo automáticamente |

### El concepto en una frase
Una oficina donde todos compiten por el ascenso **pisándose entre sí**.

### Núcleo de diseño (criterio rector)
**El juego NO está en la UI.** Está en la voz, la negociación, la paranoia, las
alianzas y la mentira. La web solo **organiza, distribuye información, controla
tiempos y muestra consecuencias**. Exactamente como *Scam Line*.

Todo desafío se evalúa con este filtro:
> Si se gana con reflejos o destreza en vez de leer y engañar personas,
> **no entra**. El juego es información asimétrica · presión social · paranoia ·
> negociación · traición · comunicación limitada.

### El principio del "switchboard de confianza"
Los resultados de los desafíos son **auto-reportados**. Si dos jugadores
reportan versiones contradictorias, la web no decide quién miente: convierte la
contradicción en **información pública** o en **Sospecha**. La web arbitra el
*procedimiento*, no la *verdad*.

---

## 2. Roles temporales + Misión Personal

### 2.1 Roles por desafío (temporales)
Cada desafío reparte **roles temporales** (p. ej. **Saboteador**, **Auditor**,
**Investigador**, **Mentiroso**). Existen solo durante ese desafío, traen su
objetivo y su tabla de puntos, suelen estar **ocultos para los demás**, y luego
se disuelven.

### 2.2 Misión Personal secreta (persistente)
Cada jugador recibe al inicio **una Misión Personal secreta** que dura toda la
partida y otorga un bono de Influencia al cumplirse. Se revela en la pantalla
final.

> **Regla de diseño clave:** las Misiones Personales se diseñan para
> **contradecirse entre sí** (ej.: "protegé a Finanzas" vs. "hacé despedir a
> Finanzas"). El choque de agendas ocultas es el motor de la traición.

Ejemplos: *El Trepa* (terminá en el podio) · *El Topo de IT* (ocultá tu área
toda la partida) · *El Farsante* (hacé creer a 3 jugadores un cargo falso) ·
*El Rencoroso* (lográ que un jugador asignado sea amonestado) · *El Networker*
(jugá una llamada 1-a-1 con cada jugador) · *El Honesto Imposible* (ganá un
desafío sin mentir).

---

## 3. Economía y recursos

Sistema **minimalista: 2 recursos personales**. La Reputación y la Confianza
existen, pero de forma **narrativa** (en la voz y la negociación), sin barra.

| Recurso | Visible | Función |
|---|---|---|
| **Influencia Corporativa** | Según el modo (§3.1) | Puntaje principal. Decide al ganador. |
| **Sospecha** | Sí | Riesgo de despido. Sube al mentir y ser pillado, al ser acusado, al actuar raro. Alta Sospecha = blanco fácil en *El Recorte*. |

- **Sobornos / tratos**: se hacen transfiriendo Influencia directamente. No hay
  moneda separada.
- **Confianza**: noción **relacional** (cuánto confía A en B), vive en la
  conversación, no es un stat.

### 3.1 Modo Anónimo (de Scam Line)
Opción de partida que **oculta toda la Influencia hasta el final** → paranoia y
faroles masivos. Sin Modo Anónimo, el marcador es **semi-oculto** (posiciones,
no cifras exactas).

---

## 4. Flujo de partida y ritmo

```
LOBBY → INTRO + REPARTO DE MISIÓN → [ RONDA × 4–6 ] → PANTALLA FINAL
```

### 4.1 Anatomía de un desafío (3 fases)
La mayoría de los desafíos siguen esta estructura:
1. **Fase pública** — todos en la reunión grupal de Teams: debate, reporte, info.
2. **Fase privada** — la web abre **llamadas 1-a-1 en paralelo** (todos a la vez):
   conspirar, pactar, mentir.
3. **Resolución** — votación o reporte secreto en la web → consecuencias.

### 4.2 Plantilla de ritmo (clave para no agotar)
Cada ronda alterna energía, según la secuencia propuesta:
> **Tensión alta → Negociación privada → Revelación → Votación → Descanso breve**

### 4.3 Pantalla final
Ranking con títulos satíricos (#1 *Empleado del Mes* … último *En Proceso de
Mejora*), revelación de Misiones Personales y sus bonos, y resumen de partida
(mejor mentira, traición más rentable, etc.).

---

## 5. Coreografía de llamadas (el switchboard)

- **Fase privada en paralelo**: la web empareja a todos a la vez, evitando
  repetir parejas. Cronómetro global compartido.
- **Solo un lado inicia**: a uno le aparece `📞 Llamá a Marcos AHORA`; a Marcos,
  `Marcos te va a llamar`. → cero llamadas cruzadas.
- Con número impar, **alguien queda sin pareja** una ronda. La web lo hace
  explícito: el aislamiento genera sospecha y ansiedad — es intencional (sabor
  heredado del *Pairing Challenge* de Scam Line).
- **Reunión grupal**: link de Teams fijo por sala + botón "Ya estoy en la sala"
  con contador; con quórum se desbloquea la fase pública.

---

## 6. Catálogo de desafíos

Catálogo consolidado tras analizar los 20 minijuegos relevados de *Scam Line* y
la propuesta de diseño de minijuegos. **9 desafíos puntuados + 1 interludio.**

### 6.1 Desafíos puntuados

**① Bono Trimestral** *(Prisoner's Dilemma grupal · 8–10 min)*
Fase pública: negociación grupal (2 min). Fase privada: reuniones 1-a-1 para
conspirar (1 min). Resolución: voto secreto *Compartir bonus* / *Apropiarse*.
Pagos: todos cooperan → +10 c/u; uno traiciona → +25 él / −10 al resto; todos
traicionan → 0. Lo divertido es la paranoia posterior.

**② Email Filtrado** *(whodunit de info asimétrica · 10–15 min)*
Rol temporal oculto: **Saboteador**. Cada jugador recibe fragmentos distintos
de mails; nadie tiene la verdad completa. Fases: lectura privada (1 min) →
debate grupal (5 min) → reuniones privadas (2 min) → acusación final (1 min).
Investigadores aciertan al culpable → +15; Saboteador sobrevive → +25.

**③ Reunión de Status** *(detección de mentiras · 8 min)* — *nuevo*
Todos reciben KPIs/tareas; a uno se le dan datos falsos o debe mentir. Fases:
preparación (30 s) → daily meeting donde cada uno reporta status (4 min) → voto
(1 min). Detectan al mentiroso → +10 investigadores; el mentiroso sobrevive → +20.

**④ El Recorte** *(votación / sacrificio · 7 min)*
La web genera una "Crisis anunciada"; la empresa debe amonestar a alguien.
Fases: crisis (30 s) → debate, defensas y acusaciones (4 min) → voto secreto
(30 s). El más votado **pierde Influencia y sube Sospecha — no es eliminado**.
No hay evidencia objetiva: todo es social.

**⑤ El Impostor del Dress Code** *(grupal)*
A 1–2 jugadores se les da un dato distinto (credencial/cargo/badge falso). El
grupo lo descubre preguntando. Detecta un atributo *estático* (≠ ③, que detecta
actuación en vivo).

**⑥ Sala de Reuniones** *(Doors · grupal)*
El grupo elige puertas / equipos / propuestas; unas benefician, otras penalizan.
Seguir a un líder o engañar al grupo.

**⑦ Votación Corporativa** *(Red or Green + Majority · grupal)*
Decisión colectiva (binaria o por mayoría) con pago dependiente del voto
agregado. Dilema de coordinación.

**⑧ Recortes de Presupuesto** *(recurso escaso · grupal)*
Pozo limitado que no alcanza para todos; se negocia, manipula y sacrifica el
reparto.

**⑨ Encontrar Departamentos** *(Room Number · llamadas 1-a-1)*
Cada jugador tiene un "área" secreta; hay que sonsacar las ajenas y ocultar la
propia mediante ingeniería social en llamadas.

### 6.2 Interludio (no puntuado)
**One-on-One / Fase de Pasillo** — entre desafíos grandes, la web abre llamadas
1-a-1 en paralelo de negociación libre (alianzas, promesas, info). Sin puntaje
propio: es tejido conectivo y respiro de ritmo. El que queda sin pareja sufre el
aislamiento.

### 6.3 Lo que NO es minijuego (es el motor)
- **Alianzas** — emergen solas; comportamiento, no reglas.
- **Pairing / emparejador** — es el switchboard (§5).
- **Lie Detection / Manipulation** — habilidades transversales presentes en todo.
- **Saboteador / Mentiroso** — roles temporales inyectables (§2.1).
- **Hidden Objective** — es la Misión Personal persistente (§2.2).

### 6.4 Descartado
- **Hot Potato / Russian Roulette** — basados en reflejos; violan el criterio (§1).

---

## 7. Condición de victoria

Tras la última ronda, **gana quien más Influencia Corporativa acumula** (incluido
el bono por Misión Personal cumplida). El #1 es el **Empleado del Mes**.

---

## 8. Interfaz y avatares

- **Avatares**: personas de oficina satíricas, personalizables (*el Becario
  eterno*, *la Reina del Excel*, etc.).
- **Pantallas (una por fase)**: `Lobby → Intro/Misión → Briefing de Desafío →
  Fase Pública / Fase Privada → Resolución → Marcador → Final`.
- **Tarjeta de Llamada**: a quién llamar, instrucción `📞 Llamá a Marcos por
  Teams`, tu rol/objetivo secreto, botón "Estamos en llamada" + cronómetro,
  formulario de "Reportar resultado".
- **HUD minimalista**: solo Influencia (según modo) y Sospecha.
- **Estilo**: app de productividad corporativa "demasiado pulida"; el humor en
  los textos (tooltips pasivo-agresivos, logros tipo "Sinergia", microcopys RRHH).

---

## 9. Arquitectura e infraestructura

| Capa | Tecnología | Motivo |
|---|---|---|
| Frontend | **Next.js (App Router) + React + TypeScript** | UI de jugador + landing/guía |
| Tiempo real | **Colyseus** (servidor de juego Node/TS) | `Room` = partida; estado, fases, reconexión |
| Estado de partida | **En memoria por sala** | Partidas cortas; no requiere BD para jugar |
| Persistencia | **Postgres** (fase 2, opcional) | Estadísticas, historial |
| Deploy frontend | **Vercel** | Trivial con Next.js |
| Deploy game server | **Railway o Fly.io** | Colyseus necesita proceso persistente |
| Autenticación | **Ninguna** — código de sala + apodo | Fricción cero |

El estado autoritativo vive en el servidor. Integración con Teams = **solo
instrucciones manuales** (sin API, sin permisos de Azure AD).

---

## 10. Roadmap

| Fase | Entregable |
|---|---|
| **0 — Diseño** | Este GDD ✅ |
| **1 — Esqueleto** | Next.js + Colyseus; lobby con código de sala y avatares |
| **2 — Bucle base** | Una ronda con "Bono Trimestral" (3 fases) + reporte + Influencia |
| **3 — Ronda completa** | Marcador + varias rondas + ritmo + pantalla final |
| **4 — Contenido** | Resto de los 9 desafíos + interludio + Misiones Personales |
| **5 — Pulido** | Estética satírica, onboarding/guía, Modo Anónimo, resumen |
| **6 — Opcional** | Persistencia, estadísticas, ranking entre partidas |

---

## 11. Decisiones abiertas

- [ ] ¿Cuántas rondas exactas y qué desafíos por ronda? ¿Fijo o según nº de jugadores?
- [ ] Regla de desempate en la pantalla final.
- [ ] ¿Algún desafío con webcam?
- [ ] Balance fino de las tablas de puntos de cada desafío.
- [ ] Set definitivo de Misiones Personales (deben contradecirse).
- [ ] Diseño concreto de las consecuencias de Sospecha alta.
