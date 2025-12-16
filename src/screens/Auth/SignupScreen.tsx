import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { YStack } from 'tamagui';
import { Button, Text, TextInput } from '@/components/ui/ui';
import { useSignupMutation } from '../../api/profikApi';

export type SignupScreenProps = {
  onGoToLogin?: () => void;
};

export default function SignupScreen({ onGoToLogin }: SignupScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signup, { isLoading }] = useSignupMutation();

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation', 'Please enter email and password.');
      return;
    }

    try {
      await signup({ email: email.trim(), password: password.trim(), role: 'contractor' }).unwrap();
      Alert.alert('Success', 'Account created. You can now log in.', [
        {
          text: 'OK',
          onPress: () => {
            if (onGoToLogin) {
              onGoToLogin();
            }
          },
        },
      ]);
    } catch (e: any) {
      const msg = e?.data?.message || 'Signup failed';
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
            Contractor Sign Up
          </Text>
          <YStack gap="$4">
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
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
              {isLoading ? 'Signing up...' : 'Sign Up'}
            </Button>
            <Button
              variant="outlined"
              marginTop="$2"
              onPress={onGoToLogin}
            >
              Already have an account? Login
            </Button>
          </YStack>
        </YStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}
