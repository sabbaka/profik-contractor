import { Platform } from 'react-native';
import WebImpl from './OpenJobsMap.web';
import NativeImpl from './OpenJobsMap.native';

const OpenJobsMap = Platform.OS === 'web' ? WebImpl : NativeImpl;
export default OpenJobsMap;
