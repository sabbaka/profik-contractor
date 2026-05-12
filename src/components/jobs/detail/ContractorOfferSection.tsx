import type { OfferStatus } from "@/src/api/types";
import { colors } from "@/src/theme";
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
      return { color: colors.statusPendingText, bg: colors.statusPending, text: "Pending" };
    case "accepted":
      return { color: colors.statusCompletedText, bg: colors.statusCompleted, text: "Accepted" };
    case "declined":
      return { color: colors.statusCancelledText, bg: colors.statusCancelled, text: "Declined" };
    default:
      return { color: colors.textSecondary, bg: colors.bgCard, text: "Unknown" };
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
          borderRadius={16}
          backgroundColor={colors.bgCard}
          borderWidth={1}
          borderColor={colors.border}
        >
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
            <Text fontSize={16} fontWeight="700" color={colors.textPrimary}>
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
          <Text fontSize={14} marginBottom="$2" color={colors.textPrimary}>
            Price: {formattedOfferPrice}
          </Text>
          {myOfferMessage ? (
            <Text fontSize={14} color={colors.textPrimary}>Message: {myOfferMessage}</Text>
          ) : (
            <Text fontSize={14} color={colors.textMuted}>
              Message: —
            </Text>
          )}

          {!!offerIdForChat && (
            <Button
              size="$5"
              fontWeight="600"
              borderRadius={9999}
              marginTop="$3"
              backgroundColor={colors.bgSecondary}
              borderWidth={1}
              borderColor={colors.border}
              color={colors.textPrimary}
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
          borderRadius={16}
          backgroundColor={colors.bgCard}
          borderWidth={1}
          borderColor={colors.border}
        >
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
            <Text fontSize={16} fontWeight="700" color={colors.textPrimary}>
              Counter Offer
            </Text>
            <Button
              size="$2"
              borderRadius={9999}
              backgroundColor={colors.bgSecondary}
              borderWidth={1}
              borderColor={colors.border}
              color={colors.textPrimary}
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
              backgroundColor={colors.surfaceInput}
              color={colors.textPrimary}
              placeholderTextColor={colors.textMuted}
              borderWidth={0}
              borderRadius={12}
            />
            <Input
              placeholder='Explain your price (e.g. "I will bring professional equipment")'
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={3}
              onFocus={onInputFocus}
              backgroundColor={colors.surfaceInput}
              color={colors.textPrimary}
              placeholderTextColor={colors.textMuted}
              borderWidth={0}
              borderRadius={12}
            />
            <Button
              borderRadius={9999}
              backgroundColor={colors.accent}
              color={colors.textInverse}
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
        borderRadius={16}
        backgroundColor={colors.bgCard}
        borderWidth={1}
        borderColor={colors.border}
      >
        <Text fontSize={16} fontWeight="700" marginBottom="$3" color={colors.textPrimary}>
          Respond to this job
        </Text>
        <YStack gap="$3">
          <Button
            borderRadius={9999}
            backgroundColor={colors.accent}
            color={colors.textInverse}
            onPress={onAcceptClientPrice}
            disabled={isSubmitting}
            opacity={isSubmitting ? 0.7 : 1}
          >
            {isSubmitting ? "Submitting..." : `Accept for ${formattedClientPrice}`}
          </Button>
          <Button
            borderRadius={9999}
            fontWeight="600"
            backgroundColor={colors.bgSecondary}
            borderWidth={1}
            borderColor={colors.border}
            color={colors.textPrimary}
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
