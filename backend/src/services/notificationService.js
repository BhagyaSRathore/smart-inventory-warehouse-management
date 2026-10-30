import { db } from "../db.ts";
import { sendPushNotification } from "./fcmService.js";

const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function createNotification({
  userId = null,
  type = "SYSTEM_ALERT",
  title = "System alert",
  message = "",
  severity = "INFO",
  actionUrl = null,
  dedupeKey = null,
  metadata = {},
} = {}) {
  const normalizedUserId = userId === undefined || userId === null ? null : Number(userId);
  const normalizedType = String(type || "SYSTEM_ALERT");
  const normalizedTitle = String(title || "System alert");
  const normalizedMessage = String(message || "");
  const normalizedSeverity = String(severity || "INFO");

  const existingNotifications = await db.orm.public.Notification.all();
  const duplicate = existingNotifications.find((notification) => {
    const isSameUser =
      notification.userId === normalizedUserId ||
      (notification.userId == null && normalizedUserId == null);
    const createdAt = new Date(notification.createdAt).getTime();
    const isRecent = !Number.isNaN(createdAt) && Date.now() - createdAt < DUPLICATE_WINDOW_MS;

    if (dedupeKey) {
      const parts = dedupeKey.split("|");
      const keyType = parts[0];
      if (notification.type === keyType) {
        if (parts.length >= 2 && parts[1]) {
          const keyIdentifier = parts[1];
          const hasIdentifier =
            notification.title.includes(keyIdentifier) ||
            notification.message.includes(keyIdentifier);
          if (parts.length >= 3 && parts[2]) {
            const secondaryKey = parts[2].toLowerCase();
            const hasSecondary =
              notification.message.toLowerCase().includes(secondaryKey) ||
              notification.title.toLowerCase().includes(secondaryKey);
            return isSameUser && hasIdentifier && hasSecondary && isRecent;
          }
          return isSameUser && hasIdentifier && isRecent;
        }
      }
    }

    const isSameType = notification.type === normalizedType;
    const isSameTitle = notification.title === normalizedTitle;
    const isSameMessage = notification.message === normalizedMessage;
    return isSameUser && isSameType && isSameTitle && isSameMessage && isRecent;
  });

  if (duplicate) {
    return duplicate;
  }

  const created = await db.orm.public.Notification.create({
    userId: normalizedUserId,
    type: normalizedType,
    title: normalizedTitle,
    message: normalizedMessage,
    severity: normalizedSeverity,
    read: false,
    actionUrl,
  });

  // Determine filter category for mobile navigation
  const isInventory =
    created.type === "LOW_STOCK" ||
    created.type === "OUT_OF_STOCK" ||
    created.type === "INVENTORY_UPDATE";
  const isOrder =
    created.type === "ORDER_CREATED" ||
    created.type === "ORDER_STATUS";
  const filterType = isInventory ? "inventory" : isOrder ? "orders" : "all";

  // Asynchronously trigger FCM push notification
  sendPushNotification({
    title: created.title,
    body: created.message,
    userId: created.userId,
    data: {
      notificationId: String(created.id),
      alertId: String(created.id),
      type: String(created.type),
      severity: String(created.severity),
      actionUrl: String(created.actionUrl || ""),
      route: isInventory ? "RestockAlerts" : "Notifications",
      filter: filterType,
      title: String(created.title),
      message: String(created.message),
      ...metadata,
    },
  }).catch((err) => {
    console.error("[NotificationService] Push notification error:", err?.message || err);
  });

  return created;
}

export async function notifyInventoryThreshold({ productId, warehouseId, quantity }) {
  if (!productId || !warehouseId) {
    return null;
  }

  const product = await db.orm.public.Product.first({ id: Number(productId) });
  if (!product) {
    return null;
  }

  const warehouse = await db.orm.public.Warehouse.first({ id: Number(warehouseId) });
  if (!warehouse) {
    return null;
  }

  const reorderLevel = Number(product.reorderLevel ?? 0);
  const safetyStock = Number(product.safetyStock ?? 0);
  const threshold = Math.max(reorderLevel, safetyStock);

  // If quantity was not explicitly passed, compute current total across all warehouse racks
  let currentQuantity = quantity !== undefined && quantity !== null ? Number(quantity) : null;
  if (currentQuantity === null || Number.isNaN(currentQuantity)) {
    const allInvs = await db.orm.public.Inventory.all();
    const productInvs = allInvs.filter(
      (inv) => Number(inv.productId) === Number(productId) && Number(inv.warehouseId) === Number(warehouseId)
    );
    currentQuantity = productInvs.reduce((sum, inv) => sum + Number(inv.quantity || 0), 0);
  }

  // Find all existing stock alerts for this product & warehouse
  const allNotifications = await db.orm.public.Notification.all();
  const existingStockAlerts = allNotifications.filter((n) => {
    const isStockType =
      n.type === "LOW_STOCK" || n.type === "OUT_OF_STOCK" || n.type === "INVENTORY_UPDATE";
    if (!isStockType) return false;
    const titleLower = (n.title || "").toLowerCase();
    const messageLower = (n.message || "").toLowerCase();
    const prodNameLower = product.name.toLowerCase();
    const whNameLower = warehouse.name.toLowerCase();
    return (
      (titleLower.includes(prodNameLower) || messageLower.includes(prodNameLower)) &&
      messageLower.includes(whNameLower)
    );
  });

  const unreadLowStock = existingStockAlerts.find((n) => n.type === "LOW_STOCK" && !n.read);
  const unreadOutOfStock = existingStockAlerts.find((n) => n.type === "OUT_OF_STOCK" && !n.read);

  // 1. OUT OF STOCK: quantity <= 0
  if (currentQuantity <= 0) {
    // If there was an unread LOW_STOCK notification, mark it as read (escalated to OUT_OF_STOCK)
    if (unreadLowStock) {
      await db.orm.public.Notification.where({ id: unreadLowStock.id }).update({ read: true });
    }

    // If an unread OUT_OF_STOCK already exists, do not create duplicate
    if (unreadOutOfStock) {
      return unreadOutOfStock;
    }

    return createNotification({
      type: "OUT_OF_STOCK",
      title: `Out of stock: ${product.name}`,
      message: `${product.name} is out of stock in ${warehouse.name}. Immediate replenishment is required.`,
      severity: "CRITICAL",
      actionUrl: `/inventory?productId=${productId}&warehouseId=${warehouseId}`,
      dedupeKey: `OUT_OF_STOCK|${productId}|${warehouseId}`,
      metadata: {
        productId: String(productId),
        warehouseId: String(warehouseId),
        productName: product.name,
        warehouseName: warehouse.name,
        currentQuantity: "0",
        threshold: String(threshold),
        reorderLevel: String(reorderLevel),
        safetyStock: String(safetyStock),
      },
    });
  }

  // 2. LOW STOCK: 0 < quantity <= threshold
  if (currentQuantity <= threshold) {
    // If there was an unread OUT_OF_STOCK notification, mark it as read
    if (unreadOutOfStock) {
      await db.orm.public.Notification.where({ id: unreadOutOfStock.id }).update({ read: true });
    }

    const targetSeverity = currentQuantity <= safetyStock ? "WARNING" : "INFO";
    const targetMessage = `${product.name} is running low in ${warehouse.name}. Current quantity: ${currentQuantity}. Reorder threshold: ${threshold}.`;

    // If an unread LOW_STOCK already exists for this product + warehouse:
    // Update its message and severity with the latest quantity so it stays current without creating duplicate notifications!
    if (unreadLowStock) {
      await db.orm.public.Notification.where({ id: unreadLowStock.id }).update({
        message: targetMessage,
        severity: targetSeverity,
        actionUrl: `/inventory?productId=${productId}&warehouseId=${warehouseId}`,
      });
      return unreadLowStock;
    }

    return createNotification({
      type: "LOW_STOCK",
      title: `Low stock: ${product.name}`,
      message: targetMessage,
      severity: targetSeverity,
      actionUrl: `/inventory?productId=${productId}&warehouseId=${warehouseId}`,
      dedupeKey: `LOW_STOCK|${productId}|${warehouseId}`,
      metadata: {
        productId: String(productId),
        warehouseId: String(warehouseId),
        productName: product.name,
        warehouseName: warehouse.name,
        currentQuantity: String(currentQuantity),
        threshold: String(threshold),
        reorderLevel: String(reorderLevel),
        safetyStock: String(safetyStock),
      },
    });
  }

  // 3. RESTOCKED: quantity > threshold
  // If previously low stock or out of stock and now replenished above threshold:
  if (unreadLowStock || unreadOutOfStock) {
    // Mark previous unread low/out of stock alerts as read
    if (unreadLowStock) {
      await db.orm.public.Notification.where({ id: unreadLowStock.id }).update({ read: true });
    }
    if (unreadOutOfStock) {
      await db.orm.public.Notification.where({ id: unreadOutOfStock.id }).update({ read: true });
    }

    // Send a restocked notification
    return createNotification({
      type: "INVENTORY_UPDATE",
      title: `Restocked: ${product.name}`,
      message: `${product.name} in ${warehouse.name} has been replenished. Current quantity: ${currentQuantity}. Reorder threshold: ${threshold}.`,
      severity: "INFO",
      actionUrl: `/inventory?productId=${productId}&warehouseId=${warehouseId}`,
      dedupeKey: `RESTOCKED|${productId}|${warehouseId}`,
      metadata: {
        productId: String(productId),
        warehouseId: String(warehouseId),
        productName: product.name,
        warehouseName: warehouse.name,
        currentQuantity: String(currentQuantity),
        threshold: String(threshold),
        reorderLevel: String(reorderLevel),
        safetyStock: String(safetyStock),
      },
    });
  }

  return false;
}

export async function notifyOrderCreated(orderNumber, items = []) {
  const productNames = items.length
    ? await Promise.all(
        items.map(async (item) => {
          const product = await db.orm.public.Product.first({ id: Number(item.productId) });
          return product ? product.name : `Product #${item.productId}`;
        })
      )
    : [];

  const itemSummary = productNames.length
    ? productNames.slice(0, 3).join(", ") + (productNames.length > 3 ? "..." : "")
    : "inventory items";

  await createNotification({
    type: "ORDER_CREATED",
    title: `New order: ${orderNumber}`,
    message: `Order ${orderNumber} has been created for ${itemSummary}.`,
    severity: "INFO",
    actionUrl: "/orders",
    dedupeKey: `ORDER_CREATED|${orderNumber}`,
    metadata: {
      orderNumber: String(orderNumber),
    },
  });

  return true;
}

export async function notifyOrderStatusChange(orderNumber, status) {
  await createNotification({
    type: "ORDER_STATUS",
    title: `Order update: ${orderNumber}`,
    message: `Order ${orderNumber} is now marked as ${status}.`,
    severity: status === "cancelled" ? "WARNING" : "INFO",
    actionUrl: "/orders",
    dedupeKey: `ORDER_STATUS|${orderNumber}|${status}`,
    metadata: {
      orderNumber: String(orderNumber),
      status: String(status),
    },
  });

  return true;
}
