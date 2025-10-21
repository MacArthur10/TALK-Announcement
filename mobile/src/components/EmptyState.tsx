import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../theme';

export default function EmptyState({ 
  title, 
  message, 
  buttonText,
  onButtonPress,
  loading
}: { 
  title: string;
  message?: string;
  buttonText?: string;
  onButtonPress?: () => void;
  loading?: boolean;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      
      {buttonText && onButtonPress && (
        <TouchableOpacity style={styles.button} onPress={onButtonPress} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>{buttonText}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing(3),
    minHeight: 180,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing(1),
  },
  message: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing(2),
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(3),
    borderRadius: 8,
    marginTop: spacing(1),
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});