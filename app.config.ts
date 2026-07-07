const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const LOCATION_WHEN_IN_USE_PERMISSION =
  'Profik Contractor uses your location while you are using the app to show open cleaning jobs near you on the map and how far each job is from your current position. For example, on the Open Jobs map you can see your own location relative to the jobs you can send offers for.';

const config = {
  name: 'profik-contractor',
  slug: 'profik-contractor',
  version: '1.0.4',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'profikcontractor',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    bundleIdentifier: 'com.profik.contractor',
    buildNumber: '3',
    supportsTablet: false,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription: LOCATION_WHEN_IN_USE_PERMISSION,
    },
  },
  android: {
    package: 'com.profik.contractor',
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
    reactCompiler: true,
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
