# Traición en la Oficina — Borradores de Pantalla (UI)

> Bocetos de baja fidelidad (wireframes en ASCII) para discutir **estructura y
> flujo**, no estética. Acompaña al [GDD](GDD.md) y al
> [Modelo de Datos](modelo-datos.md).

**Versión:** 0.2 · **Fecha:** 2026-05-17

---

## 0. Alcance de estos borradores (MVP)

| Decisión | En el MVP |
|---|---|
| Recursos | **Solo Influencia Corporativa**. Sin Sospecha, sin Reputación. |
| Misión Personal | **Fuera del MVP**. El modelo de datos la contempla a futuro. |
| Resultados | Se muestra **el cambio de Influencia** y tu propia decisión. **Nunca** la decisión ajena ni "Fulano te traicionó". |
| Modo Anónimo | Fuera del MVP. El marcador se muestra normal y completo. |
| Plataforma | **Mobile First** — diseñado para celular; responsive a desktop después. |

> **Por qué Mobile First:** muchas redes corporativas bloquean sitios web en sus
> equipos → el celular del jugador es el dispositivo más confiable. Además, a
> futuro se piensa integrar las llamadas dentro del juego, y eso vive mejor en
> mobile.

---

## 1. Concepto visual: la suite de apps corporativas

La web **no simula una oficina** (Teams ya pone las caras y las voces; simular
presencia sería redundante y caro). En cambio, la web se disfraza de **software
de empresa**: una intranet corporativa ficticia.

### 1.1 La empresa ficticia
La partida transcurre dentro de **"SINERGIA CORP"** (nombre satírico, por
defecto; a futuro el creador de la sala podría ponerle el suyo). Todo el humor
vive en los textos: comunicados de RRHH, jerga, microcopys pasivo-agresivos.

### 1.2 El shell (marco constante)
Todas las pantallas comparten un marco fijo y el contenido cambia de "app":

```
┌──────────────────────────────────┐
│ ☰  SINERGIA CORP          💼 46   │  ← shell: marca + Influencia
├──────────────────────────────────┤
│  PORTAL RRHH · Comunicado         │  ← nombre de la "app" activa
│  ································  │
│                                   │
│   [ contenido del minijuego ]     │
│                                   │
│  ································  │
│   [   ACCIÓN PRINCIPAL   ]        │  ← un botón grande, abajo (mobile)
└──────────────────────────────────┘
```

### 1.3 Skins de app (reutilización)
En vez de 19 diseños únicos, hay **~6 "skins" de app**. Cada minijuego elige una.
Esto se enchufa con el `config` del [modelo de datos](modelo-datos.md).

| Skin de app | Minijuegos que la usan |
|---|---|
| **Bandeja de Correo** | Email Filtrado, La Filtración Controlada |
| **Portal de RRHH** | El Recorte, Votación de Reconocimiento, El Reconocimiento del Mes, El Impostor del Dress Code, Tu Cargo Real |
| **Sistema de Aprobaciones** | El Botón del Bonus, Bono Trimestral, Votación Corporativa, ¿Salimos a Fumar? |
| **Panel de Finanzas** | Recortes de Presupuesto, El Catering Sospechoso |
| **Gestor de Tareas / KPIs** | El Deadline, El Marrón, Reunión de Status |
| **Pizarra Colaborativa** | Pizarrón de Brainstorming, Encontrar Departamentos |

Una skin define colores, íconos y encabezado; la **estructura** (shell + fases)
es siempre la misma → escala sin rediseñar.

---

## 2. Componentes reutilizables

- **Shell** — barra superior (marca + Influencia) + encabezado de app + zona de
  acción inferior. Siempre presente.
- **Lista de jugadores** — 3 modos: *informativa*, *seleccionable* (votar),
  *de estado* (quién terminó). Se muestra **solo cuando el desafío la necesita**.
- **Cronómetro** — barra + cuenta regresiva, sincronizado por el servidor.
- **Panel de decisión** — según tipo: 2 botones / lista seleccionable / número.
- **Panel de resultado** — el cambio de Influencia, sin editorializar.

---

## 3. Pantallas comunes

### 3.1 Lobby — alta en la empresa
```
┌──────────────────────────────────┐
│  SINERGIA CORP · Intranet         │
├──────────────────────────────────┤
│  Bienvenido al equipo.            │
│  Sala  KPXZT       Plantilla 8/12 │
│  ································  │
│  ▸ Ana            ✓ operativo     │
│  ▸ Beto           ✓ operativo     │
│  ▸ Caro           · ingresando…   │
│  ▸ Dani  (vos)    ✓ operativo     │
│  ▸ Elena          ✓ operativo     │
│  ▸ Fede           · conectando…   │
│  ▸ Gastón         ✓ operativo     │
│  ▸ Inés           ✓ operativo     │
├──────────────────────────────────┤
│      [   FICHAR ENTRADA   ]       │
└──────────────────────────────────┘
```
- Se entra con **código de sala** + apodo + avatar (pantalla previa).

### 3.2 Marcador (entre rondas) — lista completa
```
┌──────────────────────────────────┐
│ ☰  SINERGIA CORP          💼 46   │
├──────────────────────────────────┤
│  RANKING · fin de la Ronda 2      │
│  ································  │
│   1.  Ana           58   ▲        │
│   2.  Dani  (vos)   46   ▲        │
│   3.  Gastón        44   ▬        │
│   4.  Elena         39   ▲        │
│   5.  Inés          33   ▼        │
│   6.  Beto          31   ▼        │
│   7.  Caro          28   ▬        │
│   8.  Fede          25   ▼        │
│  ································  │
│      [   SIGUIENTE RONDA   ]      │
└──────────────────────────────────┘
```
- **Lista completa** de los 8. ▲▬▼ = subió/bajó respecto de la ronda anterior.

---

## 4. Ejemplo INDIVIDUAL — El Botón del Bonus

Skin: **Sistema de Aprobaciones**. Serie de llamadas 1-a-1. 5 pantallas.

### 4.1 Briefing
```
┌──────────────────────────────────┐
│ ☰  SINERGIA CORP          💼 34   │
├──────────────────────────────────┤
│  APROBACIONES · Bono del Equipo   │
│  ································  │
│  Vas a revisar el bono con varios │
│  colegas por llamada. Al cerrar   │
│  cada llamada, en secreto:        │
│                                   │
│   🟢 Compartir + 🟢 Compartir →+3 │
│   🔴 Quedármelo vs 🟢      → +5/0 │
│   🔴 Quedármelo + 🔴       →+1    │
│  ································  │
│      [   COMENZAR   ]             │
└──────────────────────────────────┘
```

### 4.2 Tarjeta de llamada
```
┌──────────────────────────────────┐
│ ☰  SINERGIA CORP          💼 34   │
├──────────────────────────────────┤
│  APROBACIONES · Llamada 2 de 5    │
│  ································  │
│        📞  LLAMAR A BETO          │
│           por Teams, ahora        │
│                                   │
│              ▸ Beto               │
│  ································  │
│   [   ESTAMOS EN LLAMADA   ]      │
└──────────────────────────────────┘
```
- A Beto le aparece `Beto: te va a llamar Dani` → solo uno inicia.

### 4.3 En llamada (cronómetro)
```
┌──────────────────────────────────┐
│ ☰  SINERGIA CORP          💼 34   │
├──────────────────────────────────┤
│  APROBACIONES · en llamada        │
│  ································  │
│           ⏱ 01:00                 │
│       ▓▓▓▓▓▓▓▓▓▓░░░░░░            │
│                                   │
│  Negociá. Prometé. Mentí.         │
│  Al terminar, vas a decidir.      │
└──────────────────────────────────┘
```

### 4.4 Tu decisión (binaria secreta)
```
┌──────────────────────────────────┐
│ ☰  SINERGIA CORP          💼 34   │
├──────────────────────────────────┤
│  APROBACIONES · Dictamen          │
│  ································  │
│  Bono de la llamada con Beto:     │
│                                   │
│   ┌────────────┐  ┌────────────┐  │
│   │ 🟢         │  │ 🔴         │  │
│   │ COMPARTIR  │  │ QUEDÁRMELO │  │
│   └────────────┘  └────────────┘  │
│  ································  │
│  Secreto. Beto no ve tu elección. │
└──────────────────────────────────┘
```

### 4.5 Resultado de la llamada
```
┌──────────────────────────────────┐
│ ☰  SINERGIA CORP          💼 39   │
├──────────────────────────────────┤
│  APROBACIONES · Resultado         │
│  ································  │
│   Influencia   34 → 39   (+5)     │
│                                   │
│   Vos elegiste 🔴 Quedártelo.     │
│   Sacá tus conclusiones de Beto.  │
│  ································  │
│   [   SIGUIENTE LLAMADA   ]       │
└──────────────────────────────────┘
```
- Muestra **tu cambio de Influencia** y **tu** elección — nunca la de Beto. El
  número (+5) deja que vos lo deduzcas.

### 4.6 Cierre del desafío (resultados parciales)
```
┌──────────────────────────────────┐
│ ☰  SINERGIA CORP          💼 46   │
├──────────────────────────────────┤
│  APROBACIONES · Cierre del bono   │
│  ································  │
│   Tus 5 llamadas:                 │
│     vs Ana      +3                │
│     vs Beto     +5                │
│     vs Caro      0                │
│     vs Elena    +1                │
│     vs Fede     +3                │
│   ─────────────────               │
│   Total   +12      34 → 46        │
│  ································  │
│      [   CONTINUAR   ]            │
└──────────────────────────────────┘
```

---

## 5. Ejemplo GRUPAL — El Recorte

Skin: **Portal de RRHH**. Reunión grupal con votación. 5 pantallas.

### 5.1 Briefing + entrada a la reunión
```
┌──────────────────────────────────┐
│ ☰  SINERGIA CORP          💼 46   │
├──────────────────────────────────┤
│  PORTAL RRHH · Comunicado         │
│  ································  │
│  ⚠ AJUSTE DE PLANTILLA — Q3       │
│                                   │
│  Dirección debe amonestar a un    │
│  empleado. Defendete, acusá y     │
│  negociá. Después se vota.        │
│  ································  │
│  [  ENTRAR A LA REUNIÓN ▸ Teams ] │
└──────────────────────────────────┘
```

### 5.2 Sala de espera (quórum)
```
┌──────────────────────────────────┐
│  PORTAL RRHH · Reunión            │
│  [ 🎦 Abrir reunión en Teams ]    │
├──────────────────────────────────┤
│  En la sala   6 / 8               │
│                                   │
│  ✓ Ana    ✓ Beto   ✓ Dani         │
│  ✓ Elena  ✓ Gastón ✓ Inés         │
│  · Caro   · Fede                  │
├──────────────────────────────────┤
│  El debate arranca con todos.     │
└──────────────────────────────────┘
```

### 5.3 Debate (cronómetro)
```
┌──────────────────────────────────┐
│ ☰  SINERGIA CORP          💼 46   │
├──────────────────────────────────┤
│  PORTAL RRHH · Debate             │
│  ································  │
│           ⏱ 03:12                 │
│       ▓▓▓▓▓▓▓░░░░░░░░░░           │
│                                   │
│  Hablen en Teams. Defendete.      │
│  Al terminar, se vota.            │
└──────────────────────────────────┘
```

### 5.4 Votación (elegir un jugador)
```
┌──────────────────────────────────┐
│ ☰  SINERGIA CORP          💼 46   │
├──────────────────────────────────┤
│  PORTAL RRHH · Voto confidencial  │
│  ································  │
│  ¿A quién amonestar?              │
│                                   │
│   ○ Ana                           │
│   ● Caro            ← tu elección │
│   ○ Beto                          │
│   ○ Elena                         │
│   ○ Fede                          │
│   ○ Inés                          │
│   ○ Abstenerse                    │
│  ································  │
│   [   ENVIAR DICTAMEN   ]         │
│  Recibidos 5 / 8 · ⏱ 00:42        │
└──────────────────────────────────┘
```
- Es la **lista de jugadores en modo seleccionable** — mismo componente que el
  lobby. Sirve para cualquier desafío de "elegí un jugador".

### 5.5 Resultado de la votación
```
┌──────────────────────────────────┐
│ ☰  SINERGIA CORP          💼 46   │
├──────────────────────────────────┤
│  PORTAL RRHH · Resolución         │
│  ································  │
│   Amonestado:   ▸ Beto            │
│   Beto pierde Influencia.         │
│                                   │
│   Tu Influencia  46 → 46          │
│  ································  │
│   No se muestra quién votó a      │
│   quién — eso queda para deducir. │
│      [   CONTINUAR   ]            │
└──────────────────────────────────┘
```

---

## 6. Patrón general de votación

Toda decisión es de uno de 3 tipos, con el mismo componente base:

| Tipo | Ejemplo | UI |
|---|---|---|
| **Binaria secreta** | El Botón, Bono Trimestral | 2 botones grandes |
| **Elegir un jugador** | El Recorte, Compañero de Proyecto | Lista seleccionable |
| **Reparto / cantidad** | Recortes de Presupuesto | Slider o número |

Siempre: elección **secreta** → espera ("recibidos X/N") → resultado.

**Decisión grupal sin compartir pantalla:** como el estado está sincronizado,
todos ven la misma pantalla a la vez en su propio celular. Si decide una sola
persona (ej. el "Jefe"), esa ve los botones y el resto ve la misma pantalla en
modo espectador. No hace falta screen-share de Teams.

---

## 7. Decisiones cerradas (feedback de Dani)

- ✅ Lista de jugadores: **solo cuando el desafío la necesita** (no panel fijo).
- ✅ Resultado de llamada: **mostrar tu elección**, nunca la del rival.
- ✅ Marcador entre rondas: **lista completa**.
- ✅ Plataforma: **Mobile First**, responsive a desktop después.
- ✅ Enfoque visual: **suite de apps corporativas** (§1).

## 8. Preguntas abiertas

- [ ] Nombre de la empresa: ¿"SINERGIA CORP" fijo, o lo elige quien crea la sala?
- [ ] ¿La Influencia del shell (💼 46) se ve siempre, o se oculta en algunos
      desafíos para sumar incertidumbre?
- [ ] Set de avatares: ¿ilustraciones de personajes de oficina, o algo más
      simple (iniciales / íconos) para el MVP?
