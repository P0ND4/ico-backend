#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$BACKEND_DIR"

mode="${1:-production}"

if [[ "$mode" != "bootstrap" && "$mode" != "production" ]]; then
  echo "Uso: $0 [bootstrap|production]"
  exit 1
fi

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export API_DOMAIN="${API_DOMAIN:?API_DOMAIN requerido en .env}"
export LANDING_DOMAIN="${LANDING_DOMAIN:?LANDING_DOMAIN requerido en .env}"
export WWW_API_DOMAIN="www.${API_DOMAIN}"
export WWW_LANDING_DOMAIN="www.${LANDING_DOMAIN}"
export CERT_PRIMARY_DOMAIN="${API_DOMAIN}"

template="production.conf.template"
if [[ "$mode" == "bootstrap" ]]; then
  template="bootstrap.http.conf.template"
fi

mkdir -p nginx/conf.d

envsubst '${API_DOMAIN} ${WWW_API_DOMAIN} ${LANDING_DOMAIN} ${WWW_LANDING_DOMAIN} ${CERT_PRIMARY_DOMAIN}' \
  < "nginx/templates/${template}" \
  > nginx/conf.d/default.conf

echo "✓ nginx/conf.d/default.conf generado (${mode})"
