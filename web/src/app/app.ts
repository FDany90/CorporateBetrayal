import { Component, computed, inject } from '@angular/core';
import { GameService } from './game.service';
import { DeskContext } from './desk-context/desk-context';
import { Ingreso } from './ingreso/ingreso';
import { Lobby } from './lobby/lobby';
import { Briefing } from './briefing/briefing';
import { Desafio } from './desafio/desafio';
import { Resultado } from './resultado/resultado';
import { Marcador } from './marcador/marcador';
import { Final } from './final/final';
import { Reunion } from './reunion/reunion';
import { Votacion } from './votacion/votacion';
import { Comunicado } from './comunicado/comunicado';
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
    Marcador, Final, Reunion, Votacion, Comunicado, Devbar,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  animations: [pageAnim],
})
export class App {
  /** protected: lo usa el template, no hace falta exponerlo más. */
  protected readonly juego = inject(GameService);

  /**
   * Fases en las que se muestra la ficha lateral (solo desktop). Son las
   * de juego activo donde el contexto persistente (tu Influencia, el día,
   * la sala) acompaña bien. Se EXCLUYEN a propósito:
   *  - lobby / ingreso: todavía no hay partida; el lobby ya lista la sala.
   *  - comunicado / final: momentos teatrales a pantalla plena (la ficha
   *    al lado le restaría dramatismo al sello/circular).
   */
  private static readonly FASES_CON_FICHA = new Set([
    'briefing', 'calls', 'meeting', 'vote', 'result', 'marcador',
  ]);

  /** ¿Mostrar la ficha lateral? (la oculta el CSS en mobile igual). */
  protected readonly mostrarFicha = computed(() => {
    const e = this.juego.estado();
    if (!e || e.status === 'lobby') return false;
    return App.FASES_CON_FICHA.has(e.phase);
  });
}
