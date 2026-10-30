import express from "express";
import { getDashboard } from "../controllers/dashboard.controller.js";
import { authenticate, requireRole, ROLES } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.STAFF),
  getDashboard
);

export default router;