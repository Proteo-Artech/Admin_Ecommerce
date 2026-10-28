"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { StoreCategory } from "@/lib/platform";

export function CategoriesBoard({ categories }: { categories: StoreCategory[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  async function save(category: StoreCategory, subcategories: string[]) {
    const response = await fetch("/api/admin/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: category.slug, subcategories }),
    });
    setNote(response.ok ? "Categoría actualizada." : "No se pudo guardar.");
    router.refresh();
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {note && <p className="panel-note">{note}</p>}
      {categories.map((category) => (
        <section key={category.id} className="panel-card">
          <h2 style={{ margin: "0 0 12px" }}>{category.name}</h2>
          <div className="panel-actions">
            {category.subcategories.map((item) => (
              <button key={item} type="button" className="panel-dark" onClick={() => save(category, category.subcategories.filter((name) => name !== item))}>
                {item} ×
              </button>
            ))}
          </div>
          <div className="panel-actions" style={{ marginTop: 12 }}>
            <input
              value={drafts[category.id] ?? ""}
              placeholder="Nueva subcategoría"
              onChange={(event) => setDrafts((current) => ({ ...current, [category.id]: event.target.value }))}
            />
            <button
              type="button"
              className="panel-gold"
              onClick={() => {
                const name = (drafts[category.id] ?? "").trim();
                if (!name) return;
                save(category, [...category.subcategories, name]);
                setDrafts((current) => ({ ...current, [category.id]: "" }));
              }}
            >
              Agregar
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}
