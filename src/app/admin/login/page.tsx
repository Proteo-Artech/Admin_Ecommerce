"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setNote(data.error ?? "No se pudo entrar.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#fafaf8", padding: 24 }}>
      <form onSubmit={submit} style={{ width: "min(420px, 100%)", background: "#fff", border: "1px solid #e8e4de", borderRadius: 16, padding: 28, display: "grid", gap: 14 }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-fraunces), serif", fontSize: 36 }}>Panel de tiendas</h1>
        <p style={{ margin: 0, color: "#8f8785", fontSize: 14 }}>
          Ingresa con tu cuenta de administración.
        </p>
        <label style={{ display: "grid", gap: 6, fontSize: 13, color: "#8f8785" }}>
          Correo
          <input value={email} onChange={(event) => setEmail(event.target.value)} style={{ border: "1px solid #e8e4de", borderRadius: 8, padding: "10px 12px" }} />
        </label>
        <label style={{ display: "grid", gap: 6, fontSize: 13, color: "#8f8785" }}>
          Contraseña
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} style={{ border: "1px solid #e8e4de", borderRadius: 8, padding: "10px 12px" }} />
        </label>
        {note && <p style={{ margin: 0, color: "#b8845a" }}>{note}</p>}
        <button type="submit" style={{ border: 0, borderRadius: 8, background: "#c99a6e", color: "#fff", padding: "12px 16px", cursor: "pointer" }}>
          Entrar
        </button>
      </form>
    </div>
  );
}
