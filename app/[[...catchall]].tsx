import { useThemeColors } from '@/src/theme';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export default function CatchAll() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPrimary }}>
      <Text style={{ color: colors.textSecondary }}>{t("notFound.title")}</Text>
    </View>
  );
}
