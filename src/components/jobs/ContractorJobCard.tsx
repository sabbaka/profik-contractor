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
        return { color: "$green10", bg: "$green3", text: "Open" };
      case "in_progress":
        return { color: "$blue10", bg: "$blue3", text: "In Progress" };
      case "completed":
        return { color: "$gray10", bg: "$gray4", text: "Completed" };
      case "canceled":
        return { color: "$red10", bg: "$red3", text: "Canceled" };
      default:
        return {
          color: "$gray10",
          bg: "$gray3",
          text: status || "Open",
        };
    }
  };

  const getOfferStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return { color: "$orange10", bg: "$orange3", text: "Pending" };
      case "accepted":
        return { color: "$green10", bg: "$green3", text: "Accepted" };
      case "declined":
        return { color: "$red10", bg: "$red3", text: "Declined" };
      default:
        return { color: "$gray10", bg: "$gray3", text: status };
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
          ? "$green6"
          : myOffer?.status === "declined"
            ? "$red6"
            : "$borderColor"
      }
      backgroundColor="$background"
      borderRadius="$6"
      padding="$0"
      elevation="$1"
      marginBottom="$4"
      animation="bouncy"
      pressStyle={{ scale: 0.98, borderColor: "$gray8" }}
    >
      <YStack padding="$4" gap="$2">
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack flex={1} gap="$2" marginRight="$3">
            <Text fontSize="$3" color="$gray10" marginTop="$1">
              {job?.category}
            </Text>
            <Text fontSize="$6" fontWeight="800" color="$color" lineHeight={24}>
              {job?.title}
            </Text>
          </YStack>

          <YStack alignItems="flex-end" gap="$1">
            <Text fontSize="$6" fontWeight="700" color="$color">
              {jobPriceLabel}
            </Text>
            {myOffer && (
              <XStack alignItems="center" gap="$1.5">
                <Send size={12} color="$blue10" />
                <Text fontSize="$3" fontWeight="600" color="$blue10">
                  {offerPriceLabel}
                </Text>
              </XStack>
            )}
          </YStack>
        </XStack>
      </YStack>

      <Separator borderColor="$gray4" />

      <XStack
        padding="$3"
        paddingHorizontal="$4"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$gray1"
        borderBottomLeftRadius="$6"
        borderBottomRightRadius="$6"
      >
        <XStack gap="$3" alignItems="center" flex={1}>
          <XStack gap="$1.5" alignItems="center" flex={1}>
            <MapPin size={14} color="$gray9" />
            <Text fontSize="$3" color="$gray10" numberOfLines={1}>
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
