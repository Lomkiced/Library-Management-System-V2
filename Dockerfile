# =============================================================================
# Library Management System - Production Docker Configuration
# =============================================================================
# Multi-stage Dockerfile for Laravel 8 Backend + React 19 (Vite) Frontend
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Frontend Build (React/Vite)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Build argument: API URL that the React app will call at runtime
# Since nginx proxies /api to PHP-FPM, this should be a relative path
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Copy package files first for better layer caching
COPY library-frontend/package.json library-frontend/package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy frontend source code
COPY library-frontend/ ./

# Build production assets with the API URL baked in
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Backend Dependencies (Composer)
# -----------------------------------------------------------------------------
FROM composer:2.6 AS composer-build

WORKDIR /app

# Copy composer files
COPY library-backend/composer.json library-backend/composer.lock ./

# Install PHP dependencies without dev dependencies
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --ignore-platform-reqs

# Copy the rest of the backend code
COPY library-backend/ ./

# Remove dev-environment cached providers (they reference facade/ignition which isn't installed)
RUN rm -f bootstrap/cache/packages.php bootstrap/cache/services.php

# Generate optimized autoloader (--no-scripts prevents discovery of dev-only providers)
RUN composer dump-autoload --optimize --no-dev --no-scripts

# -----------------------------------------------------------------------------
# Stage 3: Production Image (PHP-FPM)
# -----------------------------------------------------------------------------
FROM php:8.1-fpm-alpine AS production

# Install system dependencies and PHP extensions
RUN apk add --no-cache \
    # For GD extension
    freetype-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    libwebp-dev \
    # For zip extension
    libzip-dev \
    zip \
    unzip \
    # For intl extension
    icu-dev \
    # For database
    mysql-client \
    # For healthchecks and cron
    curl \
    supervisor \
    # Clean up
    && rm -rf /var/cache/apk/*

# Configure and install PHP extensions
RUN docker-php-ext-configure gd \
    --with-freetype \
    --with-jpeg \
    --with-webp \
    && docker-php-ext-install -j$(nproc) \
    bcmath \
    exif \
    gd \
    intl \
    opcache \
    pdo \
    pdo_mysql \
    zip

# Install Redis extension
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

# Copy custom PHP configuration
COPY <<EOF /usr/local/etc/php/conf.d/app.ini
; Production PHP Configuration
memory_limit=512M
upload_max_filesize=200M
post_max_size=220M
max_execution_time=300
max_input_vars=5000

; OPcache settings for production
opcache.enable=1
opcache.memory_consumption=256
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0
opcache.interned_strings_buffer=16
opcache.jit_buffer_size=100M
EOF

# Copy PHP-FPM pool configuration
COPY <<EOF /usr/local/etc/php-fpm.d/www.conf
[www]
user = www-data
group = www-data
listen = 9000
listen.owner = www-data
listen.group = www-data

pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
pm.max_requests = 500

clear_env = no
catch_workers_output = yes
decorate_workers_output = no
EOF

# Set working directory
WORKDIR /var/www/html

# Copy backend application from composer build stage
COPY --from=composer-build --chown=www-data:www-data /app /var/www/html

# Copy built frontend assets to Laravel public directory
COPY --from=frontend-build --chown=www-data:www-data /app/frontend/dist /var/www/html/public/app

# Backup frontend dist so it survives Docker volume overlay at runtime
# (the shared volume mounts over /var/www/html/public/app, hiding the image files)
COPY --from=frontend-build --chown=www-data:www-data /app/frontend/dist /app-frontend-dist

# Create required Laravel directories, clean stale dev cache, and discover production providers
RUN mkdir -p \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    # Remove cached provider manifests that reference dev-only packages (facade/ignition)
    && rm -f bootstrap/cache/packages.php bootstrap/cache/services.php \
    # Explicitly disable dev package discovery in production to prevent "Class not found" errors
    # (Ignition, Sail, Collision are in installed.json but files are missing due to --no-dev)
    && sed -i 's/"dont-discover": \[\]/"dont-discover": \["facade\/ignition", "laravel\/sail", "nunomaduro\/collision"\]/' composer.json \
    # Discover only production packages
    && php artisan package:discover --ansi \
    # Set permissions
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Copy entrypoint script and fix Windows line endings (CRLF → LF)
COPY docker/entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Install netcat for MySQL healthcheck, fix line endings, set permissions
RUN apk add --no-cache netcat-openbsd \
    && sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to non-root user
USER www-data

# Expose PHP-FPM port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD php-fpm -t || exit 1

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Default command
CMD ["php-fpm"]
