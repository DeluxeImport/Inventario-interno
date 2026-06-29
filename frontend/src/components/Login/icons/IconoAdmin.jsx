export default function IconoAdmin({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="iAdmTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#bfdbfe" />
        </linearGradient>
        <linearGradient id="iAdmFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c7d2fe" />
          <stop offset="100%" stopColor="#a5b4fc" />
        </linearGradient>
      </defs>
      <path d="M32 8 L56 20 L32 32 L8 20 Z" fill="url(#iAdmTop)" stroke="#93c5fd" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 20 L8 44 L32 56 L32 32 Z" fill="url(#iAdmFront)" stroke="#a5b4fc" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M56 20 L56 44 L32 56 L32 32 Z" fill="#e0e7ff" stroke="#a5b4fc" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M20 14 L44 26 L44 32 L20 20 Z" fill="#fde68a" stroke="#fcd34d" strokeWidth="1" />
    </svg>
  );
}
