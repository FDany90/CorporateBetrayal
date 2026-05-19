/* ============================================================
   PASO 2.5 — emparejador round-robin.

   Genera el calendario de parejas de un minijuego de llamadas: varias
   tandas en las que ninguna pareja se repite. Es un servicio único
   reutilizable, no uno por minijuego. Ver modelo-datos.md §4.5.
   ============================================================ */

/** Una pareja: dos ids de jugador. */
export interface ParejaPlana {
  aId: string;
  bId: string;
}

/**
 * Máximo de tandas distintas (sin repetir pareja) para `n` jugadores:
 *   n par   → n - 1
 *   n impar → n   (en cada tanda descansa uno distinto)
 */
export function maxTandas(n: number): number {
  if (n < 2) return 0;
  return n % 2 === 0 ? n - 1 : n;
}

/**
 * Calendario round-robin (método del círculo). Devuelve hasta `tandas`
 * listas de parejas; ninguna pareja se repite entre tandas. Si se piden
 * más tandas de las posibles, se topea en silencio (ver maxTandas).
 *
 * El orden de los jugadores se baraja una vez al inicio: las parejas
 * resultan aleatorias, pero el calendario sigue sin repeticiones.
 */
export function roundRobinSchedule(
  jugadores: string[],
  tandas: number
): ParejaPlana[][] {
  // copia barajada (Fisher-Yates)
  const ids = [...jugadores];
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  // con número impar agregamos un comodín "descanso"
  const BYE = "__bye__";
  const rot = ids.length % 2 === 0 ? [...ids] : [...ids, BYE];
  const m = rot.length;
  const total = Math.min(tandas, m - 1);

  const calendario: ParejaPlana[][] = [];
  for (let r = 0; r < total; r++) {
    const parejas: ParejaPlana[] = [];
    for (let i = 0; i < m / 2; i++) {
      const a = rot[i];
      const b = rot[m - 1 - i];
      if (a !== BYE && b !== BYE) parejas.push({ aId: a, bId: b });
    }
    calendario.push(parejas);

    // rotar dejando fijo rot[0] (método del círculo)
    const fijo = rot[0];
    const resto = rot.slice(1);
    resto.unshift(resto.pop() as string);
    rot.splice(0, rot.length, fijo, ...resto);
  }
  return calendario;
}
