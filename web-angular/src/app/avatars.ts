/**
 * Catálogo de avatares de SINERGIA·CORP.
 *
 * Cada avatar es una "ficha de empleado": id corto, puesto que ocupa
 * (rol corporativo satírico) y color del departamento al que pertenece
 * (se usa como fondo del marco "foto de carnet").
 *
 * El avatar se guarda en el server como un string opaco (el id). Cuando
 * la UI necesita pintarlo, busca acá la metadata y delega el dibujo en
 * `<app-avatar>`, que tiene los SVGs.
 *
 * Si el id no figura en este catálogo (caso: bots con avatares legacy
 * que eran emojis, o ids futuros sin SVG), `<app-avatar>` muestra un
 * fallback genérico para que nada explote.
 */

export interface AvatarInfo {
  id: string;
  puesto: string;
  dept: string;
  /** Color del fondo del marco "carnet" — uno por departamento. */
  deptColor: string;
}

export const AVATARS: AvatarInfo[] = [
  // Empleados "estándar"
  { id: 'emp-direccion', puesto: 'Dirección Ejecutiva',  dept: 'Ejecutivo',   deptColor: '#2b3a55' },
  { id: 'emp-sistemas',  puesto: 'Sistemas',             dept: 'IT',          deptColor: '#3a5530' },
  { id: 'emp-rrhh',      puesto: 'Recursos Humanos',     dept: 'RR. HH.',     deptColor: '#7a3b3b' },
  { id: 'emp-seguridad', puesto: 'Seguridad Patrimonial',dept: 'Operaciones', deptColor: '#4a4338' },
  // Personalidades extremas (sátira pura)
  { id: 'emp-coach',     puesto: 'Coach Motivacional',   dept: 'Cultura',     deptColor: '#c8843a' },
  { id: 'emp-visionario',puesto: 'CTO Visionario',       dept: 'Innovación',  deptColor: '#5a3a8a' },
  { id: 'emp-quemado',   puesto: 'Becario Quemado',      dept: 'Sin asignar', deptColor: '#4a4a4a' },
  { id: 'emp-jefe',      puesto: 'Gerencia Media',       dept: 'Mando',       deptColor: '#3a2218' },
  // Tipos de oficinista — personalidades reconocibles
  { id: 'emp-nerd',      puesto: 'Analista Junior',      dept: 'Auditoría',   deptColor: '#3a4a6a' },
  { id: 'emp-viejo',     puesto: 'Veterano',             dept: 'Senior',      deptColor: '#5a4030' },
  { id: 'emp-hippie',    puesto: 'Cultura Organizacional',dept: 'Bienestar',  deptColor: '#7a6a3a' },
  { id: 'emp-remera',    puesto: 'Casual Friday',        dept: 'Producto',    deptColor: '#3a6a5a' },
  // Sin SVG (placeholders mientras tanto)
  { id: 'emp-finanzas',  puesto: 'Contaduría',           dept: 'Finanzas',    deptColor: '#5a4a2a' },
  { id: 'emp-legales',   puesto: 'Asesoría Legal',       dept: 'Legales',     deptColor: '#403850' },
  { id: 'emp-disenio',   puesto: 'Diseño',               dept: 'Creativo',    deptColor: '#7a5530' },
];

/** Acceso rápido por id. */
export const AVATAR_BY_ID: Record<string, AvatarInfo> =
  Object.fromEntries(AVATARS.map((a) => [a.id, a]));

/** Default cuando alguien entra sin elegir (primera ficha del catálogo). */
export const AVATAR_DEFAULT = AVATARS[0].id;
