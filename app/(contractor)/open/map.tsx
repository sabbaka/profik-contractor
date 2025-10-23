import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import { useGetOpenJobsQuery } from '../../../src/api/profikApi';
import { router } from 'expo-router';

export default function OpenJobsMapRoute() {
  const { data: jobs, isLoading, error, refetch, isFetching } = useGetOpenJobsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
    refetchOnFocus: true,
  });

  const [Maps, setMaps] = useState<{ MapView: any; Marker: any } | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') {
      (async () => {
        const m: any = await import('react-native-maps');
        setMaps({ MapView: m.default || m.MapView, Marker: m.Marker });
      })();
    }
  }, []);

  const coords = useMemo(() => (jobs || []).filter(j => typeof j.lat === 'number' && typeof j.lng === 'number'), [jobs]);

  const region = useMemo(() => {
    if (coords.length > 0) {
      const latAvg = coords.reduce((s, j) => s + (j.lat as number), 0) / coords.length;
      const lngAvg = coords.reduce((s, j) => s + (j.lng as number), 0) / coords.length;
      return { latitude: latAvg, longitude: lngAvg, latitudeDelta: 0.2, longitudeDelta: 0.2 };
    }
    return { latitude: 50.0755, longitude: 14.4378, latitudeDelta: 0.5, longitudeDelta: 0.5 };
  }, [coords]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading open jobs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 8 }}>❌ Failed to load open jobs</Text>
        <TouchableOpacity onPress={refetch as any} style={styles.retryBtn}><Text>Retry</Text></TouchableOpacity>
      </View>
    );
  }

  if (Platform.OS === 'web') {
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

  if (!Maps) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Preparing map…</Text>
      </View>
    );
  }

  return (
    <Maps.MapView style={styles.map} initialRegion={region}>
      {coords.map((j: any) => (
        <Maps.Marker
          key={j.id}
          coordinate={{ latitude: j.lat as number, longitude: j.lng as number }}
          title={j.title}
          description={j.category}
          onCalloutPress={() => router.push({ pathname: '/(contractor)/jobs/[id]', params: { id: j.id } })}
        />
      ))}
    </Maps.MapView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  container: { flex: 1, padding: 16 },
  retryBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#eee' },
  card: { padding: 12, borderRadius: 8, backgroundColor: '#fff', marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  title: { fontWeight: '600' },
  muted: { color: '#666', marginBottom: 4 },
  map: { flex: 1 },
});
