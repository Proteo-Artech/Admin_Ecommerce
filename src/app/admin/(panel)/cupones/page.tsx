import { CouponsBoard } from "@/components/admin/cupons-board";
import { panelSnapshot } from "@/lib/platform";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const { coupons, categories } = await panelSnapshot();
  return (
    <>
      <h1 className="panel-title">Cupones</h1>
      <p style={{ margin: 0, color: "#8f8785" }}>
        Puedes topar el descuento, limitarlo a unas categorías y reservarlo para la primera compra. También se apaga solo al llegar al límite de usos o al salir del horario.
      </p>
      <CouponsBoard coupons={coupons} categories={categories.map((category) => ({ id: category.id, name: category.name, slug: category.slug }))} />
    </>
  );
}
