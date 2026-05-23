import { Component, computed, inject, signal } from '@angular/core';
import { GameService } from '../game.service';
import { Avatar } from '../avatar/avatar';
import { Brand } from '../brand/brand';
import { MINIJUEGOS } from '../challenge-meta';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Pantalla de Lobby: lista de jugadores en vivo, fichaje, bots de
 * desarrollo, expulsar jugadores y arrancar la partida.
 *
 * Todo el "estado calculado" (cuántos fichados, si soy anfitrión, etc.)
 * se arma con computed(): se recalcula solo cuando cambia el estado del
 * juego. El componente no guarda estado propio — solo deriva del server.
 */
@Component({
  selector: 'app-lobby',
  imports: [Avatar, Brand],
  templateUrl: './lobby.html',
})
export class Lobby {
  private readonly juego = inject(GameService);

  /** Mi sessionId, para marcar "vos" y ocultar mi botón de expulsar. */
  readonly miId = this.juego.miId;

  /*
   * El signal `estado` del servicio es StateView | null. Acá la app solo
   * rutea al Lobby cuando hay estado, pero TypeScript no lo sabe. Por eso
   * derivamos cada dato con computed() y un valor por defecto: nunca hay
   * que escribir `estado()!` y el código queda a prueba de null.
   */
  readonly code = computed(() => this.juego.estado()?.code ?? '');
  readonly hostId = computed(() => this.juego.estado()?.hostId ?? '');
  readonly jugadores = computed(() => this.juego.estado()?.players ?? []);

  /** Cuántos jugadores ficharon entrada. */
  readonly listos = computed(
    () => this.jugadores().filter((p) => p.ready).length,
  );
  /** Total de jugadores en la sala. */
  readonly total = computed(() => this.jugadores().length);
  /** ¿Hay algún bot? (para habilitar "Quitar bots"). */
  readonly hayBots = computed(() => this.jugadores().some((p) => p.isBot));
  /** Mi propio registro de jugador. */
  readonly yo = computed(() =>
    this.jugadores().find((p) => p.id === this.miId()),
  );
  /** ¿Soy el anfitrión? Solo el anfitrión puede empezar la partida. */
  readonly soyHost = computed(() => {
    const y = this.yo();
    return !!y && y.id === this.hostId();
  });
  /** ¿Ficharon todos? Es requisito para arrancar. */
  readonly todosFichados = computed(
    () => this.total() > 0 && this.jugadores().every((p) => p.ready),
  );
  /** ¿Se puede empezar? (2+ jugadores y todos fichados). */
  readonly puedeEmpezar = computed(
    () => this.total() >= 2 && this.todosFichados(),
  );
  /** Texto del botón de empezar, según qué falta. */
  readonly textoEmpezar = computed(() => {
    if (this.total() < 2) return 'Necesitás 2+ jugadores';
    if (!this.todosFichados()) {
      return `Faltan fichar (${this.listos()}/${this.total()})`;
    }
    return 'EMPEZAR PARTIDA';
  });

  /* ---------- acciones (delegan en el GameService) ---------- */

  /** Ficha o cancela el fichaje (invierte mi estado actual). */
  fichar(): void {
    const valor = !this.yo()?.ready;
    dlog('Lobby.fichar', { nuevoValor: valor });
    this.juego.ficharEntrada(valor);
  }

  agregarBots(n: number): void {
    dlog('Lobby.agregarBots', n);
    this.juego.agregarBots(n);
  }

  quitarBots(): void {
    dlog('Lobby.quitarBots');
    this.juego.limpiarBots();
  }

  expulsar(id: string): void {
    dlog('Lobby.expulsar', id);
    this.juego.expulsar(id);
  }

  empezar(): void {
    dlog('Lobby.empezar');
    this.juego.empezarPartida();
  }

  salir(): void {
    dlog('Lobby.salir');
    this.juego.salir();
  }

  /* ---------- atajos de desarrollo ---------- */

  /** Lista de minijuegos para el selector de "Partida rápida". */
  readonly minijuegos = MINIJUEGOS;
  /** Minijuego elegido en el selector ("" = partida normal completa). */
  readonly minijuegoElegido = signal('');

  /** Arranca una partida sin setup: bots + fichar + empezar. Si hay un
   *  minijuego elegido, juega una sola ronda de ese minijuego directo. */
  partidaRapida(): void {
    const id = this.minijuegoElegido();
    dlog('Lobby.partidaRapida', id);
    this.juego.devQuickStart(id || undefined);
  }
}
