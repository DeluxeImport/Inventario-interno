/**
 * Glifo del portal de Administración: una caja de almacén.
 * Monolínea y en `currentColor`, como el resto del set de iconos: el tono lo
 * decide el contenedor (`.login-logo`), no el propio SVG.
 */
export default function IconoAdmin({ size = 56 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M55 19.5 32 8 9 19.5v25L32 56l23-11.5v-25Z" />
      <path d="m9.6 19.8 22.4 11.2 22.4-11.2" />
      <path d="M32 55.4V31.4" />
      <path d="M20.5 13.8 43.6 25.4" opacity="0.45" />
    </svg>
  );
}
