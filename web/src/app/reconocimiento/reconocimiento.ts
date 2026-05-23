import { Component, computed, inject } from '@angular/core';
import { GameService } from '../game.service';
import { Avatar } from '../avatar/avatar';
import { Brand } from '../brand/brand';
import { Timer } from '../timer/timer';
import { temaDelDia } from '../challenge-meta';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Pantalla del Reconocimiento del Mes (fase 'reconocimiento').
 *
 * Asimetría total: un único jugador (state.bossId) es el "jefe del mes" y
 * decide a quién regalar el Reconocimiento (+8 Influencia). El resto solo
 * lobbea por voz en Teams.
 *
 * La pantalla tiene dos ramas según si soy o no el jefe:
 *  - **Vista jefe:** grilla con todos los colegas (sin mí) — toco uno para
 *    pre-seleccionarlo, "Otorgar Reconocimiento" lo confirma. El server
 *    bloquea el auto-regalo y la confirmación sin destinatario válido.
 *  - **Vista resto:** ficha grande del jefe (avatar + nombre) con un pulso
 *    al aparecer, copia que aclara que la decisión está en sus manos.
 */
@Component({
  selector: 'app-reconocimiento',
  imports: [Avatar, Brand, Timer],
  templateUrl: './reconocimiento.html',
  styleUrl: './reconocimiento.css',
})
export class Reconocimiento {
  private readonly juego = inject(GameService);

  readonly miId = this.juego.miId;
  readonly jugadores = computed(() => this.juego.estado()?.players ?? []);
  readonly yo = computed(() =>
    this.jugadores().find((p) => p.id === this.miId()),
  );

  /** Día actual y total + tema editorial — para el appheader. */
  readonly dia = computed(() => this.juego.estado()?.ronda ?? 0);
  readonly diasTotal = computed(() => this.juego.estado()?.rondasTotal ?? 0);
  readonly tema = computed(() =>
    temaDelDia(this.juego.estado()?.challengeId ?? ''),
  );

  /** Timer de la fase (lo publica el server): fin y duración total. */
  readonly phaseEndsAt = computed(() => this.juego.estado()?.phaseEndsAt ?? 0);
  readonly phaseDuration = computed(
    () => this.juego.estado()?.phaseDurationSec ?? 0,
  );

  /** Id del jefe del mes (publicado por el server al iniciar la fase). */
  readonly bossId = computed(() => this.juego.estado()?.bossId ?? '');
  /** ¿Soy yo el jefe? */
  readonly soyJefe = computed(() => this.miId() === this.bossId());
  /** El jugador-jefe (para mostrar avatar/nombre en la vista del resto). */
  readonly jefe = computed(() =>
    this.jugadores().find((p) => p.id === this.bossId()),
  );

  /** Candidatos a recibir el Reconocimiento: todos menos el jefe. */
  readonly candidatos = computed(() =>
    this.jugadores().filter((p) => p.id !== this.bossId()),
  );

  /** Destinatario pre-seleccionado por el jefe (id, o "" si todavía no
   *  eligió). Vive en `Player.decision` del jefe — se sincroniza en vivo. */
  readonly destinatarioId = computed(() => this.jefe()?.decision ?? '');
  /** El registro del destinatario pre-seleccionado (o null si todavía
   *  no eligió). Lo usa la vista del resto para mostrar en vivo a quién
   *  está considerando el jefe — genera tensión durante la llamada. */
  readonly destinatario = computed(() => {
    const id = this.destinatarioId();
    if (!id) return null;
    return this.jugadores().find((p) => p.id === id) ?? null;
  });
  /** ¿El jefe ya confirmó? Una vez true, no se puede cambiar. */
  readonly confirmado = computed(() => this.jefe()?.acted ?? false);
  /** ¿Soy yo el destinatario pre-seleccionado por el jefe? Lo uso en la
   *  vista del resto para destacar "te están por elegir a vos". */
  readonly meEstaEligiendo = computed(
    () => !!this.destinatarioId() && this.destinatarioId() === this.miId(),
  );

  /** Pre-seleccionar un destinatario (solo el jefe puede; bloqueado tras
   *  confirmar; el server además rechaza el auto-regalo). */
  elegir(idDestinatario: string): void {
    if (!this.soyJefe()) return;
    if (this.confirmado()) return;
    if (idDestinatario === this.miId()) return;
    dlog('Reconocimiento.elegir', idDestinatario);
    this.juego.regalar(idDestinatario);
  }

  /** Confirmar el Reconocimiento (cierra la fase). Requiere haber elegido. */
  confirmar(): void {
    if (!this.soyJefe()) return;
    if (this.confirmado()) return;
    if (!this.destinatarioId()) return;
    dlog('Reconocimiento.confirmar');
    this.juego.confirmar();
  }

  /** Etiqueta accesible de una tarjeta de candidato. */
  ariaCandidato(nombre: string, influencia: number, elegido: boolean): string {
    const base = `Otorgar Reconocimiento a ${nombre}, Influencia ${influencia}`;
    return elegido ? `${base} (seleccionado)` : base;
  }
}
