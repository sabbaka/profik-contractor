import { useMeQuery } from '@/src/api/profikApi';
import { Text } from '@/src/components/ui/ui';
import { useIsGuest } from '@/src/features/auth/hooks/useIsGuest';
import { resolveAvatarUrl } from '@/src/features/auth/utils';
import { useThemeColors } from '@/src/theme';
import { User } from '@tamagui/lucide-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet } from 'react-native';
import { YStack } from 'tamagui';

interface ContractorProfileButtonProps {
  onPress: () => void;
}

export default function ContractorProfileButton({ onPress }: ContractorProfileButtonProps) {
  const colors = useThemeColors();
  const isGuest = useIsGuest();
  const { data: user } = useMeQuery(undefined, { skip: isGuest });
  const initial = (user?.name?.[0] ?? 'P').toUpperCase();
  const avatarUrl = resolveAvatarUrl(user?.avatarUrl);
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      {!isGuest && avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: 44, height: 44, borderRadius: 9999, backgroundColor: colors.surfaceInput }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <YStack width={44} height={44} borderRadius={9999} overflow="hidden" alignItems="center" justifyContent="center">
          <LinearGradient colors={['#FF8A2B', '#E85D00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          {isGuest ? (
            <User size={20} color="#FFFFFF" position="relative" zIndex={1} />
          ) : (
            <Text position="relative" zIndex={1} style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 17, lineHeight: 21, textAlign: 'center' }}>{initial}</Text>
          )}
        </YStack>
      )}
    </Pressable>
  );
}
