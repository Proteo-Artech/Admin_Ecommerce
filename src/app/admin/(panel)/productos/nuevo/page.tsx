import { ProductForm } from "@/components/admin/product-form";
import { panelSnapshot } from "@/lib/platform";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const { categories, brands } = await panelSnapshot();
  return (
    <>
      <h1 className="panel-title">Subir producto</h1>
      <ProductForm categories={categories} brands={brands} />
    </>
  );
}
