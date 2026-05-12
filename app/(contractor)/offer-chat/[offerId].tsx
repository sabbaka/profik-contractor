import { useGetOfferMessagesQuery, useMeQuery, useSendOfferMessageMutation } from '@/src/api/profikApi';
import { colors } from '@/src/theme';
import { ArrowLeft } from '@tamagui/lucide-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Spinner, Text, XStack, YStack } from 'tamagui';

export default function OfferChatRoute() {
  const { offerId } = useLocalSearchParams<{ offerId: string }>();

  const { data: me } = useMeQuery();

  const {
    data: messages,
    isLoading,
    isFetching,
  } = useGetOfferMessagesQuery(offerId, {
    skip: !offerId,
    refetchOnMountOrArgChange: true,
  });

  const [content, setContent] = useState('');
  const [sendOfferMessage, { isLoading: isSending }] = useSendOfferMessageMutation();

  const handleSend = useCallback(async () => {
    if (!offerId || !content.trim()) return;

    try {
      await sendOfferMessage({ offerId, content: content.trim() }).unwrap();
      setContent('');
    } catch (_error) {
      Alert.alert('Error', 'Failed to send message');
    }
  }, [offerId, content, sendOfferMessage]);

  if (!offerId) {
    return (
      <SafeAreaView style={styles.container}>
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Text color={colors.textSecondary}>Invalid offer</Text>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <YStack flex={1}>
        <XStack paddingHorizontal="$4" paddingVertical="$3" alignItems="center" justifyContent="space-between">
        <Button
        icon={ArrowLeft}
        chromeless
        circular
        size="$2"
        scaleIcon={1.5}
        onPress={() => router.back()}
        color={colors.textPrimary}
      />
          <Text fontSize="$5" fontWeight="700" color={colors.textPrimary}>
            Chat
          </Text>
          <XStack width="$6" />
        </XStack>

        <Pressable style={styles.messagesWrapper} onPress={Keyboard.dismiss}>
          {isLoading && !messages ? (
            <YStack flex={1} alignItems="center" justifyContent="center">
              <Spinner size="large" color={colors.accent} />
            </YStack>
          ) : (
            <YStack flex={1} paddingHorizontal="$4" paddingVertical="$2" gap="$2">
              {messages?.map((message: any) => {
                const isMine = message.senderId === me?.id;
                return (
                  <YStack
                    key={message.id}
                    alignSelf={isMine ? 'flex-end' : 'flex-start'}
                    backgroundColor={isMine ? colors.accent : colors.bgCard}
                    borderRadius="$6"
                    padding="$3"
                    maxWidth="80%"
                  >
                    <Text color={isMine ? colors.textInverse : colors.textPrimary} fontSize="$4">
                      {message.content}
                    </Text>
                  </YStack>
                );
              })}

              {!messages?.length && !isLoading && !isFetching && (
                <YStack flex={1} alignItems="center" justifyContent="center">
                  <Text color={colors.textMuted}>No messages yet</Text>
                </YStack>
              )}
            </YStack>
          )}
        </Pressable>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
          <XStack
            paddingHorizontal="$4"
            paddingVertical="$2"
            alignItems="center"
            gap="$2"
            borderTopWidth={StyleSheet.hairlineWidth}
            borderTopColor={colors.border}
            backgroundColor={colors.bgSecondary}
          >
            <Input
              flex={1}
              size="$4"
              placeholder="Type a message"
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              autoCorrect
              multiline
              backgroundColor={colors.surfaceInput}
              color={colors.textPrimary}
              borderWidth={0}
              borderRadius={12}
            />
            <Button
              size="$4"
              borderRadius="$10"
              backgroundColor={colors.accent}
              color={colors.textInverse}
              onPress={handleSend}
              disabled={isSending || !content.trim()}
            >
              Send
            </Button>
          </XStack>
        </KeyboardAvoidingView>
      </YStack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  messagesWrapper: {
    flex: 1,
  },
});
