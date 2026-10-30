import express from "express";
import { authenticate, requireRole, ROLES } from "../middleware/auth.middleware.js";
import {
    getDemandPrediction,
    getRiskAssessment,
    getRestockRecommendation,
} from "../controllers/ml.controller.js";

const router = express.Router();

router.get(
  "/predictions/:productId",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  getDemandPrediction
);
router.get(
  "/risk/:productId",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  getRiskAssessment
);
router.get(
  "/restock-recommendations/:productId",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER),
  getRestockRecommendation
);

export default router;