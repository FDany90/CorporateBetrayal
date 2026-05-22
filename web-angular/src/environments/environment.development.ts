/**
 * Entorno de DESARROLLO (lo usa `ng serve` / `npm start`).
 *
 * `serverUrl` vacío a propósito: el cliente deriva la URL del game server
 * del host desde el que se abrió la web (localhost o la IP de la red
 * local), apuntando al puerto 2567. Así seguís corriendo el server local
 * sin tocar nada.
 */
export const environment = {
  production: false,
  serverUrl: '',
};
