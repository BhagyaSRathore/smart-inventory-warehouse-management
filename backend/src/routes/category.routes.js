import express from "express";
import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import { authenticate, requireRole, ROLES } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  createCategory
);
router.get(
  "/",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.STAFF),
  getCategories
);
router.get(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.STAFF),
  getCategory
);
router.put(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  updateCategory
);
router.delete(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  deleteCategory
);

export default router;