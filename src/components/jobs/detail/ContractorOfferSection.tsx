import type { JobStatus, OfferStatus } from "@/src/api/types";
import { Button, Text, TextInput } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { formatCzk } from "@/src/utils/currency";
import { MessageCircle, Send, Sparkles } from "@tamagui/lucide-icons";
import { OfferStatusPill } from "@/src/components/jobs/OfferStatusPill";
import { buildOfferChatRoute } from "@/src/components/jobs/offerChatRoute";
import { OfferBalanceWarning } from "./OfferBalanceWarning";
import { OfferCostNote } from "./OfferCostNote";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { XStack, YStack } from "tamagui";

type OfferMode = "idle" | "counter";
interface Props {
  hasOffered: boolean; myOfferPrice?: number; myOfferMessage?: string; myOfferStatus?: OfferStatus;
  /** Job the offer belongs to — travels into the chat as its header context. */
  jobId: string; jobTitle?: string;
  /** Read together with `myOfferStatus`: see `OfferStatusPill`. */
  jobStatus?: JobStatus | null;
  offerIdForChat: string | null; mode: OfferMode; setMode: (mode: OfferMode) => void;
  /** Balance, and whether it covers one offer — see `useJobOffer`. */
  balance: number; canAffordOffer: boolean;
  price: string; setPrice: (value: string) => void; message: string; setMessage: (value: string) => void;
  onAcceptClientPrice: () => void; onSubmitOffer: () => void; isSubmitting: boolean;
}

export const ContractorOfferSection = (props: Props) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { hasOffered, myOfferPrice, myOfferMessage, myOfferStatus, jobId, jobTitle, jobStatus, offerIdForChat, balance, canAffordOffer, mode, setMode, price, setPrice, message, setMessage, onAcceptClientPrice, onSubmitOffer, isSubmitting } = props;

  // A finished or cancelled job cannot take another offer, so the CTA is gone
  // rather than disabled — pressing it would spend 5 Kč on a rejection. A
  // contractor who did offer keeps their card below, status pill and all.
  if (!hasOffered && (jobStatus === "completed" || jobStatus === "canceled")) {
    const canceled = jobStatus === "canceled";
    return (
      <YStack padding={18} borderRadius={20} backgroundColor={colors.bgCard} borderWidth={1} borderColor={colors.borderSubtle} gap={3}>
        <Text variant="h5">{canceled ? t("offer.closed.canceledTitle") : t("offer.closed.completedTitle")}</Text>
        <Text variant="caption">{canceled ? t("offer.closed.canceledBody") : t("offer.closed.completedBody")}</Text>
      </YStack>
    );
  }

  if (hasOffered) {
    return (
      <YStack padding={18} borderRadius={20} backgroundColor={colors.bgCard} borderWidth={1} borderColor={colors.borderSubtle} gap={15}>
        <XStack alignItems="center" justifyContent="space-between">
          <YStack gap={3}>
            <Text variant="h5">{t("offer.yourOffer")}</Text>
            <Text variant="caption">{t("offer.sentToCustomer")}</Text>
          </YStack>
          <OfferStatusPill status={myOfferStatus ?? "pending"} jobStatus={jobStatus} />
        </XStack>
        <YStack padding={16} borderRadius={16} backgroundColor={colors.accentLight} gap={5}>
          <Text variant="caption">{t("offer.yourPrice")}</Text>
          <Text variant="priceLg" style={{ color: colors.accent }}>{formatCzk(myOfferPrice ?? 0)}</Text>
          {myOfferMessage ? <Text variant="bodySm" style={{ color: colors.textPrimary, marginTop: 5 }}>{myOfferMessage}</Text> : null}
        </YStack>
        {offerIdForChat ? (
          <Button variant="secondary" size="md" iconLeft={<MessageCircle size={17} color={colors.textSecondary} />} onPress={() => router.push(buildOfferChatRoute({ offerId: offerIdForChat, jobId, jobTitle, offerPrice: myOfferPrice, offerStatus: myOfferStatus, jobStatus }) as any)}>{t("offer.messageCustomer")}</Button>
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
          <Text variant="h5">{t("offer.makeCounterTitle")}</Text>
          <Text variant="bodySm">{t("offer.makeCounterBody")}</Text>
        </YStack>
        <YStack gap={10}>
          <TextInput placeholder={t("offer.pricePlaceholder")} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
          <TextInput placeholder={t("offer.messagePlaceholder")} value={message} onChangeText={setMessage} multiline numberOfLines={4} height={104} textAlignVertical="top" paddingTop={14} />
        </YStack>
        {canAffordOffer ? (
          <>
            <OfferCostNote />
            <Button loading={isSubmitting} disabled={!valid} iconLeft={<Send size={17} color="#FFFFFF" />} onPress={onSubmitOffer}>{t("offer.sendCounter")}</Button>
          </>
        ) : (
          <>
            <OfferBalanceWarning balance={balance} />
            <Button onPress={() => router.push("/(contractor)/balance" as any)}>{t("offer.balance.topUp")}</Button>
          </>
        )}
        <Button variant="ghost" size="sm" onPress={() => setMode("idle")}>{t("common.cancel")}</Button>
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
          <Text variant="h5">{t("offer.interestedTitle")}</Text>
          <Text variant="caption">{canAffordOffer ? t("offer.interestedBody") : t("offer.balance.interestedBody")}</Text>
        </YStack>
      </XStack>
      {canAffordOffer ? (
        <>
          <OfferCostNote />
          {/* The job's price stays out of this label on purpose: on an orange
              primary button "Send offer for 2 400 Kč" reads as "pay 2 400 Kč".
              The amount is already in the hero above, and what actually leaves
              the balance is spelled out underneath. */}
          <Button loading={isSubmitting} onPress={onAcceptClientPrice}>{t("offer.sendAtClientPrice")}</Button>
          <Button variant="secondary" onPress={() => setMode("counter")} disabled={isSubmitting}>{t("offer.makeCounter")}</Button>
        </>
      ) : (
        <>
          <OfferBalanceWarning balance={balance} />
          {/* Both offer buttons are gone rather than disabled: they cost the
              same and would fail the same way, so the only action left is the
              one that unblocks them. */}
          <Button onPress={() => router.push("/(contractor)/balance" as any)}>{t("offer.balance.topUp")}</Button>
        </>
      )}
    </YStack>
  );
};
