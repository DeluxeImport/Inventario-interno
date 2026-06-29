import { APP_NAME } from '../../constants';
import useParallax from '../../hooks/useParallax';
import { SECCIONES } from './secciones';

/**
 * Pantalla inicial: el usuario elige entre Administración y Tiendas.
 * Sin lógica de auth aquí; solo navega al formulario seleccionado.
 */
export default function LoginSelector({ onSeleccionar }) {
  const parallax = useParallax();

  return (
    <div
      ref={parallax.ref}
      onMouseMove={parallax.onMouseMove}
      onMouseLeave={parallax.onMouseLeave}
      className="login-wrap login-wrap--picker"
    >
      <div className="login-picker">
        <h1 className="login-picker-title">{APP_NAME}</h1>
        <p className="login-picker-sub">Elige tu tipo de acceso</p>
        <div className="login-picker-cards">
          {Object.values(SECCIONES).map((s) => (
            <button
              key={s.key}
              type="button"
              className={`login-card-pick login-card-pick--${s.key}`}
              onClick={() => onSeleccionar(s.key)}
            >
              <div className="login-card-pick-icon">
                <s.Icono size={64} />
              </div>
              <div className="login-card-pick-title">{s.titulo}</div>
              {s.descripcion && <div className="login-card-pick-desc">{s.descripcion}</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
