// Un PR a main solo promueve el commit exacto que terminó CI + deploy en develop.
const { GITHUB_REPOSITORY: repo, GH_TOKEN: token, PROMOTION_SHA: sha, DEPLOY_ENABLED: enabled } = process.env;
if (enabled !== "true") throw new Error("Activa y verifica primero el despliegue develop; DEPLOY_ENABLED todavía no es true.");
if (!repo || !token || !/^[a-f0-9]{40}$/.test(sha ?? "")) throw new Error("Falta contexto de promoción");
const url = `https://api.github.com/repos/${repo}/actions/workflows/ci.yml/runs?branch=develop&event=push&head_sha=${sha}&per_page=100`;
const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" } });
if (!response.ok) throw new Error(`No se pudo verificar CI develop: ${response.status}`);
const { workflow_runs: runs } = await response.json();
const latest = runs?.filter(r => r.head_sha === sha).sort((a, b) => b.run_number - a.run_number)[0];
if (!latest || latest.status !== "completed" || latest.conclusion !== "success") throw new Error("El commit exacto de develop todavía no tiene CI y despliegue exitosos. Reejecutar este check después de corregirlo.");
console.log("Commit de develop verificado para promoción.");
