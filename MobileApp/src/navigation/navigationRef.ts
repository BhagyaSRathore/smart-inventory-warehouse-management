import {createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export interface NotificationNavPayload {
  route?: string;
  filter?: string;
  productId?: string | number;
  warehouseId?: string | number;
  alertId?: string | number;
  notificationId?: string | number;
  type?: string;
  severity?: string;
  [key: string]: any;
}

let pendingNotificationNav: NotificationNavPayload | null = null;

export function setPendingNotificationNav(
  payload: NotificationNavPayload | null,
) {
  pendingNotificationNav = payload;
}

export function getPendingNotificationNav(): NotificationNavPayload | null {
  return pendingNotificationNav;
}

export function clearPendingNotificationNav() {
  pendingNotificationNav = null;
}

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    try {
      navigationRef.navigate(name, params);
    } catch (e) {
      console.warn('[NavigationRef] Navigate error:', e);
    }
  } else {
    console.log('[NavigationRef] Container not ready yet. Queuing:', name, params);
  }
}

/**
 * Handle notification tap routing with fallback queue if navigation is not ready.
 */
export function navigateToNotification(payload: NotificationNavPayload) {
  if (!payload) return;

  const type = String(payload.type || '').toUpperCase();
  const isInventory =
    type === 'LOW_STOCK' ||
    type === 'OUT_OF_STOCK' ||
    type === 'INVENTORY_UPDATE' ||
    payload.filter === 'inventory';

  const isOrder =
    type === 'ORDER_CREATED' ||
    type === 'ORDER_STATUS' ||
    payload.filter === 'orders';

  const defaultFilter = isInventory ? 'inventory' : isOrder ? 'orders' : 'all';

  const targetRoute =
    payload.route || (isInventory ? 'RestockAlerts' : 'Notifications');
  const targetParams = {
    route: targetRoute,
    filter: payload.filter || defaultFilter,
    productId: payload.productId,
    warehouseId: payload.warehouseId,
    alertId: payload.alertId || payload.notificationId,
    notificationId: payload.notificationId,
    type: payload.type,
    severity: payload.severity,
    title: payload.title,
    message: payload.message || payload.body,
    productName: payload.productName,
    warehouseName: payload.warehouseName,
    currentQuantity: payload.currentQuantity,
    threshold: payload.threshold,
    reorderLevel: payload.reorderLevel,
    safetyStock: payload.safetyStock,
    actionUrl: payload.actionUrl,
  };

  if (navigationRef.isReady()) {
    try {
      // First attempt to navigate via parent Dashboard stack
      navigationRef.navigate('Dashboard', {
        screen: targetRoute,
        params: targetParams,
      });
      clearPendingNotificationNav();
      console.log(
        '[NavigationRef] Navigated to notification screen via Dashboard:',
        targetRoute,
        targetParams,
      );
      return;
    } catch {
      try {
        navigationRef.navigate(targetRoute, targetParams);
        clearPendingNotificationNav();
        console.log(
          '[NavigationRef] Navigated directly to notification route:',
          targetRoute,
          targetParams,
        );
        return;
      } catch (err) {
        console.warn(
          '[NavigationRef] Could not navigate directly to notification, queuing payload:',
          err,
        );
      }
    }
  }

  // If container not ready or user still on splash/login, store payload
  console.log(
    '[NavigationRef] NavigationContainer not ready. Storing pending notification payload:',
    targetParams,
  );
  setPendingNotificationNav(targetParams);
}

/**
 * Flush any queued notification navigation once navigation container or Dashboard mounts.
 */
export function flushPendingNotification() {
  const pending = getPendingNotificationNav();
  if (pending && navigationRef.isReady()) {
    console.log(
      '[NavigationRef] Flushing pending notification navigation:',
      pending,
    );
    navigateToNotification(pending);
  }
}
