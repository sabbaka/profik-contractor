import { Button, Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { ChevronLeft, Mail } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

const SUPPORT_EMAIL = "sabbakaz@gmail.com";

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <YStack gap={4}>
      <Text variant="bodyStrong">{question}</Text>
      <Text variant="body">{answer}</Text>
    </YStack>
  );
}

export default function HelpSupportScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const handleContactSupport = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t("support.contactSubject"))}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // fall through to the alert below
    }
    Alert.alert(t("common.error"), t("support.contactFallback", { email: SUPPORT_EMAIL }));
  };

  return (
    <YStack flex={1} backgroundColor={colors.bgPrimary} paddingTop={insets.top}>
      <XStack height={48} paddingHorizontal={16} alignItems="center" justifyContent="space-between">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <XStack alignItems="center" gap={2}>
            <ChevronLeft size={25} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>{t("common.back")}</Text>
          </XStack>
        </Pressable>
        <Text variant="h5">{t("support.title")}</Text>
        <XStack width={58} />
      </XStack>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 24, gap: 24 }}>
        <Text variant="body">
          {t("support.intro")}
        </Text>

        <YStack gap={16}>
          <Text variant="sectionLabel">{t("support.faqTitle")}</Text>
          <FaqItem
            question={t("support.faq1Q")}
            answer={t("support.faq1A")}
          />
          <FaqItem
            question={t("support.faq2Q")}
            answer={t("support.faq2A")}
          />
          <FaqItem
            question={t("support.faq3Q")}
            answer={t("support.faq3A")}
          />
          <FaqItem
            question={t("support.faq4Q")}
            answer={t("support.faq4A")}
          />
          <FaqItem
            question={t("support.faq5Q")}
            answer={t("support.faq5A")}
          />
        </YStack>

        <YStack gap={10}>
          <Text variant="sectionLabel">{t("support.contactTitle")}</Text>
          <Button variant="secondary" iconLeft={<Mail size={16} color={colors.textSecondary} />} onPress={handleContactSupport}>
            {t("support.contactButton")}
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
