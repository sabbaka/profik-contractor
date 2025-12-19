import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { YStack } from 'tamagui';
import { FormInput } from '@/components/form';
import { Button, Text } from '@/components/ui/ui';
import { useDispatch } from 'react-redux';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useLoginMutation } from '../../api/profikApi';
import { setToken } from '../../store/authSlice';

export type LoginScreenProps = {
  onGoToSignup?: () => void;
};

const loginSchema = z.object({
  phone: z.string().min(6, 'Phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen({ onGoToSignup }: LoginScreenProps) {
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const {
    control,
    formState: { errors },
  } = form;

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const res = await login({ phone: data.phone.trim(), password: data.password.trim() }).unwrap();
      if (res?.token) {
        dispatch(setToken(res.token));
        router.replace('/(contractor)/open' as any);
      }
    } catch (e: any) {
      const msg = e?.data?.message || 'Login failed';
      Alert.alert('Error', msg);
    }
  };

  return (
    <YStack flex={1} gap={'$1'} padding="$4" justifyContent="center" backgroundColor="$background">
      <StatusBar style="dark" />
      <YStack gap="$2">
        <Text large style={{ color: '#000' }} marginBottom={'$4'}>
          Login
        </Text>
        <YStack gap="$4">
          <FormInput
            flex={0}
            name="phone"
            control={control}
            placeholder="Phone"
            autoCapitalize="none"
            keyboardType="phone-pad"
            error={errors.phone?.message}
          />

          <FormInput
            flex={0}
            name="password"
            control={control}
            placeholder="Password"
            secureTextEntry
            error={errors.password?.message}
          />
        </YStack>

        <YStack gap="$2">
          <Button
            borderRadius="$10"
            backgroundColor="$red10"
            pressStyle={{ opacity: 0.9, scale: 0.97 }}
            fontWeight="bold"
            onPress={form.handleSubmit(onSubmit)}
            disabled={isLoading}
            marginTop="$4"
            opacity={isLoading ? 0.7 : 1}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
          <Button variant="outlined" onPress={() => (onGoToSignup ? onGoToSignup() : router.push('/auth/signup' as any))} marginTop="$2">
            Create account
          </Button>
        </YStack>
      </YStack>
    </YStack>
  );
}
