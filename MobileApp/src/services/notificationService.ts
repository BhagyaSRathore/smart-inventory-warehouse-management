import API from './api';
import apis from './endpoint';

export interface AppNotification {
  id: number;
  userId: number | null;
  type: string;
  title: string;
  message: string;
  severity: string;
  read: boolean;
  actionUrl?: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  message?: string;
  notifications: AppNotification[];
}

export interface UnreadCountResponse {
  count: number;
}

export const getNotifications = async (): Promise<AppNotification[]> => {
  const response = await API.get<NotificationsResponse | AppNotification[]>(
    apis.notifications,
  );
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return response.data?.notifications || [];
};

export const getNotificationById = async (
  id: number | string,
): Promise<AppNotification | null> => {
  try {
    const response = await API.get<{message?: string; notification: AppNotification}>(
      apis.notificationById(id),
    );
    return response.data?.notification || null;
  } catch (error) {
    console.log('[NotificationService] Failed to fetch notification by id:', error);
    return null;
  }
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const response = await API.get<UnreadCountResponse>(
    apis.unreadNotificationCount,
  );
  return typeof response.data?.count === 'number' ? response.data.count : 0;
};

export const markNotificationAsRead = async (
  id: number | string,
): Promise<any> => {
  const response = await API.patch(apis.markNotificationAsRead(id));
  return response.data;
};

export const markAllNotificationsAsRead = async (): Promise<any> => {
  const response = await API.patch(apis.markAllNotificationsAsRead);
  return response.data;
};

export const deleteNotification = async (
  id: number | string,
): Promise<any> => {
  const response = await API.delete(apis.deleteNotification(id));
  return response.data;
};

export const registerDeviceToken = async (token: string): Promise<any> => {
  const response = await API.post(apis.registerDeviceToken, { token });
  return response.data;
};

export const unregisterDeviceToken = async (): Promise<any> => {
  const response = await API.delete(apis.unregisterDeviceToken);
  return response.data;
};
