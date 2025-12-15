import { Image } from 'expo-image';
import { Platform } from 'react-native';
import { YStack } from 'tamagui';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { Text } from '@/components/ui/ui';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={{
            height: 178,
            width: 290,
            bottom: 0,
            left: 0,
            position: 'absolute',
          }}
        />
      }>
      <YStack flexDirection="row" alignItems="center" gap="$2">
        <Text type="title">Welcome!</Text>
        <HelloWave />
      </YStack>
      <YStack gap="$2" marginBottom="$2">
        <Text type="subtitle">Step 1: Try it</Text>
        <Text>
          Edit <Text type="defaultSemiBold">app/(tabs)/index.tsx</Text> to see changes.
          Press{' '}
          <Text type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </Text>{' '}
          to open developer tools.
        </Text>
      </YStack>
      <YStack gap="$2" marginBottom="$2">
        <Link href="/modal">
          <Link.Trigger>
            <Text type="subtitle">Step 2: Explore</Text>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <Text>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </Text>
      </YStack>
      <YStack gap="$2" marginBottom="$2">
        <Text type="subtitle">Step 3: Get a fresh start</Text>
        <Text>
          {`When you're ready, run `}
          <Text type="defaultSemiBold">npm run reset-project</Text> to get a fresh{' '}
          <Text type="defaultSemiBold">app</Text> directory. This will move the current{' '}
          <Text type="defaultSemiBold">app</Text> to{' '}
          <Text type="defaultSemiBold">app-example</Text>.
        </Text>
      </YStack>
    </ParallaxScrollView>
  );
}
