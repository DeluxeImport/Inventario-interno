import { useState } from 'react';
import Usuarios from './Usuarios';
import Bitacora from './Bitacora';

export default function Admin({ currentUser, onError }) {
  const [tab, setTab] = useState('usuarios');
  return (
    <div>
      <div className="subnav">
        <button className={tab === 'usuarios' ? 'on' : ''} onClick={() => setTab('usuarios')}>
          👥 Usuarios
        </button>
        <button className={tab === 'bitacora' ? 'on' : ''} onClick={() => setTab('bitacora')}>
          📋 Actividad
        </button>
      </div>
      {tab === 'usuarios' ? (
        <Usuarios currentUser={currentUser} onError={onError} />
      ) : (
        <Bitacora onError={onError} />
      )}
    </div>
  );
}
