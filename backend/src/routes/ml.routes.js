import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
    getDemandPrediction,
    getRiskAssessment,
    getRestockRecommendation,
} from "../controllers/ml.controller.js";

const router = express.Router();

router.get("/predictions/:productId", authenticate, getDemandPrediction);
router.get("/risk/:productId", authenticate, getRiskAssessment);
router.get(
    "/restock-recommendations/:productId",
    authenticate,
    getRestockRecommendation
);

export default router;