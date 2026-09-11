import { Button, Text } from "@/src/components/ui/ui";
import { VerifiedBadge } from "@/src/components/profile/VerifiedBadge";
import { useIdentityVerification } from "@/src/features/verification/hooks/useIdentityVerification";
import { useThemeColors } from "@/src/theme";
import {
  ChevronLeft,
  Camera,
  IdCard,
  Lock,
  ShieldCheck,
} from "@tamagui/lucide-icons";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

/**
 * Explains identity verification and starts it.
 *
 * This screen is the consent moment, which is why the profile row opens it
 * rather than launching the browser directly: the verification rests on
 * consent, and consent given to a button labelled "Verify" is not informed.
 * Everything the person is agreeing to — what is captured, who holds it, what
 * this service keeps, and that the badge is optional — is on this screen
 * before the CTA.
 *
 * Reached from the Profile tab. Shows the state of any verification already in
 * flight, so it doubles as the place to resume or retry one.
 */
export function VerificationScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { verification, start, isStarting } = useIdentityVerification();

  const status = verification?.status ?? "not_started";
  const approved = status === "approved";
  const inFlight = status === "in_progress" || status === "not_started";
  const reviewing = status === "in_review";

  const ctaKey = approved
    ? "verification.start"
    : inFlight
      ? "verification.resume"
      : status === "declined" || status === "expired"
        ? "verification.retry"
        : "verification.start";

  const steps = [
    { Icon: IdCard, key: "verification.stepDocument" },
    { Icon: Camera, key: "verification.stepSelfie" },
    { Icon: ShieldCheck, key: "verification.stepBadge" },
  ];

  return (
    <YStack
      flex={1}
      backgroundColor={colors.bgSecondary}
      paddingTop={insets.top}
    >
      <XStack height={48} paddingHorizontal={16} alignItems="center">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
        >
          <XStack alignItems="center" gap={2}>
            <ChevronLeft size={25} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
              {t("common.back")}
            </Text>
          </XStack>
        </Pressable>
      </XStack>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 32,
          gap: 20,
        }}
      >
        <YStack gap={8}>
          <Text variant="h3">{t("verification.title")}</Text>
          <Text variant="bodySm">{t("verification.intro")}</Text>
        </YStack>

        {approved && verification?.displayName ? (
          <YStack
            backgroundColor={colors.bgCard}
            borderRadius={16}
            padding={16}
            gap={10}
          >
            <VerifiedBadge />
            {/* Without this line the gap between the account's own name and
                the public one reads as a bug rather than as the rule. */}
            <Text variant="bodySm">
              {t("verification.publicNameNote", {
                name: verification.displayName,
              })}
            </Text>
          </YStack>
        ) : null}

        {reviewing ? (
          <YStack
            backgroundColor={colors.bgCard}
            borderRadius={16}
            padding={16}
            gap={6}
          >
            <Text variant="h5">{t("verification.status.inReview")}</Text>
            <Text variant="bodySm">{t("verification.reviewNote")}</Text>
          </YStack>
        ) : null}

        {status === "declined" ? (
          <YStack
            backgroundColor={colors.bgCard}
            borderRadius={16}
            padding={16}
            gap={6}
          >
            <Text variant="h5">{t("verification.status.declined")}</Text>
            <Text variant="bodySm">{t("verification.declinedNote")}</Text>
          </YStack>
        ) : null}

        <YStack
          backgroundColor={colors.bgCard}
          borderRadius={16}
          padding={16}
          gap={14}
        >
          <Text variant="h5">{t("verification.whatHappens")}</Text>
          {steps.map(({ Icon, key }) => (
            <XStack key={key} gap={12} alignItems="flex-start">
              <Icon size={18} color={colors.textSecondary} />
              <Text variant="bodySm" style={{ flex: 1 }}>
                {t(key)}
              </Text>
            </XStack>
          ))}
        </YStack>

        <YStack
          backgroundColor={colors.bgCard}
          borderRadius={16}
          padding={16}
          gap={10}
        >
          <XStack gap={10} alignItems="center">
            <Lock size={18} color={colors.textSecondary} />
            <Text variant="h5">{t("verification.whatWeKeep")}</Text>
          </XStack>
          <Text variant="bodySm">{t("verification.whatWeKeepBody")}</Text>
        </YStack>

        <Text variant="caption">{t("verification.consentNote")}</Text>

        {!approved ? (
          <Button
            variant="primary"
            size="lg"
            onPress={() => {
              void start();
            }}
            disabled={isStarting}
            loading={isStarting}
          >
            {t(ctaKey)}
          </Button>
        ) : null}
      </ScrollView>
    </YStack>
  );
}
