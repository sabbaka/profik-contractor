import { useThemeColors } from '@/src/theme';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet } from 'react-native';

interface MapPreviewProps {
  lat?: number;
  lng?: number;
  height?: number;
}

/**
 * Web stand-in for the native map — there is no `react-native-maps` renderer
 * here, so it only reports the point.
 */
export default function MapPreview({ lat, lng, height = 180 }: MapPreviewProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

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
      <Text style={{ color: colors.textSecondary }}>
        {lat != null && lng != null
          ? t('map.coordinates', { lat: lat.toFixed(5), lng: lng.toFixed(5) })
          : t('map.unavailable')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 8, marginVertical: 12, alignItems: 'center', justifyContent: 'center' },
});
