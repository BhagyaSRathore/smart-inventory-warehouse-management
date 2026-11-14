import express from "express";
import {
  createProduct,
  getProducts,
  getProduct,
  getProductByBarcode,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

import { authenticate, requireRole, ROLES } from "../middleware/auth.middleware.js";
 
const router = express.Router();

// Barcode lookup - must be before /:id to avoid conflict
router.get(
  "/barcode/:barcode",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.STAFF),
  getProductByBarcode
);

// Standard CRUD
router.post(
  "/",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  createProduct
);
router.get(
  "/",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.STAFF),
  getProducts
);
router.get(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.STAFF),
  getProduct
);
router.put(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  updateProduct
);
router.delete(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  deleteProduct
);

export default router;