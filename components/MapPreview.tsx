import { Platform } from 'react-native';
import Web from './MapPreview.web';
import Native from './MapPreview.native';
export default Platform.OS === 'web' ? Web : Native;
