# Traición en la Oficina — Documento de Diseño (GDD)

> Juego web de desafíos sociales **inspirado en *Scam Line***, jugado sobre
> llamadas y reuniones reales de Microsoft Teams. Todos contra todos.

**Versión:** 0.6 (catálogo filtrado para MVP) · **Fecha:** 2026-05-17

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
| **Plataforma** | Web Mobile First (sin instalar nada, sin login) |
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
Los resultados de los desafíos son **auto-reportados**. La web arbitra el
procedimiento, no la verdad. El **puntaje revela la traición sin necesidad de un
cartel**: en una llamada 1-a-1, el resultado (+5, 0, +1…) deja deducir qué hizo
el otro. Así los desafíos grupales pueden "cobrar" lo que pasó en los individuales.

---

## 2. Identidad e Historial

### 2.1 Sin sistema de roles
El juego **no tiene roles** — igual que *Scam Line*. Todos son "empleados"
iguales. La única excepción: **algunos desafíos le dan un secreto a un jugador**
(p. ej. "vos recibiste los datos falsos"), explicado en ese desafío y válido
solo ahí. No es un rol: es un secreto local.

### 2.2 Misión Personal secreta — *POST-MVP*
> **Fuera del MVP** (decisión de Dani: ambigua, mejor no incluirla aún).

A futuro, cada jugador recibiría una Misión Personal secreta persistente con bono
de Influencia, diseñadas para contradecirse entre sí. El modelo de datos ya la
contempla (`personalMissionId`) sin usarla.

### 2.3 Historial de Traiciones
La web no ve Teams, pero **sí ve los resultados reportados**. Tras cada desafío
registra los cambios de Influencia. La UI le muestra a cada jugador **su propio
historial** (cuánto ganó/perdió y contra quién jugó) — material para deducir,
sin editorializar. Es la memoria social de la partida.

---

## 3. Economía y recursos

MVP **minimalista: un solo recurso**.

| Recurso | Visible | Función |
|---|---|---|
| **Influencia Corporativa** | Sí (marcador completo entre rondas) | Puntaje principal. Decide al ganador. |

- Al cerrar cada minijuego se muestra **si tu Influencia subió o bajó**.
- **Sobornos / tratos**: se hacen transfiriendo Influencia directamente.
- **Post-MVP**: *Sospecha* (riesgo de despido) y *Modo Anónimo* (ocultar el
  marcador) quedan documentados como ideas futuras — fuera del MVP por
  simplicidad.

---

## 4. Flujo de partida y ritmo

```
LOBBY → INTRO → [ 5 RONDAS ] → PANTALLA FINAL
```

### 4.1 Estructura de rondas
**5 rondas: 3 grupales + 2 individuales**, intercaladas:

```
Ronda 1   Ronda 2     Ronda 3   Ronda 4     Ronda 5
GRUPAL  → INDIVIDUAL → GRUPAL  → INDIVIDUAL → GRUPAL
```

El intercalado es intencional: **cada desafío grupal "cobra" lo que pasó en el
individual anterior** — los jugadores se echan en cara traiciones, piden favores,
se reprochan y se vengan. Los individuales generan las deudas; los grupales las
saldan en público.

### 4.2 Formatos de desafío
- **1-a-1** — intro + instrucciones y luego una **serie de llamadas 1-a-1**.
- **Grupal** — todos en la reunión grande de Teams. La web indica cuándo armar la
  reunión y cuándo salir.
- **Híbrido** — combina reunión grupal + llamadas 1-a-1 + resolución.

### 4.3 Plantilla de ritmo
> **Tensión alta → Negociación privada → Revelación → Votación → Descanso breve**

### 4.4 Pantalla final
Ranking con títulos satíricos (#1 *Empleado del Mes* … último *En Proceso de
Mejora*) y resumen de partida. **Desempate: votación directa y sin vueltas**
entre los empatados.

---

## 5. Coreografía de llamadas (el switchboard)

- **Varias llamadas por desafío**: un desafío 1-a-1 encadena varias parejas
  ("ahora llamá a Ana… ahora a Beto…"), secuencial o en paralelo.
- **Solo un lado inicia**: a uno le aparece `📞 Llamá a Marcos AHORA`; a Marcos,
  `Marcos te va a llamar` → cero llamadas cruzadas.
- En tandas paralelas, la web empareja a todos a la vez con cronómetro global.
- Con número impar, alguien queda sin pareja en una tanda — se hace explícito.
- **Reunión grupal**: link de Teams fijo por sala + botón "Ya estoy en la sala".

---

## 6. Catálogo de desafíos

Catálogo **filtrado para el MVP**: 6 individuales + 6 grupales. Una partida usa
2 individuales y 3 grupales (§4.1), rotando del pool.

### 6.A — MVP · Desafíos individuales (llamadas 1-a-1)

#### El Botón del Bonus *(Dilema de los Botones)* — **base del roadmap**
- **Formato:** serie de llamadas 1-a-1 en paralelo · **6–8 min** · Marcador público
- **Dinámica:** la web te guía a quién llamar. En cada llamada (~60 s) negociás;
  al colgar, cada uno pulsa en secreto **Compartir** (verde) o **Quedárselo** (rojo).
- **Puntuación:** Verde/Verde → +3 ambos · Rojo vs Verde → +5 / 0 · Rojo/Rojo → +1.

#### Compañero de Proyecto *(Parejas)*
- **Formato:** llamadas 1-a-1 libres · **5–6 min** · Marcador oculto
- **Dinámica:** tanda de llamadas para pactar; luego cada uno elige en secreto a
  un jugador. Solo puntúa la elección **mutua**.
- **Puntuación:** elección mutua → +X ambos · no correspondida → 0.

#### Tu Cargo Real *(Símbolo Oculto)*
- **Formato:** serie de llamadas 1-a-1 · **8–10 min** · Marcador oculto
- **Dinámica:** cada jugador ve el "cargo" de los demás **pero no el suyo**.
  Llamás a varios para que te lo digan; pueden decir verdad o mentir.
- **Puntuación:** +X si al final acertás tu propio cargo.

#### El Catering Sospechoso *(Botellas Envenenadas)*
- **Formato:** llamadas 1-a-1 + paso secuencial · **6–8 min** · Marcador oculto
- **Dinámica:** llega una bandeja con varias tazas; una está "en mal estado".
  Elegís una y la bandeja pasa; sabés si la tuya era segura y podés avisar o
  **mentir** sobre las restantes.
- **Puntuación:** taza segura → +X · taza "en mal estado" → golpe de Influencia.

#### La Filtración Controlada *(juego de la palabra — nuevo)*
- **Formato:** serie de llamadas 1-a-1 en paralelo · **6–8 min** · Marcador oculto
- **Dinámica:** cada jugador recibe **su propia palabra secreta**. En llamadas
  elegís a quién filtrársela (con pistas) e intentás adivinar las ajenas. Al
  cierre, cada uno marca su intento por jugador.
- **Puntuación:** por *tu* palabra → +X si la adivina **exactamente uno**; menos
  si se difundió a varios; 0 si nadie. Por adivinar la palabra de otro → +X.
- *Traición: te filtran su palabra confiando en vos — podés guardártela o
  difundirla para sumar vos y arruinarle el puntaje.*

#### El Tablero SCRUM *(nuevo — pedido de Dani)*
- **Formato:** llamadas 1-a-1 libres · **7–9 min** · Marcador oculto
- **Dinámica:** cada jugador arranca con tarjetas de tareas. Cada tarjeta vale
  Influencia (positiva, o negativa = "deuda técnica"); **solo el dueño ve el
  valor real**. Por llamadas se intercambian tarjetas negociando y mintiendo
  sobre cuánto valen.
- **Puntuación:** al cierre, tu Influencia = suma de los valores reales de las
  tarjetas que te quedaron. *Traición: encajarle deuda técnica a otro.*
- *Propuesta abierta: era "algo de PROD o tablero SCRUM"; este es el SCRUM. Una
  variante grupal de PROD ("El Deploy del Viernes") queda en el backlog.*

### 6.B — MVP · Desafíos grupales (reunión de Teams)

#### Email Filtrado *(whodunit de info asimétrica — híbrido)*
- **Formato:** híbrido · **10–15 min** · **Secreto:** un jugador es el saboteador
- **Dinámica:** ① lectura privada de fragmentos de mails (1 min) → ② debate
  grupal (5 min) → ③ llamadas 1-a-1 para alianzas (2 min) → ④ acusación / voto.
- **Puntuación:** aciertan al culpable → +15 a quienes votaron bien · saboteador
  no descubierto → +25.

#### El Recorte *(votación / sacrificio)*
- **Formato:** reunión grupal · **7 min** · Marcador oculto
- **Dinámica:** ① "Crisis anunciada" (30 s) → ② debate, defensas y acusaciones
  (4 min) → ③ voto secreto (30 s). Sin evidencia objetiva: todo es social.
- **Puntuación:** el más votado **pierde Influencia — no es eliminado**.

#### El Reconocimiento del Mes *(Regala un Osito)*
- **Formato:** reunión grupal · **5 min** · Marcador público
- **Dinámica:** un jugador al azar (el "jefe") tiene un punto para regalar; todos
  lo lobbean por voz (4 min) → el jefe elige destinatario.
- **Puntuación:** el destinatario elegido → +X.

#### Votación de Reconocimiento *(Votación Amable)*
- **Formato:** reunión grupal · **6 min** · Marcador público
- **Dinámica:** espejo positivo de El Recorte. Debate sobre quién merece el
  premio — se echan en cara traiciones pasadas (4 min) → voto. El más votado gana.
- **Puntuación:** el más votado → +X.

#### La Auditoría Sorpresa *(Ruleta Rusa — reskin)*
- **Formato:** reunión grupal · **6–8 min** · Marcador oculto
- **Dinámica:** circula una carpeta de auditoría; quien la recibe se la queda
  (arriesga) o la pasa. Un evento azaroso de probabilidad **creciente** cae sobre
  quien la tenga. Negociación grupal en vivo.
- **Puntuación:** sobrevivir sin recibir el evento → +X · recibirlo → pérdida.

#### El Marrón *(Hot Potato — reskin)*
- **Formato:** reunión grupal · **4–5 min** · Marcador público
- **Dinámica:** aparece una "tarea urgente"; se pasa tocando a otro jugador. En
  un momento aleatorio "vence" y queda **eliminado solo dentro de este minijuego**
  quien la tenga, hasta sacar a la mitad.
- **Puntuación:** sobrevivir → +X.
- *Nota: el más cercano a un juego de reflejos; usar como caos puntual.*

### 6.C — Backlog post-MVP
Desafíos diseñados pero **fuera del MVP**, para sumar después:
- *Individuales:* Encontrar Departamentos, Pizarrón de Brainstorming, El Deadline.
- *Grupales:* Bono Trimestral *(dinámica a rediscutir)*, Reunión de Status,
  El Impostor del Dress Code *(reformatearlo a llamadas, no 100 % grupal)*,
  ¿Salimos a Fumar? *(definir la comunicación adentro/afuera)*, Votación
  Corporativa, Recortes de Presupuesto.
- *Otros:* Fase de Pasillo (interludio), El Deploy del Viernes (variante grupal
  del juego de PROD).

### 6.D — Lo que NO es minijuego (es el motor)
- **Alianzas** — emergen solas; comportamiento, no reglas.
- **Pairing / emparejador** — es el switchboard (§5).
- **Detección de mentiras / manipulación** — habilidades transversales.
- **Historial de Traiciones** — la memoria social de la partida (§2.3).

---

## 7. Condición de victoria

Tras la última ronda, **gana quien más Influencia Corporativa acumula**. El #1 es
el **Empleado del Mes**. Empate → **votación directa** entre los empatados.

---

## 8. Interfaz y avatares

- **Concepto visual:** la web se disfraza de **suite de apps corporativas**
  ("SINERGIA CORP"), no simula una oficina. Detalle en
  [UI-borradores.md](UI-borradores.md).
- **Avatares**: personas de oficina satíricas.
- **Pantallas (una por fase)**: `Lobby → Briefing → Llamadas 1-a-1 / Reunión →
  Resolución → Marcador → Final`.
- **HUD minimalista**: solo Influencia.
- **Estilo**: app de productividad "demasiado pulida"; el humor en los textos.

---

## 9. Arquitectura e infraestructura

Resumen — detalle en [arquitectura.md](arquitectura.md).

| Capa | Tecnología |
|---|---|
| Frontend | Next.js + React + TypeScript (Mobile First) |
| Tiempo real | Colyseus (servidor de juego Node/TS) |
| Estado de partida | En memoria por sala |
| Deploy | Vercel (web) + Railway/Fly.io (game server) |
| Autenticación | Ninguna — código de sala + `playerToken` |

Estado autoritativo en el servidor. Integración con Teams = solo instrucciones
manuales.

---

## 10. Roadmap

| Fase | Entregable |
|---|---|
| **0 — Diseño** | Documentos de diseño ✅ |
| **1 — Esqueleto** | Next.js + Colyseus; lobby con código de sala y avatares |
| **2 — Bucle base** | Una ronda con **El Botón del Bonus** + reporte + Influencia |
| **3 — Ronda completa** | Marcador + las 5 rondas intercaladas + pantalla final |
| **4 — Contenido** | Resto del catálogo MVP (12 desafíos) |
| **5 — Pulido** | Estética satírica, onboarding/guía, resumen |
| **6 — Post-MVP** | Backlog (§6.C), Misión Personal, Sospecha, estadísticas |

---

## 11. Decisiones abiertas

- [ ] Balance fino de las tablas de puntos (los valores X) de cada desafío.
- [ ] Set de palabras de "La Filtración Controlada" y de tarjetas de "El Tablero
      SCRUM".
- [ ] ¿Cómo se eligen los 5 desafíos concretos de cada partida (azar del pool,
      o secuencia fija para el MVP)?
- [ ] Detalle de la comunicación en grupales con sub-tandas de llamadas.

### Decisiones cerradas (filtro de Dani)
- ✅ Catálogo MVP: 6 individuales + 6 grupales (§6.A / §6.B).
- ✅ 5 rondas: 3 grupales + 2 individuales, intercaladas (§4.1).
- ✅ Desempate: votación directa.
- ✅ Sin Misión Personal y sin Sospecha en el MVP.
- ✅ Base de construcción: El Botón del Bonus.
