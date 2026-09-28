import { db } from "../db.ts";
import { notifyOrderCreated } from "../services/notificationService.js";

export const createOrder = async (req, res) => {
  try {
    const { orderNumber, status, items } = req.body;
    if (!orderNumber || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "orderNumber and items are required",
      });
    }
    const existingOrder = await db.orm.public.Order.first({
      orderNumber,
    });
    if (existingOrder) {
      return res.status(409).json({
        message: "Order with this order number already exists",
      });
    }
    for (const item of items) {
      const product = await db.orm.public.Product.first({
        id: Number(item.productId),
      });
      if (!product) {
        return res.status(404).json({
          message: `Product ${item.productId} not found`,
        });
      }
    }
    const order = await db.orm.public.Order.create({
      orderNumber,
      status: status || "pending",
    });
    for (const item of items) {
      await db.orm.public.OrderItem.create({
        orderId: order.id,
        productId: Number(item.productId),
        quantity: Number(item.quantity),
      });
    }

    await notifyOrderCreated(orderNumber, items);

    res.status(201).json({
      message: "Order created successfully",
      order,
      items,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create order",
    });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await db.orm.public.Order.all();
    res.json({
      message: "Orders fetched successfully",
      orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
};

export const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db.orm.public.Order.first({
      id: Number(id),
    });
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }
    res.json({
      message: "Order fetched successfully",
      order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch order",
    });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderNumber, status } = req.body;
    const existingOrder = await db.orm.public.Order.first({
      id: Number(id),
    });
    if (!existingOrder) {
      return res.status(404).json({
        message: "Order not found",
      });
    }
    const order = await db.orm.public.Order
      .where({ id: Number(id) })
      .update({
        orderNumber,
        status,
      });

    if (status) {
      const { notifyOrderStatusChange } = await import("../services/notificationService.js");
      await notifyOrderStatusChange(orderNumber || existingOrder.orderNumber, status);
    }

    res.json({
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update order",
    });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const existingOrder = await db.orm.public.Order.first({
      id: Number(id),
    });
    if (!existingOrder) {
      return res.status(404).json({
        message: "Order not found",
      });
    }
    await db.orm.public.OrderItem
      .where({ orderId: Number(id) })
      .delete();
    await db.orm.public.Order
      .where({ id: Number(id) })
      .delete();
    res.json({
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to delete order",
    });
  }
};