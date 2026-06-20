import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { fmtFecha } from '../../lib/format';
import UsuarioModal from './UsuarioModal';

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
          + Nuevo usuario
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
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td data-label="Usuario" className="strong">{u.username}</td>
                <td data-label="Nombre">{u.nombre}</td>
                <td data-label="Rol">
                  <span
                    className={`badge badge-${
                      u.rol === 'admin'
                        ? 'mov'
                        : u.rol === 'tienda'
                        ? 'bajo'
                        : u.rol === 'lider'
                        ? 'area'
                        : 'ok'
                    }`}
                  >
                    {u.rol === 'admin'
                      ? 'Administrador'
                      : u.rol === 'tienda'
                      ? 'Tienda'
                      : u.rol === 'lider'
                      ? 'Líder de Área'
                      : 'Usuario'}
                  </span>
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
                  <button className="btn btn-sm" onClick={() => setEditing(u)}>
                    Editar
                  </button>
                  {u.id !== currentUser.id && (
                    <>
                      <button className="btn btn-sm" onClick={() => toggleActivo(u)}>
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => borrar(u)}>
                        Borrar
                      </button>
                    </>
                  )}
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
