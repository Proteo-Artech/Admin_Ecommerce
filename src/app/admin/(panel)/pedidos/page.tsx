import { OrdersBoard } from "@/components/admin/orders-board";
import { panelSnapshot } from "@/lib/platform";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const { orders } = await panelSnapshot();
  return (
    <>
      <h1 className="panel-title">Pedidos</h1>
      <p style={{ margin: 0, color: "#8f8785" }}>El cobro queda simulado. Cancelar un pedido devuelve el stock.</p>
      <OrdersBoard orders={orders} />
    </>
  );
}
