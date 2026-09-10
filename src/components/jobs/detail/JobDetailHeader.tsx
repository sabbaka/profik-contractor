import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { ChevronLeft, Share2 } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import { XStack } from "tamagui";

interface JobDetailHeaderProps {
  /** Opens the OS share sheet with a text summary of the job. */
  onShare: () => void;
}

export function JobDetailHeader({ onShare }: JobDetailHeaderProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  return (
    <XStack
      height={48}
      paddingHorizontal={16}
      alignItems="center"
      justifyContent="space-between"
    >
      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        <XStack alignItems="center" gap={2}>
          <ChevronLeft size={25} color={colors.textPrimary} />
          <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
            {t("common.back")}
          </Text>
        </XStack>
      </Pressable>
      <Text variant="h5">{t("job.details")}</Text>
      <Pressable
        onPress={onShare}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={t("job.shareA11y")}
        style={({ pressed }) => ({
          opacity: pressed ? 0.6 : 1,
          width: 58,
          alignItems: "flex-end",
        })}
      >
        <Share2 size={21} color={colors.textPrimary} />
      </Pressable>
    </XStack>
  );
}
