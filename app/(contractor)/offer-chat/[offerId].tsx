import { useGetOfferMessagesQuery, useMeQuery, useSendOfferMessageMutation } from "@/src/api/profikApi";
import { Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { ChevronLeft, MessageCircle, Send } from "@tamagui/lucide-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, XStack, YStack } from "tamagui";

export default function OfferChatRoute() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { offerId } = useLocalSearchParams<{ offerId: string }>();
  const { data: me } = useMeQuery();
  const { data: messages, isLoading, isFetching } = useGetOfferMessagesQuery(offerId, { skip: !offerId, refetchOnMountOrArgChange: true });
  const [content, setContent] = useState("");
  const [sendMessage, { isLoading: isSending }] = useSendOfferMessageMutation();

  const handleSend = useCallback(async () => {
    if (!offerId || !content.trim()) return;
    try { await sendMessage({ offerId, content: content.trim() }).unwrap(); setContent(""); }
    catch { Alert.alert(t("chat.notSentTitle"), t("chat.notSentBody")); }
  }, [offerId, content, sendMessage, t]);

  if (!offerId) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgSecondary }}><YStack flex={1} alignItems="center" justifyContent="center"><Text variant="bodySm">{t("chat.invalidOffer")}</Text></YStack></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgSecondary }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <XStack height={50} paddingHorizontal={16} alignItems="center" justifyContent="space-between">
          <Pressable onPress={() => router.back()} hitSlop={10}><XStack alignItems="center"><ChevronLeft size={25} color={colors.textPrimary} /><Text style={{ color: colors.textPrimary, fontSize: 16 }}>{t("common.back")}</Text></XStack></Pressable>
          <YStack alignItems="center"><Text variant="h5">{t("chat.title")}</Text><Text style={{ color: colors.success, fontFamily: "Inter_500Medium", fontSize: 10 }}>{t("chat.eyebrow")}</Text></YStack>
          <XStack width={58} />
        </XStack>

        {isLoading && !messages ? (
          <YStack flex={1} alignItems="center" justifyContent="center"><Spinner color={colors.accent} /></YStack>
        ) : (
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 18, gap: 8, justifyContent: messages?.length ? "flex-end" : "center" }} keyboardShouldPersistTaps="handled">
            {messages?.map((message: any) => {
              const mine = message.senderId === me?.id;
              return (
                <YStack key={message.id} alignSelf={mine ? "flex-end" : "flex-start"} maxWidth="82%" borderRadius={19} overflow="hidden" paddingHorizontal={15} paddingVertical={11} backgroundColor={mine ? "transparent" : colors.bgCard} borderWidth={mine ? 0 : 1} borderColor={colors.borderSubtle}>
                  {mine ? <LinearGradient colors={["#FF8A2B", "#E85D00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /> : null}
                  <Text style={{ color: mine ? "#FFFFFF" : colors.textPrimary, fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 21 }}>{message.content}</Text>
                </YStack>
              );
            })}
            {!messages?.length && !isLoading && !isFetching ? (
              <YStack alignItems="center" gap={10}>
                <YStack width={72} height={72} borderRadius={9999} backgroundColor={colors.accentLight} alignItems="center" justifyContent="center"><MessageCircle size={29} color={colors.accent} /></YStack>
                <Text variant="h4">{t("chat.emptyTitle")}</Text>
                <Text variant="bodySm" textAlign="center">{t("chat.emptyBody")}</Text>
              </YStack>
            ) : null}
          </ScrollView>
        )}

        <XStack paddingHorizontal={16} paddingVertical={10} alignItems="flex-end" gap={9} backgroundColor={colors.bgPrimary} borderTopWidth={1} borderTopColor={colors.borderSubtle}>
          <TextInput value={content} onChangeText={setContent} placeholder={t("chat.placeholders.message")} placeholderTextColor={colors.textMuted} multiline maxLength={1000} style={{ flex: 1, minHeight: 44, maxHeight: 110, borderRadius: 22, backgroundColor: colors.surfaceInput, color: colors.textPrimary, paddingHorizontal: 16, paddingVertical: 11, fontSize: 15, fontFamily: "Inter_400Regular" }} />
          <Pressable disabled={isSending || !content.trim()} onPress={handleSend} style={({ pressed }) => ({ opacity: isSending || !content.trim() ? 0.45 : pressed ? 0.8 : 1 })}>
            <YStack width={44} height={44} borderRadius={9999} overflow="hidden" alignItems="center" justifyContent="center"><LinearGradient colors={["#FF8A2B", "#E85D00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /><Send size={18} color="#FFFFFF" /></YStack>
          </Pressable>
        </XStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
