import express from "express";
import {createInventory, getInventories,getInventory,updateInventory,deleteInventory,} from "../controllers/inventory.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, createInventory);
router.get("/", authenticate, getInventories);
router.get("/:id", authenticate, getInventory);
router.put("/:id", authenticate, updateInventory);
router.delete("/:id", authenticate, deleteInventory);
export default router;