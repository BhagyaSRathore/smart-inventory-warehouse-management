import * as purchaseOrderService from "../services/purchaseOrder.service.js";
import {
  validateCreatePurchaseOrder,
  validateUpdatePurchaseOrder,
  validatePOStatusTransition,
} from "../validators/purchaseOrder.validator.js";

/**
 * POST /api/purchase-orders
 * Create a new Purchase Order
 */
export const createPurchaseOrder = async (req, res) => {
  try {
    const validation = validateCreatePurchaseOrder(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const purchaseOrder = await purchaseOrderService.createPurchaseOrder(req.body, req.user);

    return res.status(201).json({
      message: "Purchase order created successfully",
      purchaseOrder,
    });
  } catch (error) {
    console.error("Create Purchase Order error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      message: error.message || "Failed to create purchase order",
    });
  }
};

/**
 * GET /api/purchase-orders
 * List purchase orders with filtering & pagination
 */
export const getPurchaseOrders = async (req, res) => {
  try {
    const result = await purchaseOrderService.getPurchaseOrders(req.query);

    return res.status(200).json({
      message: "Purchase orders fetched successfully",
      ...result,
    });
  } catch (error) {
    console.error("Get Purchase Orders error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      message: error.message || "Failed to fetch purchase orders",
    });
  }
};

/**
 * GET /api/purchase-orders/:id
 * Get single purchase order details
 */
export const getPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    if (!id || Number.isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        message: "Valid purchase order ID is required",
      });
    }

    const purchaseOrder = await purchaseOrderService.getPurchaseOrderById(numId);

    return res.status(200).json({
      message: "Purchase order fetched successfully",
      purchaseOrder,
    });
  } catch (error) {
    console.error("Get Purchase Order error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      message: error.message || "Failed to fetch purchase order",
    });
  }
};

/**
 * PUT /api/purchase-orders/:id
 * Edit purchase order (only when status is PENDING)
 */
export const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    if (!id || Number.isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        message: "Valid purchase order ID is required",
      });
    }

    const validation = validateUpdatePurchaseOrder(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const purchaseOrder = await purchaseOrderService.updatePurchaseOrder(numId, req.body);

    return res.status(200).json({
      message: "Purchase order updated successfully",
      purchaseOrder,
    });
  } catch (error) {
    console.error("Update Purchase Order error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      message: error.message || "Failed to update purchase order",
    });
  }
};

/**
 * DELETE /api/purchase-orders/:id
 * Delete or soft-cancel purchase order
 */
export const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    if (!id || Number.isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        message: "Valid purchase order ID is required",
      });
    }

    const permanent = req.query.permanent === "true";
    const result = await purchaseOrderService.deletePurchaseOrder(numId, permanent);

    return res.status(200).json({
      message: permanent
        ? "Purchase order deleted permanently"
        : "Purchase order cancelled successfully",
      result,
    });
  } catch (error) {
    console.error("Delete Purchase Order error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      message: error.message || "Failed to delete purchase order",
    });
  }
};

/**
 * PATCH /api/purchase-orders/:id/status
 * Status transitions (PENDING -> APPROVED, PENDING -> CANCELLED, etc.)
 */
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    if (!id || Number.isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        message: "Valid purchase order ID is required",
      });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        message: "Status field is required",
      });
    }

    const order = await purchaseOrderService.getPurchaseOrderById(numId);
    const transitionValidation = validatePOStatusTransition(order.status, status);

    if (!transitionValidation.isValid) {
      return res.status(400).json({
        message: transitionValidation.error,
      });
    }

    const updated = await purchaseOrderService.updatePurchaseOrderStatus(
      numId,
      transitionValidation.status,
      req.user
    );

    return res.status(200).json({
      message: `Purchase order status updated to ${transitionValidation.status}`,
      purchaseOrder: updated,
    });
  } catch (error) {
    console.error("Update Purchase Order status error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      message: error.message || "Failed to update purchase order status",
    });
  }
};

/**
 * POST /api/purchase-orders/:id/receive
 * Receive purchase order & increase inventory
 */
export const receivePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    if (!id || Number.isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        message: "Valid purchase order ID is required",
      });
    }

    const purchaseOrder = await purchaseOrderService.receivePurchaseOrder(numId, req.user);

    return res.status(200).json({
      message: "Purchase order received successfully and inventory updated",
      purchaseOrder,
    });
  } catch (error) {
    console.error("Receive Purchase Order error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      message: error.message || "Failed to receive purchase order",
    });
  }
};
