import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { Avatar } from '../avatar/avatar';
import { Intro } from '../intro/intro';
import { CountUp } from '../count-up';
import { temaDelDia } from '../challenge-meta';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Pantalla de Marcador entre rondas: muestra el ranking acumulado tras
 * cerrar una ronda. Cada jugador confirma con "CONTINUAR"; cuando confirman
 * todos, el motor arranca la ronda siguiente.
 *
 * El ranking se revela escalonado con <app-intro>: cada fila aparece una
 * tras otra (clase `.beat` + `--i` = su orden). Reusa el mismo sistema de
 * beats del Briefing/Comunicado — sin código de animación propio.
 */
@Component({
  selector: 'app-marcador',
  imports: [Avatar, Intro, CountUp],
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
  /** Mismos valores con nomenclatura "día" para el appheader editorial. */
  readonly dia = this.ronda;
  readonly diasTotal = this.rondasTotal;
  /** Tema editorial del día — para el appheader. */
  readonly tema = computed(() =>
    temaDelDia(this.juego.estado()?.challengeId ?? ''),
  );
  readonly yo = computed(() =>
    this.jugadores().find((p) => p.id === this.miId()),
  );
  readonly listos = computed(
    () => this.jugadores().filter((p) => p.acted).length,
  );
  readonly total = computed(() => this.jugadores().length);

  /* ----------- coreografía de beats -----------
   * Orden de aparición: título (0), bajada (1), filas del ranking
   * (2..n+1), botón CONTINUAR al final (n+2). */
  readonly beatBoton = computed(() => this.ranking().length + 2);

  /** Duración del reveal para el <app-intro>: hasta el botón + colchón.
   *  Con el gap actual (~0.7s/beat) y la duración del fade (840ms). */
  readonly totalMs = computed(() => this.beatBoton() * 700 + 840 + 500);

  continuar(): void {
    dlog('Marcador.continuar');
    this.juego.confirmar();
  }
}
