import { db } from "../db.ts";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await db.orm.public.Notification.all();

    res.json({
      message: "Notifications fetched successfully",
      notifications,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const notifications = await db.orm.public.Notification.all();
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
    const notification = await db.orm.public.Notification.first({ id: Number(id) });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
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
    const notifications = await db.orm.public.Notification.all();

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
    const existing = await db.orm.public.Notification.first({ id: Number(id) });

    if (!existing) {
      return res.status(404).json({ message: "Notification not found" });
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
