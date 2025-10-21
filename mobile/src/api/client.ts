import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../utils/network';

const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 10000,
});

// Add a request interceptor to include authentication token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check for network errors
    if (!error.response) {
      return Promise.reject({
        message: 'Erreur réseau. Veuillez vérifier votre connexion internet.',
        originalError: error
      });
    }

    // Handle different response status codes
    const status = error.response.status;
    
    if (status === 401) {
      // Unauthorized - could trigger logout
      AsyncStorage.removeItem('token');
      return Promise.reject({
        message: 'Votre session a expiré. Veuillez vous reconnecter.',
        originalError: error
      });
    }
    
    if (status === 403) {
      return Promise.reject({
        message: 'Vous n\'avez pas les permissions nécessaires.',
        originalError: error
      });
    }
    
    if (status === 404) {
      return Promise.reject({
        message: 'La ressource demandée n\'existe pas.',
        originalError: error
      });
    }
    
    if (status >= 500) {
      return Promise.reject({
        message: 'Une erreur serveur s\'est produite. Veuillez réessayer ultérieurement.',
        originalError: error
      });
    }
    
    // For other errors, return the response data error or a default message
    const errorMessage = 
      error.response.data?.error || 
      error.response.data?.message || 
      'Une erreur s\'est produite. Veuillez réessayer.';
    
    return Promise.reject({
      message: errorMessage,
      originalError: error
    });
  }
);

export default api;
