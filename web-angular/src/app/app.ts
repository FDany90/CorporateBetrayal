import { Component } from '@angular/core';

/*
 * Componente raíz de la app — equivale al <main> de Game.tsx en la versión
 * React. En el Incremento 1 va a rutear a las pantallas según la fase del
 * juego; por ahora muestra solo un placeholder para verificar la base.
 *
 * - selector: la etiqueta con la que se monta (<app-root> en index.html).
 * - templateUrl: el HTML que dibuja.
 * - styleUrl: estilos propios del componente (vacío: usamos styles.css global).
 */
@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
