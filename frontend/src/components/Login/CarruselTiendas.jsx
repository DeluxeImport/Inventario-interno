import { useMemo, useState } from 'react';
import { TIENDAS_CARRUSEL } from './tiendas';

// Track duplicado para que `translate(-50%)` cierre el loop sin salto
// visual. Constante de módulo: no recalcula en cada render.
const ITEMS = [...TIENDAS_CARRUSEL, ...TIENDAS_CARRUSEL];

/**
 * Carrusel decorativo de logos de tiendas debajo del login de Tiendas.
 *
 * Diseño:
 *  - Catálogo local (asset del frontend) → siempre se renderiza, sin
 *    dependencia de red.
 *  - Imágenes con error caen a un placeholder gestionado por state;
 *    nunca se muta el DOM directamente (no rompe la reconciliación).
 *  - `aria-hidden`: contenido puramente decorativo, no útil para SR.
 */
export default function CarruselTiendas() {
  const [erroneos, setErroneos] = useState(() => new Set());

  const marcarError = (slug) =>
    setErroneos((prev) => {
      if (prev.has(slug)) return prev;
      const next = new Set(prev);
      next.add(slug);
      return next;
    });

  const total = TIENDAS_CARRUSEL.length;

  return (
    <div className="tienda-carrusel" aria-hidden="true">
      <div className="tienda-carrusel-track">
        {ITEMS.map((t, i) => {
          const falla = erroneos.has(t.slug);
          return (
            <div
              key={`${t.slug}-${Math.floor(i / total)}`}
              className={'tienda-logo' + (falla ? ' tienda-logo--placeholder' : '')}
              title={t.nombre}
            >
              {falla ? (
                <span>{t.nombre.charAt(0)}</span>
              ) : (
                <img
                  src={`/tiendas/${t.slug}.png`}
                  alt=""
                  loading="eager"
                  decoding="async"
                  draggable="false"
                  width="52"
                  height="52"
                  onError={() => marcarError(t.slug)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
