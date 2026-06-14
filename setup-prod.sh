#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COMPOSE="docker compose --profile prod"

echo "=== ICO Backend — despliegue producción (Docker + HTTPS) ==="

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: Docker no está instalado o no está en el PATH."
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Error: falta .env. Copia .env.example y configura las variables de producción."
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

export API_DOMAIN="${API_DOMAIN:-}"
export LANDING_DOMAIN="${LANDING_DOMAIN:-}"
export CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
export WWW_API_DOMAIN="www.${API_DOMAIN}"
export WWW_LANDING_DOMAIN="www.${LANDING_DOMAIN}"

REQUIRED_VARS=(
  DB_HOST
  DB_NAME
  DB_USERNAME
  DB_PASSWORD
  JWT_SECRET
  DEEPSEEK_API_KEY
  API_DOMAIN
  LANDING_DOMAIN
  CERTBOT_EMAIL
)

missing=()
for var in "${REQUIRED_VARS[@]}"; do
  value="${!var:-}"
  if [[ -z "$value" ]]; then
    missing+=("$var")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Error: variables obligatorias vacías en .env:"
  printf '  - %s\n' "${missing[@]}"
  exit 1
fi

if [[ "${NODE_ENV:-}" != "production" ]]; then
  echo "⚠ NODE_ENV no es 'production'. Forzando NODE_ENV=production."
  if grep -qE '^NODE_ENV=' .env; then
    sed -i.bak 's/^NODE_ENV=.*/NODE_ENV=production/' .env 2>/dev/null || sed -i '' 's/^NODE_ENV=.*/NODE_ENV=production/' .env
    rm -f .env.bak
  else
    echo "NODE_ENV=production" >> .env
  fi
  export NODE_ENV=production
fi

if [[ -z "${REDIS_URL:-}" ]] && [[ "${REDIS_HOST:-redis}" == "localhost" ]]; then
  if grep -qE '^REDIS_HOST=' .env; then
    sed -i.bak 's/^REDIS_HOST=.*/REDIS_HOST=redis/' .env 2>/dev/null || sed -i '' 's/^REDIS_HOST=.*/REDIS_HOST=redis/' .env
    rm -f .env.bak
  else
    echo "REDIS_HOST=redis" >> .env
  fi
  echo "✓ REDIS_HOST=redis (servicio del compose)"
fi

resolve_domain() {
  local domain="$1"
  if command -v dig >/dev/null 2>&1; then
    dig +short "$domain" A | grep -qE '^[0-9.]+'
    return
  fi
  if command -v host >/dev/null 2>&1; then
    host -t A "$domain" 2>/dev/null | grep -q "has address"
    return
  fi
  getent ahosts "$domain" >/dev/null 2>&1
}

echo ""
echo "Comprobando DNS..."
dns_missing=()
for domain in "$LANDING_DOMAIN" "$WWW_LANDING_DOMAIN" "$API_DOMAIN" "$WWW_API_DOMAIN"; do
  if resolve_domain "$domain"; then
    echo "  ✓ $domain"
  else
    dns_missing+=("$domain")
    echo "  ✗ $domain (sin registro A/CNAME resoluble)"
  fi
done

if [[ ${#dns_missing[@]} -gt 0 ]]; then
  echo ""
  echo "Error: configura DNS antes de continuar:"
  printf '  - %s\n' "${dns_missing[@]}"
  exit 1
fi

cert_exists() {
  $COMPOSE run --rm --entrypoint "" certbot \
    sh -c "test -f /etc/letsencrypt/live/${API_DOMAIN}/fullchain.pem" >/dev/null 2>&1
}

install_renew_cron() {
  local marker="ico-backend-certbot-renew"
  local cron_cmd="0 3 * * * cd ${SCRIPT_DIR} && docker compose --profile prod run --rm --entrypoint certbot certbot renew --quiet && docker compose --profile prod exec -T nginx nginx -s reload # ${marker}"

  if crontab -l 2>/dev/null | grep -q "$marker"; then
    echo "✓ Cron de renovación SSL ya configurado"
    return
  fi

  if [[ "$(uname -s)" != "Linux" ]]; then
    echo "⚠ Configura renovación SSL manualmente en este sistema:"
    echo "  ${cron_cmd}"
    return
  fi

  (crontab -l 2>/dev/null | grep -v "$marker" || true; echo "$cron_cmd") | crontab -
  echo "✓ Cron de renovación SSL instalado (03:00 diario)"
}

NO_CACHE=""
if [[ "${1:-}" == "--no-cache" ]]; then
  NO_CACHE="--no-cache"
  echo "Build sin caché (--no-cache)"
fi

chmod +x scripts/generate-nginx-conf.sh

echo ""
echo "Construyendo imágenes..."
$COMPOSE build $NO_CACHE

if cert_exists; then
  echo ""
  echo "Certificado SSL existente — generando config HTTPS..."
  ./scripts/generate-nginx-conf.sh production
else
  echo ""
  echo "Sin certificado — bootstrap HTTP para Let's Encrypt..."
  ./scripts/generate-nginx-conf.sh bootstrap
fi

echo ""
echo "Levantando servicios..."
$COMPOSE up -d --remove-orphans

echo ""
echo "Esperando API..."
for _ in $(seq 1 45); do
  status="$(docker inspect --format='{{.State.Health.Status}}' ico-api 2>/dev/null || echo "starting")"
  if [[ "$status" == "healthy" ]]; then
    break
  fi
  sleep 2
done

if ! cert_exists; then
  echo ""
  echo "Solicitando certificado Let's Encrypt..."
  $COMPOSE run --rm --entrypoint certbot certbot certonly \
    --webroot -w /var/www/certbot \
    -d "$API_DOMAIN" \
    -d "$WWW_API_DOMAIN" \
    -d "$LANDING_DOMAIN" \
    -d "$WWW_LANDING_DOMAIN" \
    --email "$CERTBOT_EMAIL" \
    --agree-tos \
    --non-interactive

  echo ""
  echo "Activando HTTPS..."
  ./scripts/generate-nginx-conf.sh production
  $COMPOSE exec -T nginx nginx -s reload
fi

$COMPOSE up -d --remove-orphans
install_renew_cron

echo ""
echo "Esperando healthcheck final..."
for _ in $(seq 1 30); do
  api_status="$(docker inspect --format='{{.State.Health.Status}}' ico-api 2>/dev/null || echo "starting")"
  if [[ "$api_status" == "healthy" ]]; then
    echo ""
    echo "✓ Despliegue completado"
    echo ""
    echo "Landing:  https://${LANDING_DOMAIN}"
    echo "          https://${WWW_LANDING_DOMAIN} → ${LANDING_DOMAIN}"
    echo "API:      https://${API_DOMAIN}/api"
    echo "          https://${WWW_API_DOMAIN} → ${API_DOMAIN}"
    echo "Health:   https://${API_DOMAIN}/api/health"
    echo ""
    $COMPOSE ps
    exit 0
  fi
  sleep 2
done

echo "⚠ La API aún no está healthy. Revisa logs:"
echo "  docker compose --profile prod logs -f api nginx"
exit 1
