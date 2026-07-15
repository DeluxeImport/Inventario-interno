// Formateo de fechas de la interfaz.
//
// Sin segundos: no ayudan a decidir nada y ensucian la columna. Reloj de 24 h
// para que la hora ocupe siempre el mismo ancho y las columnas se alineen.
// Los formateadores se construyen una vez: `Intl.DateTimeFormat` es caro y
// estas funciones se llaman una vez por fila.

const LARGO = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const CORTO = new Intl.DateTimeFormat('es-PE', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** Fecha completa con año. Devuelve '—' si es nula. */
export const fmtFecha = (f) => (f ? LARGO.format(new Date(f)) : '—');

/** Fecha breve, sin año: para listas donde el contexto es reciente. */
export const fmtFechaCorta = (f) => (f ? CORTO.format(new Date(f)) : '—');
