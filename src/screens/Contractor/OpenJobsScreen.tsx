import React from 'react';
import { View, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
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
      <View style={styles.center}> 
        <ActivityIndicator size="large" />
        <Text>Loading open jobs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text variant="titleMedium">❌ Failed to load open jobs</Text>
        <Button onPress={refetch}>Retry</Button>
      </View>
    );
  }

  return (
    <FlashList
      contentContainerStyle={data && data.length === 0 ? styles.center : styles.list}
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
          <View style={styles.card}>
            <Text variant="titleMedium">{item.title}</Text>
            <Text variant="bodyMedium" style={styles.muted}>{item.category}</Text>
            <Text variant="bodyMedium">{item.description}</Text>
            <Text variant="bodyMedium" style={styles.price}>
              {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(item.price ?? 0)}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  list: { padding: 16 },
  card: { padding: 16, borderRadius: 8, backgroundColor: '#fff', marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  muted: { color: '#666', marginBottom: 6 },
  price: { fontWeight: '600', marginTop: 8 },
});
