import React from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Card, Separator, Spinner, XStack, YStack } from 'tamagui';
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
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
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
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Text fontSize={16} color="$gray12">
          No open jobs right now.
        </Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} paddingHorizontal="$3" paddingTop="$3" paddingBottom="$4">
      <FlatList
        data={jobs}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
          />
        }
        renderItem={({ item }: { item: any }) => (
          <Card
            bordered
            borderWidth={1}
            borderColor="$borderColor"
            backgroundColor="$background"
            borderRadius="$6"
            padding={0}
            elevation="$1"
            marginBottom="$4"
            animation="bouncy"
            pressStyle={{ scale: 0.98, borderColor: '$gray8' }}
            onPress={() =>
              router.push({
                pathname: '/(contractor)/jobs/[id]',
                params: { id: item.id },
              })
            }
          >
            <YStack padding="$4" gap="$2">
              <Text fontSize={13} color="$gray10" marginTop="$1">
                {item.category}
              </Text>
              <Text fontSize={18} fontWeight="800" color="$color">
                {item.title}
              </Text>
              {item.description ? (
                <Text fontSize={14} color="$gray11" numberOfLines={3}>
                  {item.description}
                </Text>
              ) : null}
            </YStack>

            <Separator borderColor="$gray4" />

            <XStack
              padding="$3"
              paddingHorizontal="$4"
              justifyContent="space-between"
              alignItems="center"
              backgroundColor="$gray1"
              borderBottomLeftRadius="$6"
              borderBottomRightRadius="$6"
            >
              <Text fontSize={14} color="$gray11">
                {new Intl.NumberFormat('cs-CZ', {
                  style: 'currency',
                  currency: 'CZK',
                }).format(item.price ?? 0)}
              </Text>
            </XStack>
          </Card>
        )}
      />
    </YStack>
  );
}
