import { useThemeColors } from '@/src/theme';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet } from 'react-native';
import { geocodeAddress } from '@/src/utils/geocode';

type Props =
  | { lat: number; lng: number; height?: number }
  | { address: string; height?: number };

const hasCoords = (
  props: Props,
): props is { lat: number; lng: number; height?: number } =>
  'lat' in props && props.lat != null && 'lng' in props && props.lng != null;

/**
 * Web stand-in for the native map — there is no `react-native-maps` renderer
 * here, so it resolves the location and prints it. Kept in step with
 * `MapPreview.native` so a screen laid out on web does not shift on device.
 */

export default function MapPreview(props: Props) {
  const { t } = useTranslation();
  const height = props.height ?? 180;
  const colors = useThemeColors();
  const lat = hasCoords(props) ? props.lat : undefined;
  const lng = hasCoords(props) ? props.lng : undefined;
  const address = hasCoords(props) ? undefined : props.address;

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    lat != null && lng != null ? { lat, lng } : null,
  );
  const [resolving, setResolving] = useState(address != null);

  useEffect(() => {
    let cancelled = false;

    if (lat != null && lng != null) {
      setCoords({ lat, lng });
      setResolving(false);
      return;
    }

    if (!address) {
      setCoords(null);
      setResolving(false);
      return;
    }

    setResolving(true);
    void (async () => {
      const resolved = await geocodeAddress(address);
      if (cancelled) return;
      setCoords(resolved);
      setResolving(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [address, lat, lng]);

  const label = useMemo(() => {
    if (coords) return t('map.coordinates', { lat: coords.lat.toFixed(5), lng: coords.lng.toFixed(5) });
    if (resolving) return t('map.resolvingAddress');
    return t('map.unavailable');
  }, [coords, resolving, t]);

  return (
    <View
      style={[
        styles.box,
        {
          height,
          backgroundColor: colors.bgSecondary,
        },
      ]}
    >
      <Text style={{ color: colors.textMuted }}>{t('map.previewUnavailableWeb')}</Text>
      <Text style={{ color: colors.textSecondary }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 8, marginVertical: 12, alignItems: 'center', justifyContent: 'center' },
});
