import { Button, Text } from "@/src/components/ui/ui";
import { NavHeader } from "@/src/components/ui/NavHeader";
import { useThemeMode } from "@/src/theme";
import { setHasSeenOnboarding } from "@/src/utils/onboardingStorage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { XStack, YStack } from "tamagui";

export default function HowItWorksScreen() {
  const { t } = useTranslation();
  const { mode } = useThemeMode();
  const steps = [
    {
      number: "1",
      title: t("onboarding.how.steps.browse.title"),
      description: t("onboarding.how.steps.browse.description"),
    },
    {
      number: "2",
      title: t("onboarding.how.steps.offer.title"),
      description: t("onboarding.how.steps.offer.description"),
    },
    {
      number: "3",
      title: t("onboarding.how.steps.chat.title"),
      description: t("onboarding.how.steps.chat.description"),
    },
    {
      number: "4",
      title: t("onboarding.how.steps.paid.title"),
      description: t("onboarding.how.steps.paid.description"),
    },
  ];

  const handleCreateAccount = async () => {
    await setHasSeenOnboarding();
    router.replace("/auth/signup" as any);
  };

  const handleSignIn = async () => {
    await setHasSeenOnboarding();
    router.replace("/auth/login" as any);
  };

  return (
    <YStack flex={1} backgroundColor="$bgPrimary">
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <NavHeader onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 16,
          flexGrow: 1,
        }}
      >
        <YStack flex={1} jc="center" gap={32} paddingVertical={16}>
          <Text variant="display">{t("onboarding.how.title")}</Text>

          <YStack gap={20}>
            {steps.map((step) => (
              <XStack key={step.number} gap={14} ai="flex-start">
                <YStack
                  width={40}
                  height={40}
                  borderRadius={20}
                  ai="center"
                  jc="center"
                  flexShrink={0}
                  overflow="hidden"
                >
                  <LinearGradient
                    colors={["#FF8A2B", "#E85D00"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  />
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontFamily: "Inter_700Bold",
                      fontSize: 15,
                    }}
                  >
                    {step.number}
                  </Text>
                </YStack>
                <YStack flex={1} gap={4}>
                  <Text variant="cardTitle">{step.title}</Text>
                  <Text variant="body">{step.description}</Text>
                </YStack>
              </XStack>
            ))}
          </YStack>
        </YStack>
      </ScrollView>

      <YStack paddingHorizontal={24} paddingBottom={32} paddingTop={8} gap={8}>
        <Button variant="primary" onPress={handleCreateAccount}>
          {t("onboarding.how.createAccount")}
        </Button>
        <Button variant="ghost" onPress={handleSignIn}>
          {t("onboarding.how.signIn")}
        </Button>
      </YStack>
    </YStack>
  );
}
