import { Link } from 'expo-router';
import { YStack } from 'tamagui';

import { Text } from '@/components/ui/ui';

export default function ModalScreen() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$5">
      <Text type="title">This is a modal</Text>
      <Link href="/" dismissTo style={{ marginTop: 15, paddingVertical: 15 }}>
        <Text type="link">Go to home screen</Text>
      </Link>
    </YStack>
  );
}
