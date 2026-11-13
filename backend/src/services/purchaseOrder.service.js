import { db } from "../db.ts";
import { notifyInventoryThreshold } from "./notificationService.js";

/**
 * Generate a unique Purchase Order number (e.g., PO-20261008-0001)
 */
export async function generatePurchaseOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  for (let attempt = 0; attempt < 10; attempt++) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `PO-${dateStr}-${randomSuffix}`;
    const existing = await db.orm.public.PurchaseOrder.first({ orderNumber: candidate });
    if (!existing) {
      return candidate;
    }
  }

  return `PO-${dateStr}-${Date.now().toString().slice(-6)}`;
}

/**
 * Create a new Purchase Order
 */
export async function createPurchaseOrder(data, user = null) {
  const supplierId = Number(data.supplierId);
  const warehouseId = Number(data.warehouseId);

  // Verify supplier exists
  const supplier = await db.orm.public.Supplier.first({ id: supplierId });
  if (!supplier) {
    const error = new Error(`Supplier with ID ${supplierId} not found`);
    error.statusCode = 404;
    throw error;
  }

  // Verify warehouse exists
  const warehouse = await db.orm.public.Warehouse.first({ id: warehouseId });
  if (!warehouse) {
    const error = new Error(`Warehouse with ID ${warehouseId} not found`);
    error.statusCode = 404;
    throw error;
  }

  // Verify products exist and prepare validated items
  const validatedItems = [];
  let subtotal = 0;

  for (const item of data.items) {
    const productId = Number(item.productId);
    const product = await db.orm.public.Product.first({ id: productId });
    if (!product) {
      const error = new Error(`Product with ID ${productId} not found`);
      error.statusCode = 404;
      throw error;
    }

    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const itemTotal = Number((quantity * unitPrice).toFixed(2));
    subtotal += itemTotal;

    validatedItems.push({
      productId,
      quantity,
      unitPrice,
      total: itemTotal,
      productName: product.name,
      productSku: product.sku,
    });
  }

  const tax = Number((Number(data.tax) || 0).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  const orderNumber = await generatePurchaseOrderNumber();

  let createdOrder = null;

  await db.transaction(async (tx) => {
    createdOrder = await tx.orm.public.PurchaseOrder.create({
      orderNumber,
      supplierId,
      warehouseId,
      status: "PENDING",
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      notes: data.notes ? String(data.notes).trim() : null,
    });

    for (const item of validatedItems) {
      await tx.orm.public.PurchaseOrderItem.create({
        purchaseOrderId: createdOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        total: item.total.toFixed(2),
      });
    }
  });

  return getPurchaseOrderById(createdOrder.id);
}

/**
 * Get all Purchase Orders with filtering, search, and pagination
 */
export async function getPurchaseOrders(query = {}) {
  const {
    page = 1,
    limit = 20,
    search,
    orderNumber,
    supplierId,
    warehouseId,
    status,
  } = query;

  const allOrders = await db.orm.public.PurchaseOrder.all();
  const allSuppliers = await db.orm.public.Supplier.all();
  const allWarehouses = await db.orm.public.Warehouse.all();
  const allItems = await db.orm.public.PurchaseOrderItem.all();

  const supplierMap = new Map();
  allSuppliers.forEach((s) => supplierMap.set(s.id, s));

  const warehouseMap = new Map();
  allWarehouses.forEach((w) => warehouseMap.set(w.id, w));

  const itemsCountMap = new Map();
  allItems.forEach((item) => {
    itemsCountMap.set(item.purchaseOrderId, (itemsCountMap.get(item.purchaseOrderId) || 0) + 1);
  });

  // Filter
  let filtered = allOrders.filter((po) => {
    if (orderNumber && !po.orderNumber.toLowerCase().includes(String(orderNumber).toLowerCase())) {
      return false;
    }
    if (search && !po.orderNumber.toLowerCase().includes(String(search).toLowerCase())) {
      return false;
    }
    if (supplierId && po.supplierId !== Number(supplierId)) {
      return false;
    }
    if (warehouseId && po.warehouseId !== Number(warehouseId)) {
      return false;
    }
    if (status && String(po.status).toUpperCase() !== String(status).toUpperCase()) {
      return false;
    }
    return true;
  });

  // Sort descending by createdAt
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = filtered.length;
  const numPage = Math.max(1, Number(page) || 1);
  const numLimit = Math.max(1, Number(limit) || 20);
  const startIndex = (numPage - 1) * numLimit;
  const paginated = filtered.slice(startIndex, startIndex + numLimit);

  const purchaseOrders = paginated.map((po) => ({
    id: po.id,
    orderNumber: po.orderNumber,
    supplierId: po.supplierId,
    warehouseId: po.warehouseId,
    status: po.status,
    subtotal: Number(po.subtotal),
    tax: Number(po.tax),
    total: Number(po.total),
    notes: po.notes,
    createdAt: po.createdAt,
    updatedAt: po.updatedAt,
    itemsCount: itemsCountMap.get(po.id) || 0,
    supplier: supplierMap.get(po.supplierId) || null,
    warehouse: warehouseMap.get(po.warehouseId) || null,
  }));

  return {
    purchaseOrders,
    pagination: {
      total,
      page: numPage,
      limit: numLimit,
      totalPages: Math.ceil(total / numLimit) || 1,
    },
  };
}

/**
 * Get single Purchase Order by ID with full relations
 */
export async function getPurchaseOrderById(id) {
  const numId = Number(id);
  const order = await db.orm.public.PurchaseOrder.first({ id: numId });
  if (!order) {
    const error = new Error(`Purchase order with ID ${numId} not found`);
    error.statusCode = 404;
    throw error;
  }

  const supplier = await db.orm.public.Supplier.first({ id: order.supplierId });
  const warehouse = await db.orm.public.Warehouse.first({ id: order.warehouseId });

  const allItems = await db.orm.public.PurchaseOrderItem.all();
  const orderItems = allItems.filter((i) => i.purchaseOrderId === numId);

  const allProducts = await db.orm.public.Product.all();
  const productMap = new Map();
  allProducts.forEach((p) => productMap.set(p.id, p));

  const items = orderItems.map((item) => {
    const product = productMap.get(item.productId) || null;
    return {
      id: item.id,
      purchaseOrderId: item.purchaseOrderId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
      product: product
        ? {
            id: product.id,
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            price: Number(product.price),
            costPrice: product.costPrice ? Number(product.costPrice) : null,
            imageUrl: product.imageUrl,
          }
        : null,
    };
  });

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    supplierId: order.supplierId,
    warehouseId: order.warehouseId,
    status: order.status,
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    total: Number(order.total),
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    supplier: supplier || null,
    warehouse: warehouse || null,
    items,
  };
}

/**
 * Update Purchase Order (only allowed if PENDING)
 */
export async function updatePurchaseOrder(id, data) {
  const numId = Number(id);
  const existingOrder = await getPurchaseOrderById(numId);

  if (String(existingOrder.status).toUpperCase() !== "PENDING") {
    const error = new Error(
      `Cannot edit purchase order with status "${existingOrder.status}". Only PENDING purchase orders can be edited.`
    );
    error.statusCode = 400;
    throw error;
  }

  let supplierId = existingOrder.supplierId;
  if (data.supplierId !== undefined) {
    supplierId = Number(data.supplierId);
    const supplier = await db.orm.public.Supplier.first({ id: supplierId });
    if (!supplier) {
      const error = new Error(`Supplier with ID ${supplierId} not found`);
      error.statusCode = 404;
      throw error;
    }
  }

  let warehouseId = existingOrder.warehouseId;
  if (data.warehouseId !== undefined) {
    warehouseId = Number(data.warehouseId);
    const warehouse = await db.orm.public.Warehouse.first({ id: warehouseId });
    if (!warehouse) {
      const error = new Error(`Warehouse with ID ${warehouseId} not found`);
      error.statusCode = 404;
      throw error;
    }
  }

  let validatedItems = null;
  let subtotal = existingOrder.subtotal;

  if (data.items !== undefined) {
    validatedItems = [];
    subtotal = 0;

    for (const item of data.items) {
      const productId = Number(item.productId);
      const product = await db.orm.public.Product.first({ id: productId });
      if (!product) {
        const error = new Error(`Product with ID ${productId} not found`);
        error.statusCode = 404;
        throw error;
      }

      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const itemTotal = Number((quantity * unitPrice).toFixed(2));
      subtotal += itemTotal;

      validatedItems.push({
        productId,
        quantity,
        unitPrice,
        total: itemTotal,
      });
    }
  }

  const tax = data.tax !== undefined ? Number((Number(data.tax) || 0).toFixed(2)) : existingOrder.tax;
  const total = Number((subtotal + tax).toFixed(2));
  const notes = data.notes !== undefined ? (data.notes ? String(data.notes).trim() : null) : existingOrder.notes;

  await db.transaction(async (tx) => {
    await tx.orm.public.PurchaseOrder
      .where({ id: numId })
      .update({
        supplierId,
        warehouseId,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        notes,
      });

    if (validatedItems) {
      // Delete old items and insert updated ones
      await tx.orm.public.PurchaseOrderItem
        .where({ purchaseOrderId: numId })
        .delete();

      for (const item of validatedItems) {
        await tx.orm.public.PurchaseOrderItem.create({
          purchaseOrderId: numId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          total: item.total.toFixed(2),
        });
      }
    }
  });

  return getPurchaseOrderById(numId);
}

/**
 * Delete / Cancel Purchase Order
 */
export async function deletePurchaseOrder(id, permanent = false) {
  const numId = Number(id);
  const order = await getPurchaseOrderById(numId);

  if (String(order.status).toUpperCase() === "RECEIVED") {
    const error = new Error("Cannot delete a received purchase order");
    error.statusCode = 400;
    throw error;
  }

  if (permanent) {
    await db.transaction(async (tx) => {
      await tx.orm.public.PurchaseOrderItem
        .where({ purchaseOrderId: numId })
        .delete();
      await tx.orm.public.PurchaseOrder
        .where({ id: numId })
        .delete();
    });
    return { id: numId, deleted: true, orderNumber: order.orderNumber };
  }

  // Soft-cancel (recommended for enterprise ERP audit trails)
  await db.orm.public.PurchaseOrder
    .where({ id: numId })
    .update({ status: "CANCELLED" });

  return getPurchaseOrderById(numId);
}

/**
 * Update Purchase Order status
 */
export async function updatePurchaseOrderStatus(id, targetStatus, user = null) {
  const numId = Number(id);
  const normalizedStatus = String(targetStatus).toUpperCase();

  // If receiving, delegate directly to the robust receive transaction
  if (normalizedStatus === "RECEIVED") {
    return receivePurchaseOrder(numId, user);
  }

  await db.orm.public.PurchaseOrder
    .where({ id: numId })
    .update({ status: normalizedStatus });

  return getPurchaseOrderById(numId);
}

/**
 * Receive Purchase Order & update inventory via transaction
 */
export async function receivePurchaseOrder(id, user = null) {
  const numId = Number(id);
  const order = await getPurchaseOrderById(numId);

  const currentStatus = String(order.status).toUpperCase();

  if (currentStatus === "RECEIVED") {
    const error = new Error("Purchase order has already been received");
    error.statusCode = 400;
    throw error;
  }

  if (currentStatus === "CANCELLED") {
    const error = new Error("Cannot receive a cancelled purchase order");
    error.statusCode = 400;
    throw error;
  }

  if (currentStatus !== "APPROVED") {
    const error = new Error(`Purchase order must be APPROVED before receiving. Current status is ${currentStatus}`);
    error.statusCode = 400;
    throw error;
  }

  const performedBy = user?.userId ? Number(user.userId) : null;

  // Execute atomic transaction: increase inventory and log stock movements
  await db.transaction(async (tx) => {
    for (const item of order.items) {
      // Find existing inventory in warehouse (without rack specification)
      const existingInventory = await tx.orm.public.Inventory.first({
        productId: item.productId,
        warehouseId: order.warehouseId,
        rackId: null,
      });

      if (existingInventory) {
        const newQuantity = existingInventory.quantity + item.quantity;
        await tx.orm.public.Inventory
          .where({ id: existingInventory.id })
          .update({ quantity: newQuantity });
      } else {
        await tx.orm.public.Inventory.create({
          productId: item.productId,
          warehouseId: order.warehouseId,
          rackId: null,
          quantity: item.quantity,
        });
      }

      // Record Stock Movement
      await tx.orm.public.StockMovement.create({
        productId: item.productId,
        warehouseId: order.warehouseId,
        rackId: null,
        quantity: item.quantity,
        type: "IN",
        referenceNumber: order.orderNumber,
        notes: `Purchase Order received: ${order.orderNumber}`,
        performedBy,
      });
    }

    // Update Purchase Order status to RECEIVED
    await tx.orm.public.PurchaseOrder
      .where({ id: numId })
      .update({ status: "RECEIVED" });
  });

  // Check inventory threshold notifications for each product
  for (const item of order.items) {
    try {
      const inv = await db.orm.public.Inventory.first({
        productId: item.productId,
        warehouseId: order.warehouseId,
      });
      if (inv) {
        await notifyInventoryThreshold({
          productId: item.productId,
          warehouseId: order.warehouseId,
          quantity: inv.quantity,
        });
      }
    } catch (err) {
      console.warn("Notification error after PO receive:", err.message);
    }
  }

  return getPurchaseOrderById(numId);
}
