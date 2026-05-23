import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { Brand } from '../brand/brand';
import { Timer } from '../timer/timer';
import { temaDelDia } from '../challenge-meta';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Pantalla del Tablero SCRUM (fase 'tablero').
 *
 * Mecánica: cada jugador conoce el valor REAL (en Story Points) de UNA
 * tarjeta — se la mandó el server por mensaje privado al entrar a la fase.
 * Las demás tarjetas hay que estimarlas. Las llamadas son libres por Teams
 * (la web no guía a quién llamar); el tablero queda editable en vivo
 * mientras dura la fase, y cada uno confirma cuando quiere (o se cierra
 * por timer). Acierto → +Influencia, error → −Influencia (por tarjeta).
 *
 * UI: para tu tarjeta, mostramos el valor real ya conocido. Para el resto,
 * una fila de chips Fibonacci [1,2,3,5,8,13] tappeable; tocar el chip
 * seleccionado lo deselecciona (vuelve a "sin estimar" → 0 puntos).
 * Tras "Confirmar", los chips quedan bloqueados.
 */
@Component({
  selector: 'app-tablero-scrum',
  imports: [Brand, Timer],
  templateUrl: './tablero-scrum.html',
  styleUrl: './tablero-scrum.css',
})
export class TableroScrum {
  private readonly juego = inject(GameService);

  readonly miId = this.juego.miId;
  readonly jugadores = computed(() => this.juego.estado()?.players ?? []);
  readonly yo = computed(() =>
    this.jugadores().find((p) => p.id === this.miId()),
  );

  readonly cards = computed(() => this.juego.estado()?.cards ?? []);
  /** La tarjeta que vos conocés (cardId + valor real). Llega por mensaje
   *  privado del server al entrar a la fase. null = todavía no llegó. */
  readonly miTarjeta = this.juego.miTarjeta;

  /** Timer / día / tema — reusos editoriales. */
  readonly tema = computed(() =>
    temaDelDia(this.juego.estado()?.challengeId ?? ''),
  );
  readonly dia = computed(() => this.juego.estado()?.ronda ?? 0);
  readonly diasTotal = computed(() => this.juego.estado()?.rondasTotal ?? 0);
  readonly phaseEndsAt = computed(() => this.juego.estado()?.phaseEndsAt ?? 0);
  readonly phaseDuration = computed(
    () => this.juego.estado()?.phaseDurationSec ?? 0,
  );

  /** Progreso: cuántos conectados ya confirmaron. */
  readonly confirmados = computed(
    () => this.jugadores().filter((p) => p.connected && p.acted).length,
  );
  readonly total = computed(
    () => this.jugadores().filter((p) => p.connected).length,
  );

  /** ¿Es la tarjeta que conozco? (la marco "vos" + le muestro el valor). */
  esMia(cardId: string): boolean {
    return this.miTarjeta()?.cardId === cardId;
  }

  /** Escala Fibonacci de estimación SCRUM. DEBE coincidir con la del server
   *  (server/src/challenges/tableroScrum.ts FIBONACCI_SP). */
  readonly FIBONACCI = [1, 2, 3, 5, 8, 13] as const;

  /** Devuelve tu estimación actual de una tarjeta (o undefined si no
   *  estimaste). La fuente de verdad vive en el GameService. */
  estimacionDe(cardId: string): number | undefined {
    return this.juego.misEstimaciones()[cardId];
  }

  /** Toca un chip: si NO estaba seleccionado, lo elige (envía la estimación
   *  al server). Si ya estaba seleccionado, lo deselecciona (envía 0 → el
   *  server borra la estimación, equivale a "sin estimar"). Si ya confirmaste,
   *  el botón está disabled y este handler igual sale temprano por seguridad. */
  clickChip(cardId: string, valor: number): void {
    if (this.yo()?.acted) return;
    const actual = this.estimacionDe(cardId);
    const nuevo = actual === valor ? 0 : valor;
    dlog('TableroScrum.estimar', { cardId, nuevo });
    this.juego.estimar(cardId, nuevo);
  }

  confirmar(): void {
    dlog('TableroScrum.confirmar');
    this.juego.confirmar();
  }
}
