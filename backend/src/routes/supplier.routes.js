import express from "express";
import { createSupplier, getSuppliers, getSupplier,updateSupplier, deleteSupplier} from "../controllers/supplier.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, createSupplier);
router.put("/:id", authenticate, updateSupplier);
router.get("/:id", authenticate, getSupplier);
router.get("/", authenticate, getSuppliers);
router.delete("/:id", authenticate, deleteSupplier);

export default router;