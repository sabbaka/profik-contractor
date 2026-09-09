import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import {
  BriefcaseBusiness,
  Calendar,
  Check,
  Gift,
  MapPin,
  Ruler,
  Wallet,
} from "@tamagui/lucide-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { XStack, YStack } from "tamagui";

/**
 * The little product screenshots that float over each onboarding illustration.
 *
 * They are static mock-ups, not live components: showing a real
 * `ContractorJobCard` here would need real job data before the user has even
 * signed in. All four share the same floating-card shell.
 */

function MockCard({
  children,
  gap = 12,
}: {
  children: React.ReactNode;
  gap?: number;
}) {
  const colors = useThemeColors();
  return (
    <YStack
      width="100%"
      gap={gap}
      padding={16}
      borderRadius={22}
      backgroundColor={colors.bgCard}
      style={{
        shadowColor: "#000000",
        shadowOpacity: 0.12,
        shadowRadius: 36,
        shadowOffset: { width: 0, height: 18 },
        elevation: 8,
      }}
    >
      {children}
    </YStack>
  );
}

function NoteBox({ icon, text }: { icon: React.ReactNode; text: string }) {
  const colors = useThemeColors();
  return (
    <XStack
      alignItems="center"
      gap={8}
      paddingVertical={10}
      paddingHorizontal={12}
      borderRadius={12}
      backgroundColor={colors.accentLight}
    >
      {icon}
      <Text
        flex={1}
        style={{
          color: colors.accent,
          fontFamily: "Inter_600SemiBold",
          fontSize: 10,
          lineHeight: 14,
        }}
      >
        {text}
      </Text>
    </XStack>
  );
}

/** Step 1 — an open job as it appears in the Open Jobs feed. */
export function FindWorkMock() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const c = (key: string) => t(`onboarding.steps.find.card.${key}`);

  return (
    <MockCard>
      <XStack gap={12}>
        <YStack
          width={42}
          height={42}
          borderRadius={13}
          alignItems="center"
          justifyContent="center"
          backgroundColor={colors.accentLight}
        >
          <BriefcaseBusiness size={20} color={colors.accent} />
        </YStack>
        <YStack flex={1} gap={3}>
          <XStack alignItems="center" gap={8}>
            <Text
              flex={1}
              numberOfLines={1}
              style={{
                color: colors.textSecondary,
                fontFamily: "Inter_500Medium",
                fontSize: 11,
              }}
            >
              {c("category")}
            </Text>
            <Text
              style={{
                color: colors.textPrimary,
                fontFamily: "GeistMono_700Bold",
                fontSize: 15,
                lineHeight: 19,
              }}
            >
              {c("price")}
            </Text>
          </XStack>
          <Text
            style={{
              color: colors.textPrimary,
              fontFamily: "Inter_600SemiBold",
              fontSize: 14,
              lineHeight: 19,
            }}
          >
            {c("title")}
          </Text>
          <XStack alignItems="center" gap={5}>
            <MapPin size={12} color={colors.textMuted} />
            <Text
              style={{
                color: colors.textMuted,
                fontFamily: "Inter_400Regular",
                fontSize: 11,
              }}
            >
              {c("meta")}
            </Text>
          </XStack>
        </YStack>
      </XStack>

      <YStack height={1} backgroundColor={colors.divider} />

      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap={6}>
          <YStack
            width={6}
            height={6}
            borderRadius={9999}
            backgroundColor={colors.statusOpenText}
          />
          <Text
            style={{
              color: colors.statusOpenText,
              fontFamily: "Inter_600SemiBold",
              fontSize: 11,
            }}
          >
            {c("status")}
          </Text>
        </XStack>
        <Text
          style={{
            color: colors.accent,
            fontFamily: "Inter_600SemiBold",
            fontSize: 11,
          }}
        >
          {c("badge")}
        </Text>
      </XStack>
    </MockCard>
  );
}

/** Step 2 — the job detail screen with its two response actions. */
export function PickJobsMock() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const c = (key: string) => t(`onboarding.steps.pick.card.${key}`);

  const metaRows: { icon: React.ReactNode; label: string }[] = [
    {
      icon: <MapPin size={13} color={colors.textMuted} />,
      label: c("location"),
    },
    { icon: <Calendar size={13} color={colors.textMuted} />, label: c("date") },
    { icon: <Ruler size={13} color={colors.textMuted} />, label: c("details") },
  ];

  return (
    <MockCard gap={14}>
      <YStack gap={6}>
        <Text
          style={{
            color: colors.accent,
            fontFamily: "Inter_600SemiBold",
            fontSize: 10,
            letterSpacing: 0.6,
          }}
        >
          {c("category")}
        </Text>
        <Text
          style={{
            color: colors.textPrimary,
            fontFamily: "Inter_600SemiBold",
            fontSize: 16,
            lineHeight: 21,
          }}
        >
          {c("title")}
        </Text>
        <XStack alignItems="center" gap={8}>
          <Text
            style={{
              color: colors.textPrimary,
              fontFamily: "GeistMono_700Bold",
              fontSize: 22,
              lineHeight: 28,
            }}
          >
            {c("price")}
          </Text>
          <XStack
            paddingVertical={4}
            paddingHorizontal={9}
            borderRadius={9999}
            backgroundColor={colors.statusOpen}
          >
            <Text
              style={{
                color: colors.statusOpenText,
                fontFamily: "Inter_600SemiBold",
                fontSize: 10,
              }}
            >
              {c("budget")}
            </Text>
          </XStack>
        </XStack>
      </YStack>

      <YStack gap={7}>
        {metaRows.map((row) => (
          <XStack key={row.label} alignItems="center" gap={7}>
            {row.icon}
            <Text
              flex={1}
              numberOfLines={1}
              style={{
                color: colors.textSecondary,
                fontFamily: "Inter_400Regular",
                fontSize: 11,
              }}
            >
              {row.label}
            </Text>
          </XStack>
        ))}
      </YStack>

      <YStack gap={8}>
        <YStack
          height={38}
          borderRadius={9999}
          overflow="hidden"
          alignItems="center"
          justifyContent="center"
        >
          <LinearGradient
            colors={["#FF8A2B", "#E85D00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text
            style={{
              color: "#FFFFFF",
              fontFamily: "Inter_600SemiBold",
              fontSize: 13,
            }}
          >
            {c("accept")}
          </Text>
        </YStack>
        <YStack
          height={38}
          borderRadius={9999}
          borderWidth={1.5}
          borderColor={colors.border}
          alignItems="center"
          justifyContent="center"
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: "Inter_600SemiBold",
              fontSize: 13,
            }}
          >
            {c("counter")}
          </Text>
        </YStack>
      </YStack>
    </MockCard>
  );
}

/** Step 3 — the offer chat, ending on an agreed price. */
export function GetPaidMock() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const c = (key: string) => t(`onboarding.steps.paid.card.${key}`);

  const bubbles: { mine: boolean; text: string; width: number }[] = [
    { mine: false, text: c("message1"), width: 188 },
    { mine: true, text: c("message2"), width: 190 },
    { mine: false, text: c("message3"), width: 150 },
  ];

  return (
    <MockCard gap={10}>
      <XStack alignItems="center" gap={8}>
        <YStack
          width={28}
          height={28}
          borderRadius={9999}
          alignItems="center"
          justifyContent="center"
          backgroundColor={colors.accentLight}
        >
          <Text
            style={{
              color: colors.accent,
              fontFamily: "Inter_700Bold",
              fontSize: 12,
              lineHeight: 15,
              textAlign: "center",
            }}
          >
            {c("name").charAt(0)}
          </Text>
        </YStack>
        <YStack flex={1}>
          <Text
            style={{
              color: colors.textPrimary,
              fontFamily: "Inter_600SemiBold",
              fontSize: 12,
            }}
          >
            {c("name")}
          </Text>
          <Text
            style={{
              color: colors.success,
              fontFamily: "Inter_400Regular",
              fontSize: 10,
            }}
          >
            {c("status")}
          </Text>
        </YStack>
      </XStack>

      {bubbles.map((bubble, index) => (
        <XStack
          key={index}
          justifyContent={bubble.mine ? "flex-end" : "flex-start"}
        >
          <YStack
            maxWidth={bubble.width}
            borderRadius={14}
            overflow="hidden"
            paddingVertical={9}
            paddingHorizontal={12}
            backgroundColor={bubble.mine ? "transparent" : colors.bgSecondary}
          >
            {bubble.mine ? (
              <LinearGradient
                colors={["#FF8A2B", "#E85D00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
            <Text
              style={{
                color: bubble.mine ? "#FFFFFF" : colors.textPrimary,
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                lineHeight: 17,
              }}
            >
              {bubble.text}
            </Text>
          </YStack>
        </XStack>
      ))}

      <NoteBox
        icon={<Wallet size={14} color={colors.accent} />}
        text={c("note")}
      />
    </MockCard>
  );
}

/** Step 4 — the welcome bonus the account's balance starts with. */
export function CreditsMock() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const c = (key: string) => t(`onboarding.steps.credits.card.${key}`);

  const rows: { label: string; value: string }[] = [
    { label: c("rowBonus"), value: c("rowBonusValue") },
    { label: c("rowCost"), value: c("rowCostValue") },
    { label: c("rowOffers"), value: c("rowOffersValue") },
  ];

  return (
    <MockCard>
      <XStack alignItems="center" justifyContent="space-between">
        <YStack gap={2}>
          <Text
            style={{
              color: colors.textPrimary,
              fontFamily: "Inter_700Bold",
              fontSize: 13,
            }}
          >
            {c("title")}
          </Text>
          <Text
            style={{
              color: colors.textMuted,
              fontFamily: "Inter_400Regular",
              fontSize: 10,
            }}
          >
            {c("subtitle")}
          </Text>
        </YStack>
        <XStack alignItems="flex-end" gap={5}>
          <Text
            style={{
              color: colors.accent,
              fontFamily: "GeistMono_700Bold",
              fontSize: 30,
              lineHeight: 33,
            }}
          >
            {c("amount")}
          </Text>
          <Text
            style={{
              color: colors.accent,
              fontFamily: "Inter_600SemiBold",
              fontSize: 11,
              lineHeight: 18,
            }}
          >
            {c("unit")}
          </Text>
        </XStack>
      </XStack>

      <YStack height={1} backgroundColor={colors.divider} />

      {rows.map((row) => (
        <XStack key={row.label} alignItems="center" gap={8}>
          <YStack
            width={16}
            height={16}
            borderRadius={9999}
            alignItems="center"
            justifyContent="center"
            backgroundColor={colors.accentLight}
          >
            <Check size={10} color={colors.accent} />
          </YStack>
          <Text
            flex={1}
            style={{
              color: colors.textSecondary,
              fontFamily: "Inter_400Regular",
              fontSize: 11,
            }}
          >
            {row.label}
          </Text>
          <Text
            style={{
              color: colors.textPrimary,
              fontFamily: "Inter_700Bold",
              fontSize: 11,
            }}
          >
            {row.value}
          </Text>
        </XStack>
      ))}

      <NoteBox
        icon={<Gift size={14} color={colors.accent} />}
        text={c("note")}
      />
    </MockCard>
  );
}
