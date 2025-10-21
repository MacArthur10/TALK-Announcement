@echo off
echo Quick Network Configuration for TALK Mobile App
echo ===============================================
echo.

echo Current .env configuration:
if exist .env (
    findstr "EXPO_PUBLIC_API_URL" .env
) else (
    echo .env file not found!
)

echo.
echo Your current network configuration:
ipconfig | findstr /C:"IPv4"

echo.
echo Common configurations:
echo.
echo 1. Physical Device (Wi-Fi): EXPO_PUBLIC_API_URL=http://192.168.1.52:4000/api
echo 2. Android Emulator:        EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api  
echo 3. iOS Simulator:           EXPO_PUBLIC_API_URL=http://localhost:4000/api
echo.

echo To update your .env file:
echo 1. Edit the .env file with your text editor
echo 2. Update the EXPO_PUBLIC_API_URL line
echo 3. Restart the Expo development server
echo.

echo For automatic update, run: powershell -ExecutionPolicy Bypass -File update-network.ps1
echo.

pause