import { useGetPaymentHistoryInfiniteQuery } from "@/src/api/profikApi";
import { Button, Text } from "@/src/components/ui/ui";
import { ListFooterSpinner } from "@/src/components/ui/ListFooterSpinner";
import { useManualRefresh } from "@/src/hooks/useManualRefresh";
import { useThemeColors } from "@/src/theme";
import { ChevronLeft, History } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spinner, XStack, YStack } from "tamagui";
import { PaymentHistoryRow } from "./PaymentHistoryRow";

/**
 * Every balance movement on this account, newest first: top-ups, offer fees,
 * the sign-up bonus. Reached from the Balance screen, not the tab bar — it's
 * a secondary, read-only view onto balance, not a destination of its own.
 */
export function PaymentHistoryScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useGetPaymentHistoryInfiniteQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });
  const { isRefreshing, handleRefresh } = useManualRefresh(refetch);

  const entries = useMemo(() => data?.pages.flat() ?? [], [data?.pages]);

  const handleEndReached = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <YStack
      flex={1}
      backgroundColor={colors.bgSecondary}
      paddingTop={insets.top}
    >
      <XStack
        height={48}
        paddingHorizontal={16}
        alignItems="center"
        justifyContent="space-between"
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <XStack alignItems="center" gap={2}>
            <ChevronLeft size={25} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
              {t("common.back")}
            </Text>
          </XStack>
        </Pressable>
        <Text variant="h5">{t("balance.history.title")}</Text>
        <XStack width={58} />
      </XStack>

      {isLoading && !data ? (
        <YStack flex={1} alignItems="center" justifyContent="center" gap={12}>
          <Spinner color={colors.accent} />
          <Text variant="bodySm">{t("balance.history.loading")}</Text>
        </YStack>
      ) : error ? (
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap={12}
          paddingHorizontal={28}
        >
          <Text variant="h4">{t("balance.history.errorTitle")}</Text>
          <Button
            variant="secondary"
            size="md"
            fullWidth={false}
            onPress={refetch}
          >
            {t("common.retry")}
          </Button>
        </YStack>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: insets.bottom + 32,
            flexGrow: entries.length ? undefined : 1,
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
                <History size={32} color={colors.accent} />
              </YStack>
              <Text variant="h4" textAlign="center">
                {t("balance.history.emptyTitle")}
              </Text>
              <Text variant="bodySm" textAlign="center" maxWidth={280}>
                {t("balance.history.emptyBody")}
              </Text>
            </YStack>
          }
          ListFooterComponent={
            isFetchingNextPage ? <ListFooterSpinner /> : null
          }
          renderItem={({ item, index }) => (
            <YStack
              backgroundColor={colors.bgCard}
              borderWidth={1}
              borderBottomWidth={index === entries.length - 1 ? 1 : 0}
              borderColor={colors.borderSubtle}
              borderTopLeftRadius={index === 0 ? 16 : 0}
              borderTopRightRadius={index === 0 ? 16 : 0}
              borderBottomLeftRadius={index === entries.length - 1 ? 16 : 0}
              borderBottomRightRadius={index === entries.length - 1 ? 16 : 0}
              overflow="hidden"
            >
              {index > 0 ? (
                <YStack
                  height={1}
                  marginHorizontal={16}
                  backgroundColor={colors.divider}
                />
              ) : null}
              <PaymentHistoryRow entry={item} />
            </YStack>
          )}
        />
      )}
    </YStack>
  );
}
