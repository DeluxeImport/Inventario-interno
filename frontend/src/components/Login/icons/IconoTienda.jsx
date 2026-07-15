/**
 * Glifo del portal de Tiendas: una fachada con toldo.
 * Mismo trazo y misma regla de color que IconoAdmin.
 */
export default function IconoTienda({ size = 56 }) {
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
      <path d="M9 26h46l-4.5-12h-37Z" />
      <path d="M12.5 26v28h39V26" />
      <path d="M26 54V38h12v16" />
      <path d="M24.5 14 21 26M39.5 14 43 26" opacity="0.45" />
    </svg>
  );
}
