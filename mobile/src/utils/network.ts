import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Provides the API URL based on environment variables or defaults
 * This allows for easy configuration when running on different networks
 */
export const getApiUrl = (): string => {
  // First priority: Check the .env file for EXPO_PUBLIC_API_URL
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }

  // Second priority: Check for app config extra
  const configApiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (configApiUrl) {
    return configApiUrl;
  }

  // Third priority: Use platform-specific defaults
  if (Platform.OS === 'android') {
    // For Android emulator, 10.0.2.2 points to the host machine's localhost
    return 'http://10.0.2.2:4000/api';
  } 
  
  // For iOS simulator, localhost works
  return 'http://localhost:4000/api';
};

/**
 * Returns the network configuration info for display in the UI
 */
export const getNetworkInfo = () => {
  return {
    apiUrl: getApiUrl(),
    isUsingEnvVar: !!process.env.EXPO_PUBLIC_API_URL,
    envVar: process.env.EXPO_PUBLIC_API_URL || 'Not set'
  };
};