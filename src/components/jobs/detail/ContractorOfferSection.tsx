import type { OfferStatus } from "@/src/api/types";
import { Button, Text, TextInput } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { formatCzk } from "@/src/utils/currency";
import { MessageCircle, Send, Sparkles } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import { XStack, YStack } from "tamagui";

type OfferMode = "idle" | "counter";
interface Props {
  hasOffered: boolean; myOfferPrice?: number; myOfferMessage?: string; myOfferStatus?: OfferStatus;
  offerIdForChat: string | null; clientPrice: number; mode: OfferMode; setMode: (mode: OfferMode) => void;
  price: string; setPrice: (value: string) => void; message: string; setMessage: (value: string) => void;
  onAcceptClientPrice: () => void; onSubmitOffer: () => void; isSubmitting: boolean; onInputFocus: () => void;
}

export const ContractorOfferSection = (props: Props) => {
  const colors = useThemeColors();
  const { hasOffered, myOfferPrice, myOfferMessage, myOfferStatus, offerIdForChat, clientPrice, mode, setMode, price, setPrice, message, setMessage, onAcceptClientPrice, onSubmitOffer, isSubmitting, onInputFocus } = props;
  const status = myOfferStatus === "accepted"
    ? { bg: colors.statusCompleted, color: colors.statusCompletedText, label: "Accepted" }
    : myOfferStatus === "declined"
      ? { bg: colors.statusCancelled, color: colors.statusCancelledText, label: "Declined" }
      : { bg: colors.statusPending, color: colors.statusPendingText, label: "Pending" };

  if (hasOffered) {
    return (
      <YStack padding={18} borderRadius={20} backgroundColor={colors.bgCard} borderWidth={1} borderColor={colors.borderSubtle} gap={15}>
        <XStack alignItems="center" justifyContent="space-between">
          <YStack gap={3}>
            <Text variant="h5">Your offer</Text>
            <Text variant="caption">Sent to the customer</Text>
          </YStack>
          <XStack backgroundColor={status.bg} paddingVertical={5} paddingHorizontal={11} borderRadius={9999} alignItems="center" gap={5}>
            <YStack width={6} height={6} borderRadius={9999} backgroundColor={status.color} />
            <Text style={{ color: status.color, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>{status.label}</Text>
          </XStack>
        </XStack>
        <YStack padding={16} borderRadius={16} backgroundColor={colors.accentLight} gap={5}>
          <Text variant="caption">YOUR PRICE</Text>
          <Text variant="priceLg" style={{ color: colors.accent }}>{formatCzk(myOfferPrice ?? 0)}</Text>
          {myOfferMessage ? <Text variant="bodySm" style={{ color: colors.textPrimary, marginTop: 5 }}>{myOfferMessage}</Text> : null}
        </YStack>
        {offerIdForChat ? (
          <Button variant="secondary" size="md" iconLeft={<MessageCircle size={17} color={colors.textSecondary} />} onPress={() => router.push({ pathname: "/(contractor)/offer-chat/[offerId]" as any, params: { offerId: offerIdForChat } })}>Message customer</Button>
        ) : null}
      </YStack>
    );
  }

  if (mode === "counter") {
    const number = Number(price);
    const valid = Boolean(price.trim() && !Number.isNaN(number) && number > 0 && message.trim() && !isSubmitting);
    return (
      <YStack padding={18} borderRadius={20} backgroundColor={colors.bgCard} borderWidth={1} borderColor={colors.borderSubtle} gap={15}>
        <YStack gap={3}>
          <Text variant="h5">Make a counter offer</Text>
          <Text variant="bodySm">Set a fair price and tell the customer what’s included.</Text>
        </YStack>
        <YStack gap={10}>
          <TextInput placeholder="Your price in CZK" value={price} onChangeText={setPrice} keyboardType="decimal-pad" onFocus={onInputFocus} />
          <TextInput placeholder="Explain what’s included…" value={message} onChangeText={setMessage} multiline numberOfLines={4} onFocus={onInputFocus} height={104} textAlignVertical="top" paddingTop={14} />
        </YStack>
        <Button loading={isSubmitting} disabled={!valid} iconLeft={<Send size={17} color="#FFFFFF" />} onPress={onSubmitOffer}>Send counter offer</Button>
        <Button variant="ghost" size="sm" onPress={() => setMode("idle")}>Cancel</Button>
      </YStack>
    );
  }

  return (
    <YStack padding={18} borderRadius={20} backgroundColor={colors.bgCard} borderWidth={1} borderColor={colors.borderSubtle} gap={15}>
      <XStack alignItems="center" gap={12}>
        <YStack width={42} height={42} borderRadius={13} backgroundColor={colors.accentLight} alignItems="center" justifyContent="center">
          <Sparkles size={20} color={colors.accent} />
        </YStack>
        <YStack flex={1} gap={2}>
          <Text variant="h5">Interested in this job?</Text>
          <Text variant="caption">Respond now to reach the customer early.</Text>
        </YStack>
      </XStack>
      <Button loading={isSubmitting} onPress={onAcceptClientPrice}>Accept for {formatCzk(clientPrice)}</Button>
      <Button variant="secondary" onPress={() => setMode("counter")} disabled={isSubmitting}>Make a counter offer</Button>
    </YStack>
  );
};
