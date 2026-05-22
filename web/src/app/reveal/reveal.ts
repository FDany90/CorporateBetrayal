import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Intro } from '../intro/intro';

/** Modo de aparición de un elemento del intro orquestado. */
export type RevealMode = 'type' | 'fade' | 'stamp' | 'slide' | 'kicker' | 'sello';

/** Duración (ms) de las animaciones que NO son tipeo. Coinciden con los
 *  keyframes reusados en styles.css (beatIn / stampSoftIn / etc.) y, para
 *  'sello', con la animación propia del estampado en cada pantalla. */
const DURACION: Record<Exclude<RevealMode, 'type'>, number> = {
  fade: 600,
  stamp: 800,
  slide: 900,
  kicker: 450,
  sello: 740,
};

const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * `appReveal` — un paso de aparición dentro de `<app-intro>`.
 *
 * Cada elemento marcado se registra con el `<app-intro>` padre, que los
 * reproduce **en orden, uno tras otro** (ver intro.ts). Hay dos familias:
 *
 *  - `type`  → efecto MÁQUINA DE ESCRIBIR: revela el texto carácter por
 *              carácter. Es "HTML-aware": camina los nodos de texto y los va
 *              llenando, así conserva el `<strong>` y los `<em class="verde">`
 *              (no aplana el formato). Muestra un caret mientras tipea.
 *  - el resto (`fade`/`stamp`/`slide`/`kicker`) → reusa los `@keyframes` que
 *              ya existían para los beats; el elemento arranca oculto y la
 *              animación se dispara cuando le toca su turno.
 *
 * Accesibilidad: con `prefers-reduced-motion` no anima ni tipea — muestra el
 * contenido completo de una. Un tap en el intro (ver Intro.skip) completa
 * todo al instante.
 *
 * Si por algún motivo no hay `<app-intro>` padre, el elemento se revela solo
 * al iniciar (fallback: no rompe nada).
 */
@Directive({
  selector: '[appReveal]',
})
export class Reveal implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly intro = inject(Intro, { optional: true });

  /** Modo de aparición. */
  @Input('appReveal') mode: RevealMode = 'fade';
  /** Velocidad de tipeo en caracteres por segundo (solo mode 'type'). */
  @Input() revealCps = 90;
  /** Pausa (ms) antes de empezar este paso — para dar aire entre bloques. */
  @Input() revealPause = 0;
  /** Orden explícito del paso en la secuencia. Si NO se setea, Intro usa el
   *  orden del DOM. Sirve para coreografías fuera de orden (ej. el Final
   *  revela la plantilla de abajo hacia arriba). */
  @Input() revealOrder?: number;

  /** El nodo, expuesto para que Intro ordene los pasos por posición en DOM. */
  readonly host = this.el;
  /** Orden explícito (o undefined → Intro cae al orden del DOM). */
  get order(): number | undefined {
    return this.revealOrder;
  }

  private segmentos: { node: Text; full: string }[] = [];
  private total = 0;
  private mostrado = 0;
  private terminado = false;
  private reducido = false;
  private intervalo?: ReturnType<typeof setInterval>;
  private timeout?: ReturnType<typeof setTimeout>;
  private resolver?: () => void;

  ngOnInit(): void {
    this.reducido =
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (this.mode === 'type') {
      this.el.classList.add('reveal-type');
      this.recolectarTexto();
      if (!this.reducido) this.revelarHasta(0); // vaciar hasta su turno
      this.el.classList.add('reveal-ready'); // visible (vacío) sin flash
    } else {
      this.el.classList.add('reveal', 'reveal-' + this.mode);
    }

    if (this.intro) {
      this.intro.registrar(this);
    } else {
      // Sin orquestador: revelarse solo para no quedar invisible.
      void this.play();
    }
  }

  ngOnDestroy(): void {
    this.pararTimers();
  }

  private pararTimers(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = undefined;
    }
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
  }

  /** Reproduce este paso. La promesa resuelve cuando terminó (para que el
   *  orquestador encadene el siguiente). */
  async play(): Promise<void> {
    if (this.terminado) return;
    if (this.revealPause && !this.reducido) await esperar(this.revealPause);
    if (this.terminado) return; // pudo haberse saltado durante la pausa
    if (this.mode === 'type') return this.tipear();
    return this.animar();
  }

  /** Completa este paso al instante (skip o reduced-motion). */
  completar(): void {
    if (this.terminado) return;
    this.pararTimers();
    if (this.mode === 'type') {
      this.revelarHasta(this.total);
      this.el.classList.remove('tw-typing');
    } else {
      this.el.classList.add('reveal-on');
    }
    this.terminado = true;
    this.resolver?.();
    this.resolver = undefined;
  }

  /* ---- tipeo (mode 'type') ---- */

  private tipear(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.reducido || this.total === 0) {
        this.revelarHasta(this.total);
        this.terminado = true;
        resolve();
        return;
      }
      this.resolver = resolve;
      this.el.classList.add('tw-typing');
      // El intervalo no baja de ~16ms (timers más rápidos no se notan y
      // saturan). Para cps altos revelamos VARIOS caracteres por tick, así
      // la velocidad real = pasoChars/tickMs ≈ revealCps a cualquier cps.
      const tickMs = Math.max(16, 1000 / this.revealCps);
      const pasoChars = Math.max(1, Math.round((this.revealCps * tickMs) / 1000));
      this.intervalo = setInterval(() => {
        this.mostrado = Math.min(this.total, this.mostrado + pasoChars);
        this.revelarHasta(this.mostrado);
        if (this.mostrado >= this.total) {
          this.pararTimers();
          this.el.classList.remove('tw-typing');
          this.terminado = true;
          this.resolver?.();
          this.resolver = undefined;
        }
      }, tickMs);
    });
  }

  /** Junta todos los nodos de texto del subárbol (en orden) y los vacía.
   *  Conserva la estructura de tags: solo manipula el texto. */
  private recolectarTexto(): void {
    const walker = document.createTreeWalker(this.el, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) {
      const t = n as Text;
      const full = t.textContent ?? '';
      this.segmentos.push({ node: t, full });
      this.total += full.length;
    }
  }

  /** Deja visibles los primeros `k` caracteres repartidos entre los nodos. */
  private revelarHasta(k: number): void {
    let resto = k;
    for (const seg of this.segmentos) {
      if (resto >= seg.full.length) {
        seg.node.textContent = seg.full;
        resto -= seg.full.length;
      } else {
        seg.node.textContent = seg.full.slice(0, Math.max(0, resto));
        resto = 0;
      }
    }
  }

  /* ---- animación (resto de modos) ---- */

  private animar(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.el.classList.add('reveal-on');
      const dur = this.reducido
        ? 0
        : DURACION[this.mode as Exclude<RevealMode, 'type'>];
      this.resolver = resolve;
      this.timeout = setTimeout(() => {
        this.timeout = undefined;
        this.terminado = true;
        this.resolver?.();
        this.resolver = undefined;
      }, dur);
    });
  }
}
