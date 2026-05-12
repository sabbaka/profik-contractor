import { colors } from "@/src/theme";
import { MapPin, Send } from "@tamagui/lucide-icons";
import React from "react";
import { Card, Separator, Text, XStack, YStack } from "tamagui";
import type { MyOffer } from "../../api/types";

interface ContractorJobCardProps {
  job: any;
  myOffer?: MyOffer | null;
  onPress?: () => void;
}

export function ContractorJobCard({
  job,
  myOffer,
  onPress,
}: ContractorJobCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "open":
        return { color: colors.statusOpenText, bg: colors.statusOpen, text: "Open" };
      case "in_progress":
        return { color: "#60A5FA", bg: "#1E3A5F", text: "In Progress" };
      case "completed":
        return { color: colors.statusCompletedText, bg: colors.statusCompleted, text: "Completed" };
      case "canceled":
        return { color: colors.statusCancelledText, bg: colors.statusCancelled, text: "Canceled" };
      default:
        return {
          color: colors.textSecondary,
          bg: colors.bgCard,
          text: status || "Open",
        };
    }
  };

  const getOfferStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return { color: colors.statusPendingText, bg: colors.statusPending, text: "Pending" };
      case "accepted":
        return { color: colors.statusCompletedText, bg: colors.statusCompleted, text: "Accepted" };
      case "declined":
        return { color: colors.statusCancelledText, bg: colors.statusCancelled, text: "Declined" };
      default:
        return { color: colors.textSecondary, bg: colors.bgCard, text: status };
    }
  };

  const statusConfig = getStatusConfig(job?.status ?? "open");
  const offerStatusConfig = myOffer
    ? getOfferStatusConfig(myOffer.status)
    : null;

  const locationString =
    [job?.city, job?.country].filter(Boolean).join(", ") ||
    "Remote / No address";

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0,
    }).format(price);

  const jobPriceLabel = formatPrice(job?.price ?? 0);
  const offerPriceLabel = myOffer ? formatPrice(myOffer.price) : null;

  return (
    <Card
      onPress={onPress}
      bordered
      borderWidth={1}
      borderColor={
        myOffer?.status === "accepted"
          ? colors.success
          : myOffer?.status === "declined"
            ? colors.error
            : colors.border
      }
      backgroundColor={colors.bgCard}
      borderRadius="$6"
      padding="$0"
      elevation="$0"
      marginBottom="$4"
      animation="bouncy"
      pressStyle={{ scale: 0.98, borderColor: colors.accent }}
    >
      <YStack padding="$4" gap="$2">
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack flex={1} gap="$2" marginRight="$3">
            <Text fontSize="$3" color={colors.textSecondary} marginTop="$1">
              {job?.category}
            </Text>
            <Text fontSize="$6" fontWeight="800" color={colors.textPrimary} lineHeight={24}>
              {job?.title}
            </Text>
          </YStack>

          <YStack alignItems="flex-end" gap="$1">
            <Text fontSize="$6" fontWeight="700" color={colors.textPrimary}>
              {jobPriceLabel}
            </Text>
            {myOffer && (
              <XStack alignItems="center" gap="$1.5">
                <Send size={12} color={colors.accent} />
                <Text fontSize="$3" fontWeight="600" color={colors.accent}>
                  {offerPriceLabel}
                </Text>
              </XStack>
            )}
          </YStack>
        </XStack>
      </YStack>

      <Separator borderColor={colors.border} />

      <XStack
        padding="$3"
        paddingHorizontal="$4"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor={colors.bgSecondary}
        borderBottomLeftRadius="$6"
        borderBottomRightRadius="$6"
      >
        <XStack gap="$3" alignItems="center" flex={1}>
          <XStack gap="$1.5" alignItems="center" flex={1}>
            <MapPin size={14} color={colors.textMuted} />
            <Text fontSize="$3" color={colors.textSecondary} numberOfLines={1}>
              {locationString}
            </Text>
          </XStack>
        </XStack>

        <XStack gap="$2" alignItems="center">
          {offerStatusConfig && (
            <XStack
              backgroundColor={offerStatusConfig.bg}
              paddingVertical={4}
              paddingHorizontal={10}
              borderRadius={100}
              alignItems="center"
              gap="$1.5"
            >
              <Text
                fontSize="$2"
                fontWeight="700"
                color={offerStatusConfig.color}
                textTransform="uppercase"
              >
                {offerStatusConfig.text}
              </Text>
            </XStack>
          )}
          <XStack
            backgroundColor={statusConfig.bg}
            paddingVertical={4}
            paddingHorizontal={10}
            borderRadius={100}
            alignItems="center"
            gap="$1.5"
          >
            <Text
              fontSize="$2"
              fontWeight="700"
              color={statusConfig.color}
              textTransform="uppercase"
            >
              {statusConfig.text}
            </Text>
          </XStack>
        </XStack>
      </XStack>
    </Card>
  );
}
