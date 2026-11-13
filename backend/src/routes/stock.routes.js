import express from "express";
import {
  createStockMovement,
  getStockMovements,
  getStockMovement,
  updateStockMovement,
  deleteStockMovement,
} from "../controllers/stock.controller.js";
import { authenticate, requireRole, ROLES } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate, requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER));

router.post("/", createStockMovement);
router.get("/", getStockMovements);
router.get("/:id", getStockMovement);
router.put("/:id", updateStockMovement);
router.delete("/:id", deleteStockMovement);

export default router;