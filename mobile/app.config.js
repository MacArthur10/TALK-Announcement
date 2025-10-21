export default ({ config }) => {
  return {
    ...config,
    name: 'CAD3 Intranet',
    slug: 'talk-announcement-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#2e7d32'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.cad3.intranet'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#2e7d32'
      },
      package: 'com.cad3.intranet'
    },
    plugins: [
      // Removed expo-updates until it's properly installed
    ],
    extra: {
      eas: {
        projectId: 'your-project-id-here'
      },
      // Define environment variables
      apiUrl: process.env.EXPO_PUBLIC_API_URL || null,
    }
  };
};