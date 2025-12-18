import { User } from '@tamagui/lucide-icons';
import { Button, YStack } from 'tamagui';

interface ContractorProfileButtonProps {
  onPress: () => void;
}

export default function ContractorProfileButton({ onPress }: ContractorProfileButtonProps) {
  return (
    <Button unstyled onPress={onPress} pressStyle={{ opacity: 0.5 }}>
      <YStack
        width="$4"
        height="$4"
        borderRadius="$10"
        backgroundColor="$gray7"
        alignItems="center"
        justifyContent="center"
      >
        <User size="$2" color="black" />
      </YStack>
    </Button>
  );
}
