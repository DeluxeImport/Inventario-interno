import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import Modal from '../common/Modal';
import Combobox from '../common/Combobox';
import Icon from '../common/Icon';
import { RESPONSABLES } from '../../constants';

export default function MovimientoModal({ producto, onClose, onSaved, onError }) {
  const [tipo, setTipo] = useState('ENTRADA');
  const [cantidad, setCantidad] = useState(1);
  const [destino, setDestino] = useState('');
  const [responsable, setResponsable] = useState('');
  const [observacion, setObservacion] = useState('');
  const [destinos, setDestinos] = useState({ tiendas: [], areas: [] });

  useEffect(() => {
    api.destinos().then(setDestinos).catch(() => {});
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    try {
      await api.crearMovimiento({
        productoId: producto.id,
        tipo,
        cantidad,
        destino,
        responsable,
        observacion,
      });
      onSaved();
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <Modal title={`Movimiento · ${producto.producto}`} onClose={onClose}>
      <form onSubmit={guardar} className="form">
        <p className="muted">
          Stock completo actual: <strong>{producto.stockCompleto}</strong> {producto.unidad}
        </p>
        <div className="seg" role="group" aria-label="Tipo de movimiento">
          <button
            type="button"
            className={tipo === 'ENTRADA' ? 'seg-on entrada' : ''}
            onClick={() => setTipo('ENTRADA')}
            aria-pressed={tipo === 'ENTRADA'}
          >
            <Icon name="entrada" size={13} />
            Entrada
          </button>
          <button
            type="button"
            className={tipo === 'SALIDA' ? 'seg-on salida' : ''}
            onClick={() => setTipo('SALIDA')}
            aria-pressed={tipo === 'SALIDA'}
          >
            <Icon name="salida" size={13} />
            Salida
          </button>
        </div>
        <label>
          Cantidad ({producto.unidad})
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            required
          />
        </label>
        {tipo === 'SALIDA' && (
          <label>
            Destino (tienda / área)
            <select value={destino} onChange={(e) => setDestino(e.target.value)}>
              <option value="">Seleccionar destino...</option>
              {destinos.tiendas.length > 0 && (
                <optgroup label="Tiendas">
                  {destinos.tiendas.map((t) => (
                    <option key={`t-${t}`} value={t}>
                      {t}
                    </option>
                  ))}
                </optgroup>
              )}
              {destinos.areas.length > 0 && (
                <optgroup label="Áreas">
                  {destinos.areas.map((a) => (
                    <option key={`a-${a}`} value={a}>
                      {a}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
        )}
        <label>
          Responsable
          <Combobox
            value={responsable}
            onChange={setResponsable}
            options={RESPONSABLES}
            placeholder="Seleccionar responsable…"
            nuevaLabel="Otro…"
            nuevaPlaceholder="Nombre del responsable"
          />
        </label>
        <label>
          Observación
          <input
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Opcional"
          />
        </label>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Registrar
          </button>
        </div>
      </form>
    </Modal>
  );
}
