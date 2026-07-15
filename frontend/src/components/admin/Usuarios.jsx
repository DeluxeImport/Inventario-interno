import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { fmtFecha } from '../../lib/format';
import Icon from '../common/Icon';
import UsuarioModal from './UsuarioModal';

const ROL_LABEL = {
  admin: 'Administrador',
  tienda: 'Tienda',
  lider: 'Líder de Área',
  usuario: 'Usuario',
};

// El rol es una etiqueta, no un estado: solo el administrador se resalta.
const rolClase = (rol) => (rol === 'admin' ? 'badge-area' : 'badge-neutral');

export default function Usuarios({ currentUser, onError }) {
  const [usuarios, setUsuarios] = useState([]);
  const [editing, setEditing] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setUsuarios(await api.usuarios());
    } catch (e) {
      onError(e.message);
    }
  }, [onError]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const borrar = async (u) => {
    if (!confirm(`¿Eliminar al usuario "${u.username}"? Se borrará también su bitácora.`)) return;
    try {
      await api.borrarUsuario(u.id);
      cargar();
    } catch (e) {
      onError(e.message);
    }
  };

  const toggleActivo = async (u) => {
    try {
      await api.editarUsuario(u.id, { activo: !u.activo });
      cargar();
    } catch (e) {
      onError(e.message);
    }
  };

  return (
    <div>
      <div className="toolbar">
        <h3 className="admin-h3">Usuarios del sistema</h3>
        <button className="btn btn-primary" onClick={() => setEditing({ nuevo: true })}>
          <Icon name="mas" size={13} strokeWidth={2} />
          Nuevo usuario
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Tienda / Área</th>
              <th>Estado</th>
              <th>Último inicio</th>
              <th>Última IP</th>
              <th className="col-acciones">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td data-label="Usuario" className="strong">{u.username}</td>
                <td data-label="Nombre">{u.nombre}</td>
                <td data-label="Rol">
                  <span className={`badge ${rolClase(u.rol)}`}>{ROL_LABEL[u.rol] || u.rol}</span>
                </td>
                <td data-label="Tienda / Área">{u.tienda || u.area || '—'}</td>
                <td data-label="Estado">
                  <span className={`badge badge-${u.activo ? 'ok' : 'agotado'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td data-label="Último inicio">{fmtFecha(u.ultimoLogin)}</td>
                <td data-label="Última IP" className="mono">{u.ultimaIp || '—'}</td>
                <td data-label="Acciones" className="actions">
                  <div className="row-actions">
                    <button className="icon-btn" onClick={() => setEditing(u)} title="Editar">
                      <Icon name="lapiz" size={15} title="Editar" />
                    </button>
                    {u.id !== currentUser.id && (
                      <>
                        <button
                          className="icon-btn"
                          onClick={() => toggleActivo(u)}
                          title={u.activo ? 'Desactivar' : 'Activar'}
                        >
                          <Icon
                            name={u.activo ? 'prohibido' : 'check'}
                            size={15}
                            title={u.activo ? 'Desactivar' : 'Activar'}
                          />
                        </button>
                        <button
                          className="icon-btn icon-btn--danger"
                          onClick={() => borrar(u)}
                          title="Eliminar usuario"
                        >
                          <Icon name="basura" size={15} title="Eliminar usuario" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <UsuarioModal
          usuario={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            cargar();
          }}
          onError={onError}
        />
      )}
    </div>
  );
}
