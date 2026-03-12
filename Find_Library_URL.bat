@echo off
setlocal enabledelayedexpansion
title PCLU Library Kiosk - URL Finder
color 0B

echo ===============================================================================
echo                      PCLU Library System URL Finder
echo ===============================================================================
echo.
echo Scanning for active Wi-Fi (WLAN) IP Address...
echo.

:: Initialize variables
set "IP_ADDRESS="

:: Extract the IPv4 address specifically for the Wi-Fi adapter using PowerShell
for /f "usebackq tokens=*" %%A in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias '*Wi-Fi*' -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress"`) do (
    set "IP_ADDRESS=%%A"
)

:: Check if we found an IP address
if "%IP_ADDRESS%"=="" (
    color 0C
    echo [ERROR] Could not detect your Wi-Fi IP Address.
    echo Please make sure you are connected to a Wi-Fi network.
    echo.
    echo Defaulting to 'localhost' for local access only...
    set "IP_ADDRESS=localhost"
) else (
    echo [SUCCESS] Your Current Wi-Fi IP Address is: !IP_ADDRESS!
)

echo.
echo -------------------------------------------------------------------------------
echo Access URLs (HTTPS):
echo -------------------------------------------------------------------------------
echo.
echo Administrator Dashboard:
echo https://!IP_ADDRESS!:8443
echo.
echo Student Catalog Kiosk:
echo https://!IP_ADDRESS!:8443/catalog
echo.
echo Attendance Kiosk:
echo https://!IP_ADDRESS!:8443/attendance
echo.
echo -------------------------------------------------------------------------------
echo [NOTE] Your browser may show a "Not Secure" warning. 
echo Click "Advanced" then "Proceed" to allow Camera access.
echo -------------------------------------------------------------------------------
echo.

:: Ask user if they want to launch the dashboard
set /p launch="Do you want to open the Dashboard now? (Y/N): "
if /I "%launch%"=="Y" (
    start https://!IP_ADDRESS!:8443
)

echo.
pause
