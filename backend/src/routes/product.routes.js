import express from "express";
import {
  createProduct,
  getProducts,
  getProduct,
  getProductByBarcode,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Barcode lookup - must be before /:id to avoid conflict
router.get("/barcode/:barcode", authenticate, getProductByBarcode);

// Standard CRUD
router.post("/", authenticate, createProduct);
router.get("/", authenticate, getProducts);
router.get("/:id", authenticate, getProduct);
router.put("/:id", authenticate, updateProduct);
router.delete("/:id", authenticate, deleteProduct);

export default router;