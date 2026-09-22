import express from "express";
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/unread-count", authenticate, getUnreadNotificationCount);
router.get("/", authenticate, getNotifications);
router.patch("/read-all", authenticate, markAllNotificationsAsRead);
router.patch("/:id/read", authenticate, markNotificationAsRead);
router.delete("/:id", authenticate, deleteNotification);

export default router;
