import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { Intro } from '../intro/intro';
import { Reveal } from '../reveal/reveal';
import { temaDelDia } from '../challenge-meta';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Pantalla de Briefing: explica las reglas del minijuego del día antes
 * de jugarlo. Cada jugador confirma con "ENTENDIDO"; la fase avanza cuando
 * todos confirmaron.
 *
 * Lenguaje editorial: el appheader dice "DÍA X DE Y · TEMA DEL DÍA"
 * (no "Ronda", no "Aprobaciones") — conecta con la narrativa del
 * Comunicado ("durante los próximos días se procederá al monitoreo
 * de la performance individual"). Cada minijuego tiene su propio tema
 * mapeado en [challenge-meta.ts](../challenge-meta.ts).
 *
 * El contenido se muestra dentro de `<app-intro>` con la directiva
 * `appReveal` en cada bloque: la prosa se tipea (máquina de escribir) y el
 * resto aparece con animación, todo en secuencia. Ver reveal.ts / intro.ts.
 */
@Component({
  selector: 'app-briefing',
  imports: [Intro, Reveal],
  templateUrl: './briefing.html',
  styleUrl: './briefing.css',
})
export class Briefing {
  private readonly juego = inject(GameService);

  readonly miId = this.juego.miId;
  readonly jugadores = computed(() => this.juego.estado()?.players ?? []);
  readonly yo = computed(() =>
    this.jugadores().find((p) => p.id === this.miId()),
  );

  /** Día actual y total — para la cabecera "DÍA 2 DE 4". */
  readonly dia = computed(() => this.juego.estado()?.ronda ?? 0);
  readonly diasTotal = computed(() => this.juego.estado()?.rondasTotal ?? 0);

  /** Id del minijuego del día: decide qué briefing mostrar.
   *  "" = día sin minijuego implementado (placeholder). */
  readonly challengeId = computed(
    () => this.juego.estado()?.challengeId ?? '',
  );

  /** Tema editorial del día — viene de un mapa cliente (challenge-meta). */
  readonly tema = computed(() => temaDelDia(this.challengeId()));

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
