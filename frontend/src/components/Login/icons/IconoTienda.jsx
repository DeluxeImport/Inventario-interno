export default function IconoTienda({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="iTndAwn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fecaca" />
          <stop offset="100%" stopColor="#fca5a5" />
        </linearGradient>
        <linearGradient id="iTndWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d1fae5" />
          <stop offset="100%" stopColor="#a7f3d0" />
        </linearGradient>
      </defs>
      <rect x="10" y="26" width="44" height="28" rx="3" fill="url(#iTndWall)" stroke="#6ee7b7" strokeWidth="1.2" />
      <path d="M8 16 L56 16 L52 28 L12 28 Z" fill="url(#iTndAwn)" stroke="#fda4af" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M14 28 L18 16 M22 28 L26 16 M30 28 L34 16 M38 28 L42 16 M46 28 L50 16" stroke="#fff" strokeWidth="1.2" opacity="0.7" />
      <rect x="26" y="34" width="12" height="20" rx="2" fill="#fef3c7" stroke="#fcd34d" strokeWidth="1.1" />
      <circle cx="35" cy="44" r="0.9" fill="#a16207" />
      <rect x="14" y="34" width="8" height="10" rx="1.2" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="1" />
      <rect x="42" y="34" width="8" height="10" rx="1.2" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="1" />
    </svg>
  );
}
