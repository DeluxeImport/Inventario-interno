import { useState } from 'react';
import { api, setToken } from '../../api/client';
import Icon from '../common/Icon';
import PasswordInput from '../common/PasswordInput';
import CarruselTiendas from './CarruselTiendas';
import { SECCIONES, SECCION_KEYS } from './secciones';
import coralLogoWhite from '../../assets/coral-logo-white.png';
import coralIconWhite from '../../assets/coral-icon-white.png';
import coralLogo from '../../assets/coral-logo.png';
import coralTeam from '../../assets/coral-team.png';

/**
 * Pantalla única de acceso: portada de marca a la izquierda, formulario con
 * los 3 portales (tabs) a la derecha. El portal elegido viaja en cada
 * intento de login; el backend valida que coincida con el rol de la cuenta
 * ANTES de emitir el token (ver auth.service.login en el backend).
 */
export default function Login({ onLogin }) {
  const [seccion, setSeccion] = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const cambiarSeccion = (key) => {
    if (key === seccion) return;
    setSeccion(key);
    setUsername('');
    setPassword('');
    setError('');
  };

  const entrar = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.login(username, password, seccion);
      setToken(token);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const s = SECCIONES[seccion];

  return (
    <div className="login-split">
      <div className="login-cover">
        <img className="login-cover-mark" src={coralIconWhite} alt="" aria-hidden="true" />
        <img className="login-cover-logo" src={coralLogoWhite} alt="Coral" />

        <div className="login-cover-people" aria-hidden="true">
          <img src={coralTeam} alt="" />
        </div>

        <div className="login-cover-msg">
          <h2>Un solo sistema para almacén, tiendas y áreas.</h2>
          <p>Stock, movimientos y solicitudes de todo el equipo Coral, en un solo lugar.</p>
        </div>
      </div>

      <div className="login-form-pane">
        <form className="login-unified-card" onSubmit={entrar}>
          <img className="login-form-logo" src={coralLogo} alt="Coral" />
          <h1 className="login-unified-title">Inicio de sesión</h1>
          <div className="tabs" role="tablist" aria-label="Portal de acceso">
            {SECCION_KEYS.map((key) => {
              const sec = SECCIONES[key];
              const activo = seccion === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  className="tab"
                  data-on={activo}
                  onClick={() => cambiarSeccion(key)}
                >
                  <Icon name={sec.icono} size={14} />
                  {sec.titulo}
                </button>
              );
            })}
          </div>
          <p className="login-unified-sub">{s.subtitulo}</p>

          {error && <div className="login-error">{error}</div>}

          <label>
            Usuario
            <div className="login-field">
              <Icon name="persona" size={15} className="login-field-icon" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                placeholder="tu.usuario"
                required
              />
            </div>
          </label>
          <label>
            Contraseña
            <div className="login-field login-field--pass">
              <Icon name="candado" size={15} className="login-field-icon" />
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </div>
          </label>
          <button className="btn btn-primary login-unified-btn" disabled={loading}>
            {loading ? 'Ingresando...' : (
              <>
                Ingresar
                <Icon name="flecha" size={15} className="login-btn-arrow" />
              </>
            )}
          </button>

          <p className="login-support">
            ¿Problemas para ingresar?{' '}
            <a href="https://wa.me/51926961214" target="_blank" rel="noopener noreferrer">
              Escríbenos por WhatsApp
            </a>
          </p>

          {seccion === 'tienda' && <CarruselTiendas />}
        </form>
      </div>
    </div>
  );
}
