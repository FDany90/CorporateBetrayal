import { trigger, transition, style, animate } from '@angular/animations';

/**
 * pageAnim — animación de entrada de cada pantalla principal.
 *
 * Angular Animations: el `trigger` se aplica a un elemento del template
 * (acá, el wrapper `.page` que envuelve a cada pantalla). Cuando ese
 * elemento entra al DOM, Angular dispara el `transition(':enter', …)` y
 * corre la secuencia de `style` → `animate` definida abajo.
 *
 * Por ahora solo animamos `:enter` (la entrada). No definimos `:leave`
 * porque las pantallas usan `flex: 1` del contenedor `.app`; si dejáramos
 * la pantalla saliente en el DOM mientras entra la nueva, las dos
 * compartirían el espacio flex y "saltaría" el layout. Si más adelante
 * queremos cross-fade, lo resolvemos con `position: absolute`.
 *
 * La curva `cubic-bezier(.2,.7,.2,1)` es la típica "ease-out" suave:
 * arranca rápida y desacelera al final — se siente "decidida".
 */
export const pageAnim = trigger('pageAnim', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(10px)' }),
    animate(
      '260ms cubic-bezier(.2,.7,.2,1)',
      style({ opacity: 1, transform: 'translateY(0)' }),
    ),
  ]),
]);
