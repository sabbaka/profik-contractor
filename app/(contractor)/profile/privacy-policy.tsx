import { Text } from "@/src/components/ui/ui";
import { FALLBACK_PRIVACY_URL } from "@/src/features/auth/terms";
import { useThemeColors } from "@/src/theme";
import { openLegalDocument } from "@/src/utils/openLegalDocument";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

const SUPPORT_EMAIL = "info@profik.app";
const PRIVACY_POLICY_URL = FALLBACK_PRIVACY_URL;

function Section({ title, body }: { title: string; body: string }) {
  return (
    <YStack gap={6}>
      <Text variant="h5">{title}</Text>
      <Text variant="body">{body}</Text>
    </YStack>
  );
}

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

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
        <Text variant="h5">{t("privacy.title")}</Text>
        <XStack width={58} />
      </XStack>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: insets.bottom + 24,
          gap: 20,
        }}
      >
        <Text variant="body">{t("privacy.intro")}</Text>

        <Section
          title={t("privacy.dataCollectedTitle")}
          body={t("privacy.dataCollected")}
        />
        <Section
          title={t("privacy.locationTitle")}
          body={t("privacy.location")}
        />
        <Section
          title={t("privacy.notificationsTitle")}
          body={t("privacy.notifications")}
        />
        <Section
          title={t("privacy.balanceTitle")}
          body={t("privacy.balance")}
        />
        <Section
          title={t("privacy.sharingTitle")}
          body={t("privacy.sharing")}
        />
        <Section
          title={t("privacy.retentionTitle")}
          body={t("privacy.retention")}
        />
        <Section
          title={t("privacy.contactTitle")}
          body={t("privacy.contact", { email: SUPPORT_EMAIL })}
        />

        {/* What is above is a plain-language summary written for this screen,
            not the policy itself. The published document is the one that
            governs, so the way to it belongs here rather than only in the
            consent screen. */}
        <Pressable
          onPress={() => void openLegalDocument(PRIVACY_POLICY_URL)}
          accessibilityRole="link"
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text variant="body" style={{ color: colors.accent }}>
            {t("privacy.fullVersion")}
          </Text>
        </Pressable>
      </ScrollView>
    </YStack>
  );
}
