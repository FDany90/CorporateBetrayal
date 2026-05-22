import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { Intro } from '../intro/intro';
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
 * El contenido se muestra dentro de `<app-intro class="intro-slow">`
 * para hacer un "reveal" escalonado y darle ritmo de lectura (no UI).
 */
@Component({
  selector: 'app-briefing',
  imports: [Intro],
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

  /**
   * Beat del botón ENTENDIDO. Es el último de todos, así que su orden
   * depende de cuántos bloques tenga el briefing del minijuego actual.
   * Desde el lead, todos los bloques están corridos -0.3 (para achicar
   * el gap título→lead un 30%); el botón sigue al cierre + 1.
   *  - Botón del Bonus: cierre en 6.7 → botón 7.7
   *  - El Recorte: cierre en 4.7 → botón 5.7
   *  - Placeholder: cierre en 2.7 → botón 3.7
   */
  readonly beatBoton = computed(() => {
    switch (this.challengeId()) {
      case 'boton-del-bonus':
        return 7.7;
      case 'el-recorte':
        return 5.7;
      default:
        return 3.7;
    }
  });

  /**
   * Duración del reveal para el <app-intro> (variante intro-slow, 1.4s
   * por beat). Cubre hasta el botón + el fade + colchón; si quedara corto,
   * app-intro marca `skipped` antes de tiempo y los últimos beats
   * aparecerían de golpe.
   */
  readonly totalMs = computed(() => this.beatBoton() * 1400 + 1200 + 500);

  /** Confirma que leí el briefing. El server marca `acted` y avanza. */
  confirmar(): void {
    dlog('Briefing.confirmar');
    this.juego.confirmar();
  }
}
