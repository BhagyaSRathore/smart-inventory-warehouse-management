import express from "express";
import { authenticate, requireRole, ROLES } from "../middleware/auth.middleware.js";
import { chatWithAI } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/chat", authenticate, requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER), chatWithAI);

export default router;