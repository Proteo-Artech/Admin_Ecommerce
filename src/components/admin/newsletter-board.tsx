"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Subscriber = { id: string; email: string; source: string; createdAt: string };
type Bulletin = { id: string; kind: string; subject: string; couponCode: string; recipientCount: number; createdAt: string };
type CouponOption = { id: string; code: string; name: string; type: string; value: number };

const kinds: Record<string, string> = { DESCUENTO: "Descuento", CUPON: "Cupón", NOVEDAD: "Novedad" };

function couponLabel(coupon: CouponOption) {
  const value = coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `$${coupon.value}`;
  return `${coupon.code} · ${value}`;
}

export function NewsletterBoard({
  subscribers,
  bulletins,
  coupons,
}: {
  subscribers: Subscriber[];
  bulletins: Bulletin[];
  coupons: CouponOption[];
}) {
  const router = useRouter();
  const [kind, setKind] = useState("DESCUENTO");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [selected, setSelected] = useState<string[]>(() => subscribers.map((item) => item.id));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"" | "preview" | "send" | "remove">("");
  const [preview, setPreview] = useState("");

  useEffect(() => {
    const ids = new Set(subscribers.map((item) => item.id));
    setSelected((current) => current.filter((id) => ids.has(id)));
  }, [subscribers]);

  const allSelected = subscribers.length > 0 && selected.length === subscribers.length;
  const payload = { kind, subject, body, couponCode: kind === "NOVEDAD" ? "" : couponCode, subscriberIds: selected };

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleAll() {
    setSelected(allSelected ? [] : subscribers.map((item) => item.id));
  }

  async function openPreview() {
    setNote("");
    setBusy("preview");
    const response = await fetch("/api/admin/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, preview: true }),
    });
    const data = (await response.json()) as { error?: string; html?: string };
    setBusy("");
    if (!response.ok || !data.html) {
      setNote(data.error ?? "No se pudo armar la vista previa.");
      return;
    }
    setPreview(data.html);
  }

  async function removeSelected() {
    if (!selected.length) {
      setNote("Elige al menos un suscrito.");
      return;
    }
    const label = selected.length === 1 ? "este correo" : `${selected.length} correos`;
    if (!window.confirm(`¿Quitar ${label} del boletín?`)) return;
    setBusy("remove");
    setNote("");
    const response = await fetch("/api/admin/newsletter", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected }),
    });
    const data = (await response.json()) as { error?: string; removed?: number };
    setBusy("");
    if (!response.ok) {
      setNote(data.error ?? "No se pudo quitar.");
      return;
    }
    setNote(data.removed === 1 ? "Se quitó 1 suscrito." : `Se quitaron ${data.removed ?? 0} suscritos.`);
    router.refresh();
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    setBusy("send");
    setNote("");
    const response = await fetch("/api/admin/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { error?: string; recipients?: number };
    setBusy("");
    if (!response.ok) {
      setNote(data.error ?? "No se pudo enviar.");
      return;
    }
    setSubject("");
    setBody("");
    setCouponCode("");
    setNote(`Enviado a ${data.recipients} ${data.recipients === 1 ? "correo" : "correos"}.`);
    router.refresh();
  }

  return (
    <>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", alignItems: "start" }}>
        <form className="panel-card panel-form" onSubmit={send}>
          <label>
            Tipo
            <select
              value={kind}
              onChange={(event) => {
                const next = event.target.value;
                setKind(next);
                if (next === "NOVEDAD") setCouponCode("");
              }}
            >
              <option value="DESCUENTO">Descuento</option>
              <option value="CUPON">Cupón</option>
              <option value="NOVEDAD">Novedad</option>
            </select>
          </label>
          <label>
            Asunto
            <input value={subject} onChange={(event) => setSubject(event.target.value)} required />
          </label>
          <label>
            Mensaje
            <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={6} required />
          </label>
          {kind !== "NOVEDAD" && (
            <label>
              Cupón
              <select value={couponCode} onChange={(event) => setCouponCode(event.target.value)} required={kind === "CUPON"}>
                <option value="">{kind === "CUPON" ? "Elige un cupón" : "Sin cupón"}</option>
                {coupons.map((coupon) => (
                  <option key={coupon.id} value={coupon.code}>
                    {couponLabel(coupon)}
                    {coupon.name && coupon.name !== coupon.code ? ` · ${coupon.name}` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          {kind !== "NOVEDAD" && coupons.length === 0 && (
            <p className="panel-note">No hay cupones activos. Créalos en Cupones antes de usarlos aquí.</p>
          )}
          <div className="panel-actions">
            <button className="panel-dark" type="button" disabled={busy !== ""} onClick={openPreview}>
              {busy === "preview" ? "Abriendo…" : "Vista previa"}
            </button>
            <button className="panel-gold" type="submit" disabled={busy !== "" || selected.length === 0}>
              {busy === "send" ? "Enviando…" : `Enviar a ${selected.length}`}
            </button>
          </div>
          {note && <p className="panel-note">{note}</p>}
        </form>
        <div className="panel-card" style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
            <strong>{subscribers.length} suscritos</strong>
            <button className="panel-dark" type="button" disabled={busy !== "" || selected.length === 0} onClick={removeSelected}>
              Quitar
            </button>
          </div>
          {subscribers.length > 0 && (
            <label className="panel-check">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              {allSelected ? "Quitar selección" : "Seleccionar todos"}
            </label>
          )}
          {subscribers.length === 0 && <p style={{ margin: 0, color: "#8f8785" }}>Nadie se ha suscrito en esta tienda.</p>}
          <div style={{ display: "grid", gap: 8, maxHeight: 420, overflow: "auto" }}>
            {subscribers.map((item) => (
              <label key={item.id} className="panel-check" style={{ alignItems: "flex-start" }}>
                <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} />
                <span>
                  {item.email}
                  <span style={{ color: "#8f8785" }}>{item.source === "registro" ? " · registro" : " · boletín"}</span>
                </span>
              </label>
            ))}
          </div>
          {bulletins.length > 0 && (
            <>
              <strong>Envíos</strong>
              {bulletins.map((item) => (
                <p key={item.id} style={{ margin: 0, fontSize: 14 }}>
                  {kinds[item.kind] ?? item.kind}: {item.subject}
                  {item.couponCode ? ` · ${item.couponCode}` : ""}
                  <span style={{ color: "#8f8785" }}>{` · ${item.recipientCount}`}</span>
                </p>
              ))}
            </>
          )}
        </div>
      </div>
      {preview && (
        <div
          role="presentation"
          onClick={() => setPreview("")}
          style={{ position: "fixed", inset: 0, background: "rgba(29,27,25,.45)", zIndex: 40, display: "grid", placeItems: "center", padding: 16 }}
        >
          <div
            role="dialog"
            aria-label="Vista previa del boletín"
            onClick={(event) => event.stopPropagation()}
            style={{ width: "min(720px, 100%)", height: "min(860px, 92vh)", background: "#fff", borderRadius: 16, overflow: "hidden", display: "grid", gridTemplateRows: "auto 1fr" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #e8e4de" }}>
              <strong>Vista previa</strong>
              <button className="panel-dark" type="button" onClick={() => setPreview("")}>
                Cerrar
              </button>
            </div>
            <iframe title="Vista previa del boletín" srcDoc={preview} style={{ width: "100%", height: "100%", border: 0, background: "#efefef" }} />
          </div>
        </div>
      )}
    </>
  );
}
