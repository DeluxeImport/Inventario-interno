import { useState } from 'react';
import { api } from '../../api/client';
import { AREAS } from '../../constants';
import Icon from '../common/Icon';
import PasswordInput from '../common/PasswordInput';

export default function UsuarioModal({ usuario, onClose, onSaved, onError }) {
  const nuevo = !!usuario.nuevo;
  const [form, setForm] = useState({
    username: usuario.username || '',
    nombre: usuario.nombre || '',
    rol: usuario.rol || 'usuario',
    tienda: usuario.tienda || '',
    area: usuario.area || '',
    password: '',
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = async (e) => {
    e.preventDefault();
    try {
      if (nuevo) {
        await api.crearUsuario(form);
      } else {
        const data = { nombre: form.nombre, rol: form.rol, tienda: form.tienda, area: form.area };
        if (form.password) data.password = form.password;
        await api.editarUsuario(usuario.id, data);
      }
      onSaved();
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{nuevo ? 'Nuevo usuario' : `Editar: ${usuario.username}`}</h3>
          <button className="icon-btn" onClick={onClose} title="Cerrar">
            <Icon name="cerrar" size={15} title="Cerrar" />
          </button>
        </div>
        <form className="form" onSubmit={guardar}>
          <label>
            Nombre de usuario
            <input
              value={form.username}
              onChange={(e) => set('username', e.target.value)}
              disabled={!nuevo}
              required
            />
          </label>
          <label>
            Nombre completo
            <input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required />
          </label>
          <label>
            Rol
            <select value={form.rol} onChange={(e) => set('rol', e.target.value)}>
              <option value="usuario">Usuario (almacén — ve todo menos admin)</option>
              <option value="tienda">Tienda (solo solicitudes/tickets)</option>
              <option value="lider">Líder de Área (solo solicitudes/tickets)</option>
              <option value="admin">Administrador (acceso total)</option>
            </select>
          </label>
          {form.rol === 'tienda' && (
            <label>
              Nombre de la tienda
              <input
                value={form.tienda}
                onChange={(e) => set('tienda', e.target.value)}
                placeholder="Ej. Tienda Miraflores"
              />
            </label>
          )}
          {form.rol === 'lider' && (
            <label>
              Área
              <select value={form.area} onChange={(e) => set('area', e.target.value)}>
                <option value="">Elegir área...</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            {nuevo ? 'Contraseña' : 'Nueva contraseña (dejar vacío para no cambiar)'}
            <PasswordInput
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              required={nuevo}
              placeholder={nuevo ? '' : '••••••'}
            />
          </label>
          <div className="modal-foot">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
