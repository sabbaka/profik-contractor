import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { YStack } from 'tamagui';
import { FormInput } from '@/components/form';
import { Button, Text } from '@/components/ui/ui';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useSignupMutation } from '../../api/profikApi';

export type SignupScreenProps = {
  onGoToLogin?: () => void;
};

const signupSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupScreen({ onGoToLogin }: SignupScreenProps) {
  const [signup, { isLoading }] = useSignupMutation();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const {
    control,
    formState: { errors },
  } = form;

  const onSubmit = async (data: SignupFormValues) => {
    try {
      await signup({ email: data.email.trim(), password: data.password.trim(), role: 'contractor' }).unwrap();
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
    <YStack flex={1} gap={'$1'} padding="$4" justifyContent="center" backgroundColor="$background">
      <StatusBar style="dark" />
      <YStack gap="$2">
        <Text large style={{ color: '#000' }} marginBottom={'$4'}>
          Sign Up
        </Text>

        <YStack gap="$4">
          <FormInput
            flex={0}
            name="email"
            control={control}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            error={errors.email?.message}
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
            {isLoading ? 'Signing up...' : 'Sign Up'}
          </Button>
          <Button variant="outlined" marginTop="$2" onPress={onGoToLogin}>
            Already have an account? Login
          </Button>
        </YStack>
      </YStack>
    </YStack>
  );
}
