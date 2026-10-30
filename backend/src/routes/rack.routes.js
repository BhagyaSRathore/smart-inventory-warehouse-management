import express from "express";
import {
  createRack,
  getRacks,
  getRack,
  updateRack,
  deleteRack,
} from "../controllers/rack.controller.js";
import { authenticate, requireRole, ROLES } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  createRack
);
router.get(
  "/",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.STAFF),
  getRacks
);
router.get(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.STAFF),
  getRack
);
router.put(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  updateRack
);
router.delete(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  deleteRack
);

export default router;