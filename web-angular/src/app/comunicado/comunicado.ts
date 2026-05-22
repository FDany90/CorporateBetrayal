import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { Intro } from '../intro/intro';
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
 * Reveal: <app-intro> con beats escalonados — el sello cae al final.
 */
@Component({
  selector: 'app-comunicado',
  imports: [Intro],
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

  /* ----------------- Coreografía de beats ----------------- */
  // Mismo patrón que <app-final>: cada bloque del documento es un beat;
  // el sello tiene su propio delay calculado para caer DESPUÉS del beat
  // de la firma; el botón aparece al último.

  // El comunicado usa la variante "intro-slow": gap entre beats = 1400ms
  // (vs. 700ms del intro normal). Le da más tiempo a leer cada sección
  // y se siente más "ceremonial" — un documento que se lee con calma,
  // no una secuencia de UI.
  // OJO: estos valores DEBEN coincidir con los del CSS `.intro.intro-slow`
  // en styles.css (delay 1.4s, duración beat 1200ms, título 2000ms);
  // se usan acá para coordinar la caída del sello y el corte de skipped.
  private readonly GAP_MS = 1400;
  private readonly DURACION_BEAT_MS = 1200;
  private readonly DURACION_TITULO_MS = 2000;

  readonly beatHead = 0;
  readonly beatTitle = 1;
  readonly beatIntro = 2;       // primer párrafo
  readonly beatCuadros = 3;     // grid ASCENSO/DESPIDO
  readonly beatCierre = 4;      // segundo párrafo + cierre
  readonly beatFirma = 5;

  /**
   * Sello "CONFIDENCIAL" — cae DESPUÉS de la firma, cuando ya leíste
   * todo el comunicado. Es el "punto final" visual: confirma que lo
   * que acabás de leer es serio y no negociable.
   */
  readonly stampDelayMs = computed(
    () => this.beatFirma * this.GAP_MS + this.DURACION_BEAT_MS + 400, // ≈ 4500ms
  );

  /** Botón "ENTENDIDO" — entra tras el sello (lo último de todo). */
  readonly beatBoton = computed(() => this.beatFirma + 2);

  /** Duración total para el `[totalMs]` del <app-intro>. */
  readonly totalMs = computed(
    () => this.beatBoton() * this.GAP_MS + this.DURACION_BEAT_MS + 500,
  );

  confirmar(): void {
    dlog('Comunicado.confirmar');
    this.juego.confirmar();
  }
}
