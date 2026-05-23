import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { Avatar } from '../avatar/avatar';
import { Intro } from '../intro/intro';
import { Reveal } from '../reveal/reveal';
import { CountUp } from '../count-up';
import { NOMBRE_CHALLENGE } from '../models';
import { temaDelDia } from '../challenge-meta';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Pantalla de Resultado: muestra cuánta Influencia gané/perdí en el
 * desafío y el marcador general. Cada jugador confirma con "CONTINUAR".
 */
@Component({
  selector: 'app-resultado',
  imports: [Avatar, CountUp, Intro, Reveal],
  templateUrl: './resultado.html',
  styleUrl: './resultado.css',
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

  /** Formato tipográfico del delta: "+3" / "−3" usando el signo MENOS
   *  matemático (U+2212), no el guion ASCII (U+002D). 0 va sin signo. */
  formatDelta(n: number): string {
    if (n > 0) return '+' + n;
    if (n < 0) return '−' + Math.abs(n);
    return '0';
  }

  /** Influencia actual y la previa al desafío (actual − delta). El conteo
   *  va de la previa a la actual: sube si ganaste, baja si perdiste. */
  readonly influencia = computed(() => this.yo()?.influence ?? 0);
  readonly influenciaPrevia = computed(() => this.influencia() - this.delta());

  /** Tanda actual y total de tandas del desafío. */
  readonly tanda = computed(() => this.juego.estado()?.tanda ?? 0);
  readonly tandasTotal = computed(() => this.juego.estado()?.tandasTotal ?? 0);
  /** ¿Es el resultado final del desafío, o uno parcial entre tandas? */
  readonly esFinal = computed(() => this.tanda() >= this.tandasTotal());

  /** Nombre del minijuego del día, para el título. */
  readonly nombre = computed(() => {
    const id = this.juego.estado()?.challengeId ?? '';
    return NOMBRE_CHALLENGE[id] ?? 'La ronda';
  });

  /* ---------- Tablero SCRUM: datos del reveal ---------- */

  /** ¿El minijuego que acaba de cerrar es el Tablero SCRUM? */
  readonly esTablero = computed(
    () => this.juego.estado()?.challengeId === 'tablero-scrum',
  );

  /** Tarjetas del Tablero (con valor real revelado por el server). */
  readonly cards = computed(() => this.juego.estado()?.cards ?? []);

  /** Mi tarjeta propia (la que conocía) — persiste durante 'result'. */
  readonly miTarjeta = this.juego.miTarjeta;
  /** Mis estimaciones por tarjeta — persisten durante 'result'. */
  readonly misEstimaciones = this.juego.misEstimaciones;

  /** ¿Es mi tarjeta propia (la que ya conocía)? */
  esMia(cardId: string): boolean {
    return this.miTarjeta()?.cardId === cardId;
  }
  /** Mi estimación para una tarjeta (o undefined si no estimé). */
  estimacionDe(cardId: string): number | undefined {
    return this.misEstimaciones()[cardId];
  }
  /** Estado del acierto: 'mia' (no se puntúa), 'sin-estimar' (0),
   *  'acierto' (+payoff), 'error' (−payoff). */
  estadoCarta(
    cardId: string,
    valorReal: number,
  ): 'mia' | 'sin-estimar' | 'acierto' | 'error' {
    if (this.esMia(cardId)) return 'mia';
    const est = this.estimacionDe(cardId);
    if (est === undefined) return 'sin-estimar';
    return est === valorReal ? 'acierto' : 'error';
  }

  /** Día actual / total y tema editorial — para el appheader. */
  readonly dia = computed(() => this.juego.estado()?.ronda ?? 0);
  readonly diasTotal = computed(() => this.juego.estado()?.rondasTotal ?? 0);
  readonly tema = computed(() =>
    temaDelDia(this.juego.estado()?.challengeId ?? ''),
  );

  /** Confirma el resultado. Cuando confirman todos, vuelve al lobby. */
  confirmar(): void {
    dlog('Resultado.confirmar');
    this.juego.confirmar();
  }
}
