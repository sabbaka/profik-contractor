import { Platform } from 'react-native';

// Bridge file so TypeScript can resolve the module without platform suffixes
// and React Native / Expo can still pick the right implementation at runtime.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Impl = Platform.OS === 'web'
  ? require('./MapPreview.web').default
  : require('./MapPreview.native').default;

export default Impl;
