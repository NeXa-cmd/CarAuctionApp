import { Platform } from 'react-native';

export const API_URL = 'http://157.230.124.2:5001/api';
export const SOCKET_URL = 'http://157.230.124.2:5001';

export const CONFIG = {
  API_URL,
  SOCKET_URL,
  // For iOS simulator, use localhost
  // For Android emulator, use 10.0.2.2
  // For physical device, use your machine's IP address
  getBaseUrl: () => 'http://157.230.124.2:5001',
};
