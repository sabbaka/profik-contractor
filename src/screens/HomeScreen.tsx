import React from 'react';
import { YStack } from 'tamagui';
import { Text, Button, ActivityIndicator } from '@/components/ui/ui';
import { useMeQuery } from '../api/profikApi';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ContractorStackParamList } from '../navigation/ContractorNavigator';

export default function HomeScreen() {
  const { data: user, isLoading, error, refetch } = useMeQuery();
  const dispatch = useDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<ContractorStackParamList>>();

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color="$gray10" />
        <Text marginTop="$3">Loading user info...</Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Text variant="titleMedium" marginBottom="$3">❌ Failed to load profile</Text>
        <Button onPress={refetch}>Retry</Button>
      </YStack>
    );
  }

  return (
    <YStack flex={1} padding="$5" justifyContent="center">
      <Text variant="titleLarge">Welcome, {user?.email} 👋</Text>
      <Text variant="bodyMedium" marginTop="$2">Role: {user?.role}</Text>
      {user?.role === 'contractor' && (
        <>
          <Button variant="contained" marginTop="$4" onPress={() => navigation.navigate('OpenJobs')}>
            Open Jobs
          </Button>
          <Button variant="contained" marginTop="$4" onPress={() => navigation.navigate('Balance')}>
            Balance
          </Button>
        </>
      )}
      <Button variant="contained" onPress={() => dispatch(logout())} marginTop="$5">
        Logout
      </Button>
    </YStack>
  );
}
