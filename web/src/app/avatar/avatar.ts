import { Component, HostBinding, Input } from '@angular/core';
import { AVATAR_BY_ID } from '../avatars';

/**
 * Ids del catálogo que ya tienen SVG dibujado. Los que NO están acá
 * caen al placeholder con la inicial del puesto sobre el color del
 * depto. Cuando dibujemos el resto, agregamos su id a esta lista y
 * eventualmente esta constante se borra (ya no hay placeholders).
 */
const IDS_CON_SVG = new Set<string>([
  'emp-direccion',
  'emp-sistemas',
  'emp-rrhh',
  'emp-seguridad',
  'emp-coach',
  'emp-visionario',
  'emp-quemado',
  'emp-jefe',
  'emp-nerd',
  'emp-viejo',
  'emp-hippie',
  'emp-remera',
  'emp-finanzas',
  'emp-legales',
  'emp-disenio',
]);

/**
 * `<app-avatar [id]="..." [size]="56" />`
 *
 * Renderiza el SVG del avatar correspondiente al id, dentro de un marco
 * redondo "foto de perfil" — fondo neutro crema, borde fino tinta.
 *
 * Si el id todavía no tiene SVG (está en transición), muestra un
 * placeholder con la inicial del puesto sobre el color del depto. Eso
 * también cubre el caso de ids legacy (emojis viejos de bots) — caen al
 * placeholder con un `?`.
 *
 * Convención de los SVGs internos
 * -------------------------------
 *  - viewBox `0 0 100 100`.
 *  - Cabeza GRANDE y caricaturesca (ellipse cx=50 cy=44 rx~28 ry~30):
 *    ocupa el 60-70% del marco — estilo "business cartoon avatar".
 *  - Cuello chiquito (rect x=43 y=72 w=14 h=8).
 *  - Torso solo asoma debajo del círculo (y=80→100) — la mayor parte
 *    queda recortada por el overflow:hidden del marco redondo. Esto
 *    permite que se vea "solapa de saco" / "cuello de blusa" sin
 *    pelearse con la cabeza.
 *  - Ojos cartoon: circles de r=2.5 — expresivos. Boca arco corto.
 *  - Sin background dentro del SVG: el marco lo provee.
 */
@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
})
export class Avatar {
  /** Id del avatar (ver `avatars.ts`). */
  @Input({ required: true }) id!: string;

  /** Tamaño del marco en px. */
  @Input() size = 56;

  /**
   * Setea la CSS var `--avatar-size` en el host (el elemento `<app-avatar>`).
   * Es importante hacerlo acá y NO en un hijo: el `:host` (avatar.css) lee
   * `var(--avatar-size)` para definir width/height; si la variable estuviera
   * en un descendiente, el :host no la vería y caería al default 56px,
   * dando la sensación de que `[size]` "no hace nada".
   *
   * El `.px` después del nombre le dice a Angular que el valor numérico se
   * interpreta en píxeles (renderiza `--avatar-size: 92px`).
   */
  @HostBinding('style.--avatar-size.px') get sizeVar() { return this.size; }

  /** Color del depto (lo lee del catálogo, gris si el id es desconocido). */
  get deptColor(): string {
    return AVATAR_BY_ID[this.id]?.deptColor ?? '#5a4f44';
  }

  /** Para el placeholder: primera letra del puesto, o '?'. */
  get inicial(): string {
    const info = AVATAR_BY_ID[this.id];
    return info ? info.puesto.charAt(0).toUpperCase() : '?';
  }

  /** ¿El id tiene SVG dibujado? (decide marco neutro o color del depto). */
  get tieneSvg(): boolean {
    return IDS_CON_SVG.has(this.id);
  }
}
