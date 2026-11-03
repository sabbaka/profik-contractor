import { Button, Text } from "@/src/components/ui/ui";
import { useAppStoreMoveBanner } from "@/src/features/appStoreMove/useAppStoreMoveBanner";
import { useThemeColors } from "@/src/theme";
import { X } from "@tamagui/lucide-icons";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import { XStack, YStack } from "tamagui";

/**
 * Asks a TestFlight install to move to the App Store build, at the top of
 * Open Jobs. Renders nothing unless `useAppStoreMoveBanner` says so — a
 * TestFlight install, with Pro live in the store per `GET /app-config`.
 *
 * Closing it lasts until the next cold start, not for good: a TestFlight build
 * expires, and the person has to hear about it again before it does.
 */
export function AppStoreMoveBanner() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { visible, dismiss, openStore } = useAppStoreMoveBanner();

  if (!visible) return null;

  return (
    <YStack
      marginHorizontal={20}
      marginBottom={12}
      padding={16}
      gap={12}
      borderRadius={16}
      backgroundColor={colors.accentLight}
      borderWidth={1}
      borderColor={colors.accent}
    >
      <XStack alignItems="flex-start" gap={12}>
        <YStack flex={1} gap={4}>
          <Text variant="h4">{t("appStoreMove.title")}</Text>
          <Text variant="bodySm">{t("appStoreMove.body")}</Text>
        </YStack>
        <Pressable
          onPress={dismiss}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("a11y.hideAppStoreMove")}
        >
          <X size={20} color={colors.textSecondary} />
        </Pressable>
      </XStack>
      <Button size="md" onPress={openStore}>
        {t("appStoreMove.cta")}
      </Button>
    </YStack>
  );
}
