import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { fmtFecha } from '../../lib/format';
import Icon from '../common/Icon';

// Tamaño de página del backend (debe coincidir con el `limit` por defecto del servicio).
const PAGE_SIZE = 100;

export default function Movimientos({ onError, refreshKey, onChanged }) {
  const [movs, setMovs] = useState([]);
  const [hayMas, setHayMas] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);

  const cargar = useCallback(() => {
    api
      .movimientos()
      .then((data) => {
        setMovs(data);
        setHayMas(data.length === PAGE_SIZE);
      })
      .catch((e) => onError(e.message));
  }, [onError]);

  const cargarMas = useCallback(async () => {
    const ultimo = movs[movs.length - 1];
    if (!ultimo) return;
    setCargandoMas(true);
    try {
      const data = await api.movimientos(null, { cursor: ultimo.id });
      setMovs((prev) => [...prev, ...data]);
      setHayMas(data.length === PAGE_SIZE);
    } catch (e) {
      onError(e.message);
    } finally {
      setCargandoMas(false);
    }
  }, [movs, onError]);

  useEffect(() => {
    cargar();
  }, [cargar, refreshKey]);

  const borrar = async (m) => {
    if (
      !confirm(
        `¿Eliminar este movimiento (${m.tipo} de ${m.cantidad} de "${m.producto?.producto}")?\n` +
          'El stock se revertirá automáticamente.'
      )
    )
      return;
    try {
      await api.borrarMovimiento(m.id);
      cargar();
      onChanged?.();
    } catch (e) {
      onError(e.message);
    }
  };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Fecha</th>
            <th>Tipo</th>
            <th className="num">Cantidad</th>
            <th>Unidad</th>
            <th>Destino</th>
            <th>Responsable</th>
            <th>Observación</th>
            <th className="col-acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {movs.map((m) => (
            <tr key={m.id}>
              <td data-label="Producto" className="strong">{m.producto?.producto}</td>
              <td data-label="Fecha">{fmtFecha(m.fecha)}</td>
              <td data-label="Tipo">
                <span
                  className={`badge badge--icono badge-${m.tipo === 'ENTRADA' ? 'ok' : 'mov'}`}
                >
                  <Icon name={m.tipo === 'ENTRADA' ? 'entrada' : 'salida'} size={12} />
                  {m.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'}
                </span>
              </td>
              <td data-label="Cantidad" className="num strong">{m.cantidad}</td>
              <td data-label="Unidad">{m.producto?.unidad || '—'}</td>
              <td data-label="Destino">{m.destino ? <span className="badge badge-area">{m.destino}</span> : '—'}</td>
              <td data-label="Responsable">{m.responsable || '—'}</td>
              <td data-label="Observación">{m.observacion || '—'}</td>
              <td data-label="Acciones" className="actions">
                <div className="row-actions">
                  <button
                    className="icon-btn icon-btn--danger"
                    onClick={() => borrar(m)}
                    title="Eliminar movimiento"
                  >
                    <Icon name="basura" size={15} title="Eliminar movimiento" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {movs.length === 0 && (
            <tr>
              <td colSpan={9} className="muted center">
                Aún no hay movimientos registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {hayMas && (
        <div className="center" style={{ padding: '12px' }}>
          <button className="btn btn-sm" onClick={cargarMas} disabled={cargandoMas}>
            {cargandoMas ? 'Cargando…' : 'Cargar más'}
          </button>
        </div>
      )}
    </div>
  );
}
