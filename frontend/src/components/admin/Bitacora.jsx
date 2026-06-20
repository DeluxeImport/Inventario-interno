import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { fmtFecha } from '../../lib/format';

export default function Bitacora({ onError }) {
  const [acts, setActs] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    api.usuarios().then(setUsuarios).catch(() => {});
  }, []);

  useEffect(() => {
    api
      .actividades(filtro || undefined)
      .then(setActs)
      .catch((e) => onError(e.message));
  }, [filtro, onError]);

  return (
    <div>
      <div className="toolbar">
        <h3 className="admin-h3">Bitácora de actividad</h3>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todos los usuarios</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre} ({u.username})
            </option>
          ))}
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha y hora</th>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Detalle</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {acts.map((a) => (
              <tr key={a.id}>
                <td data-label="Fecha">{fmtFecha(a.fecha)}</td>
                <td data-label="Usuario" className="strong">{a.usuario?.nombre || '—'}</td>
                <td data-label="Acción">{a.accion}</td>
                <td data-label="Detalle" className="muted">{a.detalle || '—'}</td>
                <td data-label="IP" className="mono">{a.ip || '—'}</td>
              </tr>
            ))}
            {acts.length === 0 && (
              <tr>
                <td colSpan={5} className="muted center">
                  Sin actividad registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
