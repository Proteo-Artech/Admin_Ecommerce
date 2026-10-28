import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { panelSnapshot } from "@/lib/platform";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { categories, brands, products } = await panelSnapshot();
  const product = products.find((item) => item.id === id);
  if (!product) notFound();
  return (
    <>
      <h1 className="panel-title">Editar producto</h1>
      <ProductForm categories={categories} brands={brands} product={product} />
    </>
  );
}
