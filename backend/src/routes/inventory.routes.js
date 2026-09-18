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
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Stock operations
router.post("/stock-in", authenticate, stockIn);
router.post("/stock-out", authenticate, stockOut);
router.post("/transfer", authenticate, transfer);
router.post("/adjustment", authenticate, adjustment);

// Low stock query
router.get("/low-stock", authenticate, getLowStock);

// Standard CRUD
router.post("/", authenticate, createInventory);
router.get("/", authenticate, getInventories);
router.get("/:id", authenticate, getInventory);
router.put("/:id", authenticate, updateInventory);
router.delete("/:id", authenticate, deleteInventory);

export default router;