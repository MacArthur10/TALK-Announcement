# TALK Mobile App - Quick Start Guide

## Current Status ✅
Your mobile app is fully configured and ready to test! Here's what's been set up:

### Network Configuration
- **Current .env setting**: `http://192.168.1.52:4000/api` (your Wi-Fi IP)
- **Network debug tool**: Tap the 🌐 button in the bottom-right corner of the Feed screen
- **Quick switching scripts**: `update-network.ps1` and `update-network.bat`

### Features Implemented
- ✅ Authentication flow with JWT tokens
- ✅ Announcements feed with pull-to-refresh
- ✅ Category filtering by department/service
- ✅ Announcement detail screen with images and links
- ✅ Offline caching and connectivity indicators
- ✅ User profile and settings
- ✅ French localization for dates
- ✅ Sorting (newest/oldest)
- ✅ Network debugging tools

## How to Test

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
```
Backend should show: "Server running on port 4000"

### 2. Start Mobile App
```bash
cd mobile
# If you have dependency issues, try:
npm install --legacy-peer-deps
# Then start:
npm start
# or try:
npx expo start
```

### 3. Connect Your Phone
- Make sure your phone and computer are on the same Wi-Fi network
- Open Expo Go app on your phone
- Scan the QR code from the terminal

### 4. Test Connection
- Tap the 🌐 network debug button in the Feed screen
- Tap "Test Connection" to verify API connectivity
- If it fails, check the troubleshooting section below

## Quick Network Switching

### Method 1: Use PowerShell Script
```powershell
cd mobile
.\update-network.ps1
```

### Method 2: Manual .env Update
Edit `mobile/.env` and change the IP address:
```env
# For physical device (Wi-Fi)
EXPO_PUBLIC_API_URL=http://192.168.1.52:4000/api

# For Android emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api

# For iOS simulator
EXPO_PUBLIC_API_URL=http://localhost:4000/api
```

## Troubleshooting

### "Cannot connect to server"
1. Check if backend is running: `http://192.168.1.52:4000/api` in your phone's browser
2. Verify both devices are on the same Wi-Fi
3. Try disabling Windows Firewall temporarily
4. Use the network debug tool to test connection

### "Module not found" errors
```bash
cd mobile
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Expo won't start
- Use `npx expo start` instead of `npm start`
- Make sure you have the latest Expo CLI
- Try clearing Expo cache: `npx expo start --clear`

### Different Wi-Fi Network
1. Run `ipconfig` to get new IP address
2. Update `.env` file with new IP
3. Restart Expo development server

## Login Credentials
Use any existing user from your backend database or create one through the web interface.

## Key Files Modified
- `mobile/.env` - Network configuration
- `mobile/src/components/NetworkDebug.tsx` - Connection testing
- `mobile/update-network.ps1` - Automatic IP detection script
- `mobile/NETWORK_CONFIG.md` - Detailed network guide

Your mobile app is now ready for testing! 🚀