# 📦 Complete Guide: Deploying to a New Personal Computer

 Follow this guide to move or install the Library Management System on a fresh Windows PC.

---

## 🛠️ Phase 1: Preparation

### 1. Install Docker Desktop
This is the **only** required software. You do **not** need WAMP, XAMPP, PHP, or Node.js.

1.  Download **Docker Desktop for Windows** from [docker.com](https://www.docker.com/products/docker-desktop/).
2.  Run the installer.
3.  ✅ Ensure **"Use WSL 2 based engine"** is checked (it usually is by default).
4.  Restart your computer if prompted.
5.  Open **Docker Desktop** and wait until the status bar in the bottom-left turns green (Engine running).

### 2. Copy the Project Files
Transfer your code to the new PC.

*   **Method A (USB / Network Share):**
    Copy the entire `Library Management System` folder from your old PC to the new one.
*   **Method B (Git):**
    If your code is on GitHub, install Git and run `git clone <your-repo-url>`.

---

## ⚙️ Phase 2: Configuration

### 1. Transfer the `.env` File (Crucial!)
The `.env` file holds your configuration (passwords, mail settings). It is **hidden** by default and **not** included in Git.

1.  On the **Old PC**, go to the project folder. Use "View > Show > Hidden items" in File Explorer if you don't see it.
2.  Copy `.env` to a USB drive or cloud storage.
3.  Paste it into the project folder on the **New PC**.

> **Note:** If you start fresh without the old `.env`, rename `.env.docker.example` to `.env`. You will need to re-configure your mail settings.

---

## 🚀 Phase 3: Deployment

### 1. Run the Auto-Deploy Script
I created a script that handles everything for you (IP detection, configuration updates, building).

1.  Open the project folder on the **New PC**.
2.  Right-click empty space and select **Open in Terminal** (or Shift+Right-Click > Open PowerShell).
3.  Run this command:
    ```powershell
    .\deploy.ps1
    ```

### 2. Wait for Completion
*   The first run will take **5-10 minutes** to download and build Docker images.
*   Once done, it will show green text with your access URLs.

### 3. Verify Access
Open your browser and test:
*   **Localhost:** `http://localhost:8080`
*   **LAN Access:** The script will verify the LAN URL (e.g., `http://192.168.1.x:8080`).

---

## 💾 Phase 4: Restore Data (Optional)

Do this **only** if you want to transfer your existing books, users, and transactions from the old PC. If you want a fresh empty system, skip this.

### 1. Backup Old Data (On Old PC)
Run this command in the project folder while Docker is running:
```powershell
docker compose exec mysql mysqldump -u root library_system > full_backup.sql
```
Copy the generated `full_backup.sql` file to the **New PC** project folder.

### 2. Restore Data (On New PC)
Run this command on the New PC (Docker must be running):
```powershell
cat full_backup.sql | docker compose exec -T mysql mysql -u root library_system
```

---

## ⚠️ Common Issues

**"Ports are not available"**
*   If port 8080 is taken, open `.env` and change `NGINX_HTTP_PORT=8080` to something else (e.g., 9090).
*   Run `.\deploy.ps1` again.

**"Access denied" / Login fails**
*   The system auto-seeds a default admin if the database is empty:
    *   **Email:** `admin@school.edu`
    *   **Password:** `password123`
*   If you restored data (Phase 4), use your **old login credentials**.

**"Firewall Blocked"**
*   When you first run Docker, Windows Firewall may ask for permission.
*   Check both **Private** and **Public** networks and click **Allow Access**.
