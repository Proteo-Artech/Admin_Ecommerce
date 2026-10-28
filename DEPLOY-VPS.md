# Distinto en Vercel y Admin en VPS Docker

## Arquitectura y estado

Actualizado el 27 de octubre de 2026. Sustituye la propuesta anterior de ejecutar también la tienda en el VPS.

- **Distinto:** Vercel. develop utiliza Preview; main utiliza Production.
- **Admin:** VPS Ubuntu con Docker, SQLite y archivos persistentes. Instalaciones independientes para develop y producción.
- **Imágenes:** disco del VPS servido por Caddy. Se conserva `/uploads/` para facilitar una migración posterior a Cloudflare R2.
- **Automatización:** GitHub Actions comprueba el código antes de publicar. Los despliegues están apagados hasta definir `DEPLOY_ENABLED=true` en cada repositorio.
- **Protecciones:** los JSON incluidos deben aplicarse en GitHub; guardarlos en Git no activa las reglas remotas.

Las pruebas, el aislamiento y la recuperación reducen riesgos; no garantizan ausencia de fallos. Las comprobaciones locales no sustituyen DNS, TLS, permisos, correo y Stripe reales.

## 1. Ramas y reglas en ambos repositorios

```text
feature/* o fix/* -> PR -> develop -> CI -> deploy develop -> validar
                              |
                              +-> PR develop a main -> CI + revisión -> producción
```

| Regla | develop | main |
|---|---|---|
| Push directo | Bloqueado | Bloqueado |
| Force push y borrar rama | Bloqueado | Bloqueado |
| PR obligatorio | Sí | Sí |
| Checks requeridos | `quality`, `branch-policy` | `quality`, `branch-policy` |
| Rama actualizada antes del merge | Sí | Sí |
| Revisión de otra persona | Opcional | Una y aprobación del último push |
| Origen del PR | Feature/fix | Solo develop del mismo repositorio |
| Deploy develop del SHA exacto | No aplica | Obligatorio |
| Bypass configurado | Ninguno | Ninguno |

`branch-policy` busca un run exitoso de `CI` por push a develop para el SHA exacto del PR y exige `DEPLOY_ENABLED=true`. Si CI o el despliegue de ese commit falla, no se promueve. Reejecutar el check del PR cuando haya terminado el run develop.

Promover develop → main con merge commit. Después sincronizar main → develop mediante PR. La revisión obligatoria de main requiere otra persona; si trabajas solo, acordar otra política de revisión sin eliminar tests ni habilitar bypass habitual.

### Activación de reglas

1. Confirmar/crear el remoto de Admin: la carpeta revisada no tenía `origin` configurado. Excluir secretos, SQLite e imágenes del primer commit.
2. Crear develop y conservar main. Hacer el bootstrap inicial de workflows y ejecutar CI antes de exigir sus checks.
3. En cada repo: **Settings → Rules → Rulesets → Import a ruleset**, importar `.github/rulesets/develop.json` y `main.json`.
4. Alternativa, con `GH_TOKEN` ya configurado en tu terminal y permiso Administration:write:

   ```powershell
   node scripts/apply-rules.mjs Proteo-Artech/Distinto
   node scripts/apply-rules.mjs Proteo-Artech/Distinto --apply
   # Repetir desde Admin con su OWNER/REPO real.
   ```

5. Comprobar enforcement Active, cero bypass y fuente GitHub Actions para los checks (App ID 15368 en los JSON).
6. Verificar que un PR con tests fallidos y un PR feature → main no permiten merge.

Reglas y revisores de environments dependen del plan y visibilidad del repositorio. Si GitHub rechaza activarlos por el plan, resolverlo antes de considerar protegidas las ramas. El script falla ante errores HTTP y no imprime credenciales.

## 2. Pruebas y calidad

En ambos proyectos:

```powershell
npm ci
# Solo Admin, si falta generar cliente:
npx prisma generate
npm test
npm run build
npm run typecheck
npx playwright install chromium
npm run test:e2e
```

Actions instala Chromium con `--with-deps`. Los tests no reutilizan servidores existentes ni bases reales.

| Proyecto | Cobertura inicial |
|---|---|
| Distinto, Vitest | Carrito y reservas, variantes y stock, cupón, direcciones, clave privada hacia Admin, errores de pedidos, login sin filtrar token, salud ante caída del backend |
| Distinto, navegador | Detalle → agregar → carrito → recarga → eliminar; perfil sin sesión; catálogo sin secretos |
| Admin, Vitest + SQLite temporal | Login, cookie falsificada por ID, token aleatorio y hash, expiración/revocación, suspensión de usuario, cupones, precio del servidor, stock, líneas duplicadas, confirmación secuencial idempotente, subidas, clave API y URLs de medios |
| Admin, navegador + backend real | Login/logout y rechazo de replay; catálogo protegido → pedido simulado → rechazo de segunda venta |

Distinto usa un servidor HTTP de contrato local en sus pruebas de navegador. Admin usa su servidor compilado con SQLite nueva en directorio temporal. **El recorrido completo Vercel → VPS se verifica adicionalmente en develop** antes de aprobar producción. No se cubren cobros reales, SMTP externo ni todos los casos concurrentes de pagos.

No usar credenciales/datos de producción en tests. Los traces no se publican automáticamente como artifacts.

### Cambios preparados en código

- Admin configura `DATABASE_URL` y `UPLOAD_DIR`; las dos rutas de subida usan `src/lib/uploads.ts`.
- Cookie de panel con token aleatorio, hash en Session, caducidad de 14 días y revocación. Las cookies anteriores dejan de funcionar: volver a iniciar sesión.
- Demo deshabilitada por defecto; requiere habilitación explícita, APP_ENV test/develop y contraseña bootstrap fuerte.
- `npm run admin:create` crea un administrador sin contraseña predeterminada y no sobreescribe usuarios.
- Distinto permite dominios de Admin/medios mediante variables, usa timeout hacia Admin y cookie secure en producción.
- El detalle de producto devuelve imágenes absolutas igual que el catálogo.

## 3. GitHub Environments

Crear en ambos repositorios:

| Environment | Rama permitida | Publicación |
|---|---|---|
| develop | develop | Automática después de CI |
| production | main | Reviewer obligatorio antes de liberar secretos/desplegar |

Activar prevent self-review cuando esté disponible. Proteger la rama y aprobar la publicación son controles diferentes.

La variable **de repositorio** `DEPLOY_ENABLED` empieza ausente/false. Activarla solo tras preparar datos, dominios, secretos, restricciones y respaldos. Los PR ejecutan calidad sin publicar ni acceder a secretos de deploy.

## 4. Distinto en Vercel

1. Identificar/crear el proyecto Vercel correcto y confirmar equipo, Org ID y Project ID.
2. Asignar dominios de producción y develop, por ejemplo `distinto.mx` y `dev.distinto.mx`. Production Branch: main.
3. `vercel.json` desactiva deployments de Git: **Actions controla tests → candidato → smoke → promoción**. No mantener otro mecanismo que publique antes de los tests.
4. En develop, el alias se asigna después del smoke. Verificar en el primer despliegue que ninguna configuración adicional mueve antes el dominio de desarrollo.

### Variables de aplicación en Vercel

Configurar Preview para develop y Production para main:

| Variable | Develop | Producción |
|---|---|---|
| ADMIN_API_URL | `https://admin-dev.tudominio.com` | `https://admin.tudominio.com` |
| ADMIN_PUBLIC_URL | Mismo origen Admin develop | Mismo origen Admin producción |
| ADMIN_API_SECRET | Clave exclusiva develop | Clave exclusiva producción |
| STORE_SLUG | distinto | distinto |
| ASSET_PUBLIC_URL | Vacío mientras se use VPS | Vacío inicialmente |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | pk_test o vacío | pk_live cuando se habiliten cobros |

Vercel necesita la URL **HTTPS pública** del VPS; no puede resolver `http://admin:3001` de Docker. No se requiere CORS de Admin para esta arquitectura: el navegador habla con rutas de Distinto y su servidor llama a Admin con `x-store-key`.

No usar `NEXT_PUBLIC_` para secretos. Configurar también Google OAuth por entorno si se usa, con callbacks de la tienda correspondiente. Variables de dominios/imágenes y NEXT_PUBLIC requieren reconstruir para cambiar.

### GitHub: variables y secretos para Vercel

En cada environment:

- Variables `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VERCEL_CLI_VERSION` (versión exacta revisada; no latest).
- En develop, variable `DEVELOP_DOMAIN`: hostname sin https.
- Secret `VERCEL_TOKEN` con el mínimo acceso necesario.
- Secret `VERCEL_AUTOMATION_BYPASS_SECRET` si los candidatos están protegidos. No desactivar la protección para pasar el smoke.

Tras `quality`, `vercel-deploy.yml` descarga configuración por entorno, construye y despliega con `--prebuilt`. Main utiliza `--prod --skip-domain`, prueba salud y catálogo y solo después ejecuta `vercel promote`. Develop asigna su alias tras esas comprobaciones.

El smoke es de solo lectura; no genera pedidos ni cargos. Si falla no se promueve. Restringir permisos de Vercel para evitar publicaciones manuales fuera del proceso.

## 5. Admin en VPS

### Preparación inicial

Punto de partida para pruebas: Ubuntu 24.04, 2 vCPU, 4 GB RAM y SSD dimensionado para fotos/respaldos. Instalar Docker Engine + Compose, Caddy como servicio del host, sqlite3, curl, openssl y flock. Medir recursos y ajustar.

Crear DNS de ambos Admin. Abrir 80/443 y controlar SSH con llaves. Los puertos Docker se publican solo en loopback.

Comandos Bash **en el VPS**:

```bash
sudo mkdir -p /srv/distinto/bin
sudo mkdir -p /srv/distinto/develop/{data,uploads,backups}
sudo mkdir -p /srv/distinto/production/{data,uploads,backups}
sudo chown -R deploy:deploy /srv/distinto
sudo chown -R 1000:1000 /srv/distinto/develop/data /srv/distinto/develop/uploads
sudo chown -R 1000:1000 /srv/distinto/production/data /srv/distinto/production/uploads
sudo chmod 700 /srv/distinto/develop/backups /srv/distinto/production/backups
sudo chmod 755 /srv/distinto/develop/uploads /srv/distinto/production/uploads
```

Confirmar UID/GID 1000 de node en la imagen. Usuario deploy necesita Docker (equivale a control administrativo del host); Caddy necesita leer uploads y atravesar sus directorios padre. Nunca poner secretos dentro de uploads.

### Archivos incluidos en Admin

| Archivo | Destino VPS |
|---|---|
| deploy/compose.yaml | `/srv/distinto/develop/compose.yaml` y equivalente production |
| deploy/deploy-admin.sh | `/srv/distinto/bin/deploy-admin.sh` |
| deploy/admin.env.example | admin.env dentro de cada entorno, completar |
| deploy/Caddyfile | Configuración Caddy del host, sustituir dominios |

Dar `chmod 700` al script. En cada entorno crear `.env` de Compose:

```dotenv
# Develop usa 3101; producción usa 3001.
ADMIN_PORT=3101
ADMIN_IMAGE=ghcr.io/tu-organizacion/tu-repo-admin:SHA_INICIAL
```

Crear `image-name` con `ghcr.io/tu-organizacion/tu-repo-admin` en minúsculas y sin etiqueta. Debe coincidir con el repositorio real, del que Actions deriva la imagen.

En admin.env: NODE_ENV production, APP_ENV develop/production, DATABASE_URL `file:/app/data/distinto.db`, UPLOAD_DIR `/app/public/uploads`, ALLOW_DEMO_SEED false. Completar URLs, correo y secretos exclusivos; ADMIN_API_SECRET debe coincidir con Vercel del mismo entorno. Generar secretos por separado con `openssl rand -hex 32`. Proteger archivos de entorno con `chmod 600`.

No compartir SQLite, imágenes ni secretos entre entornos. Mantener un solo proceso escritor Admin sobre cada SQLite; no escalar réplicas compartiendo el archivo.

### Datos y primer arranque

1. Publicar las imágenes iniciales manualmente en GHCR antes de activar CI/CD:

   ```bash
   # Desde Admin, en equipo/runner con Docker y login autorizado:
   docker build -t ghcr.io/tu-organizacion/tu-repo-admin:SHA_INICIAL .
   docker push ghcr.io/tu-organizacion/tu-repo-admin:SHA_INICIAL
   ```

2. En el VPS, usuario deploy inicia sesión en GHCR con token de lectura de paquetes mediante `--password-stdin`. No guardar token en historial ni imprimirlo.
3. Detener Admin local para copiar una SQLite consistente o usar `.backup`. Copiar `data/distinto.db` y `public/uploads` a develop; anonimizar datos si corresponde. No copiar .env local.
4. Corregir URLs absolutas antiguas que apunten a localhost. Solo las referencias `/uploads/...` se convierten automáticamente.
5. Revisar esquema. **Solo inicialización de base vacía develop:**

   ```bash
   cd /srv/distinto/develop
   docker compose pull
   docker compose run --rm admin npx prisma db push
   ```

6. En producción/cambios posteriores, preparar migraciones versionadas y baseline antes de `prisma migrate deploy`. El pipeline no ejecuta db push, reset ni migraciones implícitas.
7. En base nueva ejecutar `npm run admin:create` en contenedor temporal con ADMIN_BOOTSTRAP_EMAIL y ADMIN_BOOTSTRAP_PASSWORD pasados por entorno seguro y temporal. Exige 16 caracteres y no cambia usuarios existentes. Inicializa la tienda distinto, categorías y una marca/tipo base, sin productos demo. No persistir esa contraseña en archivos del VPS; completar catálogo en el panel.
8. Arrancar:

   ```bash
   docker compose up -d --wait admin
   docker compose ps
   curl --fail http://127.0.0.1:3101/api/health
   # Tras configurar/validar/recargar Caddy:
   curl --fail https://admin-dev.tudominio.com/api/health
   ```

9. Probar subida y acceso público a una imagen nueva, reiniciar/recrear Admin y confirmar que sigue disponible. Caddy sirve directamente uploads; las fotos no forman parte de la imagen Docker.

### Secrets GitHub de Admin

En ambos environments: VPS_HOST, VPS_USER, VPS_SSH_KEY y VPS_KNOWN_HOSTS. Usar llave dedicada y comprobar huella por consola confiable. No desactivar StrictHostKeyChecking.

GITHUB_TOKEN publica en GHCR; revisar permisos del paquete privado. VPS mantiene su propia credencial de lectura.

### Despliegue automático

Tras CI, se construye/publica imagen con SHA. El script recibe entorno/SHA, toma lock, descarga imagen, respalda SQLite consistentemente, conserva la referencia anterior, recrea Admin y verifica salud y catálogo mediante HTTPS público. Ante fallo restaura la imagen anterior.

Puede haber interrupción breve. No revierte automáticamente esquema ni archivos. Mantener compatibilidad entre releases: publicar Admin compatible primero, después tienda y retirar campos antiguos en otra versión.

## 6. Respaldos y recuperación

- Programar respaldo diario de SQLite, uploads y configuración cifrada. El backup predeploy de SQLite no sustituye el respaldo de fotos.
- Para una copia coordinada, detener brevemente Admin, respaldar base/archivos y reiniciarlo; planear la ventana de tienda.
- Mantener copia cifrada fuera del VPS y retención/alertas. Probar restauración aislada y registrar ambos SHAs.
- Vercel: rollback a release previa compatible con Admin y revisar la siguiente promoción/autoasignación.
- VPS: restablecer ADMIN_IMAGE anterior y `docker compose up -d --no-deps --wait admin`. Si hay esquema incompatible seguir el procedimiento de esa migración; restaurar una base antigua puede perder pedidos.
- No ejecutar `docker compose down -v` ni limpiar datos en CI. Monitorizar disco, disponibilidad, errores y antigüedad de respaldos.

## 7. Migrar después a Cloudflare R2

Todavía no se implementó el cliente de R2. Se preparó el punto común `src/lib/uploads.ts` y ASSET_PUBLIC_URL.

1. Crear buckets/credenciales separados por entorno.
2. Implementar adaptador S3 compatible en saveUpload, conservando permisos, validaciones y prefijo `uploads/`.
3. Copiar archivos conservando claves y configurar dominios media-dev/media.
4. Configurar ASSET_PUBLIC_URL en Admin/Distinto y reconstruir tienda para permitir nuevo host. Revisar next/image del panel si se incorporan URLs externas allí.
5. Mantener `/uploads/...`, que usa la validación de experiencias; no cambiar formato sin actualizar consumidores y pruebas.
6. Mantener URLs antiguas del VPS por proxy/redirect durante transición y verificar antes de retirar disco.
7. Inicialmente subir desde Admin, sin credenciales en navegador. Si después hay URLs firmadas, configurar CORS y permisos específicos.

## 8. Orden de activación

- [ ] Confirmar remoto Admin y cuatro dominios.
- [ ] Ejecutar tests, builds y pruebas navegador de ambos repositorios.
- [ ] Revisar/resolver vulnerabilidades sin forzar una migración mayor de Prisma a ciegas.
- [ ] Activar environments y verificar reglas remotas.
- [ ] Preparar VPS develop, datos, Caddy, GHCR; validar manualmente.
- [ ] Configurar Vercel Preview y backend develop.
- [ ] Activar DEPLOY_ENABLED y ejecutar push revisado a develop en ambos repositorios.
- [ ] Verificar tienda desplegada: catálogo, detalle, imágenes, login, carrito, cupón, checkout simulado, pedido en Admin y stock.
- [ ] Probar Stripe test/SMTP si se usarán; incluir doble confirmación y concurrencia antes de cobros reales.
- [ ] Probar reinicio, rollback y restauración.
- [ ] Preparar producción separada, aprobar develop → main con evidencia de develop.
- [ ] Publicar Admin compatible y luego Distinto; verificar sin crear cargos reales de prueba.

## Referencias oficiales

- [GitHub Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [GitHub Environments](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments)
- [Vercel Git Configuration](https://vercel.com/docs/project-configuration/git-configuration)
- [Vercel pull por rama](https://vercel.com/docs/cli/pull)
- [Vercel promoción](https://vercel.com/docs/deployments/promoting-a-deployment)
- [Docker Compose en producción](https://docs.docker.com/compose/how-tos/production/)
- [Caddy proxy/archivos](https://caddyserver.com/docs/caddyfile/patterns)
- [Playwright servidores de pruebas](https://playwright.dev/docs/test-webserver)
