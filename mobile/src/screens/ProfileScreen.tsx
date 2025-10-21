import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, ScrollView } from 'react-native';
import { useAuthStore } from '../store/auth';
import { colors, spacing, shadow } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }: any) {
  const { name, role, serviceName, logout } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);

  async function onLogout() {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Déconnexion", style: "destructive", onPress: async () => {
          await logout();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }}
      ]
    );
  }

  const roleLabel = React.useMemo(() => {
    switch(role) {
      case 'superadmin': return 'Super Administrateur';
      case 'admin': return 'Administrateur';
      case 'employee': return 'Employé';
      default: return role;
    }
  }, [role]);

  return (
    <ScrollView style={styles.container}>
      {/* User info section */}
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          <Text style={styles.avatarText}>{name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.roleLabel}>{roleLabel}</Text>
        <Text style={styles.meta}>{serviceName}</Text>
      </View>
      
      {/* Settings section */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Paramètres</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            <Text style={styles.settingLabel}>Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Ionicons name="moon-outline" size={20} color={colors.text} />
            <Text style={styles.settingLabel}>Mode Sombre</Text>
          </View>
          <Switch
            value={darkModeEnabled}
            onValueChange={setDarkModeEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>
      
      {/* Account section */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Compte</Text>
        
        <TouchableOpacity style={styles.accountItem}>
          <View style={styles.settingLabelContainer}>
            <Ionicons name="person-outline" size={20} color={colors.text} />
            <Text style={styles.settingLabel}>Modifier le profil</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.accountItem}>
          <View style={styles.settingLabelContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.text} />
            <Text style={styles.settingLabel}>Changer le mot de passe</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={onLogout}>
        <Text style={styles.buttonText}>Déconnexion</Text>
      </TouchableOpacity>
      
      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
  },
  profileHeader: {
    backgroundColor: colors.card,
    padding: spacing(3),
    alignItems: 'center',
    marginBottom: spacing(2),
    ...shadow.card,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing(1.5),
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  title: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: colors.text,
  },
  roleLabel: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  meta: { 
    color: colors.muted, 
    marginTop: 4,
  },
  settingsSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: spacing(2),
    marginBottom: spacing(2),
    ...shadow.card,
  },
  sectionTitle: {
    paddingHorizontal: spacing(2),
    paddingTop: spacing(2),
    paddingBottom: spacing(1),
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
  },
  button: { 
    backgroundColor: colors.danger, 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: spacing(2),
    marginBottom: spacing(2),
    marginHorizontal: spacing(2),
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '600',
    fontSize: 16,
  },
  version: {
    textAlign: 'center',
    color: colors.muted,
    marginBottom: spacing(4),
  }
});
