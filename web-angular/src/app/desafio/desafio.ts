import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { Avatar } from '../avatar/avatar';
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
  imports: [Avatar],
  templateUrl: './desafio.html',
})
export class Desafio {
  private readonly juego = inject(GameService);

  readonly miId = this.juego.miId;
  readonly jugadores = computed(() => this.juego.estado()?.players ?? []);
  readonly pairings = computed(() => this.juego.estado()?.pairings ?? []);

  /** Tanda de llamadas actual y total — para el indicador "Tanda 2 de 3". */
  readonly tanda = computed(() => this.juego.estado()?.tanda ?? 0);
  readonly tandasTotal = computed(() => this.juego.estado()?.tandasTotal ?? 0);
  /** Ronda actual y total — para la cabecera. */
  readonly ronda = computed(() => this.juego.estado()?.ronda ?? 0);
  readonly rondasTotal = computed(() => this.juego.estado()?.rondasTotal ?? 0);
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

  /**
   * Soy el lado que INICIA la llamada. Por convención, el `aId` del pairing
   * llama y el `bId` espera — así nunca hay llamadas cruzadas (GDD §5).
   */
  readonly soyQuienLlama = computed(() => {
    const pr = this.pairing();
    return !!pr && pr.aId === this.miId();
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
