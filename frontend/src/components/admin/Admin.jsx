import { useState } from 'react';
import Icon from '../common/Icon';
import Usuarios from './Usuarios';
import Bitacora from './Bitacora';

export default function Admin({ currentUser, onError }) {
  const [tab, setTab] = useState('usuarios');
  return (
    <div>
      <div className="subnav" role="group" aria-label="Secciones de administracion">
        <button
          className={tab === 'usuarios' ? 'on' : ''}
          onClick={() => setTab('usuarios')}
          aria-pressed={tab === 'usuarios'}
        >
          <Icon name="personas" size={14} />
          Usuarios
        </button>
        <button
          className={tab === 'bitacora' ? 'on' : ''}
          onClick={() => setTab('bitacora')}
          aria-pressed={tab === 'bitacora'}
        >
          <Icon name="lista" size={14} />
          Actividad
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
