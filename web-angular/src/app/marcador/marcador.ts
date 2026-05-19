import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Pantalla de Marcador entre rondas: muestra el ranking acumulado tras
 * cerrar una ronda. Cada jugador confirma con "CONTINUAR"; cuando confirman
 * todos, el motor arranca la ronda siguiente.
 */
@Component({
  selector: 'app-marcador',
  templateUrl: './marcador.html',
})
export class Marcador {
  private readonly juego = inject(GameService);

  readonly miId = this.juego.miId;
  readonly jugadores = computed(() => this.juego.estado()?.players ?? []);
  /** Jugadores ordenados por influencia (de mayor a menor). */
  readonly ranking = computed(() =>
    [...this.jugadores()].sort((a, b) => b.influence - a.influence),
  );
  readonly ronda = computed(() => this.juego.estado()?.ronda ?? 0);
  readonly rondasTotal = computed(() => this.juego.estado()?.rondasTotal ?? 0);
  readonly yo = computed(() =>
    this.jugadores().find((p) => p.id === this.miId()),
  );
  readonly listos = computed(
    () => this.jugadores().filter((p) => p.acted).length,
  );
  readonly total = computed(() => this.jugadores().length);

  continuar(): void {
    dlog('Marcador.continuar');
    this.juego.confirmar();
  }
}
