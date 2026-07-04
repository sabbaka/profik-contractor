import { useRegisterPushTokenMutation } from '@/src/api/profikApi';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

const PROJECT_ID = '40e934e5-f375-4c9d-a65d-de5f48d4ae49';

// Show notifications in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications(enabled: boolean) {
  const [registerPushToken] = useRegisterPushTokenMutation();
  const registered = useRef(false);

  useEffect(() => {
    if (!enabled || registered.current) return;

    async function register() {
      if (!Device.isDevice) return;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: PROJECT_ID,
      });

      await registerPushToken(token.data);
      registered.current = true;
    }

    register().catch(() => undefined);
  }, [enabled, registerPushToken]);

  useEffect(() => {
    if (!enabled) return;

    const subscription = Notifications.addNotificationResponseReceivedListener((_response) => {
      // Future: navigate to the relevant screen based on response.notification.request.content.data
    });

    return () => subscription.remove();
  }, [enabled]);
}
