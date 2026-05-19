/*
 * ⚠️ TEMPORAL — logs de depuración de la migración a Angular.
 * BORRAR antes de cerrar la migración (este archivo + sus usos `dlog(`).
 *
 * Imprime en consola qué función se invoca y con qué datos, con un prefijo
 * de color para distinguirlos del ruido del navegador.
 */
export function dlog(scope: string, ...datos: unknown[]): void {
  console.log(
    `%c[traición·${scope}]`,
    'color:#7c3aed;font-weight:bold',
    ...datos,
  );
}
