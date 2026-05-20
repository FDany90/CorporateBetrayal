import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { Avatar } from '../avatar/avatar';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Pantalla de Votación (fase 'vote' de El Recorte): cada jugador vota en
 * secreto a quién recortar. Se puede cambiar el voto hasta que voten todos.
 */
@Component({
  selector: 'app-votacion',
  imports: [Avatar],
  templateUrl: './votacion.html',
})
export class Votacion {
  private readonly juego = inject(GameService);

  readonly miId = this.juego.miId;
  readonly jugadores = computed(() => this.juego.estado()?.players ?? []);
  readonly yo = computed(() =>
    this.jugadores().find((p) => p.id === this.miId()),
  );
  /** A quién puedo votar: todos menos yo. */
  readonly candidatos = computed(() =>
    this.jugadores().filter((p) => p.id !== this.miId()),
  );
  /** Mi voto actual (id del votado, o "" si no voté). */
  readonly miVoto = computed(() => this.yo()?.decision ?? '');
  /** Progreso: cuántos conectados ya votaron. */
  readonly votaron = computed(
    () => this.jugadores().filter((p) => p.connected && p.decision).length,
  );
  readonly total = computed(
    () => this.jugadores().filter((p) => p.connected).length,
  );
  readonly ronda = computed(() => this.juego.estado()?.ronda ?? 0);
  readonly rondasTotal = computed(() => this.juego.estado()?.rondasTotal ?? 0);

  votar(id: string): void {
    dlog('Votacion.votar', id);
    this.juego.votar(id);
  }
}
