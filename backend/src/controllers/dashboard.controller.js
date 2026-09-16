import { db } from "../db.ts";

export const getDashboard = async (req, res) => {
  try {
    const products = await db.orm.public.Product.all();
    const warehouses = await db.orm.public.Warehouse.all();
    const inventories = await db.orm.public.Inventory.all();
    const orders = await db.orm.public.Order.all();
    const movements = await db.orm.public.StockMovement.all();
    const totalStock = inventories.reduce(
      (total, item) => total + item.quantity,
      0
    );
    const lowStockProducts = inventories.filter(
      (item) => item.quantity < 10
    );
    const pendingOrders = orders.filter(
      (order) => order.status === "pending"
    );
    res.json({
      message: "Dashboard data fetched successfully",
      summary: {
        totalProducts: products.length,
        totalWarehouses: warehouses.length,
        totalStock,
        lowStockCount: lowStockProducts.length,
        pendingOrders: pendingOrders.length,
        totalOrders: orders.length,
      },
      lowStockProducts,
      recentStockMovements: movements.slice(-5),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch dashboard data",
    });
  }
};