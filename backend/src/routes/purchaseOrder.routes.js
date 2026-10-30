import express from "express";
import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  updateStatus,
  receivePurchaseOrder,
} from "../controllers/purchaseOrder.controller.js";
import { authenticate, requireRole, ROLES } from "../middleware/auth.middleware.js";

const router = express.Router();

// Protect all Purchase Order routes with authentication and RBAC
router.use(authenticate, requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER));

router.post("/", createPurchaseOrder);
router.get("/", getPurchaseOrders);
router.get("/:id", getPurchaseOrder);
router.put("/:id", updatePurchaseOrder);
router.delete("/:id", deletePurchaseOrder);
router.patch("/:id/status", updateStatus);
router.post("/:id/receive", receivePurchaseOrder);

export default router;
