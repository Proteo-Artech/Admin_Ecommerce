"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Review = "PENDING" | "APPROVED" | "DECLINED";

type PanelExperience = {
  id: string;
  name: string;
  rating: number;
  body: string;
  status: Review;
  orderNumber: string;
  products: string[];
  createdAt: string;
  photos: { id: string; url: string; status: Review }[];
};

const statusLabel: Record<Review, string> = {
  PENDING: "En revisión",
  APPROVED: "En la página",
  DECLINED: "Declinada",
};

export function ExperiencesBoard({ experiences }: { experiences: PanelExperience[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  async function review(payload: { id?: string; photoId?: string; status: "APPROVED" | "DECLINED" }) {
    await fetch("/api/admin/experiences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    router.refresh();
  }

  if (!experiences.length) return <p className="panel-card">Todavía no hay experiencias.</p>;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {experiences.map((item) => {
        const expanded = open[item.id] === true;
        return (
          <article key={item.id} className="panel-card" style={{ display: "grid", gap: 12, color: "#1d1b19" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <button type="button" className="panel-dark" onClick={() => setOpen((current) => ({ ...current, [item.id]: !expanded }))}>
                {expanded ? "Minimizar" : "Ver"}
              </button>
              <strong style={{ flexShrink: 0 }}>{item.name}</strong>
              <span style={{ color: "#c99a6e", flexShrink: 0 }} aria-label={`${item.rating} de 5 estrellas`}>
                {"★".repeat(item.rating)}
                {"☆".repeat(5 - item.rating)}
              </span>
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.body}</span>
              <span style={{ color: item.status === "PENDING" ? "#b8845a" : "#8f8785", fontSize: 13, flexShrink: 0 }}>
                {statusLabel[item.status]}
              </span>
              <button type="button" className="panel-gold" onClick={() => review({ id: item.id, status: "APPROVED" })}>
                Aprobar
              </button>
              <button type="button" className="panel-dark" onClick={() => review({ id: item.id, status: "DECLINED" })}>
                Declinar
              </button>
            </div>
            {expanded && (
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", overflowX: "auto" }}>
                {item.photos.map((photo) => (
                  <figure key={photo.id} style={{ margin: 0, width: 140, flexShrink: 0 }}>
                    <img src={photo.url} alt="" style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 12, background: "#f3f1ee" }} />
                    <figcaption style={{ display: "grid", gap: 6, marginTop: 8 }}>
                      <span style={{ color: "#1d1b19", fontSize: 12 }}>{statusLabel[photo.status]}</span>
                      <button type="button" className="panel-gold" onClick={() => review({ photoId: photo.id, status: "APPROVED" })}>
                        Aprobar foto
                      </button>
                      <button type="button" className="panel-dark" onClick={() => review({ photoId: photo.id, status: "DECLINED" })}>
                        Declinar foto
                      </button>
                    </figcaption>
                  </figure>
                ))}
                <div style={{ minWidth: 220, flex: 1 }}>
                  <p style={{ margin: "0 0 8px", color: "#1d1b19", lineHeight: 1.5 }}>{item.body}</p>
                  <p style={{ margin: 0, color: "#8f8785", fontSize: 13 }}>
                    {item.orderNumber} · {new Date(item.createdAt).toLocaleDateString("es-MX")}
                  </p>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
