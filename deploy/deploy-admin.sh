#!/usr/bin/env bash
set -Eeuo pipefail
target="${1:?develop o production}"
sha="${2:?commit SHA}"
[[ "$target" = develop || "$target" = production ]] || exit 2
[[ "$sha" =~ ^[a-f0-9]{40}$ ]] || exit 2
cd "/srv/distinto/$target"
exec 9>.deploy.lock
flock -x 9
# Archivo administrado solo en el servidor: nombre de imagen sin etiqueta.
image=$(cat image-name)
[[ "$image" =~ ^ghcr\.io/[a-z0-9_.-]+/[a-z0-9_.-]+$ ]] || exit 2
previous=$(sed -n 's/^ADMIN_IMAGE=//p' .env)
test -n "$previous"
docker pull "$image:$sha"
stamp=$(date -u +%Y%m%dT%H%M%S)
mkdir -p "backups/$stamp"
chmod 700 "backups/$stamp"
cp .env "backups/$stamp/images.env"
sqlite3 data/distinto.db ".backup 'backups/$stamp/distinto.db'"
sed -i "s|^ADMIN_IMAGE=.*|ADMIN_IMAGE=$image:$sha|" .env
if ! docker compose up -d --no-deps --wait --wait-timeout 180 admin; then
  docker compose logs --tail 60 admin
  sed -i "s|^ADMIN_IMAGE=.*|ADMIN_IMAGE=$previous|" .env
  docker compose up -d --no-deps --wait --wait-timeout 180 admin
  exit 1
fi
# Validar también el proxy público y la clave compartida (solo lectura).
if ! docker compose exec -T admin node -e '
  (async () => {
    const origin = process.env.ADMIN_PUBLIC_URL;
    const headers = { "x-store-key": process.env.ADMIN_API_SECRET };
    const response = await fetch(`${origin}/api/v1/stores/distinto/catalog`, { headers, signal: AbortSignal.timeout(20000) });
    if (!response.ok || !Array.isArray((await response.json()).products)) process.exit(1);
  })().catch(() => process.exit(1));
'; then
  sed -i "s|^ADMIN_IMAGE=.*|ADMIN_IMAGE=$previous|" .env
  docker compose up -d --no-deps --wait --wait-timeout 180 admin
  exit 1
fi
# No migraciones implícitas: preparar por separado cambios compatibles del esquema.
