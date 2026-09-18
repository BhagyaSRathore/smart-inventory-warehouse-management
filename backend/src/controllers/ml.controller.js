import { db } from "../db.ts";
import {
    predictDemand,
    assessRisk,
    recommendRestock,
} from "../services/mlService.js";

const ALLOWED_DAYS = [7, 14, 30];

const parseProductId = (value) => {
    const productId = Number(value);

    if (!Number.isInteger(productId) || productId <= 0) {
        return null;
    }

    return productId;
};

const parseDays = (value) => {
    const days = value === undefined ? 7 : Number(value);

    if (!ALLOWED_DAYS.includes(days)) {
        return null;
    }

    return days;
};

const getProductData = async (productId, days) => {
    const product = await db.orm.public.Product.first({
        id: productId,
    });

    if (!product) {
        return null;
    }

    const inventory = await db.orm.public.Inventory.all();
    const productInventory = inventory.filter(
        (item) => Number(item.productId) === productId
    );

    const currentStock = productInventory.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
    );

    const movements = await db.orm.public.StockMovement.all();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const dailyDemand = new Map();

    for (const movement of movements) {
        if (
            Number(movement.productId) !== productId ||
            movement.type !== "OUT"
        ) {
            continue;
        }

        const createdAt = new Date(movement.createdAt);

        if (Number.isNaN(createdAt.getTime()) || createdAt < cutoff) {
            continue;
        }

        const date = createdAt.toISOString().slice(0, 10);

        dailyDemand.set(
            date,
            (dailyDemand.get(date) || 0) + Number(movement.quantity || 0)
        );
    }

    const historicalData = Array.from(dailyDemand.entries())
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, quantity]) => ({
            date,
            quantity,
        }));

    return {
        product,
        currentStock,
        historicalData,
    };
};

const handleError = (res, error, message) => {
    console.error(error);

    return res.status(500).json({
        message,
    });
};

export const getDemandPrediction = async (req, res) => {
    try {
        const productId = parseProductId(req.params.productId);
        const days = parseDays(req.query.days);

        if (!productId) {
            return res.status(400).json({
                message: "productId must be a positive integer",
            });
        }

        if (!days) {
            return res.status(400).json({
                message: "days must be one of 7, 14, or 30",
            });
        }

        const data = await getProductData(productId, days);

        if (!data) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        const result = await predictDemand({
            productId,
            days,
            historicalData: data.historicalData,
        });

        return res.json({
            productId,
            productName: data.product.name,
            currentStock: data.currentStock,
            prediction: result,
        });
    } catch (error) {
        return handleError(
            res,
            error,
            "Failed to generate demand prediction"
        );
    }
};

export const getRiskAssessment = async (req, res) => {
    try {
        const productId = parseProductId(req.params.productId);
        const days = parseDays(req.query.days);

        if (!productId) {
            return res.status(400).json({
                message: "productId must be a positive integer",
            });
        }

        if (!days) {
            return res.status(400).json({
                message: "days must be one of 7, 14, or 30",
            });
        }

        const data = await getProductData(productId, days);

        if (!data) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        const demand = await predictDemand({
            productId,
            days,
            historicalData: data.historicalData,
        });

        const result = await assessRisk({
            productId,
            currentStock: data.currentStock,
            predictedDemand: demand.predictedDemand,
        });

        return res.json({
            productId,
            productName: data.product.name,
            currentStock: data.currentStock,
            prediction: demand,
            risk: result,
        });
    } catch (error) {
        return handleError(
            res,
            error,
            "Failed to assess inventory risk"
        );
    }
};

export const getRestockRecommendation = async (req, res) => {
    try {
        const productId = parseProductId(req.params.productId);
        const days = parseDays(req.query.days);

        if (!productId) {
            return res.status(400).json({
                message: "productId must be a positive integer",
            });
        }

        if (!days) {
            return res.status(400).json({
                message: "days must be one of 7, 14, or 30",
            });
        }

        const data = await getProductData(productId, days);

        if (!data) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        const demand = await predictDemand({
            productId,
            days,
            historicalData: data.historicalData,
        });

        const result = await recommendRestock({
            productId,
            currentStock: data.currentStock,
            predictedDemand: demand.predictedDemand,
        });

        return res.json({
            productId,
            productName: data.product.name,
            currentStock: data.currentStock,
            prediction: demand,
            recommendation: result,
        });
    } catch (error) {
        return handleError(
            res,
            error,
            "Failed to generate restock recommendation"
        );
    }
};