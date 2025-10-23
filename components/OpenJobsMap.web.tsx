import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useGetOpenJobsQuery } from '../src/api/profikApi';
import { router } from 'expo-router';

export default function OpenJobsMapWeb() {
  const { data: jobs, error, refetch } = useGetOpenJobsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
    refetchOnFocus: true,
  });

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 8 }}>❌ Failed to load open jobs</Text>
        <TouchableOpacity onPress={refetch as any} style={styles.retryBtn}><Text>Retry</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={{ marginBottom: 8 }}>Map preview not available on web.</Text>
      {(jobs || []).map((j: any) => (
        <TouchableOpacity key={j.id} style={styles.card} onPress={() => router.push({ pathname: '/(contractor)/jobs/[id]', params: { id: j.id } })}>
          <Text style={styles.title}>{j.title}</Text>
          <Text style={styles.muted}>{j.category}</Text>
          <Text numberOfLines={2}>{j.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  container: { flex: 1, padding: 16 },
  retryBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#eee' },
  card: { padding: 12, borderRadius: 8, backgroundColor: '#fff', marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  title: { fontWeight: '600' },
  muted: { color: '#666', marginBottom: 4 },
});
