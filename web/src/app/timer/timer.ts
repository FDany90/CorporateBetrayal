import { Component, OnDestroy, computed, input, signal } from '@angular/core';

/**
 * Banner de cuenta regresiva con barra de progreso.
 *
 *   <app-timer [endsAt]="phaseEndsAt()" [totalSeconds]="phaseDuration()" />
 *
 * El reloj autoritativo vive en el SERVER (campo `phaseEndsAt` del estado,
 * epoch ms de fin de fase). Este componente solo MUESTRA la cuenta: no
 * decide cuándo avanza la partida — eso lo fuerza el server al vencer.
 *
 * Conceptos Angular en juego:
 *  - `input()` (signal inputs): `endsAt` y `totalSeconds` son signals de
 *    entrada; cuando el server manda un `phaseEndsAt` nuevo, los `computed`
 *    de abajo se recalculan solos.
 *  - `signal` + `setInterval`: `ahora` es un signal que actualizamos cada
 *    250ms; como los `computed` (restante, mmss, pct) lo leen, la vista se
 *    repinta sola. Usamos un intervalo corto para que la barra se vea fluida.
 *  - `OnDestroy`: limpiamos el intervalo al destruir el componente (cada vez
 *    que se cambia de pantalla), para no dejar timers corriendo.
 *
 * Si `endsAt` es 0 (fase sin tiempo límite) no se renderiza nada.
 */
@Component({
  selector: 'app-timer',
  templateUrl: './timer.html',
  styleUrl: './timer.css',
})
export class Timer implements OnDestroy {
  /** Epoch ms en que termina la fase (0 = sin timer → no se muestra). */
  readonly endsAt = input<number>(0);
  /** Duración total de la fase, en segundos (denominador de la barra). */
  readonly totalSeconds = input<number>(0);

  /** "Ahora" reactivo: lo refrescamos cada 250ms para mover la cuenta. */
  private readonly ahora = signal(Date.now());
  private readonly intervalo = setInterval(() => this.ahora.set(Date.now()), 250);

  /** ¿Hay un timer activo? (el server publicó un fin de fase). */
  readonly activo = computed(() => this.endsAt() > 0);

  /** Milisegundos restantes (nunca negativo). */
  readonly restanteMs = computed(() =>
    Math.max(0, this.endsAt() - this.ahora()),
  );
  /** Segundos restantes redondeados hacia arriba (para mostrar). */
  readonly restanteSeg = computed(() => Math.ceil(this.restanteMs() / 1000));

  /** Texto "m:ss". */
  readonly mmss = computed(() => {
    const s = this.restanteSeg();
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  });

  /** Porcentaje restante (ancho de la barra). */
  readonly pct = computed(() => {
    const total = this.totalSeconds() * 1000;
    if (total <= 0) return 0;
    return Math.max(0, Math.min(100, (this.restanteMs() / total) * 100));
  });

  /** Últimos 10s: estado de urgencia (rojo + pulso). */
  readonly urgente = computed(() => this.activo() && this.restanteSeg() <= 10);

  ngOnDestroy(): void {
    clearInterval(this.intervalo);
  }
}
