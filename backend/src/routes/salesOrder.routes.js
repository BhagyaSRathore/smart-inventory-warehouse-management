import express from "express";
import {
  createSalesOrder,
  getSalesOrders,
  getSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  updateStatus,
  shipSalesOrder,
} from "../controllers/salesOrder.controller.js";
import { authenticate, requireRole, ROLES } from "../middleware/auth.middleware.js";

const router = express.Router();

// Protect all Sales Order routes with authentication and RBAC
router.use(authenticate, requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER));

router.post("/", createSalesOrder);
router.get("/", getSalesOrders);
router.get("/:id", getSalesOrder);
router.put("/:id", updateSalesOrder);
router.delete("/:id", deleteSalesOrder);
router.patch("/:id/status", updateStatus);
router.post("/:id/ship", shipSalesOrder);

export default router;
