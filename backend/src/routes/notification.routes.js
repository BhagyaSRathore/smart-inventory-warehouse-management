import express from "express";
import {
  deleteNotification,
  getNotifications,
  getNotificationById,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  registerDeviceToken,
  unregisterDeviceToken,
  testPushNotification,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Static routes first
router.get("/unread-count", authenticate, getUnreadNotificationCount);
router.patch("/read-all", authenticate, markAllNotificationsAsRead);

// FCM Device Token Registration endpoints (Must be declared before /:id)
router.post("/register-token", authenticate, registerDeviceToken);
router.delete("/register-token", authenticate, unregisterDeviceToken);

// Test push notification endpoint
router.post("/test-push", authenticate, testPushNotification);

// Parameterized and root routes
router.get("/", authenticate, getNotifications);
router.get("/:id", authenticate, getNotificationById);
router.patch("/:id/read", authenticate, markNotificationAsRead);
router.delete("/:id", authenticate, deleteNotification);

export default router;
