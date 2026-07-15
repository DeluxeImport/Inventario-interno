/**
 * Set de iconos de la aplicación. Un único componente para no repartir SVG
 * sueltos por los componentes: así el trazo, el tamaño y la alineación
 * óptica son idénticos en toda la interfaz.
 *
 * Dibujados sobre una retícula de 24 con trazo de 1.6 y extremos redondeados,
 * al estilo de los símbolos del sistema en macOS. Heredan color vía
 * `currentColor` y tamaño vía la prop `size`.
 *
 * Decorativos por defecto (`aria-hidden`). Cuando el icono es la única
 * etiqueta de un control, pasa `title` y se anuncia como imagen accesible.
 */

const PATHS = {
  // Navegación
  caja: <><path d="M20.5 7.5 12 3.5 3.5 7.5v9L12 20.5l8.5-4v-9Z" /><path d="m3.7 7.6 8.3 4 8.3-4" /><path d="M12 20.3v-8.7" /></>,
  transfer: <><path d="M7 3.8v15.4" /><path d="m3.4 7.4 3.6-3.6 3.6 3.6" /><path d="M17 20.2V4.8" /><path d="m20.6 16.6-3.6 3.6-3.6-3.6" /></>,
  ticket: <><path d="M3.5 9.2a1.8 1.8 0 0 1 1.8-1.8h13.4a1.8 1.8 0 0 1 1.8 1.8 1.9 1.9 0 0 0 0 3.6 1.8 1.8 0 0 1-1.8 1.8H5.3a1.8 1.8 0 0 1-1.8-1.8 1.9 1.9 0 0 0 0-3.6Z" /><path d="M13.4 7.4v1.4" /><path d="M13.4 13.2v1.4" /></>,
  grafico: <><path d="M3.6 3.6v16.8h16.8" /><path d="m7.2 15.2 3.4-4 3 2.5 5.6-6.4" /></>,
  personas: <><circle cx="9.2" cy="7.4" r="3.4" /><path d="M2.8 20.4v-1.6a4 4 0 0 1 4-4h4.8a4 4 0 0 1 4 4v1.6" /><path d="M16.6 3.9a3.4 3.4 0 0 1 0 6.6" /><path d="M18.4 14.9a4 4 0 0 1 2.8 3.8v1.7" /></>,

  // Acciones
  buscar: <><circle cx="10.8" cy="10.8" r="6.4" /><path d="m19.6 19.6-4.2-4.2" /></>,
  mas: <><path d="M12 5.2v13.6" /><path d="M5.2 12h13.6" /></>,
  lapiz: <><path d="M12.6 20.4h7.8" /><path d="M16.4 3.9a2 2 0 0 1 2.8 2.8L7.6 18.3l-3.8.9.9-3.8Z" /></>,
  basura: <><path d="M3.8 6.2h16.4" /><path d="M8.4 6.2V4.4a.9.9 0 0 1 .9-.9h5.4a.9.9 0 0 1 .9.9v1.8" /><path d="M18.4 6.2 17.5 19a1.5 1.5 0 0 1-1.5 1.4H8a1.5 1.5 0 0 1-1.5-1.4L5.6 6.2" /><path d="M10.3 10.2v6" /><path d="M13.7 10.2v6" /></>,
  puntos: <><circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" /></>,
  cerrar: <><path d="m6.2 6.2 11.6 11.6" /><path d="M17.8 6.2 6.2 17.8" /></>,
  salir: <><path d="M9.4 20.4H5.6a1.8 1.8 0 0 1-1.8-1.8V5.4a1.8 1.8 0 0 1 1.8-1.8h3.8" /><path d="m15.6 16.6 4.6-4.6-4.6-4.6" /><path d="M20.2 12H9" /></>,
  volver: <><path d="M19.2 12H4.8" /><path d="m10.4 5.6-5.6 6.4 5.6 6.4" /></>,
  lista: <><path d="M9.4 6.2h10.8" /><path d="M9.4 12h10.8" /><path d="M9.4 17.8h10.8" /><circle cx="4.6" cy="6.2" r="1.1" fill="currentColor" stroke="none" /><circle cx="4.6" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="4.6" cy="17.8" r="1.1" fill="currentColor" stroke="none" /></>,

  // Contraseña
  ojo: <><path d="M2.4 12S6 5.6 12 5.6 21.6 12 21.6 12 18 18.4 12 18.4 2.4 12 2.4 12Z" /><circle cx="12" cy="12" r="3.1" /></>,
  ojoTachado: <><path d="M9.6 6a8.6 8.6 0 0 1 2.4-.3c6 0 9.6 6.3 9.6 6.3a15.6 15.6 0 0 1-2.6 3.3" /><path d="M6.4 7.8A15.5 15.5 0 0 0 2.4 12s3.6 6.4 9.6 6.4a8.9 8.9 0 0 0 3.4-.7" /><path d="M9.9 9.9a3.1 3.1 0 0 0 4.3 4.4" /><path d="m3.6 3.6 16.8 16.8" /></>,

  // Movimientos y estados
  entrada: <><path d="M12 4.4v13.2" /><path d="m6.4 12.6 5.6 5.6 5.6-5.6" /><path d="M4.6 20.4h14.8" /></>,
  salida: <><path d="M12 19.6V6.4" /><path d="m6.4 11.4 5.6-5.6 5.6 5.6" /><path d="M4.6 3.6h14.8" /></>,
  aviso: <><path d="M12 4.3 2.9 19.4h18.2Z" /><path d="M12 9.9v4.2" /><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" /></>,
  check: <><circle cx="12" cy="12" r="8.4" /><path d="m8.2 12.2 2.6 2.6 5-5.6" /></>,
  errorCirculo: <><circle cx="12" cy="12" r="8.4" /><path d="m9.2 9.2 5.6 5.6" /><path d="m14.8 9.2-5.6 5.6" /></>,
  prohibido: <><circle cx="12" cy="12" r="8.4" /><path d="m6.1 17.9 11.8-11.8" /></>,

  // Entidades
  tienda: <><path d="M3.6 9.2h16.8L18.9 4H5.1Z" /><path d="M4.8 9.2v11.2h14.4V9.2" /><path d="M9.6 20.4v-5.6h4.8v5.6" /></>,
  edificio: <><path d="M5.4 20.4V4.8a1.2 1.2 0 0 1 1.2-1.2h10.8a1.2 1.2 0 0 1 1.2 1.2v15.6" /><path d="M2.8 20.4h18.4" /><path d="M9 7.6h1.6" /><path d="M13.4 7.6H15" /><path d="M9 11.6h1.6" /><path d="M13.4 11.6H15" /><path d="M10.4 20.4v-4.2h3.2v4.2" /></>,
  persona: <><circle cx="12" cy="7.6" r="3.6" /><path d="M4.8 20.4v-1.2a5 5 0 0 1 5-5h4.4a5 5 0 0 1 5 5v1.2" /></>,
  etiqueta: <><path d="M3.8 11.2V4.8a1 1 0 0 1 1-1h6.4a1 1 0 0 1 .7.3l8 8a1 1 0 0 1 0 1.4l-6.4 6.4a1 1 0 0 1-1.4 0l-8-8a1 1 0 0 1-.3-.7Z" /><circle cx="7.8" cy="7.8" r="1.3" /></>,
  nota: <><path d="M6 3.6h8.4l4.6 4.6v12.2H6Z" /><path d="M14.2 3.6v4.8h4.8" /><path d="M9.2 13h6" /><path d="M9.2 16.6h4" /></>,
  descarga: <><path d="M12 3.6v11.2" /><path d="m7.6 10.6 4.4 4.4 4.4-4.4" /><path d="M4.4 15.6v3.2a1.6 1.6 0 0 0 1.6 1.6h12a1.6 1.6 0 0 0 1.6-1.6v-3.2" /></>,
  libro: <><path d="M4.2 5a1.4 1.4 0 0 1 1.4-1.4H18a1 1 0 0 1 1 1v13.8H5.6A1.4 1.4 0 0 0 4.2 19.8Z" /><path d="M4.2 19.8a1.4 1.4 0 0 1 1.4-1.4H19" /><path d="M8 7.8h7" /><path d="M8 11.2h7" /></>,
  megafono: <><path d="M4 9.4v3.2a1.4 1.4 0 0 0 1.4 1.4H8l6 4V5.4l-6 4H5.4A1.4 1.4 0 0 0 4 9.4Z" /><path d="M8 14v4.2a1.2 1.2 0 0 0 1.2 1.2h1a1.2 1.2 0 0 0 1.2-1.2v-2.6" /><path d="M18 8.6a4 4 0 0 1 0 4.8" /></>,
};

export default function Icon({ name, size = 16, title, className, strokeWidth = 1.6 }) {
  const path = PATHS[name];
  if (!path) return null;

  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      aria-label={title}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {path}
    </svg>
  );
}
