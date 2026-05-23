import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { Brand } from '../brand/brand';
import { Intro } from '../intro/intro';
import { Reveal } from '../reveal/reveal';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Pantalla Comunicado — premisa narrativa del juego.
 *
 * Aparece DESPUÉS del lobby y ANTES del primer briefing (fase 'comunicado'
 * del server). Anuncia la "reestructuración" que justifica todo el juego:
 * hay un ASCENSO y un DESPIDO en juego, y las próximas rondas (los
 * minijuegos) son la "evaluación de desempeño" que determinará quién es
 * quién.
 *
 * Conceptualmente es la contraparte del Final:
 *   - Comunicado: ABRE la promesa narrativa (alguien sube, alguien cae).
 *   - Final:      CIERRA esa promesa (con su sello "ASCENSO APROBADO").
 *
 * Diseño: papel + grano + sombra dramática como el Final, pero con sello
 * rojo "URGENTE" en lugar de "ASCENSO APROBADO". Tono burocrático frío,
 * sátira corporativa (lenguaje de plan de optimización).
 *
 * Reveal: orquestado por `appReveal` (ver reveal.ts / intro.ts). Los dos
 * párrafos se escriben (máquina de escribir); el resto aparece con
 * animación; el sello cae al final. El orden está en el template
 * ([revealOrder]); este componente ya no calcula beats.
 */
@Component({
  selector: 'app-comunicado',
  imports: [Brand, Intro, Reveal],
  templateUrl: './comunicado.html',
  styleUrl: './comunicado.css',
})
export class Comunicado {
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
  readonly code = computed(() => this.juego.estado()?.code ?? '');

  confirmar(): void {
    dlog('Comunicado.confirmar');
    this.juego.confirmar();
  }
}
