import { Component, inject } from '@angular/core';
import { GameService } from './game.service';
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
}
