import {
  useGetConversationsInfiniteQuery,
  useGetUnreadCountQuery,
  useMarkAllReadMutation,
  useMeQuery,
} from "@/src/api/profikApi";
import type { Conversation, ConversationBucket } from "@/src/api/types";
import { buildOfferChatRoute } from "@/src/components/jobs/offerChatRoute";
import { Button, Text } from "@/src/components/ui/ui";
import { useIsGuest } from "@/src/features/auth/hooks/useIsGuest";
import { useThemeColors } from "@/src/theme";
import { logError } from "@/src/utils/logger";
import { CheckCheck, Lock, MessageCircle } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl } from "react-native";
import { Spinner, XStack, YStack } from "tamagui";
import { BucketTabs } from "./BucketTabs";
import { ConversationRow } from "./ConversationRow";
import { useConversationTime } from "./useConversationTime";

/**
 * The Messages tab: every chat the contractor has, grouped by what state the
 * job is in.
 *
 * Conversations exist per offer, so this list is also the only place that
 * shows chats for jobs that were declined or went to someone else — reaching
 * those through My Jobs would mean filtering to "declined" and opening the
 * card first.
 */
export function MessagesScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const isGuest = useIsGuest();
  const formatTime = useConversationTime();

  const [bucket, setBucket] = useState<ConversationBucket>("open");

  const { data: me } = useMeQuery(undefined, { skip: isGuest });
  const { data: unread } = useGetUnreadCountQuery(undefined, {
    skip: isGuest,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    // There's no socket, so without this a message that arrives while the
    // contractor is sitting on this screen never shows up. Faster than the
    // 60s tab badge in app/(contractor)/(tabs)/_layout.tsx (which is mounted
    // for the whole session regardless of tab) since this only runs while
    // someone is actively looking at the list.
    pollingInterval: 15_000,
  });
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useGetConversationsInfiniteQuery(
    { bucket },
    {
      skip: isGuest,
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true,
      refetchOnFocus: true,
      // Same reasoning as the unread count above: keep the list itself
      // current while it's on screen, not just its badge.
      pollingInterval: 15_000,
    },
  );
  const [markAllRead, { isLoading: isMarking }] = useMarkAllReadMutation();

  // The query's own fetching flag is true for the 15s background poll too,
  // not just a manual pull — binding the pull-to-refresh spinner to it made the
  // list jump every poll tick even though nothing the contractor did caused
  // it. Track the manual refresh separately instead.
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const conversations = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages],
  );
  const totalUnread = unread?.total ?? 0;

  const handleBucketChange = useCallback((next: ConversationBucket) => {
    setBucket(next);
  }, []);

  // Guarded on `isFetchingNextPage`, not `isFetching`: the latter is true on
  // every 15s poll tick, so a scroll that lands in that window would be
  // silently dropped and the list would simply stop growing.
  const handleEndReached = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllRead().unwrap();
    } catch (err) {
      logError(err);
    }
  }, [markAllRead]);

  const openChat = useCallback((conversation: Conversation) => {
    router.push(
      buildOfferChatRoute({
        offerId: conversation.offerId,
        jobId: conversation.job.id,
        jobTitle: conversation.job.title,
        offerPrice: conversation.offer.price,
        offerStatus: conversation.offer.status,
      }) as any,
    );
  }, []);

  const previewOf = useCallback(
    (conversation: Conversation) => {
      const last = conversation.lastMessage;
      if (!last) return t("messages.noMessagesYet");
      return last.senderId === me?.id
        ? t("messages.youPrefix", { text: last.content })
        : last.content;
    },
    [me?.id, t],
  );

  if (isGuest) {
    return (
      <YStack flex={1} backgroundColor={colors.bgSecondary}>
        <Header subtitle={t("messages.subtitle")} />
        <EmptyState
          Icon={Lock}
          title={t("messages.guestTitle")}
          body={t("messages.guestBody")}
          ctaLabel={t("auth.continueWithPhone")}
          onPress={() => router.push("/auth/login" as any)}
        />
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor={colors.bgSecondary}>
      <Header
        subtitle={
          totalUnread > 0
            ? t("messages.unreadSubtitle", { count: totalUnread })
            : t("messages.subtitle")
        }
        action={
          <Pressable
            onPress={handleMarkAllRead}
            disabled={totalUnread === 0 || isMarking}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("messages.markAllRead")}
            accessibilityState={{ disabled: totalUnread === 0 || isMarking }}
            style={({ pressed }) => ({
              opacity: totalUnread === 0 ? 0.4 : pressed ? 0.7 : 1,
            })}
          >
            <YStack
              width={40}
              height={40}
              borderRadius={9999}
              alignItems="center"
              justifyContent="center"
              backgroundColor={colors.bgPrimary}
              borderWidth={1}
              borderColor={colors.borderSubtle}
            >
              <CheckCheck size={19} color={colors.textSecondary} />
            </YStack>
          </Pressable>
        }
      />

      <BucketTabs
        value={bucket}
        onChange={handleBucketChange}
        unreadByBucket={unread?.byBucket}
      />
      <YStack height={1} backgroundColor={colors.borderSubtle} />

      {isLoading && !data ? (
        <YStack flex={1} alignItems="center" justifyContent="center" gap={12}>
          <Spinner color={colors.accent} />
          <Text variant="bodySm">{t("messages.loading")}</Text>
        </YStack>
      ) : error ? (
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap={12}
          paddingHorizontal={28}
        >
          <Text variant="h4">{t("messages.errorTitle")}</Text>
          <Text variant="bodySm" textAlign="center">
            {t("messages.errorBody")}
          </Text>
          <Button variant="secondary" size="md" fullWidth={false} onPress={refetch}>
            {t("common.retry")}
          </Button>
        </YStack>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.offerId}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 118,
            flexGrow: conversations.length ? undefined : 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={handleEndReached}
          ListEmptyComponent={
            <EmptyState
              Icon={MessageCircle}
              title={t(`messages.empty.${bucket}.title`)}
              body={t(`messages.empty.${bucket}.body`)}
              ctaLabel={bucket === "open" ? t("messages.findJob") : undefined}
              onPress={() => router.replace("/(contractor)/(tabs)/open" as any)}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <YStack paddingVertical={16} alignItems="center">
                <Spinner color={colors.accent} />
              </YStack>
            ) : null
          }
          renderItem={({ item, index }) => (
            <YStack
              backgroundColor={colors.bgCard}
              borderWidth={1}
              borderBottomWidth={index === conversations.length - 1 ? 1 : 0}
              borderColor={colors.borderSubtle}
              borderTopLeftRadius={index === 0 ? 16 : 0}
              borderTopRightRadius={index === 0 ? 16 : 0}
              borderBottomLeftRadius={
                index === conversations.length - 1 ? 16 : 0
              }
              borderBottomRightRadius={
                index === conversations.length - 1 ? 16 : 0
              }
              overflow="hidden"
            >
              {index > 0 ? (
                <YStack
                  height={1}
                  marginHorizontal={16}
                  backgroundColor={colors.divider}
                />
              ) : null}
              <ConversationRow
                conversation={item}
                onPress={() => openChat(item)}
                timeLabel={formatTime(
                  item.lastMessage?.createdAt ?? item.offer.createdAt,
                )}
                preview={previewOf(item)}
              />
            </YStack>
          )}
        />
      )}
    </YStack>
  );
}

function Header({
  subtitle,
  action,
}: {
  subtitle: string;
  action?: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <XStack
      paddingHorizontal={20}
      paddingTop={12}
      paddingBottom={14}
      alignItems="flex-end"
      justifyContent="space-between"
    >
      <YStack gap={3} flex={1}>
        <Text variant="h1">{t("messages.title")}</Text>
        <Text variant="bodySm">{subtitle}</Text>
      </YStack>
      {action}
    </XStack>
  );
}

function EmptyState({
  Icon,
  title,
  body,
  ctaLabel,
  onPress,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  body: string;
  ctaLabel?: string;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      gap={12}
      paddingHorizontal={28}
      paddingBottom={80}
    >
      <YStack
        width={80}
        height={80}
        borderRadius={9999}
        alignItems="center"
        justifyContent="center"
        backgroundColor={colors.accentLight}
      >
        <Icon size={32} color={colors.accent} />
      </YStack>
      <Text variant="h4" textAlign="center">
        {title}
      </Text>
      <Text variant="bodySm" textAlign="center" maxWidth={280}>
        {body}
      </Text>
      {ctaLabel ? (
        <YStack gap={8} width="100%" maxWidth={280} marginTop={8}>
          <Button variant="primary" onPress={onPress}>
            {ctaLabel}
          </Button>
        </YStack>
      ) : null}
    </YStack>
  );
}
