import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { colors, spacing, shadow } from '../theme';
import api from '../api/client';
import { useAuthStore } from '../store/auth';

export default function LoginScreen({ navigation }: any) {
  const { setAuth, token, hydrate } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hydrate().then(() => {
      if (token) navigation.replace('Main');
    });
  }, []);

  async function onLogin() {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const role = res.data.user.role as 'superadmin' | 'admin' | 'employee';
      const serviceId = res.data.user.service?.id || null;
      const serviceName = res.data.user.service?.name || null;
      await setAuth({ token: res.data.token, name: res.data.user.name, role, serviceId, serviceName });
      navigation.replace('Main');
    } catch (err: any) {
      Alert.alert('Login failed', err?.response?.data?.error || 'Please check your credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>CAD3 Intranet</Text>
      <Text style={styles.subtitle}>Système de Gestion des Annonces</Text>

      <View style={[styles.card, shadow.card]}>
        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Mot de passe"
          placeholderTextColor={colors.muted}
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.button} onPress={onLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Se connecter</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing(3) },
  logo: { width: 84, height: 84, marginBottom: spacing(2) },
  title: { fontSize: 24, fontWeight: '700', color: colors.primary },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: spacing(3) },
  card: { width: '100%', backgroundColor: colors.card, borderRadius: 12, padding: spacing(2), gap: spacing(1) },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text },
  button: { backgroundColor: colors.primary, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: spacing(1) },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
