import { useCallback, useEffect, useRef } from 'react';

/**
 * Expone CSS variables --mx y --my (normalizadas a -1..1) en el elemento
 * referenciado, según la posición del mouse relativa a su bounding box.
 *
 * Patrón de uso:
 *   const { ref, onMouseMove, onMouseLeave } = useParallax();
 *   <div ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} />
 *
 * El estilo lee las variables vía calc() para mover orbes / gradientes en
 * GPU sin pasar por React state (cero re-renders).
 */
export default function useParallax() {
  const ref = useRef(null);
  const rafId = useRef(0);
  const next = useRef({ x: 0, y: 0 });

  const apply = useCallback(() => {
    rafId.current = 0;
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--mx', next.current.x.toFixed(3));
    el.style.setProperty('--my', next.current.y.toFixed(3));
  }, []);

  const onMouseMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      next.current.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      next.current.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!rafId.current) rafId.current = requestAnimationFrame(apply);
    },
    [apply]
  );

  const onMouseLeave = useCallback(() => {
    next.current = { x: 0, y: 0 };
    if (!rafId.current) rafId.current = requestAnimationFrame(apply);
  }, [apply]);

  // Cancela cualquier frame pendiente al desmontar para no llamar apply()
  // sobre un ref nulo (no rompe, pero es ruido innecesario).
  useEffect(() => () => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
