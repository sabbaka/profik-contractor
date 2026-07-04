import { useThemeColors } from '@/src/theme';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

type Props =
  | { lat: number; lng: number; height?: number }
  | { address: string; height?: number };

const hasCoords = (
  props: Props,
): props is { lat: number; lng: number; height?: number } =>
  'lat' in props && 'lng' in props;

export default function MapPreview(props: Props) {
  const height = props.height ?? 180;
  const colors = useThemeColors();

  const lat = hasCoords(props) ? props.lat : undefined;
  const lng = hasCoords(props) ? props.lng : undefined;
  const address = hasCoords(props) ? undefined : props.address;

  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(
    lat != null && lng != null ? { lat, lng } : null,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (address) {
        try {
          const results = await Location.geocodeAsync(address);
          const first = results?.[0];
          if (!cancelled && first && typeof first.latitude === 'number' && typeof first.longitude === 'number') {
            setGeo({ lat: first.latitude, lng: first.longitude });
          }
        } catch {
          // silent: keep placeholder
        }
      } else if (lat != null && lng != null) {
        setGeo({ lat, lng });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, lat, lng]);

  const region = useMemo(() =>
    geo
      ? { latitude: geo.lat, longitude: geo.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }
      : null,
  [geo]);

  if (!region) {
    return (
      <View
        style={[
          styles.placeholder,
          {
            height,
            backgroundColor: colors.bgSecondary,
          },
        ]}
      >
        <Text style={{ color: colors.textMuted }}>Locating…</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});
