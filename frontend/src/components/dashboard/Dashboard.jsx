import EstadoBadge from '../common/EstadoBadge';
import Icon from '../common/Icon';

// Agotado antes que stock bajo: primero lo que ya no se puede entregar.
const PESO = { AGOTADO: 0, BAJO: 1, OK: 2 };

export default function Dashboard({ stats }) {
  if (!stats) return <p className="muted">Cargando…</p>;

  const categorias = Object.entries(stats.porCategoria).sort((a, b) => b[1] - a[1]);
  const mayor = categorias[0]?.[1] || 1;
  const alertas = [...stats.alertas].sort((a, b) => PESO[a.estado] - PESO[b.estado]);
  const necesitanReposicion = stats.bajoMinimo + stats.agotados;
  const porcentaje = stats.totalProductos
    ? Math.round((necesitanReposicion / stats.totalProductos) * 100)
    : 0;

  return (
    <div>
      <div className="cards">
        <div className="card card--hero">
          <span className="card-lbl">Necesitan reposición</span>
          <span className="card-num">{necesitanReposicion}</span>
          <span className="card-foot">
            de {stats.totalProductos} productos · {porcentaje}% del catálogo
          </span>
        </div>
        <div className="card card-danger">
          <span className="card-num">{stats.agotados}</span>
          <span className="card-lbl">Agotados</span>
        </div>
        <div className="card card-warn">
          <span className="card-num">{stats.bajoMinimo}</span>
          <span className="card-lbl">Bajo mínimo</span>
        </div>
        <div className="card">
          <span className="card-num">{categorias.length}</span>
          <span className="card-lbl">Categorías</span>
        </div>
      </div>

      <h3 className="section-title">
        <Icon name="aviso" size={15} />
        Productos que necesitan reposición
        {alertas.length > 0 && <span className="contador">· {alertas.length}</span>}
      </h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th className="num">Total</th>
              <th className="num">Mínimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {alertas.map((p) => (
              <tr
                key={p.id}
                className={p.estado === 'AGOTADO' ? 'row-alert row-alert--critica' : 'row-alert'}
              >
                <td data-label="Producto" className="strong">{p.producto}</td>
                <td data-label="Categoría">{p.categoria}</td>
                <td data-label="Total" className="num strong">{p.stockTotal}</td>
                <td data-label="Mínimo" className="num">{p.stockMinimo}</td>
                <td data-label="Estado">
                  <EstadoBadge estado={p.estado} />
                </td>
              </tr>
            ))}
            {alertas.length === 0 && (
              <tr>
                <td colSpan={5} className="muted center">
                  Todo el stock está por encima del mínimo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3 className="section-title">
        <Icon name="lista" size={15} />
        Productos por categoría
      </h3>
      <div className="cats-grid">
        {categorias.map(([c, n]) => (
          <div key={c} className="cat-chip">
            <span>{c}</span>
            <span className="cat-barra">
              <i style={{ width: `${(n / mayor) * 100}%` }} />
            </span>
            <strong>{n}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
