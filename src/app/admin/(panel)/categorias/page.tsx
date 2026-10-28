import { redirect } from "next/navigation";
import { CategoriesBoard } from "@/components/admin/categories-board";
import { currentUser, panelSnapshot } from "@/lib/platform";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const user = await currentUser();
  if (user?.role !== "ADMIN") redirect("/admin");
  const { categories } = await panelSnapshot();
  return (
    <>
      <h1 className="panel-title">Categorías</h1>
      <p style={{ margin: 0, color: "#8f8785" }}>
        Las secciones de la tienda son Mujeres, Hombres, Junior y Accesorios. Aquí se editan los tipos de prenda que el cliente usa para filtrar.
      </p>
      <CategoriesBoard
        categories={[
          {
            id: "tipos",
            slug: "tipos",
            name: "Tipos de prenda",
            image: "",
            subcategories: categories[0]?.subcategories ?? [],
          },
        ]}
      />
    </>
  );
}
