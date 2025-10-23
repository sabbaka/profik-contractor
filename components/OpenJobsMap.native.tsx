import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useGetOpenJobsQuery } from '../src/api/profikApi';
import { router } from 'expo-router';

export default function OpenJobsMapNative() {
  const { data: jobs } = useGetOpenJobsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
    refetchOnFocus: true,
  });

  const coords = useMemo(() => (jobs || []).filter(j => typeof j.lat === 'number' && typeof j.lng === 'number'), [jobs]);

  const region = useMemo(() => {
    if (coords.length > 0) {
      const latAvg = coords.reduce((s, j) => s + (j.lat as number), 0) / coords.length;
      const lngAvg = coords.reduce((s, j) => s + (j.lng as number), 0) / coords.length;
      return { latitude: latAvg, longitude: lngAvg, latitudeDelta: 0.2, longitudeDelta: 0.2 };
    }
    return { latitude: 50.0755, longitude: 14.4378, latitudeDelta: 0.5, longitudeDelta: 0.5 };
  }, [coords]);

  return (
    <MapView style={styles.map} initialRegion={region}>
      {coords.map((j: any) => (
        <Marker
          key={j.id}
          coordinate={{ latitude: j.lat as number, longitude: j.lng as number }}
          title={j.title}
          description={j.category}
          onCalloutPress={() => router.push({ pathname: '/(contractor)/jobs/[id]', params: { id: j.id } })}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
