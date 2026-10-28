import { StoresBoard } from "@/components/admin/stores-board";
import { listStores, storeProductCounts } from "@/lib/platform";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const stores = await listStores();
  const counts = await storeProductCounts();
  return (
    <>
      <h1 className="panel-title">Tiendas</h1>
      <p style={{ margin: 0, color: "#8f8785" }}>
        Distinto ya tiene catálogo. Tienda 2 y Tienda 3 arrancan vacías: lo que subas ahí solo lo verá esa tienda.
      </p>
      <StoresBoard stores={stores} counts={counts} />
    </>
  );
}
