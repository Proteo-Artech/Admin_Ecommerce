"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/data/catalog";

export function OffersBoard({ products }: { products: Product[] }) {
  const router = useRouter();
  const [note, setNote] = useState("");

  async function save(product: Product, comparePrice: number) {
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, comparePrice: comparePrice > product.price ? comparePrice : null }),
    });
    const data = (await response.json()) as { error?: string };
    setNote(response.ok ? "Oferta actualizada." : (data.error ?? "No se pudo guardar."));
    router.refresh();
  }

  return (
    <div className="panel-card" style={{ overflowX: "auto" }}>
      {note && <p className="panel-note">{note}</p>}
      <table className="panel-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio</th>
            <th>Precio anterior</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <OfferRow key={product.id} product={product} onSave={save} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OfferRow({ product, onSave }: { product: Product; onSave: (product: Product, comparePrice: number) => void }) {
  const [compare, setCompare] = useState(product.comparePrice ?? "");
  return (
    <tr>
      <td>{product.name}</td>
      <td>{product.price}</td>
      <td>
        <input type="number" min={0} value={compare} onChange={(event) => setCompare(event.target.value)} />
      </td>
      <td>
        <button type="button" className="panel-gold" onClick={() => onSave(product, Number(compare) || 0)}>
          Guardar
        </button>
      </td>
    </tr>
  );
}
