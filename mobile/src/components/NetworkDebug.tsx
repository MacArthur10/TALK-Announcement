import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { getNetworkInfo } from '../utils/network';
import { colors, spacing } from '../theme';
import api from '../api/client';

export default function NetworkDebug() {
  const [visible, setVisible] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const networkInfo = getNetworkInfo();

  const testConnection = async () => {
    setTesting(true);
    try {
      const response = await api.get('/announcements/feed');
      Alert.alert(
        'Connection Test', 
        `✅ Successfully connected to API!\n\nURL: ${networkInfo.apiUrl}\nStatus: ${response.status}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      let errorMessage = '';
      if (error.code === 'NETWORK_ERROR' || error.message.includes('ECONNREFUSED')) {
        errorMessage = '❌ Cannot connect to server.\n\nCheck:\n• Backend server is running\n• IP address is correct\n• Same Wi-Fi network';
      } else if (error.response?.status === 401) {
        errorMessage = '⚠️ Server reachable but authentication required.\n\nAPI is working!';
      } else {
        errorMessage = `❌ Connection failed:\n${error.message}`;
      }
      
      Alert.alert('Connection Test', errorMessage, [{ text: 'OK' }]);
    } finally {
      setTesting(false);
    }
  };

  if (!visible) {
    return (
      <TouchableOpacity 
        style={styles.debugButton}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.debugButtonText}>🌐</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Debug</Text>
      
      <Text style={styles.infoLabel}>Current API URL:</Text>
      <Text style={styles.infoValue}>{networkInfo.apiUrl}</Text>
      
      <Text style={styles.infoLabel}>Environment Variable:</Text>
      <Text style={[styles.infoValue, networkInfo.isUsingEnvVar ? styles.success : styles.warning]}>
        {networkInfo.isUsingEnvVar ? '✅ Active' : '❌ Not set'} 
      </Text>
      
      <Text style={styles.infoLabel}>Expected for Wi-Fi:</Text>
      <Text style={styles.infoValue}>http://192.168.1.52:4000/api</Text>
      
      <TouchableOpacity 
        style={[styles.testButton, testing && styles.testButtonDisabled]}
        onPress={testConnection}
        disabled={testing}
      >
        <Text style={styles.testButtonText}>
          {testing ? 'Testing...' : 'Test Connection'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => setVisible(false)}
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: spacing(2),
    borderRadius: 8,
    maxWidth: '80%',
    zIndex: 9999,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing(1),
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing(1),
  },
  infoValue: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  success: {
    color: '#4CAF50',
  },
  warning: {
    color: '#FF9800',
  },
  testButton: {
    backgroundColor: colors.primary,
    padding: spacing(1),
    borderRadius: 4,
    alignItems: 'center',
    marginTop: spacing(1.5),
  },
  testButtonDisabled: {
    backgroundColor: colors.muted,
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#666',
    padding: spacing(1),
    borderRadius: 4,
    alignSelf: 'flex-end',
    marginTop: spacing(1),
  },
  closeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  debugButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  debugButtonText: {
    fontSize: 16,
  },
});