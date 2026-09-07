import { useGetOfferedJobsQuery } from "@/src/api/profikApi";
import type { OfferStatus } from "@/src/api/types";
import { ContractorJobCard } from "@/src/components/jobs/ContractorJobCard";
import { buildOfferChatRoute } from "@/src/components/jobs/offerChatRoute";
import { Button, Text } from "@/src/components/ui/ui";
import { useJobsFilter } from "@/src/context/JobsFilterContext";
import { useIsGuest } from "@/src/features/auth/hooks/useIsGuest";
import { useThemeColors } from "@/src/theme";
import { FolderOpen, Lock } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl } from "react-native";
import { Spinner, XStack, YStack } from "tamagui";

const FILTERS: { key: OfferStatus; labelKey: string }[] = [
  { key: "pending", labelKey: "my.filters.pending" },
  { key: "accepted", labelKey: "my.filters.accepted" },
  { key: "declined", labelKey: "my.filters.declined" },
];

export default function MyJobsTab() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { filter, setFilter } = useJobsFilter();
  const isGuest = useIsGuest();
  // The filter tab switches immediately, but RTK Query's `isFetching` can lag
  // a render behind the new args, so `changing` covers that gap: it's set the
  // moment the tab changes and cleared once a fetch that was in flight
  // finishes (not merely whenever `isFetching` happens to read false).
  const [changing, setChanging] = useState(false);
  const previousFilter = useRef(filter);
  const wasFetching = useRef(false);
  const { data, isLoading, isFetching, error, refetch } = useGetOfferedJobsQuery({ status: filter }, {
    skip: isGuest,
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
    refetchOnFocus: true,
  });

  useEffect(() => {
    if (previousFilter.current !== filter) {
      setChanging(true);
      previousFilter.current = filter;
    }
  }, [filter]);

  useEffect(() => {
    if (wasFetching.current && !isFetching) setChanging(false);
    wasFetching.current = isFetching;
  }, [isFetching]);

  const jobs = data ?? [];
  const loading = isLoading || changing || (isFetching && !jobs.length);
  const currentLabel = t(`my.labels.${filter}`);

  if (isGuest) {
    return (
      <YStack flex={1} backgroundColor={colors.bgSecondary}>
        <YStack paddingHorizontal={20} paddingTop={12} paddingBottom={16} gap={3}>
          <Text variant="h1">{t("my.title")}</Text>
          <Text variant="bodySm">{t("my.subtitle")}</Text>
        </YStack>
        <YStack flex={1} alignItems="center" justifyContent="center" gap={12} paddingHorizontal={28} paddingBottom={80}>
          <YStack width={80} height={80} borderRadius={9999} backgroundColor={colors.accentLight} alignItems="center" justifyContent="center">
            <Lock size={32} color={colors.accent} />
          </YStack>
          <Text variant="h4">{t("guest.myJobsTitle")}</Text>
          <Text variant="bodySm" textAlign="center" maxWidth={270}>{t("guest.myJobsBody")}</Text>
          <YStack gap={8} width="100%" maxWidth={280} marginTop={8}>
            <Button variant="primary" onPress={() => router.push("/auth/login" as any)}>{t("auth.continueWithPhone")}</Button>
          </YStack>
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor={colors.bgSecondary}>
      <YStack paddingHorizontal={20} paddingTop={12} paddingBottom={16} gap={15}>
        <YStack gap={3}>
          <Text variant="h1">{t("my.title")}</Text>
          <Text variant="bodySm">{t("my.subtitle")}</Text>
        </YStack>
        <XStack gap={8}>
          {FILTERS.map((item) => {
            const active = item.key === filter;
            return (
              <Pressable key={item.key} onPress={() => setFilter(item.key)} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                <YStack height={34} paddingHorizontal={16} borderRadius={9999} alignItems="center" justifyContent="center" backgroundColor={active ? colors.accent : colors.bgPrimary} borderWidth={active ? 0 : 1} borderColor={colors.borderSubtle}>
                  <Text style={{ color: active ? "#FFFFFF" : colors.textSecondary, fontFamily: active ? "Inter_600SemiBold" : "Inter_500Medium", fontSize: 13 }}>{t(item.labelKey)}</Text>
                </YStack>
              </Pressable>
            );
          })}
        </XStack>
      </YStack>

      {loading ? (
        <YStack flex={1} alignItems="center" justifyContent="center" gap={12}>
          <Spinner color={colors.accent} />
          <Text variant="bodySm">{t("my.loading", { label: currentLabel })}</Text>
        </YStack>
      ) : error ? (
        <YStack flex={1} alignItems="center" justifyContent="center" gap={12} paddingHorizontal={28}>
          <Text variant="h4">{t("my.errorTitle")}</Text>
          <Button variant="secondary" size="md" fullWidth={false} onPress={refetch}>{t("common.retry")}</Button>
        </YStack>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item: any) => item.job.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 118, flexGrow: jobs.length ? undefined : 1 }}
          refreshControl={<RefreshControl refreshing={isFetching && !changing} onRefresh={refetch} tintColor={colors.accent} />}
          ListEmptyComponent={
            <YStack flex={1} alignItems="center" justifyContent="center" gap={12} paddingBottom={80}>
              <YStack width={80} height={80} borderRadius={9999} backgroundColor={colors.accentLight} alignItems="center" justifyContent="center">
                <FolderOpen size={32} color={colors.accent} />
              </YStack>
              <Text variant="h4">{t("my.emptyTitle", { label: currentLabel })}</Text>
              <Text variant="bodySm" textAlign="center" maxWidth={270}>{t("my.emptyBody")}</Text>
            </YStack>
          }
          renderItem={({ item }: { item: any }) => (
            <ContractorJobCard
              job={item.job}
              myOffer={item.myOffer}
              onPress={() => router.push({ pathname: "/(contractor)/jobs/[id]", params: { id: item.job.id } })}
              onMessage={
                item.myOffer?.id
                  ? () =>
                      router.push(
                        buildOfferChatRoute({
                          offerId: item.myOffer.id,
                          jobId: item.job.id,
                          jobTitle: item.job.title,
                          offerPrice: item.myOffer.price,
                          offerStatus: item.myOffer.status,
                        }) as any,
                      )
                  : undefined
              }
            />
          )}
        />
      )}
    </YStack>
  );
}
