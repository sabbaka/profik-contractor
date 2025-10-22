import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
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
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading user info...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text variant="titleMedium">❌ Failed to load profile</Text>
        <Button onPress={refetch}>Retry</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="titleLarge">Welcome, {user?.email} 👋</Text>
      <Text variant="bodyMedium">Role: {user?.role}</Text>
      {user?.role === 'contractor' && (
        <>
          <Button mode="contained" style={{ marginTop: 16 }} onPress={() => navigation.navigate('OpenJobs')}>
            Open Jobs
          </Button>
          <Button mode="contained" style={{ marginTop: 16 }} onPress={() => navigation.navigate('Balance')}>
            Balance
          </Button>
        </>
      )}
      <Button mode="contained" onPress={() => dispatch(logout())} style={{ marginTop: 20 }}>
        Logout
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
