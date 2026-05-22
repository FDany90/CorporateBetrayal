import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
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
 * el modal ocupa toda la pantalla.
 *
 * Accesibilidad (Tanda 2 de web-design-guidelines)
 * ------------------------------------------------
 *  - `role="dialog"` + `aria-modal="true"` + `aria-labelledby` en el HTML.
 *  - Tecla **Escape** → cierra (ver `onEscape`).
 *  - **Focus trap**: Tab desde el último elemento focusable salta al
 *    primero; Shift+Tab desde el primero salta al último. Implementado
 *    en `onTab` con HostListener para que solo aplique cuando el modal
 *    está montado.
 *  - **Auto-focus**: al abrir, el foco va al botón "Cerrar" (un sitio
 *    seguro: si el usuario ya estaba navegando por teclado, no pierde
 *    el hilo y puede salir con Enter sin tocar nada).
 *  - **Restaurar focus**: al destruirse el modal, devolvemos el foco al
 *    elemento que lo abrió (el avatar grande del ingreso).
 */
@Component({
  selector: 'app-avatar-picker',
  imports: [Avatar],
  templateUrl: './avatar-picker.html',
  styleUrl: './avatar-picker.css',
})
export class AvatarPicker implements OnInit, AfterViewInit, OnDestroy {
  /** Id del avatar actualmente elegido — lo recibe del padre al abrir. */
  @Input({ required: true }) currentId!: string;

  /** Se emite con el id elegido cuando el usuario toca "LISTO". */
  @Output() pick = new EventEmitter<string>();

  /** Se emite cuando el usuario cancela (tap en backdrop, ✕ o Escape). */
  @Output() close = new EventEmitter<void>();

  /** Selección temporal en el modal — hasta que confirme con LISTO. */
  readonly seleccion = signal<string>('');

  /** Catálogo completo para el grid. */
  readonly avatares = AVATARS;

  /** ElementRef del host (`<app-avatar-picker>`) — usado para buscar
   *  elementos focusables dentro del modal cuando hacemos focus trap. */
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  /** El elemento que tenía el foco ANTES de abrir el modal. Lo guardamos
   *  para devolverle el foco al cerrar — así el usuario de teclado vuelve
   *  exactamente al punto donde estaba (típicamente el botón que abrió
   *  el picker). */
  private previouslyFocused: HTMLElement | null = null;

  ngOnInit(): void {
    this.seleccion.set(this.currentId);
    // Guardar el elemento con foco antes de que el modal se monte —
    // típicamente el botón <app-avatar-current> del ingreso.
    this.previouslyFocused = document.activeElement as HTMLElement;
  }

  ngAfterViewInit(): void {
    // Auto-focus en el botón Cerrar — punto de entrada seguro: el usuario
    // de teclado puede salir con Enter sin "navegar" la lista.
    queueMicrotask(() => {
      const closeBtn = this.host.nativeElement
        .querySelector<HTMLElement>('.picker-close');
      closeBtn?.focus();
    });
  }

  ngOnDestroy(): void {
    // Devolver el foco al elemento que abrió el modal (si todavía existe
    // en el DOM y es focusable).
    this.previouslyFocused?.focus?.();
  }

  /** Tecla Escape → cancela (cierra el modal sin cambios). */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cancelar();
  }

  /**
   * Tecla Tab → "focus trap": si llegamos al final con Tab, volvemos
   * al principio; si llegamos al principio con Shift+Tab, vamos al
   * final. Eso evita que el foco se escape al fondo (cosa que
   * confunde a los usuarios de teclado).
   *
   * El selector de "focusables" cubre los casos típicos: button, link,
   * input, select, textarea, y cualquier elemento con tabindex >= 0.
   */
  @HostListener('document:keydown.tab', ['$event'])
  onTab(event: Event): void {
    // Angular tipa el $event de HostListener como Event; sabemos que es
    // un KeyboardEvent porque el binding es keydown.tab.
    const ke = event as KeyboardEvent;
    const focusables = this.host.nativeElement.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), ' +
      'select:not([disabled]), textarea:not([disabled]), ' +
      '[tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement;
    if (ke.shiftKey && active === first) {
      ke.preventDefault();
      last.focus();
    } else if (!ke.shiftKey && active === last) {
      ke.preventDefault();
      first.focus();
    }
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
