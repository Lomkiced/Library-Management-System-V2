# Docker Deployment Guide

Production-ready Docker deployment for the Library Management System — optimized for **LAN access**.

## 📋 Prerequisites

- Docker Desktop 24.0+ ([Download](https://www.docker.com/products/docker-desktop/))
- At least 2GB RAM available
- Windows 10/11 with PowerShell

## 📦 Moving to a New PC

If you are deploying this system to a **fresh computer**, follow these steps:

1.  **Install Prerequisites**:
    - [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Enable WSL2 backend on Windows)
    - [Git](https://git-scm.com/downloads)

2.  **Get the Code**:
    - Copy your project folder to the new PC (or `git clone` from your repository).

3.  **Setup Environment**:
    - The `.env` file contains your secrets and configs. It is **not** included in Git.
    - **Copy your `.env` file** from the old PC to the new one manually.
    - Or, create a new one: `copy .env.docker.example .env`

4.  **Data Migration (Optional)**:
    - If you want to keep your data, you must export it from the old PC:
      ```powershell
      docker compose exec mysql mysqldump -u root library_system > backup.sql
      ```
    - Then import on the new PC (after starting Docker):
      ```powershell
      cat backup.sql | docker compose exec -T mysql mysql -u root library_system
      ```

5.  **Deploy**:
    - Run `.\deploy.ps1` on the new PC.
    - It will detect the **new LAN IP** and update your `.env` automatically.

6.  **Configure Network Access (Required for LAN Devices)**:
    - Run `Open_Firewall.bat` (Right-click -> Run as Administrator or double-click and click Yes).
    - This opens ports 8080 and 8443 in Windows Defender Firewall so other devices can connect.

7.  **Find Access Links**:
    - Run `Find_Library_URL.bat` to instantly get the correct Wi-Fi IP address and clickable HTTPS links for Kiosks and Dashboards.

## 🚀 Quick Start (Recommended)

### One-Command Deploy

```powershell
# Open PowerShell in the project folder, then:
.\deploy.ps1
```

The script will:
1. ✅ Check Docker is running
2. ✅ Auto-detect your LAN IP
3. ✅ Configure `.env` for LAN access
4. ✅ Build & start all services
5. ✅ Display access URLs

### Manual Deploy

```powershell
# 1. Copy environment file
copy .env.docker.example .env

# 2. Edit .env — set your LAN IP in SANCTUM_STATEFUL_DOMAINS and APP_URL

# 3. Build and start
docker compose build
docker compose up -d

# 4. Check status
docker compose ps
```

---

## 🌐 LAN Access

Once deployed, the system is accessible from **any device** on your WiFi/LAN:

| From | URL |
|------|-----|
| **Host PC** | `http://localhost:8000` |
| **LAN Devices** | `http://<YOUR-IP>:8000` |
| **Catalog Kiosk** | `http://<YOUR-IP>:8000/catalog` |
| **Attendance Kiosk** | `http://<YOUR-IP>:8000/attendance` |

### Find Your LAN IP / System URLs

The easiest way to find your IP and access links is by using the helper script:

1. Double-click the **`Find_Library_URL.bat`** file located in this folder (or on your Desktop if you copied it).
2. It will automatically detect your active Wi-Fi IP address.
3. It will display the exact HTTPS links you need to access the Kiosk and Dashboard.

### Important: Update SANCTUM_STATEFUL_DOMAINS

For login to work from LAN devices, your `.env` must include the LAN IP:

```env
SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1,localhost:8000,127.0.0.1:8000,192.168.1.100,192.168.1.100:8000
```

> **Note:** The `deploy.ps1` script does this automatically.

> **Note:** The `deploy.ps1` script does this automatically.

---

## 📷 Camera & HTTPS

**Important:** To use the camera (QR Scanner, Attendance, etc.) on LAN devices, you **MUST** use HTTPS.

| Device | URL |
|--------|-----|
| **Host PC** | `https://localhost:8443` |
| **LAN Devices** | `https://<YOUR-IP>:8443` |

### "Your connection is not private" Warning
Since we use a **self-signed certificate** for local development, your browser will show a security warning. This is normal.

1. Click **Advanced**
2. Click **Proceed to ... (unsafe)**

Once you do this, the camera will work! 🚀

---

## 🏗️ Architecture

```
  LAN Device ──────┐
                    │
  Host Browser ────┐│
                   ││    ┌──────────┐     ┌──────────┐
                   ├┼──► │  Nginx   │────►│ PHP-FPM  │
                   │     │ :8000    │     │ (Laravel) │
                   │     └──────────┘     └────┬─────┘
                   │                           │
  Kiosk Device ────┘            ┌──────────┐   │   ┌──────────┐
                                │  Redis   │◄──┴──►│  MySQL   │
                                │ (Cache)  │       │ (Data)   │
                                └──────────┘       └──────────┘
```

| Service | Port | Description |
|---------|------|-------------|
| `nginx` | 8000 (HTTP) | Reverse proxy & static files |
| `app` | 9000 (internal) | PHP-FPM application |
| `mysql` | 3307 (external) | Database |
| `redis` | 6379 (internal) | Cache & sessions |

---

## ⚙️ Deploy Script Commands

```powershell
.\deploy.ps1              # Build and start everything
.\deploy.ps1 -Build       # Force rebuild images
.\deploy.ps1 -Down        # Stop all services
.\deploy.ps1 -Logs        # View live logs
.\deploy.ps1 -Status      # Check service health
.\deploy.ps1 -Reset       # Delete everything (data included!)
```

---

## ⚙️ Docker Compose Commands

```powershell
# Stop all services
docker compose down

# Rebuild after code changes
docker compose build --no-cache
docker compose up -d

# View logs for specific service
docker compose logs -f app

# Execute artisan commands
docker compose exec app php artisan migrate:status
docker compose exec app php artisan cache:clear

# Access MySQL CLI
docker compose exec mysql mysql -u root library_system

# Access Redis CLI
docker compose exec redis redis-cli
```

---

## 🔧 Optional Services

```powershell
# Enable Queue Worker
docker compose --profile with-queue up -d

# Enable Scheduler
docker compose --profile with-scheduler up -d

# Enable Both
docker compose --profile with-queue --profile with-scheduler up -d
```

---

## 🐛 Troubleshooting

### Container won't start

```powershell
docker compose logs app          # Check app logs
docker compose logs mysql        # Check database logs
docker compose logs nginx        # Check proxy logs
```

### Can't login from LAN device

1. Verify `SANCTUM_STATEFUL_DOMAINS` in `.env` includes your LAN IP
2. Rebuild: `docker compose up -d`
3. Clear cache: `docker compose exec app php artisan config:clear`

### Permission issues

```powershell
docker compose exec -u root app chmod -R 775 storage bootstrap/cache
```

### Database connection failed

```powershell
docker compose ps mysql          # Check if MySQL is healthy
docker compose exec app php artisan db:show
```

### Blank page / Assets not loading

```powershell
# Rebuild with no cache
docker compose build --no-cache
docker compose up -d
```

---

## 📊 Resource Usage

| Service | Memory | CPU |
|---------|--------|-----|
| nginx | ~50MB | Low |
| app | ~256MB | Medium |
| mysql | ~512MB | Medium |
| redis | ~128MB | Low |

**Total:** ~1GB RAM minimum recommended
