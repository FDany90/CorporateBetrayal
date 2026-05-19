import { Component, signal } from '@angular/core';
import { dlog } from '../dlog'; // TEMPORAL: logs de depuración

/**
 * Conmutador de paleta — previsualiza las 2 propuestas de estilo.
 *
 * Cambia el atributo `data-theme` del <html>; el CSS de styles.css aplica
 * la paleta según ese atributo. La elección se guarda en localStorage.
 */
@Component({
  selector: 'app-theme-switcher',
  templateUrl: './theme-switcher.html',
})
export class ThemeSwitcher {
  /** Tema activo. Signal: cuando cambia, el template se repinta solo. */
  readonly tema = signal('azul');

  constructor() {
    // Al crearse el componente, recuperar el tema guardado y aplicarlo.
    const guardado = localStorage.getItem('traicion.tema') || 'azul';
    this.aplicar(guardado);
  }

  /** Cambia el tema (llamado desde el template) y lo persiste. */
  cambiar(t: string): void {
    dlog('ThemeSwitcher.cambiar', t);
    this.aplicar(t);
    localStorage.setItem('traicion.tema', t);
  }

  private aplicar(t: string): void {
    this.tema.set(t);
    // Nota: dataset['theme'] (no .theme) por noPropertyAccessFromIndexSignature.
    document.documentElement.dataset['theme'] = t;
  }
}
