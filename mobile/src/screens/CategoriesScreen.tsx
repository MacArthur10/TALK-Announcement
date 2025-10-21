import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { colors, spacing, shadow } from '../theme';
import EmptyState from '../components/EmptyState';
import { useFeedStore } from '../store/feed';

export default function CategoriesScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<Array<{id: string, name: string, count: number}>>([]);
  const { announcements } = useFeedStore();
  
  useEffect(() => {
    async function loadServices() {
      setLoading(true);
      setError(null);
      try {
        // Extract unique services from announcements
        const serviceMap = new Map<string, {id: string, name: string, count: number}>();
        
        announcements.forEach(announcement => {
          if (announcement.service && typeof announcement.service === 'object') {
            const id = String(announcement.service._id || '');
            const name = announcement.service.name;
            
            if (id && name) {
              if (!serviceMap.has(id)) {
                serviceMap.set(id, { id, name, count: 1 });
              } else {
                const current = serviceMap.get(id)!;
                serviceMap.set(id, { ...current, count: current.count + 1 });
              }
            }
          }
        });
        
        setServices(Array.from(serviceMap.values()));
      } catch (err: any) {
        setError(err.message || 'Failed to load services');
      } finally { 
        setLoading(false); 
      }
    }

    loadServices();
  }, [announcements]);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  if (error) return (
    <EmptyState
      title="Erreur"
      message={error}
      buttonText="Réessayer"
      onButtonPress={() => navigation.navigate('Feed')}
    />
  );

  return (
    <FlatList
      contentContainerStyle={{ padding: spacing(2) }}
      data={services}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity 
          style={styles.item}
          onPress={() => {
            // Navigate to Feed and reset the tab to make it active
            navigation.navigate('Feed');
            // Using setTimeout to ensure navigation completes before we try to access params
            setTimeout(() => {
              // Use the parent navigator's setParams to set selectedCategory on the Feed screen
              navigation.getParent()?.setParams({ selectedCategory: item.id });
            }, 0);
          }}
        >
          <View style={styles.itemContent}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.desc}>{item.count} annonce{item.count > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.count}</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <EmptyState 
          title="Aucune catégorie"
          message="Aucune catégorie disponible pour le moment."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  item: { 
    backgroundColor: colors.card, 
    borderRadius: 12, 
    padding: spacing(2), 
    marginBottom: spacing(1.5),
    borderWidth: 1, 
    borderColor: colors.border,
    ...shadow.card
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: colors.text 
  },
  desc: { 
    color: colors.muted, 
    marginTop: 4 
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  }
});
