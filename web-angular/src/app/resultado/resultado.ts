import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Pantalla de Resultado: muestra cuánta Influencia gané/perdí en el
 * desafío y el marcador general. Cada jugador confirma con "CONTINUAR".
 */
@Component({
  selector: 'app-resultado',
  templateUrl: './resultado.html',
})
export class Resultado {
  private readonly juego = inject(GameService);

  readonly miId = this.juego.miId;
  readonly jugadores = computed(() => this.juego.estado()?.players ?? []);
  readonly yo = computed(() =>
    this.jugadores().find((p) => p.id === this.miId()),
  );

  /** Jugadores ordenados por influencia (de mayor a menor). */
  readonly ranking = computed(() =>
    [...this.jugadores()].sort((a, b) => b.influence - a.influence),
  );
  /** Cuántos ya confirmaron el resultado. */
  readonly acks = computed(
    () => this.jugadores().filter((p) => p.acted).length,
  );
  readonly total = computed(() => this.jugadores().length);

  /** Cambio de influencia del último desafío (puede ser negativo). */
  readonly delta = computed(() => this.yo()?.lastDelta ?? 0);
  /** Signo a mostrar delante del delta ("+" si fue positivo). */
  readonly signo = computed(() => (this.delta() > 0 ? '+' : ''));

  /** Confirma el resultado. Cuando confirman todos, vuelve al lobby. */
  confirmar(): void {
    dlog('Resultado.confirmar');
    this.juego.confirmar();
  }
}
