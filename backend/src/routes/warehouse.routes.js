import express from "express";
import { createWarehouse,getWarehouses,getWarehouse,updateWarehouse,deleteWarehouse } from "../controllers/warehouse.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, createWarehouse);
router.get("/:id", authenticate, getWarehouse);
router.get("/", authenticate, getWarehouses);
router.put("/:id", authenticate, updateWarehouse);
router.delete("/:id", authenticate, deleteWarehouse);

export default router;