import { OffersBoard } from "@/components/admin/offers-board";
import { panelSnapshot } from "@/lib/platform";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  const { products } = await panelSnapshot();
  return (
    <>
      <h1 className="panel-title">Ofertas</h1>
      <p style={{ margin: 0, color: "#8f8785" }}>El precio anterior, si es mayor al actual, se muestra tachado en la tienda.</p>
      <OffersBoard products={products.filter((product) => product.isActive !== false)} />
    </>
  );
}
