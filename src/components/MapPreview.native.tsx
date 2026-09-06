import { useThemeColors } from '@/src/theme';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { geocodeAddress } from '@/src/utils/geocode';

type Props =
  | { lat: number; lng: number; height?: number }
  | { address: string; height?: number };

const hasCoords = (
  props: Props,
): props is { lat: number; lng: number; height?: number } =>
  'lat' in props && props.lat != null && 'lng' in props && props.lng != null;

/**
 * Static, non-interactive map showing one pinned location.
 *
 * Takes either coordinates or a written address. **Pass coordinates whenever
 * the caller has them** — the address path costs a geocoding round trip and can
 * fail outright, which is how this component ended up showing a permanent
 * "Locating…" on Android before `geocodeAddress` gained its Google fallback.
 *
 * Three states: resolving, resolved (the map), and unresolvable. The last one
 * is terminal and says so, rather than pretending it is still working.
 */

export default function MapPreview(props: Props) {
  const { t } = useTranslation();
  const height = props.height ?? 180;
  const colors = useThemeColors();

  const lat = hasCoords(props) ? props.lat : undefined;
  const lng = hasCoords(props) ? props.lng : undefined;
  const address = hasCoords(props) ? undefined : props.address;

  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(
    lat != null && lng != null ? { lat, lng } : null,
  );
  const [resolving, setResolving] = useState(address != null);

  useEffect(() => {
    let cancelled = false;

    if (lat != null && lng != null) {
      setGeo({ lat, lng });
      setResolving(false);
      return;
    }

    if (!address) {
      setGeo(null);
      setResolving(false);
      return;
    }

    setResolving(true);
    void (async () => {
      const coords = await geocodeAddress(address);
      if (cancelled) return;
      setGeo(coords);
      setResolving(false);
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
        <Text style={{ color: colors.textMuted }}>
          {resolving ? t('map.locating') : t('map.unavailable')}
        </Text>
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
