import type { MyOffer } from "@/src/api/types";
import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { formatCzk } from "@/src/utils/currency";
import { BriefcaseBusiness, Calendar, ChevronRight, MapPin, Send } from "@tamagui/lucide-icons";
import React from "react";
import { Pressable } from "react-native";
import { XStack, YStack } from "tamagui";

interface ContractorJobCardProps {
  job: any;
  myOffer?: MyOffer | null;
  onPress?: () => void;
}

function dateLabel(value?: string) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return null;
  }
}

function OfferPill({ status }: { status: string }) {
  const colors = useThemeColors();
  const config = status === "accepted"
    ? { bg: colors.statusCompleted, text: colors.statusCompletedText, label: "Accepted" }
    : status === "declined"
      ? { bg: colors.statusCancelled, text: colors.statusCancelledText, label: "Declined" }
      : { bg: colors.statusPending, text: colors.statusPendingText, label: "Pending" };
  return (
    <XStack backgroundColor={config.bg} paddingHorizontal={10} paddingVertical={5} borderRadius={9999} alignItems="center" gap={5}>
      <YStack width={6} height={6} borderRadius={9999} backgroundColor={config.text} />
      <Text style={{ color: config.text, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>{config.label}</Text>
    </XStack>
  );
}

export function ContractorJobCard({ job, myOffer, onPress }: ContractorJobCardProps) {
  const colors = useThemeColors();
  const location = [job?.city, job?.country].filter(Boolean).join(", ") || "Location not provided";
  const date = dateLabel(job?.createdAt);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
      <YStack backgroundColor={colors.bgCard} borderRadius={20} borderWidth={1} borderColor={colors.borderSubtle} marginBottom={12} overflow="hidden">
        <XStack padding={16} paddingBottom={14} gap={12}>
          <YStack width={48} height={48} borderRadius={14} backgroundColor={colors.accentLight} alignItems="center" justifyContent="center">
            <BriefcaseBusiness size={22} color={colors.accent} />
          </YStack>
          <YStack flex={1} gap={4}>
            <XStack justifyContent="space-between" alignItems="center" gap={8}>
              <Text variant="chip" numberOfLines={1} flex={1}>{job?.category || "Service"}</Text>
              <Text variant="price">{formatCzk(job?.price ?? 0)}</Text>
            </XStack>
            <Text variant="cardTitle" numberOfLines={2}>{job?.title || "Untitled job"}</Text>
            <YStack gap={5} marginTop={4}>
              <XStack alignItems="center" gap={6}>
                <MapPin size={14} color={colors.textMuted} />
                <Text variant="caption" numberOfLines={1} flex={1}>{location}</Text>
              </XStack>
              {date ? (
                <XStack alignItems="center" gap={6}>
                  <Calendar size={14} color={colors.textMuted} />
                  <Text variant="caption">Posted {date}</Text>
                </XStack>
              ) : null}
            </YStack>
          </YStack>
        </XStack>
        <YStack height={1} backgroundColor={colors.divider} />
        <XStack paddingHorizontal={16} paddingVertical={12} alignItems="center" justifyContent="space-between">
          {myOffer ? (
            <XStack alignItems="center" gap={8}>
              <OfferPill status={myOffer.status} />
              <XStack alignItems="center" gap={4}>
                <Send size={13} color={colors.accent} />
                <Text style={{ color: colors.accent, fontFamily: "GeistMono_700Bold", fontSize: 13 }}>{formatCzk(myOffer.price)}</Text>
              </XStack>
            </XStack>
          ) : (
            <XStack alignItems="center" gap={6}>
              <YStack width={7} height={7} borderRadius={9999} backgroundColor={colors.statusOpenText} />
              <Text variant="caption" style={{ color: colors.statusOpenText, fontFamily: "Inter_600SemiBold" }}>Open for offers</Text>
            </XStack>
          )}
          <XStack alignItems="center" gap={3}>
            <Text style={{ color: colors.accent, fontFamily: "Inter_500Medium", fontSize: 13 }}>Details</Text>
            <ChevronRight size={16} color={colors.accent} />
          </XStack>
        </XStack>
      </YStack>
    </Pressable>
  );
}
