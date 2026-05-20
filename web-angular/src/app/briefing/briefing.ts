import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { Intro } from '../intro/intro';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Pantalla de Briefing: explica las reglas del minijuego de la ronda antes
 * de jugarlo. Cada jugador confirma con "ENTENDIDO"; la fase avanza cuando
 * todos confirmaron.
 *
 * El contenido se muestra dentro de `<app-intro>` para hacer un "reveal"
 * escalonado (cine corto ~3s) y dar sensación de juego en lugar de página.
 * Ver [intro/intro.ts](../intro/intro.ts) para el detalle del componente.
 */
@Component({
  selector: 'app-briefing',
  imports: [Intro],
  templateUrl: './briefing.html',
})
export class Briefing {
  private readonly juego = inject(GameService);

  readonly miId = this.juego.miId;
  readonly jugadores = computed(() => this.juego.estado()?.players ?? []);
  readonly yo = computed(() =>
    this.jugadores().find((p) => p.id === this.miId()),
  );

  /** Ronda actual y total — para la cabecera "Ronda 2 de 4". */
  readonly ronda = computed(() => this.juego.estado()?.ronda ?? 0);
  readonly rondasTotal = computed(() => this.juego.estado()?.rondasTotal ?? 0);
  /** Id del minijuego de la ronda: decide qué briefing mostrar.
   *  "" = ronda sin minijuego implementado (placeholder). */
  readonly challengeId = computed(
    () => this.juego.estado()?.challengeId ?? '',
  );
  /** Cuántos jugadores ya confirmaron (campo `acted`). */
  readonly listos = computed(
    () => this.jugadores().filter((p) => p.acted).length,
  );
  readonly total = computed(() => this.jugadores().length);

  /** Confirma que leí el briefing. El server marca `acted` y avanza. */
  confirmar(): void {
    dlog('Briefing.confirmar');
    this.juego.confirmar();
  }
}
