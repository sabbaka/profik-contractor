import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

type Props =
  | { lat: number; lng: number; height?: number }
  | { address: string; height?: number };

export default function MapPreview(props: Props) {
  const height = (props as any).height ?? 180;

  const hasCoords = (p: Props): p is { lat: number; lng: number; height?: number } =>
    (p as any).lat != null && (p as any).lng != null;

  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(
    hasCoords(props) ? { lat: props.lat, lng: props.lng } : null,
  );
  const address = !hasCoords(props) ? (props as any).address : undefined;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!hasCoords(props) && address) {
        try {
          const results = await Location.geocodeAsync(address);
          const first = results?.[0];
          if (!cancelled && first && typeof first.latitude === 'number' && typeof first.longitude === 'number') {
            setGeo({ lat: first.latitude, lng: first.longitude });
          }
        } catch (e) {
          // silent: keep placeholder
        }
      } else if (hasCoords(props)) {
        setGeo({ lat: props.lat, lng: props.lng });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, (props as any).lat, (props as any).lng]);

  const region = useMemo(() =>
    geo
      ? { latitude: geo.lat, longitude: geo.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }
      : null,
  [geo]);

  if (!region) {
    return (
      <View style={[styles.placeholder, { height }]}> 
        <Text>Locating…</Text>
      </View>
    );
  }

  return (
    <MapView style={[styles.map, { height }]} initialRegion={region} region={region} pointerEvents="none">
      <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { borderRadius: 8, marginVertical: 12 },
  placeholder: {
    borderRadius: 8,
    marginVertical: 12,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
