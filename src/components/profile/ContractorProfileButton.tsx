import { useMeQuery } from '@/src/api/profikApi';
import { Text } from '@/src/components/ui/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet } from 'react-native';
import { YStack } from 'tamagui';

interface ContractorProfileButtonProps {
  onPress: () => void;
}

export default function ContractorProfileButton({ onPress }: ContractorProfileButtonProps) {
  const { data: user } = useMeQuery();
  const initial = (user?.name?.[0] ?? 'P').toUpperCase();
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <YStack width={44} height={44} borderRadius={9999} overflow="hidden" alignItems="center" justifyContent="center">
        <LinearGradient colors={['#FF8A2B', '#E85D00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <Text position="relative" zIndex={1} style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 17 }}>{initial}</Text>
      </YStack>
    </Pressable>
  );
}
