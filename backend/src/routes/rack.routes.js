import express from "express";
import { createRack,getRacks,getRack,updateRack,deleteRack } from "../controllers/rack.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, createRack);
router.get("/", authenticate, getRacks);
router.get("/:id", authenticate, getRack);
router.put("/:id", authenticate, updateRack);
router.delete("/:id", authenticate, deleteRack);

export default router;