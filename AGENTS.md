# Flujo de cambios y releases

- Trabajar en ramas `feature/*` o `fix/*`, con PR a `develop`.
- Promover a `main` exclusivamente mediante PR desde `develop` del mismo repositorio.
- No hacer push directo, force push ni saltar checks en `main` o `develop`.
- Antes de fusionar ejecutar `npm test`, `npm run build`, `npm run typecheck` y `npm run test:e2e`.
- Los tests usan datos y servicios temporales; nunca credenciales ni datos de producción.
- Distinto se publica en Vercel; Admin corre en VPS Docker. Configurar la comunicación por HTTPS y mantener la API compatible entre releases independientes.
- No activar `DEPLOY_ENABLED` hasta configurar secretos, dominios y protecciones remotas.
- Cambios de esquema requieren respaldo y procedimiento explícito; no aplicar `db push` en cada release.
