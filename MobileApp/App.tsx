import React, {useEffect, useState} from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  requestNotificationPermission,
  getFCMToken,
  setupForegroundNotificationListener,
  setupNotificationOpenedListener,
  syncFCMTokenWithBackend,
} from './src/services/pushNotificationService';
import {navigateToNotification} from './src/navigation/navigationRef';
import InAppNotificationBanner, {
  InAppNotificationData,
} from './src/components/notifications/InAppNotificationBanner';
import CustomAlert from './src/components/CustomAlert';

import AppNavigator from './src/navigation/AppNavigator';
import {store, persistor} from './src/store/store';
import {DrawerProvider} from './src/context/DrawerContext';
import {ThemeProvider, useAppTheme} from './src/context/ThemeContext';

const AppContent = () => {
  const {theme, isDark} = useAppTheme();
  const [foregroundNotification, setForegroundNotification] =
    useState<InAppNotificationData | null>(null);
  const [customAlertConfig, setCustomAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    data?: any;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  useEffect(() => {
    let unsubscribeForeground: (() => void) | undefined;
    let unsubscribeOpened: (() => void) | undefined;
    let isMounted = true;

   const initializePushNotifications = async () => {
  try {
    console.log('[FCM DEBUG] Initialization started');

    const permissionGranted = await requestNotificationPermission();
    console.log('[FCM DEBUG] Permission result:', permissionGranted);

    const token = await getFCMToken();
    console.log('[FCM DEBUG] Token result:', token);

    if (token && isMounted) {
      console.log('[FCM DEBUG] ACTUAL FCM TOKEN:', token);
      await syncFCMTokenWithBackend(token);
    }

    if (!isMounted) {
      return;
    }

    unsubscribeForeground = setupForegroundNotificationListener(
      remoteMessage => {
        if (!isMounted) return;

        const title =
          remoteMessage.notification?.title ||
          remoteMessage.data?.title ||
          'Smart Inventory Alert';

        const body =
          remoteMessage.notification?.body ||
          remoteMessage.data?.body ||
          remoteMessage.data?.message ||
          '';

        setForegroundNotification({
          title: String(title),
          body: String(body),
          data: remoteMessage.data,
        });
      },
    );

    unsubscribeOpened = setupNotificationOpenedListener();
  } catch (error) {
    console.error('[FCM DEBUG] Initialization error:', error);
  }
};

    initializePushNotifications();

    return () => {
      isMounted = false;
      unsubscribeForeground?.();
      unsubscribeOpened?.();
    };
  }, []);

  return (
    <DrawerProvider>
      <SafeAreaView
        style={[styles.safeArea, {backgroundColor: theme.bg}]}>
        <StatusBar
          hidden={false}
          barStyle={isDark ? 'light-content' : 'dark-content'}
        />

        {/* Foreground In-App Notification Banner */}
        <InAppNotificationBanner
          notification={foregroundNotification}
          onDismiss={() => setForegroundNotification(null)}
          onPress={data => {
            if (data) {
              navigateToNotification(data);
            }
          }}
        />

        {/* Global Custom Alert Dialog */}
        <CustomAlert
          visible={customAlertConfig.visible}
          type={customAlertConfig.type}
          title={customAlertConfig.title}
          message={customAlertConfig.message}
          buttonText="View Details"
          secondaryButtonText="Dismiss"
          onPress={() => {
            const data = customAlertConfig.data;
            setCustomAlertConfig(prev => ({...prev, visible: false}));
            if (data) {
              navigateToNotification(data);
            }
          }}
          onSecondaryPress={() => {
            setCustomAlertConfig(prev => ({...prev, visible: false}));
          }}
        />

        <View style={[styles.rootContainer, {backgroundColor: theme.bg}]}>
          <AppNavigator />
        </View>
      </SafeAreaView>
    </DrawerProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  rootContainer: {
    flex: 1,
  },
});

const App = () => {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
};

export default App;
