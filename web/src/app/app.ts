import { Component, OnInit, computed, inject } from '@angular/core';
import { GameService } from './game.service';
import { DeskContext } from './desk-context/desk-context';
import { Ingreso } from './ingreso/ingreso';
import { Lobby } from './lobby/lobby';
import { Briefing } from './briefing/briefing';
import { Desafio } from './desafio/desafio';
import { Resultado } from './resultado/resultado';
import { Marcador } from './marcador/marcador';
import { Final } from './final/final';
import { Votacion } from './votacion/votacion';
import { Comunicado } from './comunicado/comunicado';
import { TableroScrum } from './tablero-scrum/tablero-scrum';
import { Reconocimiento } from './reconocimiento/reconocimiento';
import { Devbar } from './devbar/devbar';
import { pageAnim } from './animations';

/*
 * Componente raíz — equivale al <main> de Game.tsx en la versión React.
 *
 * Rutea según el estado del juego: si no estoy en una sala, muestra la
 * pantalla de Ingreso. En los próximos incrementos sumará el Lobby y las
 * pantallas de partida.
 *
 * `animations: [pageAnim]` registra el trigger `@pageAnim` que el template
 * aplica al wrapper `.page` de cada pantalla — produce el fade+slide al
 * cambiar de fase (briefing → calls → vote → result, etc.).
 */
@Component({
  selector: 'app-root',
  imports: [
    DeskContext,
    Ingreso, Lobby, Briefing, Desafio, Resultado,
    Marcador, Final, Votacion, Comunicado, TableroScrum,
    Reconocimiento, Devbar,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  animations: [pageAnim],
})
export class App implements OnInit {
  /** protected: lo usa el template, no hace falta exponerlo más. */
  protected readonly juego = inject(GameService);

  ngOnInit(): void {
    // Listener GLOBAL para el "thud" de press en cualquier .btn de la app.
    // Cubrimos pointerdown (mouse + touch) Y keydown Enter/Space (teclado),
    // así el feedback es coherente entre input métodos. Document-level para
    // no repetirlo en cada componente y para que sobreviva si el botón se
    // destruye antes de completar.
    const aplicarPress = (btn: HTMLElement | null) => {
      if (!btn || btn.classList.contains('is-pressing')) return;
      btn.classList.add('is-pressing');
      setTimeout(() => btn.classList.remove('is-pressing'), 260);
    };
    document.addEventListener('pointerdown', (e) => {
      const target = e.target as HTMLElement | null;
      aplicarPress(target?.closest('.btn') as HTMLElement | null);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const target = e.target as HTMLElement | null;
      const btn = target?.closest('.btn') as HTMLElement | null;
      // Solo si el foco está EN el botón mismo (no en otro elemento que
      // por casualidad esté dentro de un .btn-wrapper hipotético).
      if (btn !== target) return;
      aplicarPress(btn);
    });
  }

  /**
   * Fases en las que se muestra la ficha lateral (solo desktop). Son las
   * de juego activo donde el contexto persistente (tu Influencia, el día,
   * la sala) acompaña bien. Se EXCLUYEN a propósito:
   *  - lobby / ingreso: todavía no hay partida; el lobby ya lista la sala.
   *  - comunicado / final: momentos teatrales a pantalla plena (la ficha
   *    al lado le restaría dramatismo al sello/circular).
   */
  private static readonly FASES_CON_FICHA = new Set([
    'briefing', 'calls', 'vote', 'tablero', 'reconocimiento',
    'result', 'marcador',
  ]);

  /** ¿Mostrar la ficha lateral? (la oculta el CSS en mobile igual). */
  protected readonly mostrarFicha = computed(() => {
    const e = this.juego.estado();
    if (!e || e.status === 'lobby') return false;
    return App.FASES_CON_FICHA.has(e.phase);
  });
}
