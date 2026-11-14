import { db } from "../db.ts";
import { notifyInventoryThreshold } from "./notificationService.js";

/**
 * Generate a unique Sales Order number (e.g., SO-20261008-0001)
 */
export async function generateSalesOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  for (let attempt = 0; attempt < 10; attempt++) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `SO-${dateStr}-${randomSuffix}`;
    const existing = await db.orm.public.SalesOrder.first({ orderNumber: candidate });
    if (!existing) {
      return candidate;
    }
  }

  return `SO-${dateStr}-${Date.now().toString().slice(-6)}`;
}

/**
 * Create a new Sales Order
 */
export async function createSalesOrder(data, user = null) {
  const customerId = Number(data.customerId);
  const warehouseId = Number(data.warehouseId);

  // Verify customer exists
  const customer = await db.orm.public.Customer.first({ id: customerId });
  if (!customer) {
    const error = new Error(`Customer with ID ${customerId} not found`);
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
  const orderNumber = await generateSalesOrderNumber();

  let createdOrder = null;

  await db.transaction(async (tx) => {
    createdOrder = await tx.orm.public.SalesOrder.create({
      orderNumber,
      customerId,
      warehouseId,
      status: "PENDING",
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      notes: data.notes ? String(data.notes).trim() : null,
    });

    for (const item of validatedItems) {
      await tx.orm.public.SalesOrderItem.create({
        salesOrderId: createdOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        total: item.total.toFixed(2),
      });
    }
  });

  return getSalesOrderById(createdOrder.id);
}

/**
 * Get all Sales Orders with filtering, search, and pagination
 */
export async function getSalesOrders(query = {}) {
  const {
    page = 1,
    limit = 20,
    search,
    orderNumber,
    customerId,
    warehouseId,
    status,
  } = query;

  const allOrders = await db.orm.public.SalesOrder.all();
  const allCustomers = await db.orm.public.Customer.all();
  const allWarehouses = await db.orm.public.Warehouse.all();
  const allItems = await db.orm.public.SalesOrderItem.all();

  const customerMap = new Map();
  allCustomers.forEach((c) => customerMap.set(c.id, c));

  const warehouseMap = new Map();
  allWarehouses.forEach((w) => warehouseMap.set(w.id, w));

  const itemsCountMap = new Map();
  allItems.forEach((item) => {
    itemsCountMap.set(item.salesOrderId, (itemsCountMap.get(item.salesOrderId) || 0) + 1);
  });

  // Filter
  let filtered = allOrders.filter((so) => {
    if (orderNumber && !so.orderNumber.toLowerCase().includes(String(orderNumber).toLowerCase())) {
      return false;
    }
    if (search && !so.orderNumber.toLowerCase().includes(String(search).toLowerCase())) {
      return false;
    }
    if (customerId && so.customerId !== Number(customerId)) {
      return false;
    }
    if (warehouseId && so.warehouseId !== Number(warehouseId)) {
      return false;
    }
    if (status && String(so.status).toUpperCase() !== String(status).toUpperCase()) {
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

  const salesOrders = paginated.map((so) => ({
    id: so.id,
    orderNumber: so.orderNumber,
    customerId: so.customerId,
    warehouseId: so.warehouseId,
    status: so.status,
    subtotal: Number(so.subtotal),
    tax: Number(so.tax),
    total: Number(so.total),
    notes: so.notes,
    createdAt: so.createdAt,
    updatedAt: so.updatedAt,
    itemsCount: itemsCountMap.get(so.id) || 0,
    customer: customerMap.get(so.customerId) || null,
    warehouse: warehouseMap.get(so.warehouseId) || null,
  }));

  return {
    salesOrders,
    pagination: {
      total,
      page: numPage,
      limit: numLimit,
      totalPages: Math.ceil(total / numLimit) || 1,
    },
  };
}

/**
 * Get single Sales Order by ID with full relations
 */
export async function getSalesOrderById(id) {
  const numId = Number(id);
  const order = await db.orm.public.SalesOrder.first({ id: numId });
  if (!order) {
    const error = new Error(`Sales order with ID ${numId} not found`);
    error.statusCode = 404;
    throw error;
  }

  const customer = await db.orm.public.Customer.first({ id: order.customerId });
  const warehouse = await db.orm.public.Warehouse.first({ id: order.warehouseId });

  const allItems = await db.orm.public.SalesOrderItem.all();
  const orderItems = allItems.filter((i) => i.salesOrderId === numId);

  const allProducts = await db.orm.public.Product.all();
  const productMap = new Map();
  allProducts.forEach((p) => productMap.set(p.id, p));

  const items = orderItems.map((item) => {
    const product = productMap.get(item.productId) || null;
    return {
      id: item.id,
      salesOrderId: item.salesOrderId,
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
    customerId: order.customerId,
    warehouseId: order.warehouseId,
    status: order.status,
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    total: Number(order.total),
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customer: customer || null,
    warehouse: warehouse || null,
    items,
  };
}

/**
 * Update Sales Order (only allowed if PENDING)
 */
export async function updateSalesOrder(id, data) {
  const numId = Number(id);
  const existingOrder = await getSalesOrderById(numId);

  if (String(existingOrder.status).toUpperCase() !== "PENDING") {
    const error = new Error(
      `Cannot edit sales order with status "${existingOrder.status}". Only PENDING sales orders can be edited.`
    );
    error.statusCode = 400;
    throw error;
  }

  let customerId = existingOrder.customerId;
  if (data.customerId !== undefined) {
    customerId = Number(data.customerId);
    const customer = await db.orm.public.Customer.first({ id: customerId });
    if (!customer) {
      const error = new Error(`Customer with ID ${customerId} not found`);
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
    await tx.orm.public.SalesOrder
      .where({ id: numId })
      .update({
        customerId,
        warehouseId,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        notes,
      });

    if (validatedItems) {
      await tx.orm.public.SalesOrderItem
        .where({ salesOrderId: numId })
        .delete();

      for (const item of validatedItems) {
        await tx.orm.public.SalesOrderItem.create({
          salesOrderId: numId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          total: item.total.toFixed(2),
        });
      }
    }
  });

  return getSalesOrderById(numId);
}

/**
 * Delete / Cancel Sales Order
 */
export async function deleteSalesOrder(id, permanent = false) {
  const numId = Number(id);
  const order = await getSalesOrderById(numId);

  const currentStatus = String(order.status).toUpperCase();
  if (currentStatus === "SHIPPED" || currentStatus === "DELIVERED") {
    const error = new Error(`Cannot delete a ${currentStatus} sales order`);
    error.statusCode = 400;
    throw error;
  }

  if (permanent) {
    await db.transaction(async (tx) => {
      await tx.orm.public.SalesOrderItem
        .where({ salesOrderId: numId })
        .delete();
      await tx.orm.public.SalesOrder
        .where({ id: numId })
        .delete();
    });
    return { id: numId, deleted: true, orderNumber: order.orderNumber };
  }

  // Soft-cancel
  await db.orm.public.SalesOrder
    .where({ id: numId })
    .update({ status: "CANCELLED" });

  return getSalesOrderById(numId);
}

/**
 * Update Sales Order status
 */
export async function updateSalesOrderStatus(id, targetStatus, user = null) {
  const numId = Number(id);
  const normalizedStatus = String(targetStatus).toUpperCase();

  // If shipping, delegate to atomic ship function
  if (normalizedStatus === "SHIPPED") {
    return shipSalesOrder(numId, user);
  }

  await db.orm.public.SalesOrder
    .where({ id: numId })
    .update({ status: normalizedStatus });

  return getSalesOrderById(numId);
}

/**
 * Ship Sales Order & update inventory via transaction
 */
export async function shipSalesOrder(id, user = null) {
  const numId = Number(id);
  const order = await getSalesOrderById(numId);

  const currentStatus = String(order.status).toUpperCase();

  if (currentStatus === "SHIPPED" || currentStatus === "DELIVERED") {
    const error = new Error(`Sales order has already been ${currentStatus.toLowerCase()}`);
    error.statusCode = 400;
    throw error;
  }

  if (currentStatus === "CANCELLED") {
    const error = new Error("Cannot ship a cancelled sales order");
    error.statusCode = 400;
    throw error;
  }

  if (currentStatus !== "CONFIRMED") {
    const error = new Error(`Sales order must be CONFIRMED before shipping. Current status is ${currentStatus}`);
    error.statusCode = 400;
    throw error;
  }

  const performedBy = user?.userId ? Number(user.userId) : null;

  // Execute atomic transaction
  await db.transaction(async (tx) => {
    const allInventories = await tx.orm.public.Inventory.all();

    // 1. Verify stock availability for EVERY product in the selected warehouse first
    for (const item of order.items) {
      const warehouseInventories = allInventories.filter(
        (inv) => inv.productId === item.productId && inv.warehouseId === order.warehouseId
      );

      const totalAvailable = warehouseInventories.reduce((sum, inv) => sum + (inv.quantity || 0), 0);

      if (totalAvailable < item.quantity) {
        const prodName = item.product?.name || `Product #${item.productId}`;
        const error = new Error(
          `Insufficient stock for ${prodName}. Available in selected warehouse: ${totalAvailable}, Requested: ${item.quantity}`
        );
        error.statusCode = 400;
        throw error;
      }
    }

    // 2. Decrement stock and record stock movement for each item
    for (const item of order.items) {
      let needed = item.quantity;

      // Find primary inventory records in warehouse
      const warehouseInventories = allInventories.filter(
        (inv) => inv.productId === item.productId && inv.warehouseId === order.warehouseId
      );

      // Decrement from available inventory records
      for (const inv of warehouseInventories) {
        if (needed <= 0) break;

        const availableInRecord = inv.quantity || 0;
        const toDeduct = Math.min(availableInRecord, needed);

        if (toDeduct > 0) {
          const remaining = availableInRecord - toDeduct;
          await tx.orm.public.Inventory
            .where({ id: inv.id })
            .update({ quantity: remaining });

          inv.quantity = remaining; // update in-memory reference
          needed -= toDeduct;
        }
      }

      // Record Stock Movement (OUT)
      await tx.orm.public.StockMovement.create({
        productId: item.productId,
        warehouseId: order.warehouseId,
        rackId: null,
        quantity: item.quantity,
        type: "OUT",
        referenceNumber: order.orderNumber,
        notes: `Sales Order shipped: ${order.orderNumber}`,
        performedBy,
      });
    }

    // 3. Update Sales Order status to SHIPPED
    await tx.orm.public.SalesOrder
      .where({ id: numId })
      .update({ status: "SHIPPED" });
  });

  // Check inventory threshold notifications for each product
  for (const item of order.items) {
    try {
      const allInvs = await db.orm.public.Inventory.all();
      const productInvs = allInvs.filter(
        (inv) => inv.productId === item.productId && inv.warehouseId === order.warehouseId
      );
      const remainingTotal = productInvs.reduce((sum, inv) => sum + (inv.quantity || 0), 0);

      await notifyInventoryThreshold({
        productId: item.productId,
        warehouseId: order.warehouseId,
        quantity: remainingTotal,
      });
    } catch (err) {
      console.warn("Notification error after SO ship:", err.message);
    }
  }

  return getSalesOrderById(numId);
}
