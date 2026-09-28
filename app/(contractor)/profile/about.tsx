import { ProfikMark, ProfikWordmark } from "@/src/components/ui/ProfikLogo";
import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { ChevronLeft } from "@tamagui/lucide-icons";
import Constants from "expo-constants";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView } from "react-native";
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
      <XStack
        height={48}
        paddingHorizontal={16}
        alignItems="center"
        justifyContent="space-between"
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <XStack alignItems="center" gap={2}>
            <ChevronLeft size={25} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
              {t("common.back")}
            </Text>
          </XStack>
        </Pressable>
        <Text variant="h5">{t("about.title")}</Text>
        <XStack width={58} />
      </XStack>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <YStack alignItems="center" gap={12} paddingVertical={12}>
          {/* The mark alone, with the name spelled out below it — the lockup
              would repeat the mark twice on top of its own wordmark. */}
          <ProfikMark height={72} />
          <ProfikWordmark fontSize={32} />
          <Text variant="body" textAlign="center">
            {t("about.tagline")}
          </Text>
        </YStack>

        <YStack paddingTop={12}>
          <Text variant="body">{t("about.description")}</Text>
        </YStack>

        <YStack alignItems="center" gap={4} paddingTop={32}>
          <Text variant="caption">{t("about.version", { version })}</Text>
          <Text variant="caption">{t("about.copyright", { year })}</Text>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
