import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, ActivityIndicator, Button, TextInput, Snackbar } from 'react-native-paper';
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
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading balance...</Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.center}>
        <Text variant="titleMedium">❌ Failed to load balance</Text>
        <Button onPress={refetch} loading={isFetching}>Retry</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="titleLarge">Your Balance</Text>
      <Text variant="headlineSmall" style={{ marginTop: 8 }}>
        {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(user.balance ?? 0)}
      </Text>
      <View style={{ width: '85%', marginTop: 24 }}>
        <TextInput
          label="Top-up amount (CZK)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          mode="outlined"
          style={{ marginBottom: 12 }}
        />
        <Button mode="contained" onPress={onTopup} loading={isCreating} disabled={isCreating}>
          Top Up
        </Button>
        <Text style={{ marginTop: 8, color: '#666' }}>
          You'll complete payment in a secure web view and return to the app automatically.
        </Text>
      </View>
      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
        {snackbarMsg}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});
