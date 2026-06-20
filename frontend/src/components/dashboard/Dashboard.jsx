import EstadoBadge from '../common/EstadoBadge';

export default function Dashboard({ stats }) {
  if (!stats) return <p className="muted">Cargando...</p>;
  return (
    <div>
      <div className="cards">
        <div className="card">
          <span className="card-num">{stats.totalProductos}</span>
          <span className="card-lbl">Productos</span>
        </div>
        <div className="card card-warn">
          <span className="card-num">{stats.bajoMinimo}</span>
          <span className="card-lbl">Bajo mínimo</span>
        </div>
        <div className="card card-danger">
          <span className="card-num">{stats.agotados}</span>
          <span className="card-lbl">Agotados</span>
        </div>
        <div className="card">
          <span className="card-num">{Object.keys(stats.porCategoria).length}</span>
          <span className="card-lbl">Categorías</span>
        </div>
      </div>

      <h3 className="section-title">⚠️ Productos que necesitan reposición</h3>
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
            {stats.alertas.map((p) => (
              <tr key={p.id} className="row-alert">
                <td data-label="Producto" className="strong">{p.producto}</td>
                <td data-label="Categoría">{p.categoria}</td>
                <td data-label="Total" className="num strong">{p.stockTotal}</td>
                <td data-label="Mínimo" className="num">{p.stockMinimo}</td>
                <td data-label="Estado">
                  <EstadoBadge estado={p.estado} />
                </td>
              </tr>
            ))}
            {stats.alertas.length === 0 && (
              <tr>
                <td colSpan={5} className="muted center">
                  ✅ Todo el stock está por encima del mínimo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3 className="section-title">Productos por categoría</h3>
      <div className="cats-grid">
        {Object.entries(stats.porCategoria)
          .sort((a, b) => b[1] - a[1])
          .map(([c, n]) => (
            <div key={c} className="cat-chip">
              <span>{c}</span>
              <strong>{n}</strong>
            </div>
          ))}
      </div>
    </div>
  );
}
