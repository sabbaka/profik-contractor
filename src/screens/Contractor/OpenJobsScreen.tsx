import React from 'react';
import { RefreshControl, TouchableOpacity } from 'react-native';
import { YStack, Card } from 'tamagui';
import { Text, ActivityIndicator, Button } from '@/components/ui/ui';
import { useGetOpenJobsQuery } from '../../api/profikApi';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ContractorStackParamList } from '../../navigation/ContractorNavigator';
import { FlashList } from '@shopify/flash-list';

export default function OpenJobsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ContractorStackParamList>>();
  const { data, isLoading, isFetching, error, refetch } = useGetOpenJobsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
    refetchOnFocus: true,
  });

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <ActivityIndicator size="large" color="$gray10" />
        <Text marginTop="$3">Loading open jobs...</Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Text variant="titleMedium" marginBottom="$3">❌ Failed to load open jobs</Text>
        <Button onPress={refetch}>Retry</Button>
      </YStack>
    );
  }

  return (
    <FlashList
      contentContainerStyle={data && data.length === 0 ? { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 } : { padding: 16 }}
      data={data ?? []}
      keyExtractor={(item: any) => item.id}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      ListEmptyComponent={<Text>No open jobs right now.</Text>}
      estimatedItemSize={96}
      renderItem={({ item }: { item: any }) => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('JobDetails', { id: item.id })}
        >
          <Card
            padding="$4"
            borderRadius="$4"
            backgroundColor="$background"
            marginBottom="$3"
            borderWidth={1}
            borderColor="$gray4"
          >
            <YStack gap="$2">
              <Text variant="titleMedium">{item.title}</Text>
              <Text variant="bodyMedium" color="$gray10">{item.category}</Text>
              <Text variant="bodyMedium">{item.description}</Text>
              <Text variant="bodyMedium" fontWeight="600" marginTop="$2">
                {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(item.price ?? 0)}
              </Text>
            </YStack>
          </Card>
        </TouchableOpacity>
      )}
    />
  );
}
