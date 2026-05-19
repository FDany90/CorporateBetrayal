import { Component, inject } from '@angular/core';
import { GameService } from './game.service';
import { Ingreso } from './ingreso/ingreso';
import { Lobby } from './lobby/lobby';
import { Briefing } from './briefing/briefing';
import { Desafio } from './desafio/desafio';
import { Resultado } from './resultado/resultado';

/*
 * Componente raíz — equivale al <main> de Game.tsx en la versión React.
 *
 * Rutea según el estado del juego: si no estoy en una sala, muestra la
 * pantalla de Ingreso. En los próximos incrementos sumará el Lobby y las
 * pantallas de partida.
 */
@Component({
  selector: 'app-root',
  imports: [Ingreso, Lobby, Briefing, Desafio, Resultado],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  /** protected: lo usa el template, no hace falta exponerlo más. */
  protected readonly juego = inject(GameService);
}
