"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SessionUser, ShopRecord } from "@/lib/platform";

const links = [
  { href: "/admin", label: "Resumen", exact: true },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/ofertas", label: "Ofertas" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/experiencias", label: "Experiencias" },
  { href: "/admin/cupones", label: "Cupones" },
  { href: "/admin/boletin", label: "Boletín" },
  { href: "/admin/categorias", label: "Categorías", admin: true },
  { href: "/admin/clientes", label: "Clientes", admin: true },
  { href: "/admin/tiendas", label: "Tiendas", admin: true },
];

const shellCss = `
.panel { min-height: 100vh; display: grid; grid-template-columns: 240px minmax(0, 1fr); background: #fafaf8; color: #1d1b19; }
.panel-side { background: #1d1b19; color: #fafaf8; padding: 28px 18px; display: flex; flex-direction: column; gap: 22px; }
.panel-brand { font-family: var(--font-fraunces), serif; font-size: 28px; font-weight: 600; color: #c99a6e; }
.panel-role { margin: 0; font-size: 13px; color: #c8c2bc; }
.panel-nav { display: flex; flex-direction: column; gap: 6px; }
.panel-nav a { border-radius: 8px; padding: 10px 12px; color: #fafaf8; font-size: 14px; }
.panel-nav a.is-on, .panel-nav a:hover { background: #2a2926; color: #c99a6e; }
.panel-side button { margin-top: auto; border: 1px solid #8f8785; border-radius: 8px; background: transparent; color: #fafaf8; padding: 10px 12px; cursor: pointer; }
.panel-main { padding: 32px; display: flex; flex-direction: column; gap: 20px; }
.panel-title { margin: 0; font-family: var(--font-fraunces), serif; font-size: 36px; font-weight: 600; }
.panel-card { background: #fff; border: 1px solid #e8e4de; border-radius: 12px; padding: 16px; }
.panel-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.panel-table th, .panel-table td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #fafaf8; vertical-align: middle; }
.panel-table th { color: #8f8785; font-weight: 500; }
.panel-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.panel-stat strong { display: block; margin-top: 6px; font-size: 22px; }
.panel-form { display: grid; gap: 14px; }
.panel-form label { display: grid; gap: 6px; font-size: 13px; color: #8f8785; }
.panel-form input, .panel-form select, .panel-form textarea { border: 1px solid #e8e4de; border-radius: 8px; background: #fafaf8; color: #1d1b19; padding: 10px 12px; font-size: 14px; }
.panel-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.panel-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.panel-gold, .panel-dark { border: 0; border-radius: 8px; padding: 10px 16px; cursor: pointer; font-size: 14px; }
.panel-gold { background: #c99a6e; color: #fff; }
.panel-gold:hover { background: #b8845a; }
.panel-dark { background: #1d1b19; color: #fff; }
.panel-link { color: #c99a6e; }
.panel-note { margin: 0; color: #b8845a; font-size: 14px; }
.panel-check { display: flex; align-items: center; gap: 8px; color: #1d1b19; font-size: 14px; }
.panel-form label.panel-check { display: flex; align-items: center; gap: 8px; color: #1d1b19; font-size: 14px; }
.panel-checks { display: flex; flex-wrap: wrap; gap: 10px 16px; }
.panel-photos { display: flex; gap: 8px; flex-wrap: wrap; }
.panel-photos img { width: 72px; height: 88px; object-fit: cover; border-radius: 8px; }
@media (max-width: 900px) {
  .panel { grid-template-columns: 1fr; }
  .panel-grid, .panel-row { grid-template-columns: 1fr; }
}
`;

export function AdminShell({
  user,
  stores,
  currentSlug,
  children,
}: {
  user: SessionUser;
  stores: ShopRecord[];
  currentSlug: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  async function changeStore(slug: string) {
    await fetch("/api/admin/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    router.refresh();
  }

  return (
    <div className="panel">
      <style>{shellCss}</style>
      <aside className="panel-side">
        <div>
          <p className="panel-brand">Tiendas</p>
          <p className="panel-role">{user.role === "ADMIN" ? "Administrador" : "Encargado de productos"}</p>
          <p className="panel-role">{user.name}</p>
        </div>
        <label className="panel-role" style={{ display: "grid", gap: 6 }}>
          Tienda activa
          <select
            value={currentSlug}
            onChange={(event) => changeStore(event.target.value)}
            style={{ borderRadius: 8, border: "1px solid #8f8785", background: "#2a2926", color: "#fafaf8", padding: "8px 10px" }}
          >
            {stores.map((store) => (
              <option key={store.id} value={store.slug}>
                {store.name}
              </option>
            ))}
          </select>
        </label>
        <nav className="panel-nav">
          {links
            .filter((link) => !link.admin || user.role === "ADMIN")
            .map((link) => {
              const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href} className={active ? "is-on" : ""}>
                  {link.label}
                </Link>
              );
            })}
        </nav>
        <button type="button" onClick={logout}>
          Cerrar sesión
        </button>
      </aside>
      <div className="panel-main">{children}</div>
    </div>
  );
}
