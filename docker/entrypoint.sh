#!/bin/sh
set -e

echo "=========================================="
echo " Library Management System - Starting..."
echo "=========================================="

# ── Sync SPA frontend files to shared volume ──
# Docker named volume overlays /var/www/html/public/app at runtime,
# so we copy from the backup built during docker build.
if [ -d "/app-frontend-dist" ]; then
    echo "[0/6] Syncing frontend assets to shared volume..."
    cp -r /app-frontend-dist/* /var/www/html/public/app/ 2>/dev/null || true
fi

# ── Wait for MySQL ────────────────────────────
echo "[1/6] Waiting for MySQL at ${DB_HOST:-mysql}:${DB_PORT:-3306}..."
RETRIES=30
until nc -z ${DB_HOST:-mysql} ${DB_PORT:-3306} 2>/dev/null; do
    RETRIES=$((RETRIES - 1))
    if [ $RETRIES -le 0 ]; then
        echo "ERROR: MySQL did not become ready in time. Exiting."
        exit 1
    fi
    sleep 2
done
echo "  ✓ MySQL is ready!"

# ── Generate APP_KEY if not set ───────────────
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ]; then
    echo "[2/6] Generating application key..."
    php artisan key:generate --force
else
    echo "[2/6] Application key already set."
fi

# ── Run migrations ────────────────────────────
echo "[3/6] Running database migrations..."
php artisan migrate --force

# ── Seed admin user on fresh database ─────────
USER_COUNT=$(php artisan tinker --execute="echo App\Models\User::count();" 2>/dev/null | tail -1)
if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
    echo "  → Fresh database detected, seeding admin user..."
    php artisan db:seed --class=AdminSeeder --force 2>/dev/null || true
fi

# ── Optimize for production ───────────────────
echo "[4/6] Optimizing application..."
php artisan config:clear
php artisan config:cache
php artisan route:clear
php artisan view:cache

# ── Storage symlink ───────────────────────────
echo "[5/6] Creating storage symlink..."
php artisan storage:link --force 2>/dev/null || true

# ── Done ──────────────────────────────────────
echo "[6/6] Application ready!"
echo "=========================================="
echo " All services initialized successfully"
echo "=========================================="

# Execute the main command (php-fpm)
exec "$@"
