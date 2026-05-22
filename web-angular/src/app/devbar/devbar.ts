import { Component, computed, inject, signal } from '@angular/core';
import { GameService } from '../game.service';

/**
 * Devbar flotante — atajos de desarrollo durante la partida.
 *
 * Botón ⚙ fijo en la esquina inferior derecha; al tocarlo despliega
 * "Salir al lobby" y "Saltar fase". Solo se muestra cuando hay una
 * partida en curso (status === 'playing'); en el lobby/ingreso no
 * aparece (ahí los atajos viven en el panel del lobby).
 *
 * Es una herramienta de prueba: cuando deployemos a producción habría
 * que esconderla detrás de un flag de entorno. Por ahora siempre visible
 * en desarrollo.
 */
@Component({
  selector: 'app-devbar',
  templateUrl: './devbar.html',
  styleUrl: './devbar.css',
})
export class Devbar {
  private readonly juego = inject(GameService);

  /** ¿Hay una partida en curso? Fuera de 'playing' no mostramos nada. */
  readonly enPartida = computed(
    () => this.juego.estado()?.status === 'playing',
  );
  /** Fase actual — para mostrarla en la barra como referencia. */
  readonly fase = computed(() => this.juego.estado()?.phase ?? '');

  /** ¿El panel está desplegado? Arranca colapsado para no molestar. */
  readonly abierto = signal(false);

  toggle(): void {
    this.abierto.update((v) => !v);
  }

  salirAlLobby(): void {
    this.juego.devVolverLobby();
    this.abierto.set(false);
  }

  saltarFase(): void {
    this.juego.devSkipPhase();
  }
}
