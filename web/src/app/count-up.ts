import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  inject,
} from '@angular/core';

/**
 * `[appCountUp]` — anima el contenido de texto del elemento contando
 * desde 0 hasta el valor dado (sirve para puntajes que "suben").
 *
 * Uso:
 *   <span [appCountUp]="p.influence" [countDelay]="500"></span>
 *
 * El elemento debe contener SOLO el número (poné el emoji/etiqueta al
 * costado, en otro span). Soporta valores negativos. Respeta
 * `prefers-reduced-motion`: si está activo, escribe el valor final sin
 * animar.
 *
 * `countDelay` permite arrancar el conteo más tarde para coordinarlo con
 * un reveal escalonado (que cada fila empiece a contar cuando aparece).
 */
@Directive({
  selector: '[appCountUp]',
})
export class CountUp implements OnChanges, OnDestroy {
  /** Valor final al que contar. */
  @Input('appCountUp') value = 0;
  /** Valor desde el que arranca el conteo (default 0). Si se pasa el
   *  puntaje previo, el número sube o baja mostrando el cambio real. */
  @Input() from = 0;
  /** Espera (ms) antes de arrancar el conteo. */
  @Input() countDelay = 0;
  /** Duración del conteo (ms). */
  @Input() countDuration = 800;

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private rafId?: number;
  private startTimer?: ReturnType<typeof setTimeout>;

  ngOnChanges(): void {
    this.cancel();
    const target = this.value;
    this.setAria(target); // el lector anuncia el valor final, no los intermedios

    // Reduced-motion: mostrar el valor final sin animar.
    const reduce = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduce) {
      this.render(target);
      return;
    }

    this.render(this.from);
    this.startTimer = setTimeout(
      () => this.animate(this.from, target),
      this.countDelay,
    );
  }

  private animate(from: number, target: number): void {
    const start = performance.now();
    const dur = this.countDuration;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cúbico
      this.render(Math.round(from + (target - from) * eased));
      if (t < 1) this.rafId = requestAnimationFrame(tick);
      else this.render(target); // asegura el valor exacto al final
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private render(n: number): void {
    this.el.nativeElement.textContent = String(n);
  }

  /** Fija un aria-label con el valor final, así los lectores de pantalla
   *  anuncian el resultado y no los valores intermedios del conteo. */
  private setAria(value: number): void {
    this.el.nativeElement.setAttribute('aria-label', String(value));
  }

  private cancel(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.startTimer) clearTimeout(this.startTimer);
  }

  ngOnDestroy(): void {
    this.cancel();
  }
}
