import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { ChevronLeft } from "@tamagui/lucide-icons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

export default function AboutScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const year = new Date().getFullYear();

  return (
    <YStack flex={1} backgroundColor={colors.bgPrimary} paddingTop={insets.top}>
      <XStack height={48} paddingHorizontal={16} alignItems="center" justifyContent="space-between">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <XStack alignItems="center" gap={2}>
            <ChevronLeft size={25} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>{t("common.back")}</Text>
          </XStack>
        </Pressable>
        <Text variant="h5">{t("about.title")}</Text>
        <XStack width={58} />
      </XStack>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 24 }}>
        <YStack alignItems="center" gap={12} paddingVertical={12}>
          <YStack width={72} height={72} borderRadius={9999} overflow="hidden" alignItems="center" justifyContent="center">
            <LinearGradient colors={["#FF8A2B", "#E85D00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <Text position="relative" zIndex={1} style={{ color: "#FFFFFF", fontFamily: "Geist_700Bold", fontSize: 28 }}>P</Text>
          </YStack>
          <Text variant="h3">Profik Pro</Text>
          <Text variant="body" textAlign="center">
            {t("about.tagline")}
          </Text>
        </YStack>

        <YStack paddingTop={12}>
          <Text variant="body">
            {t("about.description")}
          </Text>
        </YStack>

        <YStack alignItems="center" gap={4} paddingTop={32}>
          <Text variant="caption">{t("about.version", { version })}</Text>
          <Text variant="caption">{t("about.copyright", { year })}</Text>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
