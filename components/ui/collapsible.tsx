import { PropsWithChildren, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { YStack } from 'tamagui';

import { Text } from '@/components/ui/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useColorScheme() ?? 'light';

  return (
    <YStack>
      <TouchableOpacity
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}>
        <YStack flexDirection="row" alignItems="center" gap="$2">
          <IconSymbol
            name="chevron.right"
            size={18}
            weight="medium"
            color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
            style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
          />
          <Text type="defaultSemiBold">{title}</Text>
        </YStack>
      </TouchableOpacity>
      {isOpen && <YStack marginTop="$2" marginLeft="$6">{children}</YStack>}
    </YStack>
  );
}
