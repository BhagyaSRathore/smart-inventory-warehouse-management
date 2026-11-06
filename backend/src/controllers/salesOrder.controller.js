import * as salesOrderService from "../services/salesOrder.service.js";
import {
  validateCreateSalesOrder,
  validateUpdateSalesOrder,
  validateSOStatusTransition,
} from "../validators/salesOrder.validator.js";

/**
 * POST /api/sales-orders
 * Create a new Sales Order
 */
export const createSalesOrder = async (req, res) => {
  try {
    const validation = validateCreateSalesOrder(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const salesOrder = await salesOrderService.createSalesOrder(req.body, req.user);

    return res.status(201).json({
      message: "Sales order created successfully",
      salesOrder,
    });
  } catch (error) {
    console.error("Create Sales Order error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      message: error.message || "Failed to create sales order",
    });
  }
};

/**
 * GET /api/sales-orders
 * List sales orders with filtering & pagination
 */
export const getSalesOrders = async (req, res) => {
  try {
    const result = await salesOrderService.getSalesOrders(req.query);

    return res.status(200).json({
      message: "Sales orders fetched successfully",
      ...result,
    });
  } catch (error) {
    console.error("Get Sales Orders error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      message: error.message || "Failed to fetch sales orders",
    });
  }
};

/**
 * GET /api/sales-orders/:id
 * Get single sales order details
 */
export const getSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    if (!id || Number.isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        message: "Valid sales order ID is required",
      });
    }

    const salesOrder = await salesOrderService.getSalesOrderById(numId);

    return res.status(200).json({
      message: "Sales order fetched successfully",
      salesOrder,
    });
  } catch (error) {
    console.error("Get Sales Order error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      message: error.message || "Failed to fetch sales order",
    });
  }
};

/**
 * PUT /api/sales-orders/:id
 * Edit sales order (only when status is PENDING)
 */
export const updateSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    if (!id || Number.isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        message: "Valid sales order ID is required",
      });
    }

    const validation = validateUpdateSalesOrder(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const salesOrder = await salesOrderService.updateSalesOrder(numId, req.body);

    return res.status(200).json({
      message: "Sales order updated successfully",
      salesOrder,
    });
  } catch (error) {
    console.error("Update Sales Order error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      message: error.message || "Failed to update sales order",
    });
  }
};

/**
 * DELETE /api/sales-orders/:id
 * Delete or soft-cancel sales order
 */
export const deleteSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    if (!id || Number.isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        message: "Valid sales order ID is required",
      });
    }

    const permanent = req.query.permanent === "true";
    const result = await salesOrderService.deleteSalesOrder(numId, permanent);

    return res.status(200).json({
      message: permanent
        ? "Sales order deleted permanently"
        : "Sales order cancelled successfully",
      result,
    });
  } catch (error) {
    console.error("Delete Sales Order error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      message: error.message || "Failed to delete sales order",
    });
  }
};

/**
 * PATCH /api/sales-orders/:id/status
 * Status transitions (PENDING -> CONFIRMED, CONFIRMED -> SHIPPED, etc.)
 */
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    if (!id || Number.isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        message: "Valid sales order ID is required",
      });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        message: "Status field is required",
      });
    }

    const order = await salesOrderService.getSalesOrderById(numId);
    const transitionValidation = validateSOStatusTransition(order.status, status);

    if (!transitionValidation.isValid) {
      return res.status(400).json({
        message: transitionValidation.error,
      });
    }

    const updated = await salesOrderService.updateSalesOrderStatus(
      numId,
      transitionValidation.status,
      req.user
    );

    return res.status(200).json({
      message: `Sales order status updated to ${transitionValidation.status}`,
      salesOrder: updated,
    });
  } catch (error) {
    console.error("Update Sales Order status error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      message: error.message || "Failed to update sales order status",
    });
  }
};

/**
 * POST /api/sales-orders/:id/ship
 * Ship sales order & decrease inventory
 */
export const shipSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    if (!id || Number.isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        message: "Valid sales order ID is required",
      });
    }

    const salesOrder = await salesOrderService.shipSalesOrder(numId, req.user);

    return res.status(200).json({
      message: "Sales order shipped successfully and inventory updated",
      salesOrder,
    });
  } catch (error) {
    console.error("Ship Sales Order error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      message: error.message || "Failed to ship sales order",
    });
  }
};
