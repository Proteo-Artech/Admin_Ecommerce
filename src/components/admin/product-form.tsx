"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/data/catalog";
import type { StoreBrand, StoreCategory } from "@/lib/platform";

const empty: Partial<Product> = {
  name: "",
  brand: "",
  category: "hombres",
  subcategory: "",
  price: 0,
  comparePrice: undefined,
        stock: 1,
        model: "",
        description: "",
        images: [],
        colors: [{ name: "Negro", hex: "#1D1B19" }],
        sizes: ["Única"],
        isNew: false,
        isFeatured: false,
        isUnique: true,
        isActive: true,
        sold: false,
};

export function ProductForm({
  categories,
  brands,
  product,
}: {
  categories: StoreCategory[];
  brands: StoreBrand[];
  product?: Product;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Partial<Product>>(
    product ?? { ...empty, brand: brands[0]?.name ?? "", subcategory: categories[0]?.subcategories[0] ?? "" },
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const category = categories.find((item) => item.slug === draft.category) ?? categories[0];

  function patch(next: Partial<Product>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const urls = [...(draft.images ?? [])];
    for (const file of files) {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setNote(data.error ?? "No se pudo subir la imagen.");
        setBusy(false);
        return;
      }
      urls.push(data.url);
    }
    patch({ images: urls });
    setBusy(false);
  }

  async function save() {
    setBusy(true);
    setNote("");
    const response = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", {
      method: product ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
      ...draft,
      sold: Boolean(draft.sold),
    }),
    });
    const data = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setNote(data.error ?? "No se pudo guardar.");
      return;
    }
    router.push("/admin/productos");
    router.refresh();
  }

  return (
    <div className="panel-card">
      <div className="panel-form">
        <div className="panel-row">
          <label>
            Nombre
            <input value={draft.name ?? ""} onChange={(event) => patch({ name: event.target.value })} />
          </label>
          <label>
            Marca
            <select value={draft.brand ?? ""} onChange={(event) => patch({ brand: event.target.value })}>
              {brands.map((brand) => (
                <option key={brand.id}>{brand.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="panel-row">
          <label>
            Categoría
            <select
              value={draft.category}
              onChange={(event) => {
                const next = categories.find((item) => item.slug === event.target.value);
                patch({ category: event.target.value as Product["category"], subcategory: next?.subcategories[0] ?? "" });
              }}
            >
              {categories.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo de prenda
            <select value={draft.subcategory ?? ""} onChange={(event) => patch({ subcategory: event.target.value })}>
              {(category?.subcategories ?? []).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="panel-row">
          <label>
            Precio
            <input type="number" min={0} value={draft.price ?? 0} onChange={(event) => patch({ price: Number(event.target.value) })} />
          </label>
          <label>
            Precio anterior (oferta)
            <input
              type="number"
              min={0}
              value={draft.comparePrice ?? ""}
              placeholder="Vacío si no hay descuento"
              onChange={(event) => patch({ comparePrice: event.target.value ? Number(event.target.value) : undefined })}
            />
          </label>
        </div>
        <div className="panel-row">
          <label>
            Talla de esta pieza
            <input value={draft.sizes?.[0] ?? ""} onChange={(event) => patch({ sizes: [event.target.value] })} />
          </label>
          <label>
            Color
            <input value={draft.colors?.[0]?.name ?? ""} onChange={(event) => patch({ colors: [{ name: event.target.value, hex: draft.colors?.[0]?.hex ?? "#1D1B19" }] })} />
          </label>
        </div>
        <label>
          Modelo
          <input value={draft.model ?? ""} onChange={(event) => patch({ model: event.target.value })} />
        </label>
        <label>
          Descripción
          <textarea rows={3} value={draft.description ?? ""} onChange={(event) => patch({ description: event.target.value })} />
        </label>
        <div>
          <p style={{ margin: "0 0 8px", color: "#8f8785", fontSize: 13 }}>Imágenes</p>
          <div className="panel-photos">
            {(draft.images ?? []).map((src) => (
              <button key={src} type="button" onClick={() => patch({ images: (draft.images ?? []).filter((item) => item !== src) })}>
                <img src={src} alt="" />
              </button>
            ))}
          </div>
          <input style={{ marginTop: 8 }} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => upload(event.target.files)} />
        </div>
        <label className="panel-check">
          <input type="checkbox" checked={Boolean(draft.isFeatured)} onChange={(event) => patch({ isFeatured: event.target.checked })} />
          Destacada en Algunas prendas
        </label>
        <label className="panel-check">
          <input
            type="checkbox"
            checked={draft.isUnique !== false}
            onChange={(event) => {
              const unique = event.target.checked;
              patch({
                isUnique: unique,
                stock: unique ? (draft.sold ? 0 : 1) : Math.max(draft.stock && draft.stock > 1 ? draft.stock : 2, 2),
                sold: unique ? Boolean(draft.sold) : false,
              });
            }}
          />
          Pieza única
        </label>
        {draft.isUnique === false ? (
          <label>
            Unidades disponibles
            <input
              type="number"
              min={0}
              value={draft.stock ?? 0}
              onChange={(event) => {
                const stock = Math.max(0, Math.floor(Number(event.target.value) || 0));
                patch({ stock, sold: stock < 1 });
              }}
            />
            <span style={{ color: "#8f8785" }}>En 0 la prenda deja de mostrarse.</span>
          </label>
        ) : (
          <label className="panel-check">
            <input
              type="checkbox"
              checked={Boolean(draft.sold) || draft.stock === 0}
              onChange={(event) => patch({ sold: event.target.checked, stock: event.target.checked ? 0 : 1, isUnique: true })}
            />
            Vendida (se oculta en la tienda y no se borra)
          </label>
        )}
        <label className="panel-check">
          <input type="checkbox" checked={Boolean(draft.isNew)} onChange={(event) => patch({ isNew: event.target.checked })} />
          Novedad
        </label>
        <label className="panel-check">
          <input type="checkbox" checked={draft.isActive !== false} onChange={(event) => patch({ isActive: event.target.checked })} />
          Visible en la tienda
        </label>
        {note && <p className="panel-note">{note}</p>}
        <div className="panel-actions">
          <button type="button" className="panel-gold" disabled={busy} onClick={save}>
            {busy ? "Guardando…" : "Guardar producto"}
          </button>
        </div>
      </div>
    </div>
  );
}
