import { dashboardStats } from "@/lib/platform";

export const dynamic = "force-dynamic";

function pesos(value: number) {
  return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default async function AdminHomePage() {
  const stats = await dashboardStats();
  const cards = [
    ["Ventas simuladas", pesos(stats.sales)],
    ["Pedidos", String(stats.orders)],
    ["Ticket medio", pesos(stats.ticket)],
    ["Productos activos", String(stats.activeProducts)],
    ["Sin stock", String(stats.outOfStock)],
    ["Destacadas", String(stats.featured)],
    ["Piezas únicas", String(stats.unique)],
  ];

  return (
    <>
      <h1 className="panel-title">Resumen · {stats.store.name}</h1>
      <p style={{ margin: 0, color: "#8f8785" }}>
        Cada tienda consume solo su catálogo. Los pagos se confirman en simulado hasta conectar Stripe. Clientes de esta tienda: {stats.customers}.
      </p>
      <div className="panel-grid">
        {cards.map(([label, value]) => (
          <article key={label} className="panel-card panel-stat">
            <span style={{ color: "#8f8785", fontSize: 13 }}>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
    </>
  );
}
