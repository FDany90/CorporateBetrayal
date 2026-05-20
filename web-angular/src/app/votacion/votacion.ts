import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { Avatar } from '../avatar/avatar';
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
  imports: [Avatar],
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
   * Todos los jugadores, ordenados con los más votados arriba. Yo
   * aparezco también (para ver cuántos votos me llevan), pero con una
   * marca "vos" y deshabilitado.
   */
  readonly filas = computed(() => {
    const c = this.conteoVotos();
    return [...this.jugadores()].sort(
      (a, b) => (c.get(b.id) ?? 0) - (c.get(a.id) ?? 0),
    );
  });

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
