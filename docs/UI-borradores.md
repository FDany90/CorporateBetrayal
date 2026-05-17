# Traición en la Oficina — Borradores de Pantalla (UI)

> Bocetos de baja fidelidad (wireframes en ASCII) para discutir **estructura y
> flujo**, no estética. Acompaña al [GDD](GDD.md).

**Versión:** 0.1 · **Fecha:** 2026-05-17

---

## 0. Alcance de estos borradores (MVP)

Según el feedback de Dani sobre el GDD, estos borradores asumen un MVP recortado:

| Decisión | En el MVP |
|---|---|
| Recursos | **Solo Influencia Corporativa**. Sin Sospecha, sin Reputación. |
| Misión Personal | **Fuera del MVP**. El modelo de datos la contempla a futuro. |
| Resultados | Al cerrar un minijuego se muestra **el cambio de Influencia** y resultados parciales. **Nunca** "Fulano te traicionó" de forma explícita. |
| Modo Anónimo | Fuera del MVP. El marcador se muestra normal. |

---

## 1. Componentes reutilizables

Toda la app se arma con pocas piezas repetidas:

**Barra superior** — siempre visible:
```
┌──────────────────────────────────────────┐
│ ⌂  Ronda 2 / 5            💼 Influencia 34 │
└──────────────────────────────────────────┘
```

**Lista de jugadores** — se reusa en 3 modos:
- *informativa* (solo ver quién está),
- *seleccionable* (votar / elegir a alguien),
- *de estado* (quién ya terminó una fase).

**Cronómetro** — barra + cuenta regresiva, sincronizado por el servidor:
```
   ⏱ 01:00   ▓▓▓▓▓▓▓▓▓░░░░░░
```

**Panel de resultado** — el cambio de Influencia, sin editorializar.

**Tarjeta de instrucción** — el bloque central que dice *qué hacer ahora*.

---

## 2. Pantallas comunes

### 2.1 Lobby — listado de jugadores
```
┌──────────────────────────────────────────┐
│  TRAICIÓN EN LA OFICINA                    │
│  Sala  KPXZT              Jugadores 8 / 12 │
├──────────────────────────────────────────┤
│  🟢 Ana             lista                  │
│  🟢 Beto            listo                  │
│  ⚪ Caro            eligiendo avatar       │
│  🟢 Dani  (vos)     listo                  │
│  🟢 Elena           lista                  │
│  ⚪ Fede            conectando…            │
│  🟢 Gastón          listo                  │
│  🟢 Inés            lista                  │
├──────────────────────────────────────────┤
│  Empieza cuando todos estén listos.        │
│              [   ESTOY LISTO   ]           │
└──────────────────────────────────────────┘
```
- Se entra con el **código de sala** + apodo + avatar (pantalla previa, no mostrada).
- 🟢 = listo · ⚪ = aún no. Esta misma lista, en *modo estado*, reaparece dentro
  de los desafíos para ver quién terminó cada fase.

### 2.2 Briefing de desafío
La tarjeta de instrucción anuncia el desafío y sus reglas antes de empezar.
Ver ejemplos en §3 y §4.

### 2.3 Marcador (entre rondas)
```
┌──────────────────────────────────────────┐
│  MARCADOR — fin de la Ronda 2              │
├──────────────────────────────────────────┤
│   1.  Ana            58  ▲                 │
│   2.  Dani  (vos)    46  ▲                 │
│   3.  Gastón         44  ▬                 │
│   4.  Elena          39  ▲                 │
│   5.  Inés           33  ▼                 │
│   6.  Beto           31  ▼                 │
│   7.  Caro           28  ▬                 │
│   8.  Fede           25  ▼                 │
├──────────────────────────────────────────┤
│              [  SIGUIENTE RONDA  ]         │
└──────────────────────────────────────────┘
```
- Única métrica: **Influencia**. ▲▬▼ indican si subió/bajó respecto de la ronda
  anterior — pista para deducir sin señalar a nadie.

---

## 3. Ejemplo INDIVIDUAL — A1 · El Botón del Bonus

Desafío de **serie de llamadas 1-a-1**. Flujo de 5 pantallas.

### 3.1 Briefing
```
┌──────────────────────────────────────────┐
│ ⌂  Ronda 2 / 5            💼 Influencia 34 │
├──────────────────────────────────────────┤
│              DESAFÍO                       │
│         EL BOTÓN DEL BONUS                 │
│                                            │
│  Vas a hablar 1-a-1 con varios             │
│  compañeros. Al colgar, cada uno elige     │
│  Verde o Rojo en secreto.                  │
│                                            │
│     🟢 + 🟢   →  +3 los dos                │
│     🔴 vs 🟢  →  +5  /  0                  │
│     🔴 + 🔴   →  +1 los dos                │
│                                            │
│              [   ENTENDIDO   ]             │
└──────────────────────────────────────────┘
```

### 3.2 Tarjeta de llamada
```
┌──────────────────────────────────────────┐
│ ⌂  Ronda 2 / 5            💼 Influencia 34 │
├──────────────────────────────────────────┤
│  LLAMADA  2 de 5                           │
│                                            │
│             📞  LLAMÁ A BETO               │
│                ahora, por Teams            │
│                                            │
│                  🧑‍💼                       │
│                  Beto                      │
│                                            │
│  Cuando los dos estén en la llamada:       │
│           [   ESTAMOS EN LLAMADA   ]       │
└──────────────────────────────────────────┘
```
- A Beto, en su pantalla, le aparece `Beto: te va a llamar Dani` → **solo uno
  inicia**, cero llamadas cruzadas.

### 3.3 En llamada (cronómetro)
```
┌──────────────────────────────────────────┐
│ ⌂  Ronda 2 / 5            💼 Influencia 34 │
├──────────────────────────────────────────┤
│  EN LLAMADA CON BETO                       │
│                                            │
│            ⏱ 01:00                          │
│        ▓▓▓▓▓▓▓▓▓▓▓░░░░░░                   │
│                                            │
│  Negociá. Prometé. Mentí.                  │
│  Cuando termine el tiempo, vas a elegir.   │
└──────────────────────────────────────────┘
```

### 3.4 Tu decisión (así se "vota" en un desafío individual)
```
┌──────────────────────────────────────────┐
│ ⌂  Ronda 2 / 5            💼 Influencia 34 │
├──────────────────────────────────────────┤
│  TU DECISIÓN — llamada con Beto             │
│  Elegí en secreto. Beto no ve tu elección. │
│                                            │
│    ┌────────────────┐ ┌────────────────┐  │
│    │      🟢        │ │      🔴        │  │
│    │     VERDE      │ │      ROJO      │  │
│    │   Cooperar     │ │   Traicionar   │  │
│    └────────────────┘ └────────────────┘  │
│                                            │
│  Esperando que Beto también elija…         │
└──────────────────────────────────────────┘
```

### 3.5 Resultado de la llamada
```
┌──────────────────────────────────────────┐
│ ⌂  Ronda 2 / 5            💼 Influencia 39 │
├──────────────────────────────────────────┤
│  RESULTADO — llamada con Beto               │
│                                            │
│         Influencia   34 → 39   (+5)        │
│                                            │
│  Vos elegiste 🔴 Rojo.                     │
│  Sacá tus conclusiones sobre Beto.         │
│                                            │
│              [   SIGUIENTE LLAMADA   ]     │
└──────────────────────────────────────────┘
```
- Muestra **solo tu cambio de Influencia**. No dice "Beto cooperó / te
  traicionó" — el número (+5) deja que **vos lo deduzcas**.

### 3.6 Cierre del desafío (resultados parciales)
```
┌──────────────────────────────────────────┐
│  EL BOTÓN DEL BONUS — terminó              │
├──────────────────────────────────────────┤
│  Tus 5 llamadas:                           │
│     vs Ana      +3                         │
│     vs Beto     +5                         │
│     vs Caro      0                         │
│     vs Elena    +1                         │
│     vs Fede     +3                         │
│  ────────────────────                      │
│  Total del desafío   +12                   │
│  Influencia    34 → 46                     │
├──────────────────────────────────────────┤
│              [   CONTINUAR   ]             │
└──────────────────────────────────────────┘
```
- Da material para deducir (vs Caro = 0 → los dos jugaron Rojo) **sin** acusar a
  nadie por vos.

---

## 4. Ejemplo GRUPAL — G4 · El Recorte

Desafío de **reunión grupal** con votación. Flujo de 5 pantallas.

### 4.1 Briefing + entrada a la reunión
```
┌──────────────────────────────────────────┐
│ ⌂  Ronda 3 / 5            💼 Influencia 46 │
├──────────────────────────────────────────┤
│              DESAFÍO                       │
│             EL RECORTE                     │
│                                            │
│  ⚠ Crisis: la empresa debe amonestar a     │
│  un empleado. Defendete, acusá, negociá.   │
│  El más votado pierde Influencia.          │
│                                            │
│         [  ENTRAR A LA REUNIÓN  ]          │
│         Abre la reunión grupal de Teams    │
└──────────────────────────────────────────┘
```

### 4.2 Sala de espera de la reunión (quórum)
```
┌──────────────────────────────────────────┐
│  REUNIÓN GRUPAL                            │
│  [ 🎦 Abrir reunión en Teams ]             │
├──────────────────────────────────────────┤
│  En la sala   6 / 8                        │
│                                            │
│  🟢 Ana     🟢 Beto    🟢 Dani  🟢 Elena   │
│  🟢 Gastón  🟢 Inés    ⚪ Caro   ⚪ Fede    │
├──────────────────────────────────────────┤
│  El debate arranca cuando entren todos.    │
└──────────────────────────────────────────┘
```

### 4.3 Debate (cronómetro)
```
┌──────────────────────────────────────────┐
│ ⌂  Ronda 3 / 5            💼 Influencia 46 │
├──────────────────────────────────────────┤
│  EL RECORTE — DEBATE                       │
│            ⏱ 03:12                          │
│        ▓▓▓▓▓▓▓▓░░░░░░░░░░                  │
│                                            │
│  Hablen en Teams. Defendete y acusá.       │
│  Cuando termine el tiempo, se vota.        │
└──────────────────────────────────────────┘
```

### 4.4 Votación (así se "vota" en un desafío grupal)
```
┌──────────────────────────────────────────┐
│ ⌂  Ronda 3 / 5            💼 Influencia 46 │
├──────────────────────────────────────────┤
│  VOTÁ A QUIÉN AMONESTAR                     │
│  Voto secreto. Elegí un jugador.            │
│                                            │
│   ◯  🧑‍💼 Ana                               │
│   ◉  🧑‍💼 Beto              ← tu elección   │
│   ◯  🧑‍💼 Caro                              │
│   ◯  🧑‍💼 Elena                             │
│   ◯  🧑‍💼 Fede                              │
│   ◯  🧑‍💼 Gastón                            │
│   ◯  🧑‍💼 Inés                              │
│   ◯  ⊘  Abstenerse                          │
│                                            │
│          [   CONFIRMAR VOTO   ]            │
│  Votaron 5 / 8 …                           │
└──────────────────────────────────────────┘
```
- Es la **lista de jugadores en modo seleccionable** — el mismo componente que
  el lobby, con radio-buttons. Este patrón sirve para *cualquier* desafío que
  pida "elegí a un jugador" (El Recorte, Compañero de Proyecto, Reconocimiento…).

### 4.5 Resultado de la votación
```
┌──────────────────────────────────────────┐
│ ⌂  Ronda 3 / 5            💼 Influencia 46 │
├──────────────────────────────────────────┤
│  RESULTADO — EL RECORTE                     │
│                                            │
│  Amonestado:   🧑‍💼 Beto                    │
│  Beto pierde Influencia.                   │
│                                            │
│  Tu Influencia   46 → 46   (sin cambios)   │
│                                            │
│  No se muestra quién votó a quién.         │
│              [   CONTINUAR   ]             │
└──────────────────────────────────────────┘
```
- Se ve **el desenlace** (a quién amonestaron) pero **no el detalle de votos**:
  quién votó a quién queda para la deducción y el chusmerío.

---

## 5. Patrón general de votación

Los desafíos piden decisiones de 3 tipos, todos con el mismo componente base:

| Tipo de decisión | Ejemplo | UI |
|---|---|---|
| **Binaria secreta** | El Botón (Verde/Rojo), Bono Trimestral | 2 botones grandes |
| **Elegir un jugador** | El Recorte, Compañero de Proyecto | Lista seleccionable + Confirmar |
| **Reparto / cantidad** | Recortes de Presupuesto | Slider o input numérico |

Siempre: elección **secreta** → pantalla de espera ("votaron X/N") → resultado.

---

## 6. Preguntas abiertas para Dani

- [ ] ¿La lista de jugadores va siempre visible (panel lateral) o solo cuando el
      desafío la necesita? En móvil el espacio es poco.
- [ ] En el resultado de llamada (§3.5), ¿mostramos "vos elegiste Rojo" o lo
      omitimos para que ni te acuerdes y haya más caos?
- [ ] El marcador entre rondas (§2.3): ¿lista completa, o solo tu puesto y los
      vecinos para generar más incertidumbre?
- [ ] ¿La web corre al lado de Teams en la misma pantalla (diseño angosto) o se
      asume una segunda pantalla / celular?
