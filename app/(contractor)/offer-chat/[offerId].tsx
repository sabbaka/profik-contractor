import { useGetOfferMessagesQuery, useMeQuery, useSendOfferMessageMutation } from '@/src/api/profikApi';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
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
          <Text>Invalid offer</Text>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <YStack flex={1}>
        <XStack paddingHorizontal="$4" paddingVertical="$3" alignItems="center" justifyContent="space-between">
          <Button size="$3" variant="outlined" onPress={() => router.back()}>
            Back
          </Button>
          <Text fontSize="$5" fontWeight="700">
            Chat
          </Text>
          <XStack width="$6" />
        </XStack>

        <View style={styles.messagesWrapper}>
          {isLoading && !messages ? (
            <YStack flex={1} alignItems="center" justifyContent="center">
              <Spinner size="large" color="$gray10" />
            </YStack>
          ) : (
            <YStack flex={1} paddingHorizontal="$4" paddingVertical="$2" gap="$2">
              {messages?.map((message: any) => {
                const isMine = message.senderId === me?.id;
                return (
                  <YStack
                    key={message.id}
                    alignSelf={isMine ? 'flex-end' : 'flex-start'}
                    backgroundColor={isMine ? '$blue10' : '$gray3'}
                    borderRadius="$6"
                    padding="$3"
                    maxWidth="80%"
                  >
                    <Text color={isMine ? 'white' : '$gray12'} fontSize="$4">
                      {message.content}
                    </Text>
                  </YStack>
                );
              })}

              {!messages?.length && !isLoading && !isFetching && (
                <YStack flex={1} alignItems="center" justifyContent="center">
                  <Text color="$gray10">No messages yet</Text>
                </YStack>
              )}
            </YStack>
          )}
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
          <XStack
            paddingHorizontal="$4"
            paddingVertical="$2"
            alignItems="center"
            gap="$2"
            borderTopWidth={StyleSheet.hairlineWidth}
            borderTopColor="#E5E5E5"
            backgroundColor="white"
          >
            <Input
              flex={1}
              size="$4"
              placeholder="Type a message"
              value={content}
              onChangeText={setContent}
              autoCorrect
              multiline
            />
            <Button
              size="$4"
              backgroundColor="$gray12"
              color="white"
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
    backgroundColor: 'white',
  },
  messagesWrapper: {
    flex: 1,
  },
});
