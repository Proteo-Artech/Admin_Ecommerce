"use client";

import { useRouter } from "next/navigation";
import type { OrderStatus, ShopOrder } from "@/lib/platform";

const statuses: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const labels: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Pagado",
  PROCESSING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

function pesos(value: number) {
  return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function OrdersBoard({ orders }: { orders: ShopOrder[] }) {
  const router = useRouter();

  async function change(id: string, status: OrderStatus) {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    router.refresh();
  }

  if (!orders.length) return <p className="panel-card">Todavía no hay pedidos.</p>;

  return (
    <div className="panel-card" style={{ overflowX: "auto" }}>
      <table className="panel-table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Pago</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <strong>{order.orderNumber}</strong>
                <div style={{ color: "#8f8785" }}>{order.items.map((item) => `${item.name} ×${item.quantity}`).join(", ")}</div>
              </td>
              <td>
                {order.customerName}
                <div style={{ color: "#8f8785" }}>{order.customerEmail}</div>
                {order.isGift && <div style={{ color: "#8f8785" }}>Regalo{order.giftNote ? `: ${order.giftNote}` : ""}</div>}
              </td>
              <td>
                {pesos(order.total)}
                {order.discount > 0 && <div style={{ color: "#8f8785" }}>Cupón {order.couponCode} −{pesos(order.discount)}</div>}
              </td>
              <td>{order.paymentStatus === "PAID" ? "Stripe" : order.paymentStatus === "SIMULATED" ? "Simulado" : order.paymentStatus}</td>
              <td>
                <select value={order.status} onChange={(event) => change(order.id, event.target.value as OrderStatus)}>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {labels[status]}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
