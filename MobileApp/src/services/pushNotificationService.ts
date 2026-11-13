import {
  getMessaging,
  getToken,
  requestPermission,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  onTokenRefresh,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import type {RemoteMessage} from '@react-native-firebase/messaging';
import {PermissionsAndroid, Platform} from 'react-native';
import {store} from '../store/store';
import {registerDeviceToken} from './notificationService';
import {navigateToNotification} from '../navigation/navigationRef';

type MessagingModule = ReturnType<typeof getMessaging>;

/**
 * Safely obtain the Firebase Messaging instance without crashing at module load time.
 */
let cachedMessaging: MessagingModule | null = null;

export const getMessagingInstance = (): MessagingModule | null => {
  if (cachedMessaging) {
    return cachedMessaging;
  }
  try {
    cachedMessaging = getMessaging();
    return cachedMessaging;
  } catch (error) {
    console.warn(
      '[PushNotificationService] Firebase Messaging is not initialized or unavailable:',
      error,
    );
    return null;
  }
};

/**
 * Request notification permission safely.
 * Handles Android 13+ (POST_NOTIFICATIONS) and Firebase authorization status.
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );

        if (!hasPermission) {
          const permissionResult = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );

          if (permissionResult !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log(
              '[PushNotificationService] POST_NOTIFICATIONS permission denied by user.',
            );
            return false;
          }
        }
      }
    }

    const messaging = getMessagingInstance();
    if (!messaging) {
      console.warn(
        '[PushNotificationService] Messaging instance unavailable for permission request.',
      );
      return false;
    }

    const status = await requestPermission(messaging);
    const isGranted =
      status === AuthorizationStatus.AUTHORIZED ||
      status === AuthorizationStatus.PROVISIONAL;

    console.log(
      '[PushNotificationService] Authorization status:',
      status,
      'Granted:',
      isGranted,
    );
    return isGranted;
  } catch (error) {
    console.error(
      '[PushNotificationService] Notification permission error:',
      error,
    );
    return false;
  }
};

/**
 * Retrieve the FCM Device Registration Token.
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const messaging = getMessagingInstance();
    if (!messaging) {
      console.warn(
        '[PushNotificationService] Messaging instance unavailable for FCM token retrieval.',
      );
      return null;
    }

    const token = await getToken(messaging);
    if (token) {
      console.log(
        '[PushNotificationService] FCM Token obtained successfully:',
        token,
      );
    } else {
      console.warn('[PushNotificationService] FCM Token is empty.');
    }
    return token;
  } catch (error) {
    console.error(
      '[PushNotificationService] Failed to retrieve FCM token:',
      error,
    );
    return null;
  }
};

/**
 * Register FCM device token with the backend for the currently authenticated user.
 */
export const syncFCMTokenWithBackend = async (
  providedToken?: string,
): Promise<boolean> => {
  try {
    const token = providedToken || (await getFCMToken());
    if (!token) {
      console.log('[PushNotificationService] No FCM token available to sync.');
      return false;
    }

    const state = store.getState();
    const authToken = state.auth?.token;
    if (!authToken) {
      console.log(
        '[PushNotificationService] User not logged in yet. Device token registration postponed.',
      );
      return false;
    }

    await registerDeviceToken(token);
    console.log(
      '[PushNotificationService] Device token registered with backend successfully.',
    );
    return true;
  } catch (error: any) {
    console.warn(
      '[PushNotificationService] Failed to sync FCM token with backend:',
      error?.response?.data?.message || error?.message || error,
    );
    return false;
  }
};

/**
 * Register foreground message listener.
 * Calls onForegroundMessage callback when an in-app message arrives.
 * Returns an unsubscribe cleanup function.
 */
export const setupForegroundNotificationListener = (
  onForegroundMessage?: (message: RemoteMessage) => void,
): (() => void) => {
  try {
    const messaging = getMessagingInstance();
    if (!messaging) {
      return () => {};
    }

    return onMessage(messaging, async remoteMessage => {
      try {
        console.log(
          '[PushNotificationService] Foreground push notification received:',
          remoteMessage,
        );
        if (onForegroundMessage) {
          onForegroundMessage(remoteMessage);
        }
      } catch (err) {
        console.error(
          '[PushNotificationService] Error in foreground message handler:',
          err,
        );
      }
    });
  } catch (error) {
    console.error(
      '[PushNotificationService] Failed to register foreground notification listener:',
      error,
    );
    return () => {};
  }
};

/**
 * Register notification opened listener for background and terminated states.
 * Automatically navigates to the target notification screen with payload.
 * Returns an unsubscribe cleanup function.
 */
export const setupNotificationOpenedListener = (): (() => void) => {
  try {
    const messaging = getMessagingInstance();
    if (!messaging) {
      return () => {};
    }

    // Check if the app was opened from a quit state via a notification
    getInitialNotification(messaging)
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            '[PushNotificationService] Notification caused app to open from quit state:',
            remoteMessage,
          );
          if (remoteMessage.data) {
            navigateToNotification(remoteMessage.data);
          }
        }
      })
      .catch(err => {
        console.warn(
          '[PushNotificationService] Error checking getInitialNotification:',
          err,
        );
      });

    // Handle background notification clicks
    const unsubscribeOpened = onNotificationOpenedApp(messaging, remoteMessage => {
      try {
        console.log(
          '[PushNotificationService] Notification opened from background:',
          remoteMessage,
        );
        if (remoteMessage.data) {
          navigateToNotification(remoteMessage.data);
        }
      } catch (err) {
        console.error(
          '[PushNotificationService] Error in notification opened handler:',
          err,
        );
      }
    });

    // Handle token refresh
    const unsubscribeRefresh = onTokenRefresh(messaging, async newToken => {
      console.log('[PushNotificationService] FCM token refreshed.');
      await syncFCMTokenWithBackend(newToken);
    });

    return () => {
      unsubscribeOpened();
      unsubscribeRefresh();
    };
  } catch (error) {
    console.error(
      '[PushNotificationService] Failed to register notification opened listener:',
      error,
    );
    return () => {};
  }
};
