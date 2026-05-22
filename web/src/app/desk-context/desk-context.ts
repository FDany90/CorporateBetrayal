import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { Avatar } from '../avatar/avatar';
import { temaDelDia } from '../challenge-meta';

/**
 * Ficha lateral del escritorio (desktop) — "ficha de personal".
 *
 * Solo se ve en desktop y solo durante las fases de juego (la monta
 * `app.html` de forma condicional dentro de `.rail`). En mobile no existe:
 * ese contexto vive en la `topbar` de cada pantalla.
 *
 * Muestra contexto PERSISTENTE que en mobile aparece y desaparece según la
 * pantalla: tu legajo (avatar + nombre), tu Influencia, el Día X de Y con su
 * tema, y quién está en la sala. NO muestra la Influencia ajena a propósito
 * (hay minijuegos de "marcador oculto"); el marcador se revela en su pantalla.
 *
 * Lee todo del GameService por signals computados — se repinta solo cuando
 * el server cambia el estado, igual que el resto de las pantallas.
 */
@Component({
  selector: 'app-desk-context',
  imports: [Avatar],
  templateUrl: './desk-context.html',
  styleUrl: './desk-context.css',
})
export class DeskContext {
  private readonly juego = inject(GameService);

  readonly miId = this.juego.miId;
  readonly jugadores = computed(() => this.juego.estado()?.players ?? []);
  readonly yo = computed(() =>
    this.jugadores().find((p) => p.id === this.miId()),
  );
  readonly hostId = computed(() => this.juego.estado()?.hostId ?? '');

  /** Tema editorial del día (mismo mapa que usa el appheader). */
  readonly tema = computed(() =>
    temaDelDia(this.juego.estado()?.challengeId ?? ''),
  );
  readonly dia = computed(() => this.juego.estado()?.ronda ?? 0);
  readonly diasTotal = computed(() => this.juego.estado()?.rondasTotal ?? 0);

  /** Cuántos jugadores hay conectados en la sala ahora. */
  readonly enSala = computed(
    () => this.jugadores().filter((p) => p.connected).length,
  );
}
