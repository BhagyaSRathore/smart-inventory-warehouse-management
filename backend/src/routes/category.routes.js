import express from "express";

import { createCategory,getCategories ,getCategory,  updateCategory, deleteCategory} from "../controllers/category.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, createCategory);
router.get("/", authenticate, getCategories);
router.get("/:id", authenticate, getCategory);
router.put("/:id", authenticate, updateCategory);
router.delete("/:id", authenticate, deleteCategory);
export default router;