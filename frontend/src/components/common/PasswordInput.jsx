import { useState } from 'react';
import Icon from './Icon';

// Campo de contraseña con botón para mostrar/ocultar el texto.
export default function PasswordInput({ value, onChange, autoComplete, required, placeholder }) {
  const [show, setShow] = useState(false);
  const etiqueta = show ? 'Ocultar contraseña' : 'Mostrar contraseña';

  return (
    <div className="pass-field">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
      />
      <button
        type="button"
        className="pass-toggle"
        onClick={() => setShow((s) => !s)}
        aria-label={etiqueta}
        title={etiqueta}
        tabIndex={-1}
      >
        <Icon name={show ? 'ojoTachado' : 'ojo'} size={15} />
      </button>
    </div>
  );
}
