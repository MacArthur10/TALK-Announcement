import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { Announcement } from '../components/AnnouncementCard';
import api from '../api/client';

interface FeedState {
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  loadAnnouncements: () => Promise<void>;
  loadCachedAnnouncements: () => Promise<void>;
}

export const useFeedStore = create<FeedState>((set) => ({
  announcements: [],
  loading: false,
  error: null,
  lastUpdated: null,
  
  loadAnnouncements: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/announcements/feed');
      set({ announcements: response.data, loading: false, lastUpdated: Date.now() });
      
      // Cache the results
      await AsyncStorage.setItem('cachedAnnouncements', JSON.stringify({
        data: response.data,
        timestamp: Date.now(),
      }));
    } catch (err: any) {
      // Use the improved error format from our API client
      const errorMessage = err.message || 'Failed to load announcements';
      set({ error: errorMessage, loading: false });
      throw err; // Re-throw to allow components to handle this
    }
  },
  
  loadCachedAnnouncements: async () => {
    try {
      const cached = await AsyncStorage.getItem('cachedAnnouncements');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        set({ 
          announcements: data, 
          lastUpdated: timestamp,
        });
      }
    } catch (err) {
      console.log('Failed to load cached announcements');
    }
  }
}));