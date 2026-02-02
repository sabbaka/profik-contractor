import type { OfferStatus } from "@/src/api/types";
import { router } from "expo-router";
import { Button, Input, Text, XStack, YStack } from "tamagui";

interface ContractorOfferSectionProps {
  hasOffered: boolean;
  myOfferPrice?: number;
  myOfferMessage?: string;
  myOfferStatus?: OfferStatus;
  offerIdForChat: string | null;
  price: string;
  setPrice: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
  onSubmitOffer: () => void;
  isSubmitting: boolean;
  onInputFocus: () => void;
}

const getStatusConfig = (status?: OfferStatus) => {
  switch (status) {
    case "pending":
      return { color: "$orange10", bg: "$orange3", text: "Pending" };
    case "accepted":
      return { color: "$green10", bg: "$green3", text: "Accepted" };
    case "declined":
      return { color: "$red10", bg: "$red3", text: "Declined" };
    default:
      return { color: "$gray10", bg: "$gray3", text: "Unknown" };
  }
};

export const ContractorOfferSection = ({
  hasOffered,
  myOfferPrice,
  myOfferMessage,
  myOfferStatus,
  offerIdForChat,
  price,
  setPrice,
  message,
  setMessage,
  onSubmitOffer,
  isSubmitting,
  onInputFocus,
}: ContractorOfferSectionProps) => {
  const formattedOfferPrice = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
  }).format(myOfferPrice || 0);

  const statusConfig = getStatusConfig(myOfferStatus);

  if (hasOffered) {
    return (
      <YStack paddingHorizontal="$4" gap="$3">
        <YStack
          padding="$4"
          borderRadius="$6"
          backgroundColor="$background"
          borderWidth={1}
          borderColor="$gray4"
        >
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
            <Text fontSize={16} fontWeight="700">
              Your Offer
            </Text>
            <XStack
              backgroundColor={statusConfig.bg}
              paddingVertical={4}
              paddingHorizontal={12}
              borderRadius={100}
            >
              <Text
                fontSize={12}
                fontWeight="700"
                color={statusConfig.color}
                textTransform="uppercase"
              >
                {statusConfig.text}
              </Text>
            </XStack>
          </XStack>
          <Text fontSize={14} marginBottom="$2">
            Price: {formattedOfferPrice}
          </Text>
          {myOfferMessage ? (
            <Text fontSize={14}>Message: {myOfferMessage}</Text>
          ) : (
            <Text fontSize={14} color="$gray10">
              Message: —
            </Text>
          )}

          {!!offerIdForChat && (
            <Button
              size="$5"
              variant="outlined"
              fontWeight="600"
              borderRadius="$10"
              marginTop="$3"
              onPress={() =>
                router.push({
                  pathname: "/(contractor)/offer-chat/[offerId]" as any,
                  params: { offerId: offerIdForChat },
                })
              }
            >
              Chat
            </Button>
          )}
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack paddingHorizontal="$4" gap="$3">
      <YStack
        padding="$4"
        borderRadius="$6"
        backgroundColor="$background"
        borderWidth={1}
        borderColor="$gray4"
      >
        <Text fontSize={16} fontWeight="700" marginBottom="$3">
          Submit an Offer
        </Text>
        <YStack gap="$3">
          <Input
            placeholder="Your price"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            onFocus={onInputFocus}
          />
          <Input
            placeholder="Message (optional)"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
            onFocus={onInputFocus}
          />
          <Button
            borderRadius="$10"
            backgroundColor="$gray12"
            color="white"
            onPress={onSubmitOffer}
            disabled={isSubmitting}
            opacity={isSubmitting ? 0.7 : 1}
          >
            {isSubmitting ? "Submitting..." : "Submit Offer"}
          </Button>
        </YStack>
      </YStack>
    </YStack>
  );
};

