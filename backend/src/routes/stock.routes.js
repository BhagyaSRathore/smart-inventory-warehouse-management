import express from "express";
import {createStockMovement, getStockMovements,getStockMovement,updateStockMovement,deleteStockMovement,} from "../controllers/stock.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, createStockMovement);
router.get("/", authenticate, getStockMovements);
router.get("/:id", authenticate, getStockMovement);
router.put("/:id", authenticate, updateStockMovement);
router.delete("/:id", authenticate, deleteStockMovement);
export default router;