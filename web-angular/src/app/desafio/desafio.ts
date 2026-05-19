import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Pantalla del Desafío (fase "calls"): muestra a qué colega llamar y la
 * decisión secreta Compartir (verde) / Quedárselo (rojo).
 *
 * Si el número de jugadores es impar, uno queda sin pareja esa ronda: para
 * ese caso hay una rama aparte en el template.
 */
@Component({
  selector: 'app-desafio',
  templateUrl: './desafio.html',
})
export class Desafio {
  private readonly juego = inject(GameService);

  readonly miId = this.juego.miId;
  readonly jugadores = computed(() => this.juego.estado()?.players ?? []);
  readonly pairings = computed(() => this.juego.estado()?.pairings ?? []);
  readonly yo = computed(() =>
    this.jugadores().find((p) => p.id === this.miId()),
  );

  /** La pareja que me tocó (o undefined si quedé libre esta ronda). */
  readonly pairing = computed(() =>
    this.pairings().find(
      (pr) => pr.aId === this.miId() || pr.bId === this.miId(),
    ),
  );
  /** El id del colega que me tocó. */
  readonly partnerId = computed(() => {
    const pr = this.pairing();
    if (!pr) return null;
    return pr.aId === this.miId() ? pr.bId : pr.aId;
  });
  /** El registro completo del colega (o null si quedé sin pareja). */
  readonly partner = computed(() => {
    const id = this.partnerId();
    if (!id) return null;
    return this.jugadores().find((p) => p.id === id) ?? null;
  });

  /** Set con los ids de todos los jugadores emparejados esta ronda. */
  private readonly idsEnPareja = computed(() => {
    const s = new Set<string>();
    this.pairings().forEach((pr) => {
      s.add(pr.aId);
      s.add(pr.bId);
    });
    return s;
  });
  /** Cuántos jugadores están emparejados (denominador del progreso). */
  readonly total = computed(
    () => this.jugadores().filter((p) => this.idsEnPareja().has(p.id)).length,
  );
  /** Cuántos de los emparejados ya decidieron. */
  readonly decididos = computed(
    () =>
      this.jugadores().filter(
        (p) => this.idsEnPareja().has(p.id) && p.decision,
      ).length,
  );

  /** Mi decisión actual: "" | "verde" | "rojo". */
  readonly miDecision = computed(() => this.yo()?.decision ?? '');

  /** Envía (o cambia) mi decisión secreta. */
  decidir(valor: 'verde' | 'rojo'): void {
    dlog('Desafio.decidir', valor);
    this.juego.decidir(valor);
  }
}
