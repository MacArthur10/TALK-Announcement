# Network Configuration for Mobile App

## Overview
This guide explains how to configure the mobile app to connect to your backend API, especially when testing on physical devices.

## Current Configuration
Your `.env` file is currently set to:
```
EXPO_PUBLIC_API_URL=http://192.168.1.52:4000/api
```

## Quick Network Switch

When you change Wi-Fi networks, update the `.env` file with one of these configurations:

### 1. Physical Device (Same Wi-Fi Network)
```
EXPO_PUBLIC_API_URL=http://192.168.1.52:4000/api
```
**Current setting** - Use your computer's Wi-Fi IP address (192.168.1.52)

### 2. Android Emulator
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api
```
Android emulator maps 10.0.2.2 to host machine's localhost

### 3. iOS Simulator  
```
EXPO_PUBLIC_API_URL=http://localhost:4000/api
```
iOS simulator can access localhost directly

### 4. VirtualBox/VMware Network
```
EXPO_PUBLIC_API_URL=http://192.168.56.1:4000/api
```
If using virtual machines

## Find Your IP Address

**Windows (PowerShell/CMD):**
```bash
ipconfig
```
Look for "Wi-Fi" section → "Adresse IPv4" (currently: 192.168.1.52)

**Mac/Linux:**
```bash
ifconfig
# or
ip addr show
```

## Quick IP Update Script (Windows PowerShell)
```powershell
# Get your current Wi-Fi IP
$ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" -PrefixOrigin Dhcp).IPAddress
Write-Host "Your Wi-Fi IP: $ip"
Write-Host "Update .env with: EXPO_PUBLIC_API_URL=http://$ip:4000/api"
```

## Running the App

1. **Start the backend server:**
   ```
   cd backend
   npm run dev
   ```

2. **Start the mobile app:**
   ```
   cd mobile
   npm start
   ```

3. **Connect from Expo Go:**
   - Make sure your phone and computer are on the same WiFi network
   - Scan the QR code with the Expo Go app

## Network Debug Tool

The app includes a built-in network debug tool to help diagnose connection issues. When you run the app in development mode, you'll see a small info button (ℹ️) in the bottom right corner of the screen.

Tap on it to see:
- Current API URL being used
- Whether an environment variable is being used
- The value of the environment variable

## Troubleshooting

1. **Unable to connect to API**:
   - Ensure your phone and computer are on the same WiFi network
   - Verify your firewall isn't blocking the connection
   - Check if port 4000 is accessible (try accessing `http://your-ip-address:4000/api` in a browser on your phone)

2. **API calls failing**:
   - Verify the backend server is running
   - Check the network debug tool to confirm the correct API URL is being used
   - Make sure your local network allows connections between devices

3. **Android-specific issues**:
   - Some Android phones have security features that prevent local network connections
   - You may need to enable "Developer options" and allow connections to local devices