"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Coupon } from "@/lib/platform";

type CouponRow = Coupon & { uses: number; discounted: number };

function localInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function when(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

function schedule(coupon: CouponRow) {
  const started = new Date(coupon.startsAt).getTime() <= Date.now();
  if (!coupon.endsAt && started) return "Sin horario";
  return `${when(coupon.startsAt)} – ${coupon.endsAt ? when(coupon.endsAt) : "sin cierre"}`;
}

function stateLabel(coupon: CouponRow) {
  if (!coupon.isActive) return "Apagado";
  if (coupon.usageLimit != null && coupon.uses >= coupon.usageLimit) return "Agotado";
  if (new Date(coupon.startsAt).getTime() > Date.now()) return "Programado";
  if (coupon.endsAt && new Date(coupon.endsAt).getTime() <= Date.now()) return "Vencido";
  return "Vigente";
}

const categoryOrder = ["mujeres", "hombres", "juniors", "accesorios"];

function pesos(value: number) {
  return `$${value.toLocaleString("es-MX")}`;
}

export function CouponsBoard({ coupons, categories }: { coupons: CouponRow[]; categories: { id: string; name: string; slug: string }[] }) {
  const router = useRouter();
  const rank = (slug: string) => {
    const index = categoryOrder.indexOf(slug);
    return index < 0 ? categoryOrder.length : index;
  };
  const ordered = [...categories].sort((a, b) => rank(a.slug) - rank(b.slug));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<Coupon["type"]>("PERCENTAGE");
  const [value, setValue] = useState(10);
  const [usageLimit, setUsageLimit] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [forNewCustomers, setForNewCustomers] = useState(false);
  const [active, setActive] = useState(true);
  const [note, setNote] = useState("");

  function reset() {
    setEditingId(null);
    setCode("");
    setName("");
    setType("PERCENTAGE");
    setValue(10);
    setUsageLimit("");
    setMaxDiscount("");
    setStartsAt("");
    setEndsAt("");
    setCategoryIds([]);
    setForNewCustomers(false);
    setActive(true);
  }

  function edit(coupon: CouponRow) {
    const scheduled = Boolean(coupon.endsAt) || new Date(coupon.startsAt).getTime() > Date.now();
    setEditingId(coupon.id);
    setCode(coupon.code);
    setName(coupon.name);
    setType(coupon.forNewCustomers ? "PERCENTAGE" : coupon.type);
    setValue(coupon.value);
    setUsageLimit(coupon.usageLimit == null ? "" : String(coupon.usageLimit));
    setMaxDiscount(coupon.maxDiscount == null ? "" : String(coupon.maxDiscount));
    setStartsAt(scheduled ? localInput(coupon.startsAt) : "");
    setEndsAt(localInput(coupon.endsAt));
    setCategoryIds(coupon.categoryIds);
    setForNewCustomers(coupon.forNewCustomers);
    setActive(coupon.isActive);
    setNote("");
  }

  function toggleCategory(id: string) {
    setCategoryIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId ?? undefined,
        code,
        name,
        type,
        value,
        usageLimit: usageLimit === "" ? null : Number(usageLimit),
        maxDiscount: maxDiscount === "" ? null : Number(maxDiscount),
        startsAt: startsAt || null,
        endsAt: endsAt || null,
        categoryIds,
        forNewCustomers,
        isActive: active,
      }),
    });
    const data = (await response.json()) as { error?: string };
    setNote(response.ok ? (editingId ? "Cupón actualizado." : "Cupón listo.") : (data.error ?? "No se pudo guardar."));
    if (response.ok) reset();
    router.refresh();
  }

  async function toggle(coupon: CouponRow) {
    await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...coupon, isActive: !coupon.isActive }),
    });
    router.refresh();
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <form className="panel-card panel-form" onSubmit={save}>
        <div className="panel-row">
          <label>
            Código
            <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} required />
          </label>
          <label>
            Nombre
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
        </div>
        <div className="panel-row">
          <label>
            Tipo
            <select value={forNewCustomers ? "PERCENTAGE" : type} disabled={forNewCustomers} onChange={(event) => setType(event.target.value as Coupon["type"])}>
              <option value="PERCENTAGE">Porcentaje</option>
              <option value="FIXED_AMOUNT">Monto fijo</option>
            </select>
          </label>
          <label>
            Valor
            <input type="number" min={1} value={value} onChange={(event) => setValue(Number(event.target.value))} />
          </label>
        </div>
        <div className="panel-row">
          <label>
            Límite de usos
            <input
              type="number"
              min={1}
              value={usageLimit}
              placeholder="Sin límite"
              onChange={(event) => setUsageLimit(event.target.value)}
            />
          </label>
          <p className="panel-note" style={{ alignSelf: "end" }}>
            Al llegar a ese número deja de aplicar solo.
          </p>
        </div>
        <div className="panel-row">
          <label>
            Empieza
            <input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
          </label>
          <label>
            Termina
            <input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
          </label>
        </div>
        <p className="panel-note">Para un solo día, usa la misma fecha y cambia la hora de inicio y la de cierre. Vacío significa sin horario.</p>
        <div className="panel-row">
          <label>
            Tope del descuento
            <input type="number" min={1} value={maxDiscount} placeholder="Sin tope" onChange={(event) => setMaxDiscount(event.target.value)} />
          </label>
          <p className="panel-note" style={{ alignSelf: "end" }}>
            Un 10% de $20,000 serían $2,000. Con un tope de $500, el descuento se queda en $500.
          </p>
        </div>
        <div>
          <p style={{ margin: "0 0 8px", color: "#1d1b19", fontSize: 14 }}>Categorías</p>
          <div className="panel-checks">
            {ordered.map((category) => (
              <label key={category.id} className="panel-check">
                <input type="checkbox" checked={categoryIds.includes(category.id)} onChange={() => toggleCategory(category.id)} />
                {category.name}
              </label>
            ))}
          </div>
          <p className="panel-note">Sin marcar, aplica a todo el pedido. Si marcas alguna, las demás no reciben descuento.</p>
        </div>
        <div>
          <p style={{ margin: "0 0 8px", color: "#1d1b19", fontSize: 14 }}>Usuarios nuevos</p>
          <label className="panel-check">
            <input
              type="checkbox"
              checked={forNewCustomers}
              onChange={(event) => {
                setForNewCustomers(event.target.checked);
                if (event.target.checked) setType("PERCENTAGE");
              }}
            />
            Activar para la primera compra, en porcentaje
          </label>
          <p className="panel-note">Quien ya tenga un pedido en la tienda no puede usarlo.</p>
        </div>
        {note && <p className="panel-note">{note}</p>}
        <div className="panel-actions">
          <button type="submit" className="panel-gold">
            {editingId ? "Guardar cupón" : "Crear cupón"}
          </button>
          {editingId && (
            <button type="button" className="panel-dark" onClick={reset}>
              Cancelar
            </button>
          )}
        </div>
      </form>
      <div className="panel-card" style={{ overflowX: "auto" }}>
        <table className="panel-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descuento</th>
              <th>Tope</th>
              <th>Categorías</th>
              <th>Usos</th>
              <th>Horario</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td>{coupon.code}</td>
                <td>{coupon.forNewCustomers ? `${coupon.value}% · primera compra` : coupon.type === "PERCENTAGE" ? `${coupon.value}%` : pesos(coupon.value)}</td>
                <td>{coupon.maxDiscount == null ? "Sin tope" : pesos(coupon.maxDiscount)}</td>
                <td>
                  {coupon.categoryIds.length
                    ? ordered
                        .filter((category) => coupon.categoryIds.includes(category.id))
                        .map((category) => category.name)
                        .join(", ")
                    : "Todas"}
                </td>
                <td>{coupon.usageLimit == null ? coupon.uses : `${coupon.uses} / ${coupon.usageLimit}`}</td>
                <td>{schedule(coupon)}</td>
                <td>{stateLabel(coupon)}</td>
                <td>
                  <div className="panel-actions">
                    <button type="button" className="panel-dark" onClick={() => edit(coupon)}>
                      Editar
                    </button>
                    <button type="button" className="panel-dark" onClick={() => toggle(coupon)}>
                      {coupon.isActive ? "Apagar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
