import { useThemeColors } from '@/src/theme';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet } from 'react-native';

type Props =
  | { lat: number; lng: number; height?: number }
  | { address: string; height?: number };

const hasCoords = (
  props: Props,
): props is { lat: number; lng: number; height?: number } =>
  'lat' in props && 'lng' in props;

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (address) {
        try {
          const key = (process.env as any).EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
          if (!key) return;
          const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
          const res = await fetch(url);
          const json = await res.json();
          const loc = json?.results?.[0]?.geometry?.location;
          if (!cancelled && loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
            setCoords({ lat: loc.lat, lng: loc.lng });
          }
        } catch {
          // ignore, keep placeholder
        }
      } else if (lat != null && lng != null) {
        setCoords({ lat, lng });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, lat, lng]);

  const label = useMemo(() => {
    if (coords) return t('map.coordinates', { lat: coords.lat.toFixed(5), lng: coords.lng.toFixed(5) });
    if (address) return t('map.resolvingAddress');
    return t('map.previewUnavailableWeb');
  }, [coords, address, t]);

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
