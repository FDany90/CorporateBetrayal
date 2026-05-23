import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { Avatar } from '../avatar/avatar';
import { Brand } from '../brand/brand';
import { Timer } from '../timer/timer';
import { temaDelDia } from '../challenge-meta';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Pantalla de Votación (fase 'vote' de El Recorte).
 *
 * Mecánica:
 *  - Cada jugador elige a quién recortar tocando su fila en la planilla.
 *    El voto se propaga al estado compartido al instante (campo
 *    `Player.decision` ya sincronizado por Colyseus), así toda la sala
 *    ve los conteos en vivo durante la deliberación.
 *  - El voto se puede cambiar libremente hasta tocar "CONFIRMAR VOTO".
 *  - Una vez confirmado (server marca `acted = true`), el voto queda
 *    firme y no se puede cambiar. El motor avanza cuando todos los
 *    conectados confirmaron.
 *
 * Auto-voto: bloqueado en el server. En la UI me incluyo en la planilla
 * para que vea cuántos votos me llevan los demás, pero la fila no es
 * clickeable.
 */
@Component({
  selector: 'app-votacion',
  imports: [Avatar, Brand, Timer],
  templateUrl: './votacion.html',
  styleUrl: './votacion.css',
})
export class Votacion {
  private readonly juego = inject(GameService);

  readonly miId = this.juego.miId;
  readonly jugadores = computed(() => this.juego.estado()?.players ?? []);
  readonly yo = computed(() =>
    this.jugadores().find((p) => p.id === this.miId()),
  );

  /** Tema editorial del día — para el appheader. */
  readonly tema = computed(() =>
    temaDelDia(this.juego.estado()?.challengeId ?? ''),
  );
  readonly dia = computed(() => this.juego.estado()?.ronda ?? 0);
  readonly diasTotal = computed(() => this.juego.estado()?.rondasTotal ?? 0);

  /** Timer de la fase (lo publica el server): fin y duración total. */
  readonly phaseEndsAt = computed(() => this.juego.estado()?.phaseEndsAt ?? 0);
  readonly phaseDuration = computed(
    () => this.juego.estado()?.phaseDurationSec ?? 0,
  );

  /** Mi voto actual (id del votado, o "" si todavía no voté). */
  readonly miVoto = computed(() => this.yo()?.decision ?? '');

  /** ¿Ya confirmé mi voto? Una vez true, no se puede cambiar. */
  readonly confirmado = computed(() => this.yo()?.acted ?? false);

  /**
   * Conteo de votos por id de candidato, calculado en vivo a partir
   * del estado compartido. Como `decision` se sincroniza al instante,
   * este map se recalcula automáticamente cuando alguien vota o cambia
   * su voto — la UI refleja la deliberación en tiempo real.
   */
  readonly conteoVotos = computed(() => {
    const m = new Map<string, number>();
    for (const p of this.jugadores()) {
      if (p.decision) m.set(p.decision, (m.get(p.decision) ?? 0) + 1);
    }
    return m;
  });

  /**
   * Todos los jugadores ordenados con los más votados arriba. Se usa
   * SOLO para calcular el "rank" (puesto) de cada uno — no para ordenar
   * el DOM. Ver `jugadoresEstables` + `rankDe`.
   */
  readonly filas = computed(() => {
    const c = this.conteoVotos();
    return [...this.jugadores()].sort(
      (a, b) => (c.get(b.id) ?? 0) - (c.get(a.id) ?? 0),
    );
  });

  /**
   * Altura fija de cada fila (px). DEBE coincidir con `.voto-row height`
   * en votacion.css: se usa para posicionar cada fila por transform.
   */
  readonly ALTURA_FILA = 64;

  /**
   * Jugadores en orden ESTABLE (por id) — este es el orden del DOM, que
   * NUNCA cambia. El reordenamiento por votos se hace moviendo cada fila
   * con `transform: translateY(rank * ALTURA)`, así CSS anima el cambio
   * de puesto. Como el DOM no se reordena, votos simultáneos no rompen
   * ni el orden ni las animaciones (la transición CSS reanima sola).
   */
  readonly jugadoresEstables = computed(() =>
    [...this.jugadores()].sort((a, b) => a.id.localeCompare(b.id)),
  );

  /** Puesto actual (0 = arriba) de un jugador según los votos. */
  rankDe(id: string): number {
    return this.filas().findIndex((p) => p.id === id);
  }

  /** Progreso: cuántos conectados ya confirmaron. */
  readonly confirmados = computed(
    () => this.jugadores().filter((p) => p.connected && p.acted).length,
  );
  readonly total = computed(
    () => this.jugadores().filter((p) => p.connected).length,
  );

  /** Devuelve los votos que lleva un candidato (0 si no tiene). */
  votosDe(id: string): number {
    return this.conteoVotos().get(id) ?? 0;
  }

  /** ¿Esta fila soy yo? (no se puede votar a uno mismo). */
  esMia(id: string): boolean {
    return id === this.miId();
  }

  /** Etiqueta accesible de una fila: nombre + conteo de votos. El conteo
   *  visual está aria-hidden (es decorativo en columna), así que lo
   *  exponemos acá para lectores de pantalla. */
  ariaVoto(nombre: string, id: string): string {
    const n = this.votosDe(id);
    const votos = `${n} ${n === 1 ? 'voto' : 'votos'}`;
    return this.esMia(id)
      ? `${nombre} (vos), ${votos}`
      : `Votar a ${nombre}, ${votos}`;
  }

  /** Toca una fila para votar (cambia mi voto). Bloqueado tras confirmar. */
  votar(id: string): void {
    if (this.confirmado()) return;
    if (this.esMia(id)) return;
    dlog('Votacion.votar', id);
    this.juego.votar(id);
  }

  /** Confirma el voto de forma definitiva. Requiere haber votado. */
  confirmar(): void {
    if (this.confirmado()) return;
    if (!this.miVoto()) return;
    dlog('Votacion.confirmar');
    this.juego.confirmar();
  }
}
