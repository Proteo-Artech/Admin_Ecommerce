"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ShopRecord } from "@/lib/platform";

export function StoresBoard({ stores, counts }: { stores: ShopRecord[]; counts: Record<string, number> }) {
  const router = useRouter();
  const [names, setNames] = useState<Record<string, string>>(Object.fromEntries(stores.map((store) => [store.slug, store.name])));
  const [note, setNote] = useState("");

  async function save(slug: string) {
    const response = await fetch("/api/admin/store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name: names[slug] }),
    });
    const data = (await response.json()) as { error?: string };
    setNote(response.ok ? "Nombre actualizado." : (data.error ?? "No se pudo guardar."));
    router.refresh();
  }

  async function open(slug: string) {
    await fetch("/api/admin/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    router.push("/admin/productos");
    router.refresh();
  }

  return (
    <div className="panel-card" style={{ overflowX: "auto" }}>
      {note && <p className="panel-note">{note}</p>}
      <table className="panel-table">
        <thead>
          <tr>
            <th>Tienda</th>
            <th>Identificador</th>
            <th>Productos</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {stores.map((store) => (
            <tr key={store.id}>
              <td>
                <input
                  value={names[store.slug] ?? store.name}
                  onChange={(event) => setNames((current) => ({ ...current, [store.slug]: event.target.value }))}
                  style={{ border: "1px solid #e8e4de", borderRadius: 8, padding: "8px 10px" }}
                />
              </td>
              <td>{store.slug}</td>
              <td>{counts[store.id] ?? 0}</td>
              <td className="panel-actions">
                <button type="button" className="panel-dark" onClick={() => save(store.slug)}>
                  Guardar nombre
                </button>
                <button type="button" className="panel-gold" onClick={() => open(store.slug)}>
                  Administrar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
