import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { Avatar } from '../avatar/avatar';
import { NOMBRE_CHALLENGE } from '../models';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Pantalla de Resultado: muestra cuánta Influencia gané/perdí en el
 * desafío y el marcador general. Cada jugador confirma con "CONTINUAR".
 */
@Component({
  selector: 'app-resultado',
  imports: [Avatar],
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

  /** Tanda actual y total de tandas del desafío. */
  readonly tanda = computed(() => this.juego.estado()?.tanda ?? 0);
  readonly tandasTotal = computed(() => this.juego.estado()?.tandasTotal ?? 0);
  /** ¿Es el resultado final del desafío, o uno parcial entre tandas? */
  readonly esFinal = computed(() => this.tanda() >= this.tandasTotal());

  /** Nombre del minijuego de la ronda, para el título. */
  readonly nombre = computed(() => {
    const id = this.juego.estado()?.challengeId ?? '';
    return NOMBRE_CHALLENGE[id] ?? 'La ronda';
  });

  /** Confirma el resultado. Cuando confirman todos, vuelve al lobby. */
  confirmar(): void {
    dlog('Resultado.confirmar');
    this.juego.confirmar();
  }
}
