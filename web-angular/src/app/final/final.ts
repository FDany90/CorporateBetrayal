import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Pantalla Final: ranking definitivo con títulos satíricos. El #1 es el
 * "Empleado del Mes". Cada jugador confirma para volver al lobby.
 *
 * Pendiente (post-MVP): desempate por votación directa entre empatados.
 */
@Component({
  selector: 'app-final',
  templateUrl: './final.html',
})
export class Final {
  private readonly juego = inject(GameService);

  readonly miId = this.juego.miId;
  readonly jugadores = computed(() => this.juego.estado()?.players ?? []);
  /** Ranking definitivo, de más a menos influencia. */
  readonly ranking = computed(() =>
    [...this.jugadores()].sort((a, b) => b.influence - a.influence),
  );
  readonly yo = computed(() =>
    this.jugadores().find((p) => p.id === this.miId()),
  );
  readonly listos = computed(
    () => this.jugadores().filter((p) => p.acted).length,
  );
  readonly total = computed(() => this.jugadores().length);

  /** Título satírico según el puesto en el ranking. */
  titulo(indice: number): string {
    if (indice === 0) return '🏆 Empleado del Mes';
    if (indice === this.total() - 1) return 'En Proceso de Mejora';
    return 'Plantilla';
  }

  volver(): void {
    dlog('Final.volver');
    this.juego.confirmar();
  }
}
