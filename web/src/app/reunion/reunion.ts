import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Pantalla de Reunión grupal (fase 'meeting' de El Recorte): todos están
 * en la llamada de Teams debatiendo. La web solo da instrucciones. Cuando
 * cada uno está listo confirma "IR A VOTAR"; al confirmar todos, se vota.
 */
@Component({
  selector: 'app-reunion',
  templateUrl: './reunion.html',
})
export class Reunion {
  private readonly juego = inject(GameService);

  readonly miId = this.juego.miId;
  readonly jugadores = computed(() => this.juego.estado()?.players ?? []);
  readonly yo = computed(() =>
    this.jugadores().find((p) => p.id === this.miId()),
  );
  readonly listos = computed(
    () => this.jugadores().filter((p) => p.acted).length,
  );
  readonly total = computed(() => this.jugadores().length);
  readonly ronda = computed(() => this.juego.estado()?.ronda ?? 0);
  readonly rondasTotal = computed(() => this.juego.estado()?.rondasTotal ?? 0);

  irAVotar(): void {
    dlog('Reunion.irAVotar');
    this.juego.confirmar();
  }
}
