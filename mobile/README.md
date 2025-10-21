# CAD3 Intranet Mobile App

Expo React Native mobile application for the CAD3 intranet system that allows employees to access announcements published by various departments.

> **IMPORTANT**: See [NETWORK_CONFIG.md](./NETWORK_CONFIG.md) for detailed instructions on connecting to your backend when testing on physical devices.

## Features

- **Authentication**
  - Secure login with JWT tokens
  - Session persistence with AsyncStorage
  - Role-based access controls (employee, admin, superadmin)

- **Announcements**
  - Scrollable feed of all announcements
  - Pull-to-refresh for latest content
  - Offline caching with connectivity indicators
  - Rich announcement details with images and links
  
- **Categories**
  - Filter announcements by department/service
  - Category browsing screen with counts
  - Quick filtering via chip selection
  
- **User Profile**
  - User information display
  - Service affiliation
  - Settings toggles
  - Secure logout

- **UI/UX**
  - Institutional green branding
  - Responsive layout
  - Loading states and error handling
  - Empty state components
  - Relative time formatting (e.g., "2 hours ago") in French

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Backend server running (from the `/backend` directory)

## Installation

1. Install dependencies:
```sh
npm install
```

2. Configure environment variables:
- Create a `.env` file in the root directory with:
```
# Replace with your computer's local IP address when testing on a physical device
EXPO_PUBLIC_API_URL=http://192.168.56.1:4000/api
```

> **Note**: To find your local IP address, run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
in a terminal. Look for your WiFi adapter's IPv4 address.

## Configuration Options

### API URL Configuration

Set the API base URL using one of these methods:

1. **Environment Variable**:
```sh
# Windows PowerShell
$env:EXPO_PUBLIC_API_URL = "http://192.168.1.10:4000/api"; npm run start

# Bash/Linux/macOS
EXPO_PUBLIC_API_URL="http://192.168.1.10:4000/api" npm run start
```

2. **Using app.config.js** (already set up):
The project includes an `app.config.js` file that reads from environment variables.

3. **Default Values**:
- Android Emulator: `http://10.0.2.2:4000/api` (points to host machine's localhost)
- iOS Simulator: `http://localhost:4000/api`

## Development

Start the development server:
```sh
npm run start
```

Then:
- Press `a` to open in Android Emulator
- Press `i` to open in iOS Simulator (macOS only)
- Scan the QR code with Expo Go app on a physical device

## Building for Production

1. Install EAS CLI:
```sh
npm install -g eas-cli
```

2. Configure EAS build:
```sh
eas build:configure
```

3. Build for the desired platform:
```sh
# For Android
eas build --platform android

# For iOS
eas build --platform ios
```

## Troubleshooting

- **Network Errors**: Ensure the backend server is running and accessible
- **Authentication Issues**: Check that user credentials are correct and the backend authentication is working
- **Image Loading**: Verify that image URLs in announcements are accessible from the mobile device

## Project Structure

```
mobile/
├── assets/              # Images, icons, and other static assets
├── src/
│   ├── api/             # API clients and services
│   ├── components/      # Reusable UI components
│   ├── navigation/      # Navigation configuration
│   ├── screens/         # App screens
│   ├── store/           # State management (Zustand)
│   └── theme/           # Theme colors and styling
├── App.tsx              # Main app entry point
└── app.config.js        # Expo configuration
```

