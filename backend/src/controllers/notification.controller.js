import { db } from "../db.ts";
import { sendPushNotification, isFirebaseReady } from "../services/fcmService.js";

const getVisibleNotifications = async (userId) => {
  try {
    const notifications = await db.orm.public.Notification.all();
    const numericUserId = Number(userId);

    return notifications.filter((notification) => {
      if (notification.userId == null) {
        return true;
      }

      return Number(notification.userId) === numericUserId;
    });
  }  catch (error) {
    console.error(
      "[Notifications] Failed to fetch notifications from database:",
      error
    );
    throw error;
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const notifications = await getVisibleNotifications(userId);

    res.json({
      message: "Notifications fetched successfully",
      notifications,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const notification = await db.orm.public.Notification.first({ id: Number(id) });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const isVisible = notification.userId == null || Number(notification.userId) === Number(userId);
    if (!isVisible) {
      return res.status(403).json({ message: "You cannot access this notification" });
    }

    res.json({
      message: "Notification fetched successfully",
      notification,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch notification" });
  }
};

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const notifications = await getVisibleNotifications(userId);
    const unreadCount = notifications.filter((notification) => !notification.read).length;

    res.json({ count: unreadCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch unread notification count" });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const notification = await db.orm.public.Notification.first({ id: Number(id) });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const isVisible = notification.userId == null || Number(notification.userId) === Number(userId);
    if (!isVisible) {
      return res.status(403).json({ message: "You cannot access this notification" });
    }

    const updated = await db.orm.public.Notification.where({ id: Number(id) }).update({ read: true });

    res.json({
      message: "Notification marked as read",
      notification: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const notifications = await getVisibleNotifications(userId);

    await Promise.all(
      notifications.filter((notification) => !notification.read).map((notification) =>
        db.orm.public.Notification.where({ id: notification.id }).update({ read: true })
      )
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const existing = await db.orm.public.Notification.first({ id: Number(id) });

    if (!existing) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const isVisible = existing.userId == null || Number(existing.userId) === Number(userId);
    if (!isVisible) {
      return res.status(403).json({ message: "You cannot delete this notification" });
    }

    await db.orm.public.Notification.where({ id: Number(id) }).delete();

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
};

export const createNotification = async ({
  userId = null,
  type = "SYSTEM_ALERT",
  title = "System alert",
  message = "",
  severity = "INFO",
  read = false,
  actionUrl = null,
}) => {
  return db.orm.public.Notification.create({
    userId,
    type,
    title,
    message,
    severity,
    read,
    actionUrl,
  });
};

export const registerDeviceToken = async (req, res) => {
  try {
    const userId = Number(req.user?.userId);
    const { token } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!token || typeof token !== "string" || !token.trim()) {
      return res.status(400).json({ message: "Valid device token is required" });
    }

    const cleanToken = token.trim();

    // Ensure the token is not duplicated across other users
    const allUsers = await db.orm.public.User.all();
    for (const otherUser of allUsers) {
      if (otherUser.id !== userId && otherUser.fcmToken === cleanToken) {
        await db.orm.public.User.where({ id: otherUser.id }).update({ fcmToken: null });
      }
    }

    // Associate token with current user
    await db.orm.public.User.where({ id: userId }).update({ fcmToken: cleanToken });

    res.json({
      message: "Device token registered successfully",
      firebaseReady: isFirebaseReady(),
    });
  } catch (error) {
    console.error("Failed to register device token:", error);
    res.status(500).json({ message: "Failed to register device token" });
  }
};

export const unregisterDeviceToken = async (req, res) => {
  try {
    const userId = Number(req.user?.userId);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    await db.orm.public.User.where({ id: userId }).update({ fcmToken: null });

    res.json({ message: "Device token unregistered successfully" });
  } catch (error) {
    console.error("Failed to unregister device token:", error);
    res.status(500).json({ message: "Failed to unregister device token" });
  }
};

export const testPushNotification = async (req, res) => {
  try {
    const userId = Number(req.user?.userId);
    const {
      title = "Smart Inventory Alert",
      message = "This is a test notification from Smart Inventory",
    } = req.body || {};

    const result = await sendPushNotification({
      title,
      body: message,
      userId,
      data: {
        route: "Notifications",
        filter: "inventory",
        type: "SYSTEM_ALERT",
        severity: "INFO",
      },
    });

    res.json({
      message: "Test push notification initiated",
      result,
    });
  } catch (error) {
    console.error("Failed to send test push notification:", error);
    res.status(500).json({ message: "Failed to send test push notification" });
  }
};
