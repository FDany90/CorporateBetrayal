/**
 * Entorno de PRODUCCIÓN (el que usa `ng build` por defecto).
 *
 * `serverUrl`: URL pública del game server (Colyseus) en Railway.
 * Formato: `wss://<tu-app>.up.railway.app` — protocolo wss (TLS) y SIN
 * puerto (Railway expone en 443). Se completa después de deployar el
 * server. Si queda vacío, el cliente intenta derivarla del host (sirve
 * en localhost / red local, NO en producción con dominios distintos).
 */
export const environment = {
  production: true,
  // Game server (Colyseus) en Render. wss:// (TLS) + dominio, sin puerto.
  serverUrl: 'wss://corporatebetrayal.onrender.com',
};
