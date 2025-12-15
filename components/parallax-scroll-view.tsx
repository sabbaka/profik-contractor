import type { PropsWithChildren, ReactElement } from 'react';
import { YStack } from 'tamagui';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
        },
      ],
    };
  });

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={{ backgroundColor: colorScheme === 'dark' ? '#151718' : '#fff', flex: 1 }}
      scrollEventThrottle={16}>
      <Animated.View
        style={[
          {
            height: HEADER_HEIGHT,
            overflow: 'hidden',
            backgroundColor: headerBackgroundColor[colorScheme],
          },
          headerAnimatedStyle,
        ]}>
        {headerImage}
      </Animated.View>
      <YStack flex={1} padding="$8" gap="$4" overflow="hidden">{children}</YStack>
    </Animated.ScrollView>
  );
}
