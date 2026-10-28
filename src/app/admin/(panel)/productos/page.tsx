import Link from "next/link";
import { panelSnapshot } from "@/lib/platform";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const { products, store } = await panelSnapshot();

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 className="panel-title">Productos · {store.name}</h1>
        <Link href="/admin/productos/nuevo" className="panel-gold" style={{ textDecoration: "none" }}>
          Subir producto
        </Link>
      </div>
      <div className="panel-card" style={{ overflowX: "auto" }}>
        <table className="panel-table">
          <thead>
            <tr>
              <th>Prenda</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Señales</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>
                  {product.category}
                  <div style={{ color: "#8f8785" }}>{product.subcategory}</div>
                </td>
                <td>
                  {product.price}
                  {product.comparePrice ? <div style={{ color: "#8f8785" }}>antes {product.comparePrice}</div> : null}
                </td>
                <td>{product.isUnique ? (product.sold ? "Única · vendida" : "Única") : product.sold ? "0 unidades" : `${product.stock} unidades`}</td>
                <td>
                  {[product.sold && "Vendida", product.isFeatured && "Destacada", product.isActive === false && "Oculta"]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
                <td>
                  <Link className="panel-link" href={`/admin/productos/${product.id}`}>
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
