import { Button, Text } from "@/src/components/ui/ui";
import { GradientCircle } from "@/src/components/ui/GradientCircle";
import { useThemeMode } from "@/src/theme";
import { setHasSeenOnboarding } from "@/src/utils/onboardingStorage";
import { Sparkles } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { useTranslation } from "react-i18next";
import { YStack } from "tamagui";

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { mode } = useThemeMode();

  const handleGetStarted = () => {
    router.push("/onboarding/about" as any);
  };

  const handleLogin = async () => {
    await setHasSeenOnboarding();
    router.replace("/auth/login" as any);
  };

  return (
    <YStack
      flex={1}
      paddingHorizontal={24}
      paddingTop={64}
      paddingBottom={32}
      backgroundColor="$bgPrimary"
    >
      <StatusBar style={mode === "dark" ? "light" : "dark"} />

      <YStack flex={1} jc="center" ai="center" gap={32}>
        <GradientCircle size={88} radius={28}>
          <Sparkles size={40} color="#FFFFFF" />
        </GradientCircle>

        <YStack gap={12} ai="center">
          <Text variant="display" textAlign="center">
            {t("onboarding.welcome.title")}
          </Text>
          <Text variant="body" textAlign="center" style={{ paddingHorizontal: 8 }}>
            {t("onboarding.welcome.body")}
          </Text>
        </YStack>
      </YStack>

      <YStack gap={12}>
        <Button variant="primary" onPress={handleGetStarted}>
          {t("onboarding.welcome.getStarted")}
        </Button>
        <Button variant="ghost" onPress={handleLogin}>
          {t("onboarding.welcome.login")}
        </Button>
      </YStack>
    </YStack>
  );
}
