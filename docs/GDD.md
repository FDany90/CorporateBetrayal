# Traición en la Oficina — Documento de Diseño (GDD)

> Juego web de desafíos sociales **inspirado en *Scam Line***, jugado sobre
> llamadas y reuniones reales de Microsoft Teams. Todos contra todos.

**Versión:** 0.5 (borrador de diseño) · **Fecha:** 2026-05-16

---

## 1. Visión general

| Campo | Definición |
|---|---|
| **Género** | Desafíos sociales / engaño y manipulación (free-for-all) |
| **Inspiración** | *Scam Line* — competencia psicológica por teléfono |
| **Jugadores** | 7–12 por partida |
| **Duración** | 40–60 min |
| **Estructura** | Todos contra todos — **gana quien más Influencia acumula** |
| **Eliminación** | Ninguna permanente — todos juegan todas las rondas |
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
tiempos y muestra consecuencias**.

> Filtro: si un desafío se gana con reflejos o destreza en vez de leer y engañar
> personas, está en tensión con el núcleo. El juego es información asimétrica ·
> presión social · paranoia · negociación · traición · comunicación limitada.

### El principio del "switchboard de confianza"
Los resultados de los desafíos son **auto-reportados**. Si dos jugadores
reportan versiones contradictorias, la web no decide quién miente: convierte la
contradicción en información pública o en Sospecha. Arbitra el procedimiento,
no la verdad.

---

## 2. Misión Personal e Historial

### 2.1 Sin sistema de roles
El juego **no tiene roles** — igual que *Scam Line*. No hay nada que memorizar
ni clases de jugador. Todos son "empleados" iguales.

La única excepción: **algunos desafíos puntuales le dan un secreto a un
jugador** (p. ej. "vos recibiste los datos falsos"). Eso se explica en las
instrucciones de ese desafío, vale solo para ese desafío y no es un "rol": es un
secreto local. Mantiene la entrada al juego simple.

### 2.2 Misión Personal secreta (persistente)
Cada jugador recibe al inicio **una Misión Personal secreta** que dura toda la
partida y da un bono de Influencia al cumplirse. Se revela en la pantalla final.

> **Regla clave:** las Misiones Personales se diseñan para **contradecirse entre
> sí** (ej.: "protegé a Finanzas" vs. "hacé despedir a Finanzas").

Ejemplos: *El Trepa* (terminá en el podio) · *El Topo de IT* (ocultá tu área
toda la partida) · *El Farsante* (hacé creer a 3 jugadores un cargo falso) ·
*El Rencoroso* (lográ que un jugador asignado sea amonestado) · *El Networker*
(jugá una llamada 1-a-1 con cada jugador) · *El Honesto Imposible* (ganá un
desafío sin mentir).

### 2.3 Historial de Traiciones
La web no ve Teams, pero **sí ve los resultados reportados**. Tras cada desafío
registra y muestra un historial: *"En el Bono Trimestral, Marcos te traicionó"*.
Da munición concreta para las discusiones y hace que la reputación pese de
desafío en desafío. Es la memoria social de la partida.

---

## 3. Economía y recursos

Sistema **minimalista: 2 recursos personales**.

| Recurso | Visible | Función |
|---|---|---|
| **Influencia Corporativa** | Según el desafío/modo | Puntaje principal. Decide al ganador. |
| **Sospecha** | Sí | Riesgo de despido. Sube al mentir y ser pillado, al ser acusado, al actuar raro. |

- **Sobornos / tratos**: se hacen transfiriendo Influencia directamente.
- **Reputación y Confianza**: existen de forma **narrativa** (en la voz y en el
  Historial de Traiciones), sin barra.

### 3.1 Visibilidad del marcador
La visibilidad de la Influencia es **por desafío**: algunos muestran el puntaje
en tiempo real (p. ej. El Botón del Bonus), otros lo ocultan.
- **Modo Anónimo** (opción de partida): oculta toda la Influencia hasta el final.
- Sin Modo Anónimo: marcador global **semi-oculto** (posiciones, no cifras).

---

## 4. Flujo de partida y ritmo

```
LOBBY → INTRO + REPARTO DE MISIÓN → [ RONDA × 4–6 ] → PANTALLA FINAL
```

### 4.1 Formatos de desafío
Cada desafío es de **uno** de estos formatos — no todos usan reunión grupal:

- **1-a-1** — la web da intro + instrucciones y luego guía una **serie de
  llamadas 1-a-1** (no una sola). Sin reunión grupal.
- **Grupal** — todos en la reunión grande de Teams. La web indica **cuándo
  armar la reunión y cuándo salir**.
- **Híbrido** — combina fases: reunión grupal + tanda de llamadas 1-a-1 +
  resolución. La web va indicando cada transición.

La web siempre dice explícitamente qué hacer ("entrá a la reunión grupal",
"salí de la reunión y llamá a Ana", "votá").

### 4.2 Plantilla de ritmo
Cada ronda alterna energía:
> **Tensión alta → Negociación privada → Revelación → Votación → Descanso breve**

### 4.3 Pantalla final
Ranking con títulos satíricos (#1 *Empleado del Mes* … último *En Proceso de
Mejora*), revelación de Misiones Personales y sus bonos, y resumen de partida
(mejor mentira, traición más rentable, etc.).

---

## 5. Coreografía de llamadas (el switchboard)

- **Varias llamadas por desafío**: un desafío 1-a-1 no es una sola llamada — la
  web encadena varias parejas ("ahora llamá a Ana… ahora a Beto…"), de forma
  secuencial o en paralelo según el desafío. Así se generan muchas conversaciones
  en un mismo desafío (como en *Scam Line*).
- **Solo un lado inicia**: a uno le aparece `📞 Llamá a Marcos AHORA`; a Marcos,
  `Marcos te va a llamar`. → cero llamadas cruzadas.
- En tandas paralelas, la web empareja a todos a la vez con cronómetro global,
  evitando repetir parejas.
- Con número impar, **alguien queda sin pareja** en una tanda: se hace explícito
  — el aislamiento genera sospecha (intencional).
- **Reunión grupal**: link de Teams fijo por sala + botón "Ya estoy en la sala"
  con contador; con quórum se desbloquea la fase grupal.

---

## 6. Catálogo de desafíos

19 desafíos puntuados + 1 interludio, adaptados de *Scam Line*. Cada uno indica
**formato**, **duración**, **dinámica con tiempos** y **puntuación**. Una partida
usa solo una selección por vez (ver §11).

### 6.A — Desafíos de llamada 1-a-1

#### A1 · El Botón del Bonus *(Dilema de los Botones)*
- **Formato:** serie de llamadas 1-a-1 en paralelo (round-robin) · **6–8 min**
- **Marcador:** público en tiempo real
- **Dinámica:** la web te guía a quién llamar. En cada llamada (~60 s) hablás,
  pactás o engañás; al colgar, cada uno pulsa en secreto **Verde** o **Rojo**.
  Se repite con varias parejas distintas.
- **Puntuación:** Verde/Verde → +3 ambos · Rojo vs Verde → +5 al rojo, 0 al
  otro · Rojo/Rojo → +1 ambos.

#### A2 · Encontrar Departamentos *(Room Number Discovery)*
- **Formato:** serie de llamadas 1-a-1 · **8–10 min** · **Marcador:** oculto
- **Dinámica:** cada jugador tiene un **área secreta** (Finanzas, IT, RRHH…).
  En llamadas sucesivas hay que sonsacar las áreas ajenas y ocultar la propia.
- **Puntuación:** +X por cada área ajena correctamente identificada al cierre;
  −X si revelaste la tuya y otro la acertó.

#### A3 · Tu Cargo Real *(Símbolo Oculto)*
- **Formato:** serie de llamadas 1-a-1 · **8–10 min** · **Marcador:** oculto
- **Dinámica:** cada jugador ve el "cargo" de los demás **pero no el suyo**.
  Llamás a varios para que te lo digan; pueden decir verdad o mentir. Conviene
  cruzar fuentes y confiar según el Historial de Traiciones.
- **Puntuación:** +X si al final acertás tu propio cargo.

#### A4 · El Catering Sospechoso *(Botellas Envenenadas)*
- **Formato:** llamadas 1-a-1 + paso secuencial · **6–8 min** · **Marcador:** oculto
- **Dinámica:** llega una bandeja con varias tazas; una está "en mal estado".
  Elegís una y la bandeja pasa al siguiente. Sabés si la tuya era segura; entre
  paso y paso podés llamar a otros para avisar o **mentir** sobre las restantes.
- **Puntuación:** taza segura → +X · taza "en mal estado" → golpe de Influencia
  y +Sospecha (sin eliminación).

#### A5 · Compañero de Proyecto *(Parejas)*
- **Formato:** llamadas 1-a-1 libres · **5–6 min** · **Marcador:** oculto
- **Dinámica:** tanda de llamadas libres para pactar; luego cada uno elige en
  secreto a un jugador. Solo puntúa la elección **mutua**.
- **Puntuación:** elección mutua → +X ambos · no correspondida → 0.

#### A6 · Pizarrón de Brainstorming *(Caballete)*
- **Formato:** llamadas 1-a-1 libres + lienzo en la web · **6–8 min**
- **Marcador:** público al final
- **Dinámica:** cada uno bosqueja una "idea" en un lienzo simple. Mientras se
  dibuja, llamadas libres para mentir o coordinar sobre quién dibujó qué. Luego
  cada jugador asigna autor a cada dibujo.
- **Puntuación:** +X por cada autoría adivinada correctamente.
- *Nota: el más liviano del catálogo; usar como cambio de ritmo.*

#### A7 · El Deadline *(Símbolos / Pinchos)*
- **Formato:** serie de llamadas 1-a-1, contrarreloj · **5–7 min**
- **Marcador:** oculto
- **Dinámica:** cada jugador tiene un dato; armar el "reporte" correcto exige
  combinar datos ajenos llamando a varios **antes de que venza el deadline**
  (cuenta regresiva visible). La urgencia es presión, no reflejos.
- **Puntuación:** reporte correcto a tiempo → +X · incompleto → pérdida de
  Influencia.

### 6.B — Desafíos de reunión grupal

#### G1 · Bono Trimestral *(Prisoner's Dilemma grupal — híbrido)*
- **Formato:** híbrido 3 fases · **8–10 min** · **Marcador:** oculto
- **Dinámica:** ① negociación grupal en Teams (2 min) → ② tanda de llamadas
  1-a-1 para conspirar (1 min) → ③ voto secreto en la web *Compartir bonus* /
  *Apropiarse*.
- **Puntuación:** todos cooperan → +10 c/u · uno se apropia → +25 él, −10 al
  resto · todos se apropian → 0.

#### G2 · Email Filtrado *(whodunit de info asimétrica — híbrido)*
- **Formato:** híbrido · **10–15 min**
- **Secreto:** un jugador es, en secreto, el **saboteador** · **Marcador:** oculto
- **Dinámica:** ① lectura privada de fragmentos de mails (1 min) → ② debate
  grupal en Teams (5 min) → ③ tanda de llamadas 1-a-1 para alianzas (2 min) →
  ④ acusación final / voto (1 min). Nadie tiene la verdad completa.
- **Puntuación:** aciertan al culpable → +15 a quienes votaron bien · el
  saboteador no descubierto → +25.

#### G3 · Reunión de Status *(detección de mentiras)*
- **Formato:** reunión grupal · **8 min**
- **Secreto:** a un jugador se le dan datos falsos / debe mentir
- **Dinámica:** ① preparación (30 s) → ② daily meeting: cada uno reporta sus
  KPIs por voz (4 min) → ③ voto (1 min).
- **Puntuación:** detectan al mentiroso → +10 a quienes votaron bien · el
  mentiroso no descubierto → +20.

#### G4 · El Recorte *(votación / sacrificio)*
- **Formato:** reunión grupal · **7 min** · **Marcador:** oculto
- **Dinámica:** ① "Crisis anunciada" generada por la web (30 s) → ② debate,
  defensas y acusaciones (4 min) → ③ voto secreto (30 s). Sin evidencia
  objetiva: todo es social.
- **Puntuación:** el más votado **pierde Influencia y sube Sospecha — no es
  eliminado**.

#### G5 · El Impostor del Dress Code *(Guess the Different Outfit)*
- **Formato:** reunión grupal · **7–8 min**
- **Secreto:** 1–2 jugadores tienen un dato distinto (credencial/cargo/badge falso)
- **Dinámica:** ① reparto de tarjetas (30 s) → ② ronda de preguntas grupales
  para detectar al desalineado (5 min) → ③ voto (1 min).
- **Puntuación:** el grupo acierta al impostor → +X · impostor no descubierto → +X.

#### G6 · ¿Salimos a Fumar? *(Las Puertas — paridad)*
- **Formato:** reunión grupal con sub-grupos · **5–6 min** · **Marcador:** público
- **Dinámica:** cada jugador decide en secreto **salir** del pasillo o
  **quedarse**. Si el número de los que salen es **impar**, todos ganan punto.
  Hay negociación previa por voz; los que salen quedan en una sala aparte y solo
  hablan entre ellos (asimetría de información).
- **Puntuación:** cantidad de "salidos" impar → +X a todos · par → 0.

#### G7 · Votación Corporativa *(Red or Green + Majority)*
- **Formato:** reunión grupal · **5–6 min** · **Marcador:** público
- **Dinámica:** decisión colectiva binaria (aprobar/rechazar un recorte). Debate
  (3 min) → voto simultáneo. El pago depende del resultado **agregado**.
- **Puntuación:** depende de la mayoría — premia a quien votó con (o contra) el
  resultado ganador, según la variante.

#### G8 · Recortes de Presupuesto *(recurso escaso)*
- **Formato:** reunión grupal · **8–10 min** · **Marcador:** oculto
- **Dinámica:** un pozo limitado que no alcanza para todos. Debate y negociación
  (6 min) → cada uno reclama en secreto una porción. Si lo reclamado supera el
  pozo, se reparte penalizando a los más ambiciosos.
- **Puntuación:** +X según la porción obtenida; sobre-reclamar puede dar 0.

#### G9 · El Reconocimiento del Mes *(Regala un Osito)*
- **Formato:** reunión grupal · **5 min** · **Marcador:** público
- **Dinámica:** un jugador al azar (el "jefe") tiene un punto para regalar.
  Todos lo lobbean por voz (4 min) → el jefe elige destinatario.
- **Puntuación:** el destinatario elegido → +X.

#### G10 · Votación de Reconocimiento *(Votación Amable)*
- **Formato:** reunión grupal · **6 min** · **Marcador:** público
- **Dinámica:** espejo positivo de El Recorte. Debate donde se discute quién
  merece el premio — y se echan en cara traiciones pasadas (Historial) (4 min)
  → voto. El más votado gana.
- **Puntuación:** el más votado → +X.

#### G11 · La Auditoría Sorpresa *(Ruleta Rusa — reskin)*
- **Formato:** reunión grupal · **6–8 min** · **Marcador:** oculto
- **Dinámica:** circula una carpeta de auditoría. Quien la recibe decide
  quedársela (arriesgarse) o pasarla a otro jugador. Un evento azaroso de
  probabilidad **creciente** "cae" sobre quien la tenga. Negociación grupal en
  vivo. *(Reskin obligado del tema "arma" — no apto oficina.)*
- **Puntuación:** sobrevivir sin recibir el evento → +X · recibirlo → pérdida de
  Influencia.

#### G12 · El Marrón *(Hot Potato — reskin)*
- **Formato:** reunión grupal · **4–5 min** · **Marcador:** público
- **Dinámica:** aparece una "tarea urgente"; se pasa haciendo click en otro
  jugador. En un momento aleatorio "explota" (vence) y queda **eliminado solo
  dentro de este minijuego** quien la tenga, hasta sacar a la mitad.
- **Puntuación:** sobrevivir → +X.
- *Nota: el más cercano a un juego de reflejos; usar como caos puntual.*

### 6.C — Interludio (no puntuado)
**Fase de Pasillo** *(One-on-One)* — 5–6 min. Entre desafíos grandes, la web
abre una tanda de llamadas 1-a-1 en paralelo de negociación libre (alianzas,
promesas, info). Sin puntaje propio: tejido conectivo y respiro de ritmo. El que
queda sin pareja sufre el aislamiento.

### 6.D — Lo que NO es minijuego (es el motor)
- **Alianzas** — emergen solas; comportamiento, no reglas.
- **Pairing / emparejador** — es el switchboard (§5).
- **Detección de mentiras / manipulación** — habilidades transversales,
  presentes en todos los desafíos.
- **Misión Personal** — la agenda oculta persistente (§2.2).
- **Historial de Traiciones** — la memoria social de la partida (§2.3).

---

## 7. Condición de victoria

Tras la última ronda, **gana quien más Influencia Corporativa acumula** (incluido
el bono por Misión Personal). El #1 es el **Empleado del Mes**.

---

## 8. Interfaz y avatares

- **Avatares**: personas de oficina satíricas, personalizables (*el Becario
  eterno*, *la Reina del Excel*, etc.).
- **Pantallas (una por fase)**: `Lobby → Intro/Misión → Briefing de Desafío →
  Llamadas 1-a-1 / Reunión Grupal → Resolución → Marcador → Final`.
- **Tarjeta de Llamada**: a quién llamar, instrucción `📞 Llamá a Marcos por
  Teams`, tu secreto/objetivo (si el desafío lo da), botón "Estamos en llamada"
  + cronómetro, formulario de "Reportar resultado".
- **HUD minimalista**: solo Influencia (según el desafío) y Sospecha.
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

El estado autoritativo vive en el servidor (los clientes mienten, el servidor no
se fía del cliente). Integración con Teams = **solo instrucciones manuales**.

---

## 10. Roadmap

| Fase | Entregable |
|---|---|
| **0 — Diseño** | Este GDD ✅ |
| **1 — Esqueleto** | Next.js + Colyseus; lobby con código de sala y avatares |
| **2 — Bucle base** | Una ronda con "Bono Trimestral" (3 fases) + reporte + Influencia |
| **3 — Ronda completa** | Marcador + ritmo + varias rondas + pantalla final |
| **4 — Contenido** | Resto del catálogo + Misiones Personales + Historial |
| **5 — Pulido** | Estética satírica, onboarding/guía, Modo Anónimo, resumen |
| **6 — Opcional** | Persistencia, estadísticas, ranking entre partidas |

---

## 11. Decisiones abiertas

- [ ] ¿Cuántas rondas exactas y qué desafíos por ronda? ¿Fijo o según nº de jugadores?
- [ ] Selección del subconjunto de desafíos por partida (no se usan los 19).
- [ ] Regla de desempate en la pantalla final.
- [ ] Balance fino de las tablas de puntos (los valores X) de cada desafío.
- [ ] Set definitivo de Misiones Personales (deben contradecirse).
- [ ] Consecuencias concretas de Sospecha alta.
- [ ] Destino final del A6 Pizarrón y el G12 El Marrón (los dos "⚠️ a medias").
