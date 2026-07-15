/**
 * Glifo del portal de Áreas: una retícula de departamentos.
 * Mismo trazo y misma regla de color (currentColor) que IconoAdmin/IconoTienda.
 */
export default function IconoArea({ size = 56 }) {
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
      <rect x="9" y="9" width="20" height="20" rx="4" />
      <rect x="35" y="9" width="20" height="20" rx="4" />
      <rect x="9" y="35" width="20" height="20" rx="4" />
      <rect x="35" y="35" width="20" height="20" rx="4" />
    </svg>
  );
}
