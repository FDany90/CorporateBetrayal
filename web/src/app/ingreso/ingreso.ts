import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameService } from '../game.service';
import { Avatar } from '../avatar/avatar';
import { AvatarPicker } from '../avatar-picker/avatar-picker';
import { AVATAR_BY_ID, AVATAR_DEFAULT } from '../avatars';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Pantalla de ingreso: crear una sala nueva o unirse a una existente.
 *
 * `imports`: declara lo que usa el template — FormsModule (para [ngModel]),
 * Avatar (preview del avatar elegido) y AvatarPicker (modal de selección).
 *
 * Flujo del avatar:
 *  - Por defecto, el avatar es `AVATAR_DEFAULT` (primer empleado del catálogo).
 *  - El usuario toca el preview grande → se abre el modal `AvatarPicker`.
 *  - El modal emite `(pick)` con el id elegido → se guarda en `avatar`.
 *  - Cancelar el modal (tap afuera o ✕) no cambia el id actual.
 */
@Component({
  selector: 'app-ingreso',
  imports: [FormsModule, Avatar, AvatarPicker],
  templateUrl: './ingreso.html',
})
export class Ingreso {
  /** El servicio compartido: la pantalla le pide crear/unirse a sala. */
  private readonly juego = inject(GameService);

  /* --- estado del formulario (signals: la UI reacciona a cada cambio) --- */
  readonly modo = signal<'crear' | 'unirse'>('crear');
  readonly nickname = signal('');
  readonly code = signal('');
  readonly avatar = signal(AVATAR_DEFAULT);

  /** ¿Está abierto el modal de selección? */
  readonly pickerAbierto = signal(false);

  /** Puesto del avatar actual (para mostrar al lado del preview grande). */
  readonly puestoActual = computed(
    () => AVATAR_BY_ID[this.avatar()]?.puesto ?? '',
  );

  abrirPicker(): void {
    dlog('Ingreso.abrirPicker');
    this.pickerAbierto.set(true);
  }

  cerrarPicker(): void {
    dlog('Ingreso.cerrarPicker');
    this.pickerAbierto.set(false);
  }

  seleccionarAvatar(id: string): void {
    dlog('Ingreso.seleccionarAvatar', id);
    this.avatar.set(id);
    this.pickerAbierto.set(false);
  }

  /* --- estado del servicio, re-expuesto para que lo lea el template --- */
  readonly cargando = this.juego.cargando;
  readonly error = this.juego.error;
  readonly servidorUrl = this.juego.servidorUrl;

  /* --- valores derivados con computed(): se recalculan solos --- */
  readonly nombreOk = computed(() => this.nickname().trim().length >= 2);
  readonly codeOk = computed(() => this.code().trim().length === 5);
  readonly puede = computed(() =>
    this.modo() === 'crear' ? this.nombreOk() : this.nombreOk() && this.codeOk(),
  );

  /** El código de sala se guarda siempre en mayúsculas. */
  setCode(valor: string): void {
    this.code.set(valor.toUpperCase());
  }

  /** Envía el formulario: crear o unirse según el modo. */
  enviar(): void {
    dlog('Ingreso.enviar', {
      modo: this.modo(),
      nickname: this.nickname(),
      code: this.code(),
      avatar: this.avatar(),
    });
    if (!this.puede() || this.cargando()) {
      dlog('Ingreso.enviar', 'ignorado (formulario inválido o cargando)');
      return;
    }
    if (this.modo() === 'crear') {
      this.juego.crearSala(this.nickname().trim(), this.avatar());
    } else {
      this.juego.unirseSala(this.code(), this.nickname().trim(), this.avatar());
    }
  }
}
