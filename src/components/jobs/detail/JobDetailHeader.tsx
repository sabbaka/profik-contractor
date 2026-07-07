import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import { XStack } from "tamagui";

export function JobDetailHeader() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  return (
    <XStack height={48} paddingHorizontal={16} alignItems="center" justifyContent="space-between">
      <Pressable onPress={() => router.back()} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
        <XStack alignItems="center" gap={2}>
          <ChevronLeft size={25} color={colors.textPrimary} />
          <Text style={{ color: colors.textPrimary, fontSize: 16 }}>{t("common.back")}</Text>
        </XStack>
      </Pressable>
      <Text variant="h5">{t("job.details")}</Text>
      <XStack width={58} />
    </XStack>
  );
}
