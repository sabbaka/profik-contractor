import { Button, Text } from "@/src/components/ui/ui";
import { NavHeader } from "@/src/components/ui/NavHeader";
import { useThemeMode } from "@/src/theme";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { useTranslation } from "react-i18next";
import { YStack } from "tamagui";

export default function AboutOnboardingScreen() {
  const { t } = useTranslation();
  const { mode } = useThemeMode();

  return (
    <YStack flex={1} backgroundColor="$bgPrimary">
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <NavHeader onBack={() => router.back()} />

      <YStack flex={1} paddingHorizontal={24} paddingBottom={32}>
        <YStack flex={1} jc="center" gap={24}>
          <Text variant="display">{t("onboarding.about.title")}</Text>

          <YStack gap={16}>
            <Text variant="body">{t("onboarding.about.p1")}</Text>
            <Text variant="body">{t("onboarding.about.p2")}</Text>
            <Text variant="body">{t("onboarding.about.p3")}</Text>
          </YStack>
        </YStack>

        <Button
          variant="primary"
          onPress={() => router.push("/onboarding/how-it-works" as any)}
        >
          {t("onboarding.about.next")}
        </Button>
      </YStack>
    </YStack>
  );
}
