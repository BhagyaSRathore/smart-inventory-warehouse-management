import express from "express";
import { createOrder,getOrders,getOrder,updateOrder,deleteOrder, } from "../controllers/order.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, createOrder);
router.get("/", authenticate, getOrders);
router.get("/:id", authenticate, getOrder);
router.put("/:id", authenticate, updateOrder);
router.delete("/:id", authenticate, deleteOrder);

export default router;