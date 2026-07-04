import { useGetOfferedJobsQuery } from "@/src/api/profikApi";
import type { OfferStatus } from "@/src/api/types";
import { ContractorJobCard } from "@/src/components/jobs/ContractorJobCard";
import { Button, Text } from "@/src/components/ui/ui";
import { useJobsFilter } from "@/src/context/JobsFilterContext";
import { useThemeColors } from "@/src/theme";
import { FolderOpen } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl } from "react-native";
import { Spinner, XStack, YStack } from "tamagui";

const FILTERS: { key: OfferStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "declined", label: "Declined" },
];

const labels = { pending: "pending offers", accepted: "accepted jobs", declined: "declined offers" };

export default function MyJobsTab() {
  const colors = useThemeColors();
  const { filter, setFilter } = useJobsFilter();
  const [changing, setChanging] = useState(false);
  const previous = useRef(filter);
  const { data, isLoading, isFetching, error, refetch } = useGetOfferedJobsQuery({ status: filter }, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
    refetchOnFocus: true,
  });

  useEffect(() => {
    if (previous.current !== filter) {
      setChanging(true);
      previous.current = filter;
    }
  }, [filter]);
  useEffect(() => { if (!isFetching) setChanging(false); }, [isFetching]);

  const jobs = data ?? [];
  const loading = isLoading || changing || (isFetching && !jobs.length);

  return (
    <YStack flex={1} backgroundColor={colors.bgSecondary}>
      <YStack paddingHorizontal={20} paddingTop={12} paddingBottom={16} gap={15}>
        <YStack gap={3}>
          <Text variant="h1">My Jobs</Text>
          <Text variant="bodySm">Track your offers and active work</Text>
        </YStack>
        <XStack gap={8}>
          {FILTERS.map((item) => {
            const active = item.key === filter;
            return (
              <Pressable key={item.key} onPress={() => setFilter(item.key)} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                <YStack height={34} paddingHorizontal={16} borderRadius={9999} alignItems="center" justifyContent="center" backgroundColor={active ? colors.accent : colors.bgPrimary} borderWidth={active ? 0 : 1} borderColor={colors.borderSubtle}>
                  <Text style={{ color: active ? "#FFFFFF" : colors.textSecondary, fontFamily: active ? "Inter_600SemiBold" : "Inter_500Medium", fontSize: 13 }}>{item.label}</Text>
                </YStack>
              </Pressable>
            );
          })}
        </XStack>
      </YStack>

      {loading ? (
        <YStack flex={1} alignItems="center" justifyContent="center" gap={12}>
          <Spinner color={colors.accent} />
          <Text variant="bodySm">Loading {labels[filter]}…</Text>
        </YStack>
      ) : error ? (
        <YStack flex={1} alignItems="center" justifyContent="center" gap={12} paddingHorizontal={28}>
          <Text variant="h4">Couldn’t load your jobs</Text>
          <Button variant="secondary" size="md" fullWidth={false} onPress={refetch}>Retry</Button>
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
              <Text variant="h4">No {labels[filter]}</Text>
              <Text variant="bodySm" textAlign="center" maxWidth={270}>When your offer status changes, the job will move here automatically.</Text>
            </YStack>
          }
          renderItem={({ item }: { item: any }) => (
            <ContractorJobCard
              job={item.job}
              myOffer={item.myOffer}
              onPress={() => router.push({ pathname: "/(contractor)/jobs/[id]", params: { id: item.job.id } })}
            />
          )}
        />
      )}
    </YStack>
  );
}
