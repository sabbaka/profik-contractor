import React, { useState } from 'react';
import { Alert } from 'react-native';
import { YStack } from 'tamagui';
import { Text, ActivityIndicator, Button, TextInput, Snackbar } from '@/components/ui/ui';
import { useMeQuery, useTopupBalanceMutation } from '../../src/api/profikApi';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

export default function BalanceRoute() {
  const { data: user, isLoading, error, refetch, isFetching } = useMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });
  const [amount, setAmount] = useState('');
  const [topup, { isLoading: isCreating }] = useTopupBalanceMutation();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  const onTopup = async () => {
    const value = Number(amount);
    if (!amount.trim() || isNaN(value) || value <= 0) {
      Alert.alert('Validation', 'Please enter a positive amount.');
      return;
    }
    try {
      const returnUrl = AuthSession.makeRedirectUri({ scheme: 'profik' });
      WebBrowser.maybeCompleteAuthSession();
      const res = await topup({ amount: value, returnUrl }).unwrap();
      const result = await WebBrowser.openAuthSessionAsync(res.url, returnUrl);
      if (result.type === 'success' || result.type === 'dismiss' || result.type === 'cancel') {
        const startBalance = user?.balance ?? 0;
        let updated = false;
        for (let i = 0; i < 5; i++) {
          const r = await refetch();
          const newBal = r.data?.balance ?? startBalance;
          if (newBal > startBalance) {
            updated = true;
            setSnackbarMsg(`Balance updated: ${new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(newBal)}`);
            setSnackbarVisible(true);
            break;
          }
          await new Promise((res) => setTimeout(res, 2000));
        }
        if (!updated) {
          await refetch();
        }
      }
    } catch (e: any) {
      const msg = e?.data?.message || 'Failed to start top-up session';
      Alert.alert('Error', msg);
    }
  };

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <ActivityIndicator size="large" color="$gray10" />
        <Text marginTop="$3">Loading balance...</Text>
      </YStack>
    );
  }

  if (error || !user) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Text variant="titleMedium" marginBottom="$3">❌ Failed to load balance</Text>
        <Button onPress={refetch} disabled={isFetching} opacity={isFetching ? 0.7 : 1}>
          {isFetching ? 'Loading...' : 'Retry'}
        </Button>
      </YStack>
    );
  }

  return (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
      <Text variant="titleLarge">Your Balance</Text>
      <Text variant="headlineSmall" marginTop="$2">
        {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(user.balance ?? 0)}
      </Text>
      <YStack width="85%" marginTop="$6" gap="$3">
        <TextInput
          placeholder="Top-up amount (CZK)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <Button variant="contained" onPress={onTopup} disabled={isCreating} opacity={isCreating ? 0.7 : 1}>
          {isCreating ? 'Processing...' : 'Top Up'}
        </Button>
        <Text fontSize={14} color="$gray10" marginTop="$2">
          You'll complete payment in a secure web view and return to the app automatically.
        </Text>
      </YStack>
      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
        {snackbarMsg}
      </Snackbar>
    </YStack>
  );
}
