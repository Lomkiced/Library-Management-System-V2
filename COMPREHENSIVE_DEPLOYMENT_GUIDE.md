# 📦 Complete Guide: Deploying to a Brand New Desktop

Follow this guide to move or install the Library Management System on a completely fresh Windows PC. Because this system is containerized with Docker, you **do not** need to install complex web servers, PHP, or databases. Everything is handled automatically.

---

## 🛠️ Phase 1: Software Prerequisites

On the new desktop, you only need to download and install one single piece of software:

1.  **Download Docker Desktop for Windows** from [docker.com](https://www.docker.com/products/docker-desktop/).
2.  **Install it.** Make sure the checkbox that says **"Use WSL 2 based engine"** is checked during installation (it usually is by default).
3.  **Restart** the new desktop if prompted by the installer.
4.  **Open Docker Desktop** from your start menu. Wait until the status indicator in the bottom-left turns green (meaning the Engine is running). Keep it running in the background.

---

## 📂 Phase 2: Transferring the Project Files

You need to move the actual code from your current PC to the new one.

1.  **Locate the Folder:** Find the `Library Management System` folder on your old PC.
2.  **Copy It:** Copy this entire folder to a USB Flash Drive or an external hard drive.
3.  **Paste It:** Plug the USB into the new desktop and paste the folder wherever you prefer (e.g., your Desktop or Documents folder).

---

## 🔐 Phase 3: The Crucial Settings File (`.env`)

The `.env` file contains all the database passwords, application keys, and email settings. It is a hidden file, so you might not see it at first glance.

1.  **On the old PC:** Open the `Library Management System` folder. If you don't see a file simply named `.env` (it might look like a blank file icon), go to **"View"** at the top of File Explorer -> **"Show"** -> check **"Hidden items"**.
2.  **Copy the `.env` file** to your USB drive.
3.  **On the new PC:** Paste this exact `.env` file directly inside the new `Library Management System` folder alongside all the other project files.

*(Note: If you do not transfer this file, the application will not be able to connect to its database or run correctly!)*

---

## 🚀 Phase 4: Deploying the System

Now that the files and settings are on the new computer, it is time to turn it on.

1.  On the **new PC**, open the `Library Management System` folder.
2.  **Right-click** on an empty space inside the folder and select **Open in Terminal** (If you don't see this, you can right-click and select "Show more options", or you can hold `Shift` + Right-Click and select "Open PowerShell window here").
3.  Type the following command into the black/blue window and hit **Enter**:
    ```powershell
    docker compose up -d --build
    ```
4.  **Wait:** Docker will now download all the necessary environments (PHP, Nginx, MySQL, Node, Redis) and build the application automatically. This first run will take about **5-10 minutes** depending on your internet speed.
5.  Once it finishes downloading and returns you to the typing cursor, the system is fully live!

---

## 🌐 Phase 5: Network Access & Kiosks

1.  **Local Access:** To view the admin dashboard on the new desktop itself, open any browser and go to:
    `https://localhost:8443`
2.  **Open the Firewall:** To allow other devices (like student phones, tablets, or separate scanning kiosks) on the same Wi-Fi network to access the system, you need to tell Windows to allow it.
    *   Inside the project folder, locate `Open_Firewall.bat`.
    *   **Right-click** it and select **Run as administrator**.
    *   Wait for the green SUCCESS message.
3.  **Find Your URL:** To find out exactly what link to type into those other devices:
    *   Double-click `Find_Library_URL.bat`.
    *   It will automatically print out the physical Wi-Fi IP address links for the Administrator Dashboard, the Student Catalog Kiosk, and the Attendance Kiosk.

*(Note: When accessing the site, your browser may warn you that the connection is "Not Secure" because it is a local network. Simply click "Advanced" and then "Proceed" to enter the site and grant it Camera permissions for the barcode scanner.)*
