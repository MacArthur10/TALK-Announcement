import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import AnnouncementCard, { Announcement } from '../components/AnnouncementCard';
import CategoryFilter from '../components/CategoryFilter';
import NetworkDebug from '../components/NetworkDebug';
import { colors, spacing } from '../theme';
import { useFeedStore } from '../store/feed';
import { Ionicons } from '@expo/vector-icons';

export default function FeedScreen({ navigation, route }: any) {
  const { announcements, loading, error, loadAnnouncements, loadCachedAnnouncements } = useFeedStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // Listen for selectedCategory from the navigation params
  useEffect(() => {
    if (route.params?.selectedCategory) {
      setSelectedCategory(route.params.selectedCategory);
      // Clear the param after we've processed it
      navigation.setParams({ selectedCategory: undefined });
    }
  }, [route.params?.selectedCategory]);
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  // Extract unique categories from announcements for filtering
  useEffect(() => {
    if (announcements.length) {
      const uniqueServices = announcements.reduce((acc: any, curr) => {
        if (curr.service && typeof curr.service === 'object' && curr.service.name) {
          const id = String(curr.service._id || '');
          const name = curr.service.name;
          if (id && !acc.find((s: any) => s.id === id)) {
            acc.push({ id, name });
          }
        }
        return acc;
      }, []);
      setCategories(uniqueServices);
    }
  }, [announcements]);

  const [isOfflineData, setIsOfflineData] = useState(false);
  
  useEffect(() => {
    // First load from cache, then from network
    const loadData = async () => {
      await loadCachedAnnouncements();
      setIsOfflineData(true);
      
      try {
        await loadAnnouncements();
        setIsOfflineData(false);
      } catch (err) {
        // Keep offline state if network load fails
        console.log('Failed to load fresh data, using cached content');
      }
    };
    
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAnnouncements();
    setRefreshing(false);
  }, []);

  // Filter announcements by category if selected
  const filteredAnnouncements = React.useMemo(() => {
    // First filter by category
    const filtered = selectedCategory 
      ? announcements.filter(item => {
          if (item.service && typeof item.service === 'object' && item.service._id) {
            return String(item.service._id) === selectedCategory;
          }
          return false;
        })
      : [...announcements];
    
    // Then sort by date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [announcements, selectedCategory, sortOrder]);

  if (loading && !announcements.length) {
    return (
      <View style={styles.center}> 
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Header with filters and sort */}
      <View style={styles.headerContainer}>
        {/* Category filter chips */}
        <View style={styles.filterContainer}>
          <CategoryFilter 
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </View>
        
        {/* Sort button */}
        <TouchableOpacity style={styles.sortButton} onPress={toggleSortOrder}>
          <Ionicons 
            name={sortOrder === 'newest' ? 'arrow-down' : 'arrow-up'} 
            size={16} 
            color={colors.primary} 
          />
          <Text style={styles.sortText}>
            {sortOrder === 'newest' ? 'Plus récent' : 'Plus ancien'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Offline indicator */}
      {isOfflineData && announcements.length > 0 && (
        <View style={styles.offlineBar}>
          <Text style={styles.offlineText}>Contenu hors ligne</Text>
        </View>
      )}
      
      <FlatList
        contentContainerStyle={{ padding: spacing(2) }}
        data={filteredAnnouncements}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <AnnouncementCard item={item} onPress={() => navigation.navigate('Detail', { id: item._id })} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {error ? (
              <Text style={styles.error}>Une erreur est survenue: {error}</Text>
            ) : (
              <Text style={styles.empty}>
                {selectedCategory ? "Aucune annonce dans cette catégorie" : "Aucune annonce"}
              </Text>
            )}
          </View>
        )}
      />
      
      {/* Network Debug Component */}
      <NetworkDebug />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: spacing(4) },
  error: { textAlign: 'center', color: colors.danger, marginTop: spacing(4) },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: spacing(4) },
  offlineBar: { 
    backgroundColor: 'rgba(255, 152, 0, 0.2)', 
    padding: spacing(1), 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255, 152, 0, 0.3)' 
  },
  offlineText: { 
    color: '#F57C00', 
    fontSize: 12, 
    fontWeight: '500' 
  },
  headerContainer: {
    flexDirection: 'column',
  },
  filterContainer: {
    flex: 1,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2),
    marginRight: spacing(2),
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.2)',
  },
  sortText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing(0.5),
  },
});
