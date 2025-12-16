import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { YStack } from 'tamagui';
import { Button, Text, TextInput } from '@/components/ui/ui';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../../api/profikApi';
import { setToken } from '../../store/authSlice';

export type LoginScreenProps = {
  onGoToSignup?: () => void;
};

export default function LoginScreen({ onGoToSignup }: LoginScreenProps) {
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <YStack
        flex={1}
        gap="$1"
        padding="$4"
        justifyContent="center"
        backgroundColor="$background"
      >
        <StatusBar style="dark" />
        <YStack gap="$2" width="100%" maxWidth={420} alignSelf="center">
          <Text large style={{ color: '#000' }} marginBottom="$4">
            Contractor Login
          </Text>
          <YStack gap="$4">
            <TextInput
              placeholder="Phone"
              value={phone}
              onChangeText={setPhone}
              autoCapitalize="none"
              keyboardType="phone-pad"
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </YStack>
          <YStack gap="$2">
            <Button
              borderRadius="$10"
              backgroundColor="$blue10"
              pressStyle={{ opacity: 0.9, scale: 0.97 }}
              fontWeight="bold"
              onPress={onSubmit}
              disabled={isLoading}
              marginTop="$4"
              opacity={isLoading ? 0.7 : 1}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            <Button
              variant="outlined"
              marginTop="$2"
              onPress={() => {
                if (onGoToSignup) {
                  onGoToSignup();
                } else {
                  Alert.alert('Not implemented', 'Account creation is not available yet in this app.');
                }
              }}
            >
              Create account
            </Button>
          </YStack>
        </YStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}
