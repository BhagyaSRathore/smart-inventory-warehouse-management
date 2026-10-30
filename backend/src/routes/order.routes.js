import express from "express";
import {
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  deleteOrder,
} from "../controllers/order.controller.js";
import { authenticate, requireRole, ROLES } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate, requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER));

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrder);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);

export default router;