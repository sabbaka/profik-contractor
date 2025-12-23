import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'tamagui';

type Props =
  | { lat: number; lng: number; height?: number }
  | { address: string; height?: number };

export default function MapPreview(props: Props) {
  const height = (props as any).height ?? 180;
  const theme = useTheme();
  const hasCoords = (p: Props): p is { lat: number; lng: number; height?: number } =>
    (p as any).lat != null && (p as any).lng != null;

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    hasCoords(props) ? { lat: props.lat, lng: props.lng } : null,
  );
  const address = !hasCoords(props) ? (props as any).address : undefined;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!hasCoords(props) && address) {
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
        } catch (e) {
          // ignore, keep placeholder
        }
      } else if (hasCoords(props)) {
        setCoords({ lat: props.lat, lng: props.lng });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, (props as any).lat, (props as any).lng]);

  const label = useMemo(() => {
    if (coords) return `Lat: ${coords.lat.toFixed(5)} Lng: ${coords.lng.toFixed(5)}`;
    if (address) return 'Resolving address…';
    return 'Map preview not available on web';
  }, [coords, address]);

  return (
    <View
      style={[
        styles.box,
        {
          height,
          backgroundColor: theme?.gray2?.val ?? '#f2f2f2',
        },
      ]}
    >
      <Text>Map preview not available on web</Text>
      <Text>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 8, marginVertical: 12, alignItems: 'center', justifyContent: 'center' },
});
