import express from "express";
import {
  createSupplier,
  getSuppliers,
  getSupplier,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplier.controller.js";
import { authenticate, requireRole, ROLES } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate, requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER));

router.post("/", createSupplier);
router.put("/:id", updateSupplier);
router.get("/:id", getSupplier);
router.get("/", getSuppliers);
router.delete("/:id", deleteSupplier);

export default router;