import { db } from "../../prisma/db.ts";

export const createStockMovement = async (req, res) => {
  try {
    const { productId, warehouseId, quantity, type } = req.body;
    if (!productId || !warehouseId || !quantity || !type) {
      return res.status(400).json({
        message: "productId, warehouseId, quantity and type are required",
      });
    }
    if (!["IN", "OUT"].includes(type)) {
      return res.status(400).json({
        message: "Type must be IN or OUT",
      });
    }
    const product = await db.orm.public.Product.first({
      id: Number(productId),
    });
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }
    const warehouse = await db.orm.public.Warehouse.first({
      id: Number(warehouseId),
    });
    if (!warehouse) {
      return res.status(404).json({
        message: "Warehouse not found",
      });
    }
    const movement = await db.orm.public.StockMovement.create({
      productId: Number(productId),
      warehouseId: Number(warehouseId),
      quantity: Number(quantity),
      type,
    });
    res.status(201).json({
      message: "Stock movement created successfully",
      movement,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create stock movement",
    });
  }
};

export const getStockMovements = async (req, res) => {
  try {
    const movements = await db.orm.public.StockMovement.all();
    res.json({
      message: "Stock movements fetched successfully",
      movements,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch stock movements",
    });
  }
};

export const getStockMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const movement = await db.orm.public.StockMovement.first({
      id: Number(id),
    });
    if (!movement) {
      return res.status(404).json({
        message: "Stock movement not found",
      });
    }
    res.json({
      message: "Stock movement fetched successfully",
      movement,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch stock movement",
    });
  }
};

export const updateStockMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, warehouseId, quantity, type } = req.body;
    const existingMovement = await db.orm.public.StockMovement.first({
      id: Number(id),
    });
    if (!existingMovement) {
      return res.status(404).json({
        message: "Stock movement not found",
      });
    }
    if (!["IN", "OUT"].includes(type)) {
      return res.status(400).json({
        message: "Type must be IN or OUT",
      });
    }
    const movement = await db.orm.public.StockMovement
      .where({ id: Number(id) })
      .update({
        productId: Number(productId),
        warehouseId: Number(warehouseId),
        quantity: Number(quantity),
        type,
      });
    res.json({
      message: "Stock movement updated successfully",
      movement,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update stock movement",
    });
  }
};

export const deleteStockMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const existingMovement = await db.orm.public.StockMovement.first({
      id: Number(id),
    });
    if (!existingMovement) {
      return res.status(404).json({
        message: "Stock movement not found",
      });
    }
    await db.orm.public.StockMovement
      .where({ id: Number(id) })
      .delete();
    res.json({
      message: "Stock movement deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to delete stock movement",
    });
  }
};