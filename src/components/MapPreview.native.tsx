import { useThemeColors } from "@/src/theme";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
  Text,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

interface MapPreviewProps {
  /** Absent only for jobs written before the backend resolved coordinates. */
  lat?: number | null;
  lng?: number | null;
  height?: number;
  /** Pin label in the maps app that opens on tap. */
  label?: string;
}

/**
 * Static map thumbnail showing one pinned location. The `MapView` itself is
 * not interactive (no pan/pinch) — tapping it opens the location in the
 * device's own Maps app for directions instead, which is what a small
 * embedded preview can't usefully do on its own.
 *
 * Coordinates come straight from the job row — the backend resolves them once
 * when the job is created, so there is nothing to look up here. An earlier
 * version geocoded the address on the device, which is what left this map
 * stuck on "Locating…" on Android, where the platform geocoder often returns
 * nothing at all.
 */
export default function MapPreview({
  lat,
  lng,
  height = 180,
  label,
}: MapPreviewProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const openInMaps = useCallback(async () => {
    if (lat == null || lng == null) return;
    const query = `${lat},${lng}`;
    const pin = encodeURIComponent(label || query);
    // maps.apple.com is a universal link, not a custom scheme, so it opens
    // reliably without an LSApplicationQueriesSchemes entry in Info.plist —
    // iOS hands it to Maps.app itself when that's installed.
    const url = Platform.select({
      ios: `https://maps.apple.com/?ll=${query}&q=${pin}`,
      android: `geo:${query}?q=${query}(${pin})`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    try {
      await Linking.openURL(url);
    } catch {
      // Best effort — a broken deep link on one device isn't worth an alert.
    }
  }, [lat, lng, label]);

  const region = useMemo(
    () =>
      lat != null && lng != null
        ? {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }
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
        <Text style={{ color: colors.textMuted }}>{t("map.unavailable")}</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={openInMaps}
      accessibilityRole="button"
      accessibilityLabel={t("map.openInMaps")}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <MapView
        style={[styles.map, { height }]}
        initialRegion={region}
        region={region}
        pointerEvents="none"
      >
        <Marker
          coordinate={{
            latitude: region.latitude,
            longitude: region.longitude,
          }}
        />
      </MapView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  map: { borderRadius: 8, marginVertical: 12 },
  placeholder: {
    borderRadius: 8,
    marginVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
