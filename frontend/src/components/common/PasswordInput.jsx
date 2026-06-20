import { useState } from 'react';

// Campo de contraseña con botón de ojo para mostrar/ocultar.
export default function PasswordInput({ value, onChange, autoComplete, required, placeholder }) {
  const [show, setShow] = useState(false);
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
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        title={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        tabIndex={-1}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}
