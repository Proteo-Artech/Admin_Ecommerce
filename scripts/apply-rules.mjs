// Uso: GH_TOKEN=... node scripts/apply-rules.mjs OWNER/REPO [--apply]
// Por defecto solo inspecciona; nunca imprime la credencial.
import { readFile } from "node:fs/promises";
const repo = process.argv[2];
if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error("Especifica OWNER/REPO");
const token = process.env.GH_TOKEN;
if (!token) throw new Error("Configura GH_TOKEN con Administration:write sobre el repositorio");
async function api(path, method = "GET", body) {
  const r = await fetch(`https://api.github.com/repos/${repo}${path}`, { method,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`GitHub ${method} ${path}: ${r.status}. Revisa permisos, plan y existencia de ramas.`);
  return r.json();
}
const existing = await api("/rulesets");
for (const branch of ["develop", "main"]) {
  const desired = JSON.parse(await readFile(new URL(`../.github/rulesets/${branch}.json`, import.meta.url), "utf8"));
  const current = existing.find(r => r.name === desired.name);
  if (!process.argv.includes("--apply")) { console.log(`${repo}: ${current ? "actualizar" : "crear"} ${desired.name} (vista previa)`); continue; }
  await api(current ? `/rulesets/${current.id}` : "/rulesets", current ? "PUT" : "POST", desired);
  console.log(`${repo}: ${desired.name} aplicado`);
}
