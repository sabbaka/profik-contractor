import { useThemeColors } from '@/src/theme';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface MapPreviewProps {
  /** Absent only for jobs written before the backend resolved coordinates. */
  lat?: number;
  lng?: number;
  height?: number;
}

/**
 * Static, non-interactive map showing one pinned location.
 *
 * Coordinates come straight from the job row — the backend resolves them once
 * when the job is created, so there is nothing to look up here. An earlier
 * version geocoded the address on the device, which is what left this map
 * stuck on "Locating…" on Android, where the platform geocoder often returns
 * nothing at all.
 */
export default function MapPreview({ lat, lng, height = 180 }: MapPreviewProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const region = useMemo(
    () =>
      lat != null && lng != null
        ? { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }
        : null,
    [lat, lng],
  );

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
        <Text style={{ color: colors.textMuted }}>{t('map.unavailable')}</Text>
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
