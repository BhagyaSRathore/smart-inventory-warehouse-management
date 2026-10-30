import express from "express";
import {
  createWarehouse,
  getWarehouses,
  getWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from "../controllers/warehouse.controller.js";
import { authenticate, requireRole, ROLES } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  createWarehouse
);
router.get(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.STAFF),
  getWarehouse
);
router.get(
  "/",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.STAFF),
  getWarehouses
);
router.put(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  updateWarehouse
);
router.delete(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  deleteWarehouse
);

export default router;