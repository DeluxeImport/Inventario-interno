// Formatea una fecha ISO a fecha/hora local (es-PE). Devuelve '—' si es nula.
export const fmtFecha = (f) => (f ? new Date(f).toLocaleString('es-PE') : '—');
