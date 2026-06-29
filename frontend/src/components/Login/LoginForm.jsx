import { useState } from 'react';
import { api, setToken } from '../../api/client';
import useParallax from '../../hooks/useParallax';
import PasswordInput from '../common/PasswordInput';
import { SECCIONES } from './secciones';
import CarruselTiendas from './CarruselTiendas';

/**
 * Formulario de login para una sección concreta. Único responsable del
 * intercambio de credenciales. La validación rol↔sección la hace el
 * backend ANTES de emitir el token (ver auth.service.login); aquí solo
 * mostramos el mensaje de error que devuelve el servidor.
 */
export default function LoginForm({ seccion, onVolver, onLogin }) {
  const s = SECCIONES[seccion];
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const parallax = useParallax();

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

  return (
    <div
      ref={parallax.ref}
      onMouseMove={parallax.onMouseMove}
      onMouseLeave={parallax.onMouseLeave}
      className={`login-wrap login-wrap--${seccion}`}
    >
      <form className={`login-card login-card--${seccion}`} onSubmit={entrar}>
        <button type="button" className="login-back" onClick={onVolver}>
          ← Volver
        </button>
        <div className="login-logo">
          <s.Icono size={72} />
        </div>
        <h1>{s.titulo}</h1>
        <p className="login-sub">{s.subtitulo}</p>

        {error && <div className="login-error">{error}</div>}

        <label>
          Usuario
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
            required
          />
        </label>
        <label>
          Contraseña
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button className="btn btn-primary login-btn" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      {seccion === 'tienda' && <CarruselTiendas />}
    </div>
  );
}
