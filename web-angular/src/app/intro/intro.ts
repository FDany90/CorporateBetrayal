import {
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';

/**
 * `<app-intro>` — orquestador del "intro dramático" de las pantallas
 * (briefing, resultado, marcador, final).
 *
 * Cómo funciona
 * -------------
 *  - Los hijos que querés revelar uno por uno llevan la clase `.beat` y un
 *    `style="--i: N"` con su orden (0, 1, 2, …). El CSS global (styles.css)
 *    usa `--i` para calcular `animation-delay`, así cada beat entra ~500ms
 *    después del anterior con un fade+slide-up de 400ms.
 *
 *  - Este componente aporta dos cosas que el CSS solo no resuelve:
 *      1) `tap-para-saltar`: un click en cualquier parte del intro (host)
 *         agrega la clase `.skipped`, que en CSS anula las animaciones y
 *         deja todos los beats visibles al instante.
 *      2) un `setTimeout` que también marca `skipped = true` cuando termina
 *         la duración total (`totalMs`), por si en el futuro queremos
 *         enganchar un evento `done` al final natural.
 *
 * Por qué no Angular Animations
 * -----------------------------
 *  Las animaciones de aparición escalonadas son trivialmente CSS (un
 *  `@keyframes` + `animation-delay`). Lo que Angular Animations no hace
 *  cómodo es *cancelar* una animación en curso — y eso es exactamente lo
 *  que necesita el skip. Con CSS, el skip es una sola clase.
 *
 * Cómo se usa (ejemplo)
 * ---------------------
 *   <app-intro>
 *     <div class="content">
 *       <h1 class="beat" style="--i:0">El Botón del Bonus</h1>
 *       <p  class="beat" style="--i:1">Vas a hablar 1-a-1…</p>
 *       …
 *     </div>
 *     <div class="actionbar">
 *       <button class="btn beat" style="--i:4">ENTENDIDO</button>
 *     </div>
 *   </app-intro>
 *
 * El componente usa `display: flex; flex: 1` para mantener el layout del
 * `.screen` padre (que es column, con `.content` flex:1 y `.actionbar`
 * shrink:0). Los hijos del slot proyectado siguen comportándose como
 * estaban antes.
 */
@Component({
  selector: 'app-intro',
  template: '<ng-content />',
  // El host es el propio <app-intro>. Le ponemos clase .intro siempre;
  // la clase .skipped la agrega/saca el binding de abajo según el signal.
})
export class Intro implements OnInit, OnDestroy {
  /**
   * Duración aproximada de la secuencia (ms). El componente programa un
   * `setTimeout(totalMs)` que marca `skipped = true` al final — eso libera
   * cualquier `pointer-events: none` futuro y permite enganchar un evento
   * `done`. Las animaciones CSS de cada beat son independientes de este
   * valor; lo importante es que `totalMs` cubra hasta el último beat:
   * si lo dejás corto, la clase `.skipped` se activa antes y corta el
   * reveal de los últimos beats.
   *
   * @Input para que cada pantalla configure su propio ritmo (briefing
   * ~2.6s, final ~5s con el sello final).
   */
  @Input() totalMs = 2600;

  /** Signal interno: ¿ya se completó (por timer o tap-skip)? */
  private readonly skipped = signal(false);
  private timer?: ReturnType<typeof setTimeout>;

  // Host bindings: aplican atributos/clases al propio <app-intro>.
  // Equivalente Angular del "host" antiguo (Angular 16+) en formato de
  // decorador. Se actualizan reactivamente cuando cambia el signal.
  @HostBinding('class.intro') readonly hostIntro = true;
  @HostBinding('class.skipped') get hostSkipped() { return this.skipped(); }

  // Click en cualquier parte del intro → skip. Si el usuario tocó el
  // botón ENTENDIDO, el evento burbujea hasta acá y también dispara
  // skip(), pero como ya estará skipped, el setter es idempotente.
  @HostListener('click') onClick(): void {
    this.skipped.set(true);
  }

  constructor(_el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    // Programamos el "final natural": cuando termina la secuencia,
    // marcamos skipped=true para dejar pointer-events normales y poder,
    // más adelante, emitir un evento `done` si lo necesitamos.
    this.timer = setTimeout(() => this.skipped.set(true), this.totalMs);
  }

  ngOnDestroy(): void {
    // Evitar fugas: si el componente se destruye antes (cambio de fase,
    // reconexión, etc.), cancelamos el timer pendiente.
    if (this.timer) clearTimeout(this.timer);
  }
}
