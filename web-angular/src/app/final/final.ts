import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { Intro } from '../intro/intro';
import { Avatar } from '../avatar/avatar';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Pantalla Final — "CIRCULAR OFICIAL" de Sinergia·Corp.
 *
 * Dirección estética
 * ------------------
 * La pantalla rompe deliberadamente con la estética blanda/mobile del shell.
 * Se presenta como una circular interna escaneada de RR.HH. anunciando la
 * evaluación trimestral de desempeño. El #1 ("Empleado del Mes") recibe
 * un sello rojo diagonal "ASCENSO APROBADO" que cae al final con un thud
 * (scale + rotate + overshoot). El resto del ranking aparece como
 * "Plantilla general" en planilla mono chiquita.
 *
 * Coreografía del reveal
 * ----------------------
 * Layout visual (de arriba abajo en el documento):
 *   [encabezado] [título] [intro] [GANADOR grande] [plantilla #2..#N] [firma]
 *
 * Pero el orden de aparición ANIMADO es distinto, para dar suspenso:
 *   1) encabezado del documento
 *   2) título "CIRCULAR OFICIAL"
 *   3) bajada "Por la presente..."
 *   4) header "Plantilla general"
 *   5) puesto #N (último), después #N-1, ..., hasta #2  ← suspenso
 *   6) bloque GANADOR (#1) aparece grande
 *   7) cae el sello "ASCENSO APROBADO" con thud
 *   8) firma
 *
 * Por qué se puede romper el orden visual: las animaciones CSS usan
 * `animation-delay` calculado desde la CSS var `--i`. Eso es independiente
 * del orden del DOM — un elemento que está arriba puede tener --i alto.
 */
@Component({
  selector: 'app-final',
  imports: [Intro, Avatar],
  templateUrl: './final.html',
  styleUrl: './final.css',
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

  /** Ganador: el #1 del ranking. */
  readonly ganador = computed(() => this.ranking()[0]);

  /**
   * Plantilla general: del #2 al #N (sin el ganador), con su número de
   * puesto pre-calculado para mostrarlo como "folio" en cada fila.
   */
  readonly plantilla = computed(() =>
    this.ranking()
      .slice(1)
      .map((p, i) => ({ ...p, puesto: i + 2 })),
  );

  // -----------------------------------------------------------------
  // "Beats" de la coreografía. Cada uno es un índice que el template
  // consume vía [style.--i]; el CSS calcula `animation-delay = i * 0.35s`.
  // Los nombres acá deben coincidir con el comentario de arriba.
  // -----------------------------------------------------------------
  private readonly BEAT_HEAD = 0;
  private readonly BEAT_TITLE = 1;
  private readonly BEAT_INTRO = 2;
  private readonly BEAT_PLANTILLA_HEAD = 3;
  private readonly BEAT_PLANTILLA_START = 4;

  /** Beat del encabezado del documento (logo + folio). */
  readonly beatHead = this.BEAT_HEAD;
  readonly beatTitle = this.BEAT_TITLE;
  readonly beatIntro = this.BEAT_INTRO;
  readonly beatPlantillaHead = this.BEAT_PLANTILLA_HEAD;

  /**
   * Beat de una fila de la plantilla, dado su índice en el array (#2 → 0,
   * #3 → 1, …). Invertimos el orden para revelar de abajo hacia arriba:
   * el último puesto del DOM (= #2 en este caso) tiene el beat más alto.
   */
  beatFila(indiceEnPlantilla: number): number {
    const n = this.plantilla().length;
    return this.BEAT_PLANTILLA_START + (n - 1 - indiceEnPlantilla);
  }

  /** Beat del bloque GANADOR — justo después de la última fila de plantilla. */
  readonly beatGanador = computed(
    () => this.BEAT_PLANTILLA_START + this.plantilla().length,
  );

  /**
   * Delay del sello (ms) — empieza DESPUÉS del beat del ganador.
   * El ganador entra con la animación del título (700ms); le damos 200ms
   * extra de pausa antes de que caiga el sello, para que se "respire".
   */
  readonly stampDelayMs = computed(
    () => this.beatGanador() * 350 + 700 + 200,
  );

  /** Beat de la firma — después del sello, con un beat extra de pausa. */
  readonly beatFirma = computed(() => this.beatGanador() + 2);

  /**
   * Duración total estimada de la secuencia (para el <app-intro [totalMs]>).
   * = beat de firma × 350ms + duración del fade + colchón.
   */
  readonly totalMs = computed(() => this.beatFirma() * 350 + 600 + 300);

  volver(): void {
    dlog('Final.volver');
    this.juego.confirmar();
  }
}
