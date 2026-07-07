import { useGetOpenJobsQuery } from "@/src/api/profikApi";
import { ContractorJobCard } from "@/src/components/jobs/ContractorJobCard";
import { Button, Text } from "@/src/components/ui/ui";
import { useThemeColors } from "@/src/theme";
import { BriefcaseBusiness, SlidersHorizontal } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl } from "react-native";
import { Spinner, XStack, YStack } from "tamagui";

export default function OpenJobsTab() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { data, isLoading, isFetching, error, refetch } = useGetOpenJobsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
    refetchOnFocus: true,
  });
  const jobs = data ?? [];

  return (
    <YStack flex={1} backgroundColor={colors.bgSecondary}>
      <XStack paddingHorizontal={20} paddingTop={12} paddingBottom={16} alignItems="flex-end" justifyContent="space-between">
        <YStack gap={3}>
          <Text variant="h1">{t("open.title")}</Text>
          <Text variant="bodySm">{isLoading ? t("open.finding") : t("open.available", { count: jobs.length })}</Text>
        </YStack>
        <YStack width={40} height={40} borderRadius={9999} backgroundColor={colors.bgPrimary} borderWidth={1} borderColor={colors.borderSubtle} alignItems="center" justifyContent="center">
          <SlidersHorizontal size={19} color={colors.textSecondary} />
        </YStack>
      </XStack>

      {isLoading ? (
        <YStack flex={1} alignItems="center" justifyContent="center" gap={12}>
          <Spinner color={colors.accent} />
          <Text variant="bodySm">{t("open.loading")}</Text>
        </YStack>
      ) : error ? (
        <YStack flex={1} alignItems="center" justifyContent="center" paddingHorizontal={28} gap={12}>
          <Text variant="h4">{t("open.errorTitle")}</Text>
          <Text variant="bodySm" textAlign="center">{t("open.errorBody")}</Text>
          <Button variant="secondary" size="md" fullWidth={false} onPress={refetch}>{t("common.retry")}</Button>
        </YStack>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 118, flexGrow: jobs.length ? undefined : 1 }}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.accent} />}
          ListEmptyComponent={
            <YStack flex={1} alignItems="center" justifyContent="center" gap={12} paddingBottom={80}>
              <YStack width={80} height={80} borderRadius={9999} backgroundColor={colors.accentLight} alignItems="center" justifyContent="center">
                <BriefcaseBusiness size={32} color={colors.accent} />
              </YStack>
              <Text variant="h4">{t("open.emptyTitle")}</Text>
              <Text variant="bodySm" textAlign="center" maxWidth={270}>{t("open.emptyBody")}</Text>
            </YStack>
          }
          renderItem={({ item }: { item: any }) => (
            <ContractorJobCard
              job={item}
              onPress={() => router.push({ pathname: "/(contractor)/jobs/[id]", params: { id: item.id } })}
            />
          )}
        />
      )}
    </YStack>
  );
}
