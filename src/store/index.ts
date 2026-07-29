import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { Platform } from 'react-native';
import { profikApi } from '../api/profikApi';
import authReducer from './authSlice';
import { nativeRtkListeners } from './rtkListeners';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [profikApi.reducerPath]: profikApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(profikApi.middleware),
});

// Required for refetchOnFocus / refetchOnReconnect to do anything. The default
// handler only works on web (it needs window.addEventListener), so native gets
// an AppState-based one. See ./rtkListeners.
setupListeners(
  store.dispatch,
  Platform.OS === 'web' ? undefined : nativeRtkListeners,
);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
