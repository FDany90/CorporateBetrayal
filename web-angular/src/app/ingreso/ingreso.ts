import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameService } from '../game.service';
import { ThemeSwitcher } from '../theme-switcher/theme-switcher';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

const AVATARS = ['🧑‍💼', '👩‍💼', '🧑‍💻', '👨‍💼', '👩‍💻', '🧔'];

/**
 * Pantalla de ingreso: crear una sala nueva o unirse a una existente.
 *
 * `imports`: este componente es standalone, así que declara lo que usa en
 * su template — FormsModule (para [ngModel]) y el componente ThemeSwitcher.
 */
@Component({
  selector: 'app-ingreso',
  imports: [FormsModule, ThemeSwitcher],
  templateUrl: './ingreso.html',
})
export class Ingreso {
  /** El servicio compartido: la pantalla le pide crear/unirse a sala. */
  private readonly juego = inject(GameService);

  /** Lista de avatares para el selector. readonly: no cambia. */
  readonly avatares = AVATARS;

  /* --- estado del formulario (signals: la UI reacciona a cada cambio) --- */
  readonly modo = signal<'crear' | 'unirse'>('crear');
  readonly nickname = signal('');
  readonly code = signal('');
  readonly avatar = signal(AVATARS[0]);

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
