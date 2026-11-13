/**
 * Purchase Order Validator
 */

export const PURCHASE_ORDER_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  RECEIVED: "RECEIVED",
  CANCELLED: "CANCELLED",
};

export const VALID_PO_STATUS_TRANSITIONS = {
  PENDING: ["APPROVED", "CANCELLED"],
  APPROVED: ["RECEIVED", "CANCELLED"],
  RECEIVED: [],
  CANCELLED: [],
};

/**
 * Validate Purchase Order creation payload
 */
export function validateCreatePurchaseOrder(data) {
  const errors = [];

  if (!data || typeof data !== "object") {
    return { isValid: false, errors: ["Request body must be a valid JSON object"] };
  }

  // supplierId
  const supplierId = Number(data.supplierId);
  if (!data.supplierId || Number.isNaN(supplierId) || supplierId <= 0 || !Number.isInteger(supplierId)) {
    errors.push("supplierId is required and must be a positive integer");
  }

  // warehouseId
  const warehouseId = Number(data.warehouseId);
  if (!data.warehouseId || Number.isNaN(warehouseId) || warehouseId <= 0 || !Number.isInteger(warehouseId)) {
    errors.push("warehouseId is required and must be a positive integer");
  }

  // tax (optional, >= 0)
  if (data.tax !== undefined && data.tax !== null) {
    const tax = Number(data.tax);
    if (Number.isNaN(tax) || tax < 0) {
      errors.push("tax must be a non-negative number");
    }
  }

  // items
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push("items must be a non-empty array with at least one item");
  } else {
    data.items.forEach((item, index) => {
      const prefix = `Item at index ${index}`;
      if (!item || typeof item !== "object") {
        errors.push(`${prefix} must be an object`);
        return;
      }

      const productId = Number(item.productId);
      if (!item.productId || Number.isNaN(productId) || productId <= 0 || !Number.isInteger(productId)) {
        errors.push(`${prefix}: productId must be a positive integer`);
      }

      const quantity = Number(item.quantity);
      if (item.quantity === undefined || Number.isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
        errors.push(`${prefix}: quantity must be an integer greater than 0`);
      }

      const unitPrice = Number(item.unitPrice);
      if (item.unitPrice === undefined || Number.isNaN(unitPrice) || unitPrice < 0) {
        errors.push(`${prefix}: unitPrice must be a number greater than or equal to 0`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Purchase Order update payload
 */
export function validateUpdatePurchaseOrder(data) {
  const errors = [];

  if (!data || typeof data !== "object") {
    return { isValid: false, errors: ["Request body must be a valid JSON object"] };
  }

  if (data.supplierId !== undefined) {
    const supplierId = Number(data.supplierId);
    if (Number.isNaN(supplierId) || supplierId <= 0 || !Number.isInteger(supplierId)) {
      errors.push("supplierId must be a positive integer");
    }
  }

  if (data.warehouseId !== undefined) {
    const warehouseId = Number(data.warehouseId);
    if (Number.isNaN(warehouseId) || warehouseId <= 0 || !Number.isInteger(warehouseId)) {
      errors.push("warehouseId must be a positive integer");
    }
  }

  if (data.tax !== undefined && data.tax !== null) {
    const tax = Number(data.tax);
    if (Number.isNaN(tax) || tax < 0) {
      errors.push("tax must be a non-negative number");
    }
  }

  if (data.items !== undefined) {
    if (!Array.isArray(data.items) || data.items.length === 0) {
      errors.push("items must be a non-empty array when provided");
    } else {
      data.items.forEach((item, index) => {
        const prefix = `Item at index ${index}`;
        if (!item || typeof item !== "object") {
          errors.push(`${prefix} must be an object`);
          return;
        }

        const productId = Number(item.productId);
        if (!item.productId || Number.isNaN(productId) || productId <= 0 || !Number.isInteger(productId)) {
          errors.push(`${prefix}: productId must be a positive integer`);
        }

        const quantity = Number(item.quantity);
        if (item.quantity === undefined || Number.isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
          errors.push(`${prefix}: quantity must be an integer greater than 0`);
        }

        const unitPrice = Number(item.unitPrice);
        if (item.unitPrice === undefined || Number.isNaN(unitPrice) || unitPrice < 0) {
          errors.push(`${prefix}: unitPrice must be a number greater than or equal to 0`);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Purchase Order status transition
 */
export function validatePOStatusTransition(currentStatus, targetStatus) {
  const current = String(currentStatus || "").toUpperCase();
  const target = String(targetStatus || "").toUpperCase();

  if (!PURCHASE_ORDER_STATUSES[target]) {
    return {
      isValid: false,
      error: `Invalid status "${targetStatus}". Allowed statuses: ${Object.keys(PURCHASE_ORDER_STATUSES).join(", ")}`,
    };
  }

  if (current === target) {
    return {
      isValid: false,
      error: `Purchase order is already in "${current}" status`,
    };
  }

  const allowed = VALID_PO_STATUS_TRANSITIONS[current] || [];
  if (!allowed.includes(target)) {
    return {
      isValid: false,
      error: `Cannot transition purchase order from ${current} to ${target}. Allowed next statuses from ${current}: [${allowed.join(", ") || "none"}]`,
    };
  }

  return { isValid: true, status: target };
}
