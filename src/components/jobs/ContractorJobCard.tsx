import type { MyOffer } from "@/src/api/types";
import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { formatCzk } from "@/src/utils/currency";
import { dateLocale, formatSchedule } from "@/src/utils/jobSchedule";
import { BriefcaseBusiness, Calendar, MapPin, MessageCircle, Send } from "@tamagui/lucide-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import { XStack, YStack } from "tamagui";
import { OfferStatusPill } from "./OfferStatusPill";
import { formatCountry } from "@/src/utils/country";

interface ContractorJobCardProps {
  job: any;
  myOffer?: MyOffer | null;
  onPress?: () => void;
  /** Opens the chat for `myOffer`. Open Jobs has no offer to talk about yet. */
  onMessage?: () => void;
}

export function ContractorJobCard({ job, myOffer, onPress, onMessage }: ContractorJobCardProps) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const location =
    [job?.city, formatCountry(job?.country, t)].filter(Boolean).join(", ") ||
    t("job.locationNotProvided");
  const dateText = formatSchedule(job?.scheduledDates, dateLocale(i18n.language), t, { year: true });
  // The date and the slot are both optional and independently so — an older
  // job may carry one without the other — hence the separator hangs off the
  // slot rather than a fixed template.
  const scheduleText = [
    dateText,
    job?.timeSlot ? t(`job.timeSlot.${job.timeSlot}`) : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
      <YStack backgroundColor={colors.bgCard} borderRadius={20} borderWidth={1} borderColor={colors.borderSubtle} marginBottom={12} overflow="hidden">
        <XStack padding={16} paddingBottom={14} gap={12}>
          <YStack width={48} height={48} borderRadius={14} backgroundColor={colors.accentLight} alignItems="center" justifyContent="center">
            <BriefcaseBusiness size={22} color={colors.accent} />
          </YStack>
          <YStack flex={1} gap={4}>
            <XStack justifyContent="space-between" alignItems="center" gap={8}>
              <Text variant="chip" numberOfLines={1} flex={1}>{job?.category || t("job.service")}</Text>
              <Text variant="price">{formatCzk(job?.price ?? 0)}</Text>
            </XStack>
            <Text variant="cardTitle" numberOfLines={2}>{job?.title || t("job.untitled")}</Text>
            <YStack gap={5} marginTop={4}>
              <XStack alignItems="center" gap={6}>
                <MapPin size={14} color={colors.textMuted} />
                <Text variant="caption" numberOfLines={1} flex={1}>{location}</Text>
              </XStack>
              {scheduleText ? (
                <XStack alignItems="center" gap={6}>
                  <Calendar size={14} color={colors.textMuted} />
                  <Text variant="caption" numberOfLines={1}>{scheduleText}</Text>
                </XStack>
              ) : null}
            </YStack>
          </YStack>
        </XStack>
        <YStack height={1} backgroundColor={colors.divider} />
        <XStack paddingHorizontal={16} paddingVertical={12} alignItems="center" justifyContent="space-between">
          {myOffer ? (
            <XStack alignItems="center" gap={8}>
              <OfferStatusPill status={myOffer.status} jobStatus={job?.status} />
              <XStack alignItems="center" gap={4}>
                <Send size={13} color={colors.accent} />
                <Text style={{ color: colors.accent, fontFamily: "GeistMono_700Bold", fontSize: 13, lineHeight: 17 }}>{formatCzk(myOffer.price)}</Text>
              </XStack>
            </XStack>
          ) : (
            <XStack alignItems="center" gap={6}>
              <YStack width={7} height={7} borderRadius={9999} backgroundColor={colors.statusOpenText} />
              <Text variant="caption" style={{ color: colors.statusOpenText, fontFamily: "Inter_600SemiBold" }}>{t("job.openForOffers")}</Text>
            </XStack>
          )}
          {myOffer && onMessage ? (
            <Pressable
              onPress={onMessage}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t("job.messageClientA11y", { title: job?.title || t("job.untitled") })}
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
            >
              <XStack alignItems="center" gap={5} paddingHorizontal={12} paddingVertical={7} borderRadius={9999} backgroundColor={colors.accentLight}>
                <MessageCircle size={14} color={colors.accent} />
                <Text style={{ color: colors.accent, fontFamily: "Inter_600SemiBold", fontSize: 13, lineHeight: 17 }}>{t("job.messageClient")}</Text>
              </XStack>
            </Pressable>
          ) : null}
        </XStack>
      </YStack>
    </Pressable>
  );
}
