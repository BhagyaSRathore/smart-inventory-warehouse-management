import express from "express";
import {
  createInventory,
  getInventories,
  getInventory,
  updateInventory,
  deleteInventory,
  stockIn,
  stockOut,
  transfer,
  adjustment,
  getLowStock,
} from "../controllers/inventory.controller.js";
import { authenticate, requireRole, ROLES } from "../middleware/auth.middleware.js";

const router = express.Router();

// Stock operations
router.post(
  "/stock-in",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.STAFF),
  stockIn
);
router.post(
  "/stock-out",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.STAFF),
  stockOut
);
router.post(
  "/transfer",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  transfer
);
router.post(
  "/adjustment",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  adjustment
);

// Low stock query
router.get(
  "/low-stock",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.STAFF),
  getLowStock
);

// Standard CRUD
router.post(
  "/",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  createInventory
);
router.get(
  "/",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.STAFF),
  getInventories
);
router.get(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.STAFF),
  getInventory
);
router.put(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  updateInventory
);
router.delete(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  deleteInventory
);

export default router;