import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import dayjs from 'dayjs';
import { colors, spacing, shadow } from '../theme';

export type Announcement = {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  service?: { 
    name: string;
    _id?: string; 
  } | string;
  attachments?: string[];
  type: 'internal' | 'public' | 'private';
};

export default function AnnouncementCard({ item, onPress }: { item: Announcement; onPress: () => void }) {
  const image = item.attachments?.[0];
  return (
    <TouchableOpacity onPress={onPress} style={[styles.card, shadow.card]}>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.meta}>
          {dayjs(item.createdAt).fromNow()} • {typeof item.service === 'string' ? '' : item.service?.name || ''}
        </Text>
        <Text style={styles.excerpt} numberOfLines={3}>{item.content.replace(/\n/g, ' ')}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden', marginBottom: spacing(2) },
  image: { width: '100%', height: 160 },
  content: { padding: spacing(2) },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  meta: { fontSize: 12, color: colors.muted, marginBottom: 6 },
  excerpt: { fontSize: 14, color: colors.text },
});
