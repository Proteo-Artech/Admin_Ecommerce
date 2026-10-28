import { panelSnapshot } from "@/lib/platform";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const { customers, store } = await panelSnapshot();

  return (
    <>
      <h1 className="panel-title">Clientes · {store.name}</h1>
      <p style={{ margin: 0, color: "#8f8785" }}>Cuentas creadas en esta tienda. No se comparten con las otras dos.</p>
      <div className="panel-card" style={{ overflowX: "auto" }}>
        <table className="panel-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={4}>Todavía no hay clientes en {store.name}.</td>
              </tr>
            )}
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  {customer.name} {customer.lastName}
                </td>
                <td>{customer.email}</td>
                <td>{customer.phone || "—"}</td>
                <td>{customer.status === "ACTIVE" ? "Activo" : "Inactivo"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
