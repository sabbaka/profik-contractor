import {
  useGetOfferMessagesQuery,
  useMarkConversationReadMutation,
  useMeQuery,
  useSendOfferMessageMutation,
} from "@/src/api/profikApi";
import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { OfferStatusPill } from "@/src/components/jobs/OfferStatusPill";
import { formatCzk } from "@/src/utils/currency";
import type { JobStatus, OfferStatus } from "@/src/api/types";
import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Send,
} from "@tamagui/lucide-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { logError } from "@/src/utils/logger";
import { PROFIK_GRADIENT } from "@/tamagui.config";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
} from "react-native";
import {
  KeyboardAvoidingView,
  useKeyboardState,
} from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Spinner, XStack, YStack } from "tamagui";

export default function OfferChatRoute() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const isKeyboardVisible = useKeyboardState((state) => state.isVisible);
  // Job context travels in the route params — see `buildOfferChatRoute`. A
  // deep link carries only `offerId`, so every field below is optional.
  const { offerId, jobId, jobTitle, offerPrice, offerStatus, jobStatus } =
    useLocalSearchParams<{
      offerId: string;
      jobId?: string;
      jobTitle?: string;
      offerPrice?: string;
      offerStatus?: OfferStatus;
      jobStatus?: JobStatus;
    }>();
  const { data: me } = useMeQuery();
  const {
    data: messages,
    isLoading,
    isFetching,
  } = useGetOfferMessagesQuery(offerId, {
    skip: !offerId,
    refetchOnMountOrArgChange: true,
    // There is no socket, so without polling an open chat never shows the
    // client's replies.
    pollingInterval: 10000,
  });
  // The API returns oldest-first; the list is inverted, so feed it newest-first.
  const orderedMessages = useMemo(
    () => (messages ? [...messages].reverse() : []),
    [messages],
  );
  const [content, setContent] = useState("");
  const [sendMessage, { isLoading: isSending }] = useSendOfferMessageMutation();
  const [markConversationRead] = useMarkConversationReadMutation();

  // Reading the chat is what clears its unread count, so the cursor moves on
  // open and again on every message that arrives while it is open. Keyed on
  // the newest message id so a re-render does not re-post the same cursor —
  // the endpoint is idempotent, but the request is not free.
  const newestMessageId = messages?.length
    ? messages[messages.length - 1].id
    : undefined;
  const lastMarkedId = useRef<string | null>(null);
  useEffect(() => {
    if (!offerId || !newestMessageId) return;
    if (lastMarkedId.current === newestMessageId) return;
    lastMarkedId.current = newestMessageId;
    markConversationRead({ offerId, lastReadMessageId: newestMessageId })
      .unwrap()
      .catch(logError);
  }, [offerId, newestMessageId, markConversationRead]);

  const handleSend = useCallback(async () => {
    if (!offerId || !content.trim()) return;
    try {
      await sendMessage({ offerId, content: content.trim() }).unwrap();
      setContent("");
    } catch (err) {
      logError(err);
      Alert.alert(t("chat.notSentTitle"), t("chat.notSentBody"));
    }
  }, [offerId, content, sendMessage, t]);

  if (!offerId)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgSecondary }}>
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Text variant="bodySm">{t("chat.invalidOffer")}</Text>
        </YStack>
      </SafeAreaView>
    );

  return (
    // Top edge only: the bottom inset now belongs to the composer, which drops
    // it while the keyboard is up. Leaving it here too would count it twice.
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.bgSecondary }}
    >
      <XStack
        height={50}
        paddingHorizontal={16}
        alignItems="center"
        justifyContent="space-between"
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <XStack alignItems="center">
            <ChevronLeft size={25} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
              {t("common.back")}
            </Text>
          </XStack>
        </Pressable>
        <YStack alignItems="center">
          <Text variant="h5">{t("chat.title")}</Text>
          <Text
            style={{
              color: colors.success,
              fontFamily: "Inter_500Medium",
              fontSize: 10,
            }}
          >
            {t("chat.eyebrow")}
          </Text>
        </YStack>
        <XStack width={58} />
      </XStack>

      {jobTitle ? (
        <Pressable
          onPress={
            jobId
              ? () =>
                  router.push({
                    pathname: "/(contractor)/jobs/[id]",
                    params: { id: jobId },
                  })
              : undefined
          }
          disabled={!jobId}
          accessibilityRole="button"
          accessibilityLabel={t("chat.openJob")}
          style={({ pressed }) => ({ opacity: pressed && jobId ? 0.85 : 1 })}
        >
          <XStack
            paddingHorizontal={16}
            paddingVertical={10}
            gap={10}
            alignItems="center"
            backgroundColor={colors.bgCard}
            borderBottomWidth={1}
            borderBottomColor={colors.borderSubtle}
          >
            <YStack
              width={34}
              height={34}
              borderRadius={10}
              backgroundColor={colors.accentLight}
              alignItems="center"
              justifyContent="center"
            >
              <BriefcaseBusiness size={16} color={colors.accent} />
            </YStack>
            <YStack flex={1} gap={3}>
              <Text
                numberOfLines={1}
                style={{
                  color: colors.textPrimary,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 13,
                  lineHeight: 17,
                }}
              >
                {jobTitle}
              </Text>
              {offerPrice || offerStatus ? (
                <XStack alignItems="center" gap={6}>
                  {offerPrice ? (
                    <Text
                      style={{
                        color: colors.accent,
                        fontFamily: "GeistMono_700Bold",
                        fontSize: 11,
                        lineHeight: 15,
                      }}
                    >
                      {t("chat.yourOffer", {
                        price: formatCzk(Number(offerPrice)),
                      })}
                    </Text>
                  ) : null}
                  {offerStatus ? (
                    <OfferStatusPill
                      status={offerStatus}
                      jobStatus={jobStatus}
                      size="sm"
                    />
                  ) : null}
                </XStack>
              ) : null}
            </YStack>
            {jobId ? <ChevronRight size={16} color={colors.textMuted} /> : null}
          </XStack>
        </Pressable>
      ) : null}

      {/* Wraps the list and the composer, never the header or the job banner —
          `padding` shrinks what it wraps, so anything else inside would be
          squeezed off the top. "padding" on both platforms: this one rides the
          IME insets, so unlike RN's it works on Android under edge-to-edge,
          where the window is no longer resized. Shrinking the container is
          also what keeps the last message visible, which translating the
          composer alone would not. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {isLoading && !messages ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <Spinner color={colors.accent} />
          </YStack>
        ) : !messages?.length && !isFetching ? (
          <YStack
            flex={1}
            alignItems="center"
            justifyContent="center"
            gap={10}
            paddingHorizontal={20}
          >
            <YStack
              width={72}
              height={72}
              borderRadius={9999}
              backgroundColor={colors.accentLight}
              alignItems="center"
              justifyContent="center"
            >
              <MessageCircle size={29} color={colors.accent} />
            </YStack>
            <Text variant="h4">{t("chat.emptyTitle")}</Text>
            <Text variant="bodySm" textAlign="center">
              {t("chat.emptyBody")}
            </Text>
          </YStack>
        ) : (
          <FlatList
            // Inverted so the newest message sits at the bottom and the list
            // opens there without an imperative scroll.
            inverted
            data={orderedMessages}
            keyExtractor={(message: any) => message.id}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingVertical: 18,
              gap: 8,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            renderItem={({ item: message }: { item: any }) => {
              const mine = message.senderId === me?.id;
              return (
                <YStack
                  alignSelf={mine ? "flex-end" : "flex-start"}
                  maxWidth="82%"
                  borderRadius={19}
                  overflow="hidden"
                  paddingHorizontal={15}
                  paddingVertical={11}
                  backgroundColor={mine ? "transparent" : colors.bgCard}
                  borderWidth={mine ? 0 : 1}
                  borderColor={colors.borderSubtle}
                >
                  {mine ? (
                    <LinearGradient
                      colors={PROFIK_GRADIENT.accent}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  ) : null}
                  <Text
                    style={{
                      color: mine ? "#FFFFFF" : colors.textPrimary,
                      fontFamily: "Inter_400Regular",
                      fontSize: 15,
                      lineHeight: 21,
                    }}
                  >
                    {message.content}
                  </Text>
                </YStack>
              );
            }}
          />
        )}

        <XStack
          paddingHorizontal={16}
          paddingTop={10}
          // The home indicator sits behind the keyboard, so its inset is only
          // worth reserving while the keyboard is down.
          paddingBottom={
            isKeyboardVisible ? 10 : Math.max(insets.bottom, 10) + 6
          }
          alignItems="flex-end"
          gap={9}
          backgroundColor={colors.bgPrimary}
          borderTopWidth={1}
          borderTopColor={colors.borderSubtle}
        >
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder={t("chat.placeholders.message")}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
            style={{
              flex: 1,
              minHeight: 44,
              maxHeight: 110,
              borderRadius: 22,
              backgroundColor: colors.surfaceInput,
              color: colors.textPrimary,
              paddingHorizontal: 16,
              paddingVertical: 11,
              fontSize: 15,
              fontFamily: "Inter_400Regular",
            }}
          />
          <Pressable
            disabled={isSending || !content.trim()}
            onPress={handleSend}
            accessibilityRole="button"
            accessibilityLabel={t("a11y.send")}
            style={({ pressed }) => ({
              opacity: isSending || !content.trim() ? 0.45 : pressed ? 0.8 : 1,
            })}
          >
            <YStack
              width={44}
              height={44}
              borderRadius={9999}
              overflow="hidden"
              alignItems="center"
              justifyContent="center"
            >
              <LinearGradient
                colors={PROFIK_GRADIENT.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Send size={18} color="#FFFFFF" />
            </YStack>
          </Pressable>
        </XStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
