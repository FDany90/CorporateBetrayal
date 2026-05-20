import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { Avatar } from '../avatar/avatar';
import { AVATARS, AVATAR_BY_ID } from '../avatars';

/**
 * `<app-avatar-picker>` — modal pantalla-completa para elegir avatar.
 *
 * Cómo se usa
 * -----------
 *   <app-avatar-picker
 *     [currentId]="avatarActual"
 *     (pick)="onAvatarElegido($event)"
 *     (close)="onCerrar()" />
 *
 * El padre decide cuándo montarlo (con un @if). Mientras esté en el DOM,
 * el modal ocupa toda la pantalla. Tocar afuera (backdrop) o el botón ✕
 * cierra sin aplicar cambios. Elegir un avatar + tocar "LISTO" emite
 * `pick` con el id elegido.
 *
 * Convención de eventos en Angular
 * --------------------------------
 *  @Output() expone un EventEmitter al padre. `(pick)` en el template es
 *  azúcar para "subscribirse al EventEmitter pick del hijo". Cuando el
 *  hijo llama `this.pick.emit(id)`, el padre recibe el valor.
 */
@Component({
  selector: 'app-avatar-picker',
  imports: [Avatar],
  templateUrl: './avatar-picker.html',
  styleUrl: './avatar-picker.css',
})
export class AvatarPicker implements OnInit {
  /** Id del avatar actualmente elegido — lo recibe del padre al abrir. */
  @Input({ required: true }) currentId!: string;

  /** Se emite con el id elegido cuando el usuario toca "LISTO". */
  @Output() pick = new EventEmitter<string>();

  /** Se emite cuando el usuario cancela (tap en backdrop o ✕). */
  @Output() close = new EventEmitter<void>();

  /** Selección temporal en el modal — hasta que confirme con LISTO. */
  readonly seleccion = signal<string>('');

  /** Catálogo completo para el grid. */
  readonly avatares = AVATARS;

  ngOnInit(): void {
    this.seleccion.set(this.currentId);
  }

  /** Devuelve la info (puesto + depto) del avatar actualmente seleccionado. */
  get info() {
    return AVATAR_BY_ID[this.seleccion()];
  }

  elegir(id: string): void {
    this.seleccion.set(id);
  }

  confirmar(): void {
    this.pick.emit(this.seleccion());
  }

  cancelar(): void {
    this.close.emit();
  }
}
