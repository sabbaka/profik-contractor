import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, Button, TextInput, ActivityIndicator } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../../api/profikApi';
import { setToken } from '../../store/authSlice';

export default function LoginScreen() {
  const dispatch = useDispatch();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();

  const onSubmit = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Validation', 'Please enter phone and password.');
      return;
    }
    try {
      const res = await login({ phone: phone.trim(), password: password.trim() }).unwrap();
      if (res?.token) {
        dispatch(setToken(res.token));
      }
    } catch (e: any) {
      const msg = e?.data?.message || 'Login failed';
      Alert.alert('Error', msg);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text variant="headlineSmall" style={{ marginBottom: 12 }}>Contractor Login</Text>
        <TextInput
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          autoCapitalize="none"
          keyboardType="phone-pad"
          style={{ marginBottom: 8 }}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ marginBottom: 12 }}
        />
        <Button mode="contained" onPress={onSubmit} disabled={isLoading}>
          {isLoading ? <ActivityIndicator animating color="#fff" /> : 'Login'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  card: { width: '100%', maxWidth: 420 },
});
