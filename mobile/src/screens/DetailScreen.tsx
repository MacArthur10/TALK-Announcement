import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Linking, Image } from 'react-native';
import api from '../api/client';
import { colors, spacing } from '../theme';
import EmptyState from '../components/EmptyState';
import dayjs from 'dayjs';

export default function DetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDetail();
  }, [id]);
  
  async function loadDetail() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/announcements/${id}`);
      setItem(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load announcement');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  if (error) return (
    <EmptyState 
      title="Erreur" 
      message={error}
      buttonText="Réessayer"
      onButtonPress={loadDetail} 
    />
  );
  if (!item) return (
    <EmptyState
      title="Non trouvé"
      message="Cette annonce n'est pas disponible ou a été supprimée."
      buttonText="Retour"
      onButtonPress={() => navigation.goBack()}
    />
  );

  return (
    <ScrollView contentContainerStyle={{ padding: spacing(2) }}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.meta}>
        {item?.service?.name} • {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}
      </Text>
      
      {item.attachments && item.attachments.length > 0 && (
        <Image 
          source={{ uri: item.attachments[0] }} 
          style={styles.image} 
          resizeMode="cover"
        />
      )}
      
      <Text style={styles.content}>{item.content}</Text>
      
      {item?.links?.length ? (
        <View style={styles.linkContainer}>
          <Text style={styles.linkHeader}>Liens utiles:</Text>
          {item.links.map((l: any, idx: number) => (
            <Text key={idx} style={styles.link} onPress={() => Linking.openURL(l.url)}>
              {l.title}
            </Text>
          ))}
        </View>
      ) : null}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Créé par: {item.createdBy?.name || 'Administrateur'}
        </Text>
        {item.modifiedAt && (
          <Text style={styles.footerText}>
            Modifié le: {dayjs(item.modifiedAt).format('DD/MM/YYYY')}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing(1) },
  meta: { color: colors.muted, marginBottom: spacing(2) },
  image: { 
    width: '100%', 
    height: 200, 
    borderRadius: 8,
    marginBottom: spacing(2),
  },
  content: { 
    fontSize: 16, 
    color: colors.text, 
    lineHeight: 22,
  },
  linkContainer: {
    marginTop: spacing(2),
    padding: spacing(2),
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  linkHeader: {
    fontWeight: '600',
    marginBottom: spacing(1),
  },
  link: { 
    color: colors.primary, 
    textDecorationLine: 'underline', 
    marginBottom: 8,
    padding: 4,
  },
  footer: {
    marginTop: spacing(3),
    paddingTop: spacing(1.5),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    color: colors.muted,
    fontSize: 12,
  }
});
