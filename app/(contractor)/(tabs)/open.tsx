import { useGetOpenJobsQuery } from "@/src/api/profikApi";
import { ContractorJobCard } from "@/src/components/jobs/ContractorJobCard";
import { Button, Text } from "@/src/components/ui/ui";
import { colors } from "@/src/theme";
import { router } from "expo-router";
import React from "react";
import { FlatList, RefreshControl } from "react-native";
import { Spinner, YStack } from "tamagui";

export default function OpenJobsTab() {
  const { data, isLoading, isFetching, error, refetch } = useGetOpenJobsQuery(
    undefined,
    {
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true,
      refetchOnFocus: true,
    }
  );

  const jobs = data ?? [];

  if (isLoading) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        paddingHorizontal="$4"
        backgroundColor={colors.bgSecondary}
      >
        <Spinner size="large" color={colors.accent} />
        <Text marginTop="$3" fontSize={16} color={colors.textSecondary}>
          Loading open jobs...
        </Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" backgroundColor={colors.bgSecondary}>
        <Text fontSize={18} fontWeight="700" marginBottom="$3">
          Failed to load open jobs
        </Text>
        <Button variant="bordered" onPress={refetch}>
          Retry
        </Button>
      </YStack>
    );
  }

  if (jobs.length === 0) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        paddingHorizontal="$4"
        backgroundColor={colors.bgSecondary}
      >
        <Text fontSize={16} color={colors.textMuted}>
          No open jobs right now.
        </Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor={colors.bgSecondary}>
      <FlatList
        data={jobs}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <Text fontSize={28} fontWeight="bold" color={colors.textPrimary} marginBottom="$4">
            Open Jobs
          </Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={colors.accent}
          />
        }
        renderItem={({ item }: { item: any }) => (
          <ContractorJobCard
            job={item}
            onPress={() =>
              router.push({
                pathname: "/(contractor)/jobs/[id]",
                params: { id: item.id },
              })
            }
          />
        )}
      />
    </YStack>
  );
}
