const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const PHOTO_LIBRARY_PERMISSION =
  'Profik Contractor uses your photo library so you can choose an existing photo to upload as your profile avatar. For example, when you tap Change avatar on your Profile screen, you can pick a picture from your library.';
const LOCATION_WHEN_IN_USE_PERMISSION =
  'Profik Contractor uses your location while you are using the app to show open cleaning jobs near you on the map and how far each job is from your current position. For example, on the Open Jobs map you can see your own location relative to the jobs you can send offers for.';

const config = {
  name: 'profik-contractor',
  slug: 'profik-contractor',
  version: '1.0.12',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'profikcontractor',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    bundleIdentifier: 'com.profik.contractor',
    buildNumber: '13',
    supportsTablet: false,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSPhotoLibraryUsageDescription: PHOTO_LIBRARY_PERMISSION,
      NSLocationWhenInUseUsageDescription: LOCATION_WHEN_IN_USE_PERMISSION,
    },
  },
  android: {
    package: 'com.profik.contractor',
    versionCode: 13,
    adaptiveIcon: {
      backgroundColor: '#E85D00',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    config: {
      googleMaps: {
        apiKey: GOOGLE_MAPS_API_KEY,
      },
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#EE6C00',
        dark: { backgroundColor: '#EE6C00' },
      },
    ],
    'expo-font',
    'expo-web-browser',
    'expo-secure-store',
    'expo-image',
    'expo-localization',
    'expo-status-bar',
    [
      'expo-image-picker',
      {
        photosPermission: PHOTO_LIBRARY_PERMISSION,
        cameraPermission: false,
        microphonePermission: false,
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: false,
        locationAlwaysPermission: false,
        locationWhenInUsePermission: LOCATION_WHEN_IN_USE_PERMISSION,
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#ffffff',
        iosDisplayInForeground: true,
      },
    ],
    [
      '@sentry/react-native/expo',
      {
        // Must match the org/project slugs created at sentry.io. Sourcemap
        // upload only runs on builds where SENTRY_AUTH_TOKEN is set.
        organization: 'profik',
        project: 'profik-contractor',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    // Off deliberately: Tamagui distributes the active theme by subscription
    // rather than context, and the compiler's automatic memoization froze
    // leaf nodes with stale colours when the user switched appearance (same
    // bug class as the missing <Theme name={mode}> wrapper in app/_layout.tsx
    // — see .claude/rules/components.md). The sibling client app hit this
    // first and turned it off; mirroring that here.
    reactCompiler: false,
  },
  extra: {
    router: {},
    eas: {
      projectId: '40e934e5-f375-4c9d-a65d-de5f48d4ae49',
    },
  },
  owner: 'sabbaka',
};

export default config;
