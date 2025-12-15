import { Text } from '@/components/ui/ui';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming 
} from 'react-native-reanimated';

const AnimatedText = Animated.createAnimatedComponent(Text);

export function HelloWave() {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: withRepeat(
          withSequence(
            withTiming('0deg', { duration: 150 }),
            withTiming('25deg', { duration: 150 }),
            withTiming('0deg', { duration: 150 }),
            withTiming('25deg', { duration: 150 }),
            withTiming('0deg', { duration: 150 }),
            withTiming('0deg', { duration: 2000 })
          ),
          -1
        ),
      },
    ],
  }));

  return (
    <AnimatedText
      fontSize={28}
      lineHeight={32}
      marginTop={-6}
      style={animatedStyle}>
      👋
    </AnimatedText>
  );
}
