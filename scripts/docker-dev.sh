#!/bin/sh
set -e

if [ ! -d node_modules ] || ! node -e "require('bcrypt')" >/dev/null 2>&1; then
  echo "[docker-dev] Installing dependencies (native modules like bcrypt need install scripts)..."
  # En container/dev sans TTY, pnpm peut demander une confirmation pour purger node_modules.
  # On force le mode non-interactif pour éviter ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY.
  CI=true PNPM_CONFIG_CONFIRM_MODULES_PURGE=false pnpm install --frozen-lockfile
fi

echo "[docker-dev] Generating Prisma client..."
pnpm exec prisma generate

exec pnpm start:dev
