import { useThemeColors } from '@/src/theme';
import { User } from '@tamagui/lucide-icons';
import { Button, YStack } from 'tamagui';

interface ContractorProfileButtonProps {
  onPress: () => void;
}

export default function ContractorProfileButton({ onPress }: ContractorProfileButtonProps) {
  const colors = useThemeColors();
  return (
    <Button unstyled onPress={onPress} pressStyle={{ opacity: 0.5 }}>
      <YStack
        width="$4"
        height="$4"
        borderRadius="$10"
        backgroundColor={colors.accent}
        alignItems="center"
        justifyContent="center"
      >
        <User size="$2" color={colors.textInverse} />
      </YStack>
    </Button>
  );
}
