@echo off
title PCLU Library System - Firewall Setup
color 0B

:: Check for Administrator privileges
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"

if '%errorlevel%' NEQ '0' (
    echo ===============================================================================
    echo Requesting Administrative Privileges to open Firewall ports...
    echo ===============================================================================
    
    :: Generate VBScript to elevate privileges
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"

    :: Execute the script and exit the current unelevated shell
    "%temp%\getadmin.vbs"
    exit /B
)

:: If we get here, we have Admin rights
if exist "%temp%\getadmin.vbs" ( del "%temp%\getadmin.vbs" )

echo ===============================================================================
echo                      PCLU Library System - Firewall Setup
echo ===============================================================================
echo.
echo Applying Windows Defender Firewall Rules for LAN Access...
echo.

:: Add rules to allow incoming TCP traffic on ports 8080 and 8443
netsh advfirewall firewall add rule name="PCLU Library System (HTTP 8080)" dir=in action=allow protocol=TCP localport=8080
netsh advfirewall firewall add rule name="PCLU Library System (HTTPS 8443)" dir=in action=allow protocol=TCP localport=8443

color 0A
echo.
echo [SUCCESS] Firewall rules added! 
echo Other devices on your Wi-Fi network should now be able to access the system.
echo.
pause
