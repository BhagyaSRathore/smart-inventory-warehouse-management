import { db } from "../db.ts";

export const createInventory = async (req, res) => {
  try {
    const { productId, warehouseId, rackId, quantity } = req.body;
    if (!productId || !warehouseId) {
      return res.status(400).json({
        message: "productId and warehouseId are required",
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
    if (rackId) {
      const rack = await db.orm.public.Rack.first({
        id: Number(rackId),
      });
      if (!rack) {
        return res.status(404).json({
          message: "Rack not found",
        });
      }
    }
    const inventory = await db.orm.public.Inventory.create({
      productId: Number(productId),
      warehouseId: Number(warehouseId),
      rackId: rackId ? Number(rackId) : null,
      quantity: quantity ?? 0,
    });
    res.status(201).json({
      message: "Inventory created successfully",
      inventory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create inventory",
    });
  }
};

export const getInventories = async (req, res) => {
  try {
    const inventories = await db.orm.public.Inventory.all();
    res.json({
      message: "Inventory fetched successfully",
      inventories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch inventory",
    });
  }
};

export const getInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const inventory = await db.orm.public.Inventory.first({
      id: Number(id),
    });
    if (!inventory) {
      return res.status(404).json({
        message: "Inventory not found",
      });
    }
    res.json({
      message: "Inventory fetched successfully",
      inventory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch inventory",
    });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, warehouseId, rackId, quantity } = req.body;
    const existingInventory = await db.orm.public.Inventory.first({
      id: Number(id),
    });
    if (!existingInventory) {
      return res.status(404).json({
        message: "Inventory not found",
      });
    }
    const inventory = await db.orm.public.Inventory
      .where({ id: Number(id) })
      .update({
        productId: Number(productId),
        warehouseId: Number(warehouseId),
        rackId: rackId ? Number(rackId) : null,
        quantity,
      });
    res.json({
      message: "Inventory updated successfully",
      inventory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update inventory",
    });
  }
};

export const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const existingInventory = await db.orm.public.Inventory.first({
      id: Number(id),
    });
    if (!existingInventory) {
      return res.status(404).json({
        message: "Inventory not found",
      });
    }
    await db.orm.public.Inventory
      .where({ id: Number(id) })
      .delete();
    res.json({
      message: "Inventory deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to delete inventory",
    });
  }
};