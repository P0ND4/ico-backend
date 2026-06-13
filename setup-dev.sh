#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COMPOSE="docker compose --profile dev"

echo "=== ICO Backend — setup desarrollo (Docker) ==="

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: Docker no está instalado o no está en el PATH."
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "✓ Creado .env desde .env.example"
fi

if grep -qE '^DB_HOST=localhost$' .env; then
  case "$(uname -s)" in
    Darwin|MINGW*|MSYS*|CYGWIN*)
      if [[ "$(uname -s)" == "Darwin" ]]; then
        sed -i '' 's/^DB_HOST=localhost/DB_HOST=host.docker.internal/' .env
      else
        sed -i 's/^DB_HOST=localhost/DB_HOST=host.docker.internal/' .env
      fi
      echo "✓ DB_HOST ajustado a host.docker.internal (PostgreSQL en tu máquina)"
      ;;
    Linux)
      echo "⚠ DB_HOST=localhost no funciona desde Docker en Linux."
      echo "  Usa la IP del host o añade extra_hosts en docker-compose.yml."
      ;;
  esac
fi

if grep -qE '^REDIS_HOST=' .env && ! grep -qE '^REDIS_HOST=redis$' .env; then
  :
else
  if grep -qE '^REDIS_HOST=' .env; then
    sed -i.bak 's/^REDIS_HOST=.*/REDIS_HOST=redis/' .env 2>/dev/null || sed -i '' 's/^REDIS_HOST=.*/REDIS_HOST=redis/' .env
    rm -f .env.bak
  else
    echo "REDIS_HOST=redis" >> .env
  fi
  echo "✓ REDIS_HOST=redis (servicio del compose)"
fi

if grep -qE '^NODE_ENV=' .env; then
  sed -i.bak 's/^NODE_ENV=.*/NODE_ENV=development/' .env 2>/dev/null || sed -i '' 's/^NODE_ENV=.*/NODE_ENV=development/' .env
  rm -f .env.bak
else
  echo "NODE_ENV=development" >> .env
fi

echo ""
echo "Construyendo imagen (profile dev — sin nginx/certbot)..."
$COMPOSE build

echo ""
echo "Levantando servicios..."
$COMPOSE up -d --remove-orphans

echo ""
echo "Esperando que la API responda..."
PORT="$(grep -E '^PORT=' .env | cut -d= -f2- || true)"
PORT="${PORT:-3000}"

for _ in $(seq 1 30); do
  if curl -sf "http://localhost:${PORT}/api/docs" >/dev/null 2>&1; then
    echo "✓ API lista en http://localhost:${PORT}/api/docs"
    $COMPOSE ps
    exit 0
  fi
  sleep 2
done

echo "⚠ La API aún no responde. Revisa logs:"
echo "  docker compose --profile dev logs -f api-dev"
exit 1
