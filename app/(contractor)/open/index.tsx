import React from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Spinner, YStack } from 'tamagui';
import { ContractorJobCard } from '@/components/jobs/ContractorJobCard';
import { Button, Text } from '@/components/ui/ui';
import { useGetOpenJobsQuery } from '../../../src/api/profikApi';

export default function OpenJobsRoute() {
  const { data, isLoading, isFetching, error, refetch } = useGetOpenJobsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
    refetchOnFocus: true,
  });

  const jobs = data ?? [];

  if (isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" paddingHorizontal="$4">
        <Spinner size="large" color="$gray10" />
        <Text marginTop="$3" fontSize={16} color="$gray11">
          Loading open jobs...
        </Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Text fontSize={18} fontWeight="700" marginBottom="$3">
          Failed to load open jobs
        </Text>
        <Button variant="outlined" onPress={refetch}>
          Retry
        </Button>
      </YStack>
    );
  }

  if (jobs.length === 0) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" paddingHorizontal="$4">
        <Text fontSize={16} color="$gray12">
          No open jobs right now.
        </Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1}>
      <FlatList
        data={jobs}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
          />
        }
        renderItem={({ item }: { item: any }) => (
          <ContractorJobCard
            job={item}
            onPress={() =>
              router.push({
                pathname: '/(contractor)/jobs/[id]',
                params: { id: item.id },
              })
            }
          />
        )}
      />
    </YStack>
  );
}
