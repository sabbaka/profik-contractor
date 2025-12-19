import React from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { YStack } from 'tamagui';
import { Button, Text, TextInput } from '@/components/ui/ui';
import { useRequestSmsCodeMutation, useVerifySmsCodeMutation, profikApi } from '../../api/profikApi';
import { useDispatch } from 'react-redux';
import { setToken } from '../../store/authSlice';
import { router } from 'expo-router';

export type SignupScreenProps = {
  onGoToLogin?: () => void;
};

export default function SignupScreen({ onGoToLogin }: SignupScreenProps) {
  const dispatch = useDispatch();
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');

  const [requestSmsCode, { isLoading: requesting }] = useRequestSmsCodeMutation();
  const [verifySmsCode, { isLoading: verifying }] = useVerifySmsCodeMutation();
  const isLoading = requesting || verifying;

  const handleSignup = async () => {
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();
    const trimmedCode = code.trim();

    if (!trimmedPhone) {
      Alert.alert('Error', 'Phone is required');
      return;
    }

    try {
      if (!trimmedCode) {
        await requestSmsCode({ phone: trimmedPhone, purpose: 'register' }).unwrap();
        Alert.alert('Code sent', 'We sent an SMS code to your phone. Enter it and tap Sign Up again.');
        return;
      }

      const res = await verifySmsCode({
        phone: trimmedPhone,
        code: trimmedCode,
        email: trimmedEmail || undefined,
        password: trimmedPassword,
        name: trimmedName,
        role: 'contractor',
      }).unwrap();

      if (res?.token) {
        dispatch(setToken(res.token));
        // @ts-ignore util exists on api instance
        dispatch(profikApi.util.resetApiState());
        router.replace('/(contractor)/open' as any);
      }
    } catch (e: any) {
      const msg = e?.data?.message || 'Signup failed';
      Alert.alert('Error', msg);
    }
  };

  return (
    <YStack flex={1} gap={'$1'} padding="$4" justifyContent="center" backgroundColor="$background">
      <StatusBar style="dark" />
      <YStack gap="$2">
        <Text large style={{ color: '#000' }} marginBottom={'$4'}>
          Sign Up
        </Text>

        <YStack gap="$4">
          <TextInput placeholder="Phone" value={phone} onChangeText={setPhone} autoCapitalize="none" keyboardType="phone-pad" />
          <TextInput placeholder="Name" value={name} onChangeText={setName} autoCapitalize="words" />
          <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <TextInput
            placeholder="SMS code (enter after you receive it)"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
          />
        </YStack>

        <YStack gap="$2">
          <Button
            borderRadius="$10"
            backgroundColor="$red10"
            pressStyle={{ opacity: 0.9, scale: 0.97 }}
            fontWeight="bold"
            onPress={handleSignup}
            disabled={isLoading}
            marginTop="$4"
            opacity={isLoading ? 0.7 : 1}
          >
            {isLoading ? 'Signing up...' : 'Sign Up'}
          </Button>
          <Button
            variant="outlined"
            marginTop="$2"
            onPress={() => (onGoToLogin ? onGoToLogin() : router.push('/auth/login' as any))}
          >
            Already have an account? Login
          </Button>
        </YStack>
      </YStack>
    </YStack>
  );
}
