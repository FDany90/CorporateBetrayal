/* ============================================================
   El Reconocimiento del Mes — cuarto minijuego (grupal, kind 'reconocimiento').

   Asimetría total: un jugador al azar es el "jefe del mes" y tiene un
   Reconocimiento para otorgar a otro jugador (no puede elegirse a sí
   mismo). Los demás lobbean por Teams para convencerlo. El destinatario
   gana `bossDelta` Influencia. Una sola fase con timer; si se agota y
   el jefe no eligió, el server elige al azar entre los otros.
   ============================================================ */

import type { ChallengeDefinition } from "./registry";

export const RECONOCIMIENTO_DEL_MES: ChallengeDefinition = {
  id: "reconocimiento-del-mes",
  nombre: "El Reconocimiento del Mes",
  format: "grupal",
  kind: "reconocimiento",
  callRounds: 0,
  bossSeconds: 180, // 3 min de fase única
  bossDelta: 8, // el destinatario gana +8 Influencia
};
