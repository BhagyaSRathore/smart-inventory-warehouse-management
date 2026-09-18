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
    
    // Create a product map for quick lookup
    const productMap = {};
    products.forEach(product => {
      productMap[product.id] = product;
    });
    
    // Calculate low stock using product.reorderLevel
    const lowStockProducts = inventories.filter(
      (item) => {
        const product = productMap[item.productId];
        if (!product) return false;
        return item.quantity <= product.reorderLevel;
      }
    );
    
    // Calculate out of stock
    const outOfStockProducts = inventories.filter(
      (item) => item.quantity === 0
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
        outOfStockCount: outOfStockProducts.length,
        pendingOrders: pendingOrders.length,
        totalOrders: orders.length,
      },
      lowStockProducts,
      outOfStockProducts,
      recentStockMovements: movements.slice(-10),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch dashboard data",
    });
  }
};
