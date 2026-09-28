import { db } from "../db.ts";

const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function createNotification({
  userId = null,
  type = "SYSTEM_ALERT",
  title = "System alert",
  message = "",
  severity = "INFO",
  actionUrl = null,
  dedupeKey = null,
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
    const isSameType = notification.type === normalizedType;
    const isSameTitle = notification.title === normalizedTitle;
    const isSameMessage = notification.message === normalizedMessage;
    const createdAt = new Date(notification.createdAt).getTime();
    const isRecent = !Number.isNaN(createdAt) && Date.now() - createdAt < DUPLICATE_WINDOW_MS;

    if (dedupeKey) {
      const notificationDedupeKey = `${notification.type}|${notification.title}|${notification.message}|${notification.userId ?? "all"}`;
      return notificationDedupeKey === dedupeKey && isRecent;
    }

    return isSameUser && isSameType && isSameTitle && isSameMessage && isRecent;
  });

  if (duplicate) {
    return duplicate;
  }

  return db.orm.public.Notification.create({
    userId: normalizedUserId,
    type: normalizedType,
    title: normalizedTitle,
    message: normalizedMessage,
    severity: normalizedSeverity,
    read: false,
    actionUrl,
  });
}

export async function notifyInventoryThreshold({ productId, warehouseId, quantity }) {
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

  if (quantity <= 0) {
    await createNotification({
      type: "OUT_OF_STOCK",
      title: `Out of stock: ${product.name}`,
      message: `${product.name} is out of stock in ${warehouse.name}. Immediate replenishment is required.`,
      severity: "CRITICAL",
      actionUrl: "/inventory",
      dedupeKey: `OUT_OF_STOCK|${productId}|${warehouseId}`,
    });
    return true;
  }

  if (quantity <= threshold) {
    await createNotification({
      type: "LOW_STOCK",
      title: `Low stock: ${product.name}`,
      message: `${product.name} is running low in ${warehouse.name}. Current quantity: ${quantity}. Reorder threshold: ${threshold}.`,
      severity: quantity <= safetyStock ? "WARNING" : "INFO",
      actionUrl: "/inventory",
      dedupeKey: `LOW_STOCK|${productId}|${warehouseId}`,
    });
    return true;
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
  });

  return true;
}
