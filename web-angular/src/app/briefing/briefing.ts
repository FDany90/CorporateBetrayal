import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Pantalla de Briefing: explica las reglas de El Botón del Bonus antes de
 * jugarlo. Cada jugador confirma con "ENTENDIDO"; la fase avanza cuando
 * todos confirmaron.
 */
@Component({
  selector: 'app-briefing',
  templateUrl: './briefing.html',
})
export class Briefing {
  private readonly juego = inject(GameService);

  readonly miId = this.juego.miId;
  readonly jugadores = computed(() => this.juego.estado()?.players ?? []);
  readonly yo = computed(() =>
    this.jugadores().find((p) => p.id === this.miId()),
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
