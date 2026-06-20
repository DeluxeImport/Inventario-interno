import { useState } from 'react';
import { api } from '../../api/client';
import Modal from '../common/Modal';
import Combobox from '../common/Combobox';

// Unidad de medida: una simple etiqueta de cómo se cuenta el producto.
const UNIDADES = ['Unidad', 'Paquete', 'Caja', 'Docena', 'Bolsa', 'Rollo', 'Par', 'Metro', 'Litro', 'Frasco'];

export default function ProductoModal({ producto, categorias, onClose, onSaved, onError }) {
  const [form, setForm] = useState(producto);
  const esNuevo = !producto.id;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = async (e) => {
    e.preventDefault();
    try {
      if (esNuevo) await api.crearProducto(form);
      else await api.editarProducto(producto.id, form);
      onSaved();
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <Modal title={esNuevo ? 'Nuevo producto' : 'Editar producto'} onClose={onClose}>
      <form onSubmit={guardar} className="form">
        <label>
          Categoría
          <Combobox
            value={form.categoria}
            onChange={(v) => set('categoria', v)}
            options={categorias}
            placeholder="Selecciona una categoría…"
            nuevaLabel="➕ Otra categoría…"
            nuevaPlaceholder="Nueva categoría"
            required
          />
        </label>
        <label>
          Producto
          <input value={form.producto} onChange={(e) => set('producto', e.target.value)} required />
        </label>
        <label>
          Unidad de medida
          <Combobox
            value={form.unidad || ''}
            onChange={(v) => set('unidad', v)}
            options={UNIDADES}
            placeholder="Selecciona una unidad…"
            nuevaLabel="➕ Otra unidad…"
            nuevaPlaceholder="Nueva unidad"
          />
        </label>
        <div className="grid3">
          <label>
            Stock completo
            <input
              type="number"
              min="0"
              value={form.stockCompleto}
              onChange={(e) => set('stockCompleto', e.target.value)}
            />
          </label>
          <label>
            Stock incompleto
            <input
              type="number"
              min="0"
              value={form.stockIncompleto}
              onChange={(e) => set('stockIncompleto', e.target.value)}
            />
          </label>
          <label>
            Stock mínimo
            <input
              type="number"
              min="0"
              value={form.stockMinimo}
              onChange={(e) => set('stockMinimo', e.target.value)}
            />
          </label>
        </div>
        <label className="check-row">
          <input
            type="checkbox"
            checked={!!form.solicitable}
            onChange={(e) => set('solicitable', e.target.checked)}
          />
          <span>
            🎫 Solicitable por ticket
            <small>Permite que los usuarios pidan este producto en una solicitud.</small>
          </span>
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
    </Modal>
  );
}
