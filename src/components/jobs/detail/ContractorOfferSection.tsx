import type { OfferStatus } from "@/src/api/types";
import { formatCzk } from "@/src/utils/currency";
import { router } from "expo-router";
import { Button, Input, Text, XStack, YStack } from "tamagui";

type OfferMode = "idle" | "counter";

interface ContractorOfferSectionProps {
  hasOffered: boolean;
  myOfferPrice?: number;
  myOfferMessage?: string;
  myOfferStatus?: OfferStatus;
  offerIdForChat: string | null;
  clientPrice: number;
  mode: OfferMode;
  setMode: (mode: OfferMode) => void;
  price: string;
  setPrice: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
  onAcceptClientPrice: () => void;
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
  clientPrice,
  mode,
  setMode,
  price,
  setPrice,
  message,
  setMessage,
  onAcceptClientPrice,
  onSubmitOffer,
  isSubmitting,
  onInputFocus,
}: ContractorOfferSectionProps) => {
  const formattedOfferPrice = formatCzk(myOfferPrice || 0);
  const formattedClientPrice = formatCzk(clientPrice);

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

  if (mode === "counter") {
    const priceNum = Number(price);
    const canSubmit =
      !!price.trim() &&
      !isNaN(priceNum) &&
      priceNum > 0 &&
      !!message.trim() &&
      !isSubmitting;

    return (
      <YStack paddingHorizontal="$4" gap="$3">
        <YStack
          padding="$4"
          borderRadius="$6"
          backgroundColor="$background"
          borderWidth={1}
          borderColor="$gray4"
        >
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
            <Text fontSize={16} fontWeight="700">
              Counter Offer
            </Text>
            <Button
              size="$2"
              variant="outlined"
              borderRadius="$10"
              onPress={() => setMode("idle")}
              disabled={isSubmitting}
            >
              Back
            </Button>
          </XStack>
          <YStack gap="$3">
            <Input
              placeholder="Your price"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              onFocus={onInputFocus}
            />
            <Input
              placeholder='Explain your price (e.g. "I will bring professional equipment")'
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
              disabled={!canSubmit}
              opacity={canSubmit ? 1 : 0.5}
            >
              {isSubmitting ? "Submitting..." : "Submit counter offer"}
            </Button>
          </YStack>
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
          Respond to this job
        </Text>
        <YStack gap="$3">
          <Button
            borderRadius="$10"
            backgroundColor="$gray12"
            color="white"
            onPress={onAcceptClientPrice}
            disabled={isSubmitting}
            opacity={isSubmitting ? 0.7 : 1}
          >
            {isSubmitting ? "Submitting..." : `Accept for ${formattedClientPrice}`}
          </Button>
          <Button
            borderRadius="$10"
            variant="outlined"
            fontWeight="600"
            onPress={() => setMode("counter")}
            disabled={isSubmitting}
          >
            Make counter offer
          </Button>
        </YStack>
      </YStack>
    </YStack>
  );
};
