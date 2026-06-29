import { useState } from 'react';
import LoginSelector from './LoginSelector';
import LoginForm from './LoginForm';
import { SECCION_KEYS } from './secciones';

/**
 * Orquestador del login. Su única responsabilidad es alternar entre la
 * pantalla de selector y el formulario de la sección elegida.
 */
export default function Login({ onLogin }) {
  const [seccion, setSeccion] = useState(null);

  const seleccionar = (key) => {
    if (SECCION_KEYS.includes(key)) setSeccion(key);
  };

  if (!seccion) return <LoginSelector onSeleccionar={seleccionar} />;
  return <LoginForm seccion={seccion} onVolver={() => setSeccion(null)} onLogin={onLogin} />;
}
