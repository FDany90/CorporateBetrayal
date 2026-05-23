import { Component, Input, computed, inject } from '@angular/core';
import { GameService } from '../game.service';

/**
 * Marca corporativa de la partida — el nombre que configuró el anfitrión
 * al crear la sala (o "Sinergia Corp" por defecto). Centraliza el render
 * para no repetirlo en 10 topbars + memos.
 *
 * Dos variantes via el input `doc`:
 *  - default (topbar): aplica clase `.brand` — caja inline pequeña.
 *  - `[doc]="true"` (memos / Comunicado / Final): aplica `.doc-brand` —
 *    título grande del documento.
 *
 * En ambos casos los espacios del nombre se renderizan como un punto
 * champagne (`<span class="dot">·</span>`), igual que el "SINERGIA·CORP"
 * original. El `text-transform: uppercase` lo aplica el CSS global de
 * `.brand` / `.doc-brand`, así cualquier nombre queda en CAPS.
 */
@Component({
  selector: 'app-brand',
  imports: [],
  template: `<span [class.brand]="!doc" [class.doc-brand]="doc">
    @for (part of parts(); let last = $last; track $index) {
      {{ part }}@if (!last) {<span class="dot">·</span>}
    }
  </span>`,
})
export class Brand {
  /** true → variante "memo" (clase `.doc-brand`). */
  @Input() doc = false;

  private readonly juego = inject(GameService);
  /** Partes del nombre, separadas por espacios. Se reactivan cuando el
   *  state del juego trae un companyName distinto. */
  readonly parts = computed(() => this.juego.companyNameParts());
}
