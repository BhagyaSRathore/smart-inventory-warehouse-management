import { db } from "../db.ts";
import { notifyInventoryThreshold } from "../services/notificationService.js";

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
      // Validate rack belongs to warehouse
      if (rack.warehouseId !== Number(warehouseId)) {
        return res.status(400).json({
          message: "Rack does not belong to the specified warehouse",
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

// Stock IN operation
export const stockIn = async (req, res) => {
  try {
    const { productId, warehouseId, rackId, quantity, referenceNumber, notes } = req.body;
    
    // Validation
    if (!productId || !warehouseId || !quantity) {
      return res.status(400).json({
        message: "productId, warehouseId, and quantity are required",
      });
    }
    
    if (quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than zero",
      });
    }
    
    // Verify product exists
    const product = await db.orm.public.Product.first({
      id: Number(productId),
    });
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }
    
    // Verify warehouse exists
    const warehouse = await db.orm.public.Warehouse.first({
      id: Number(warehouseId),
    });
    if (!warehouse) {
      return res.status(404).json({
        message: "Warehouse not found",
      });
    }
    
    // Verify rack if provided
    if (rackId) {
      const rack = await db.orm.public.Rack.first({
        id: Number(rackId),
      });
      if (!rack) {
        return res.status(404).json({
          message: "Rack not found",
        });
      }
      if (rack.warehouseId !== Number(warehouseId)) {
        return res.status(400).json({
          message: "Rack does not belong to the specified warehouse",
        });
      }
    }
    
    // Execute transaction
    let finalInventoryQuantity = quantity;
    await db.transaction(async (tx) => {
      // Find existing inventory
      const existingInventory = await tx.orm.public.Inventory.first({
        productId: Number(productId),
        warehouseId: Number(warehouseId),
        rackId: rackId ? Number(rackId) : null,
      });
      
      if (existingInventory) {
        finalInventoryQuantity = existingInventory.quantity + Number(quantity);
        // Update existing inventory
        await tx.orm.public.Inventory
          .where({ id: existingInventory.id })
          .update({
            quantity: finalInventoryQuantity,
          });
      } else {
        finalInventoryQuantity = Number(quantity);
        // Create new inventory record
        await tx.orm.public.Inventory.create({
          productId: Number(productId),
          warehouseId: Number(warehouseId),
          rackId: rackId ? Number(rackId) : null,
          quantity: finalInventoryQuantity,
        });
      }
      
      // Create stock movement record
      await tx.orm.public.StockMovement.create({
        productId: Number(productId),
        warehouseId: Number(warehouseId),
        rackId: rackId ? Number(rackId) : null,
        quantity: Number(quantity),
        type: "IN",
        referenceNumber: referenceNumber || null,
        notes: notes || null,
        performedBy: req.user?.userId || null,
      });
    });

    await notifyInventoryThreshold({
      productId,
      warehouseId,
      quantity: finalInventoryQuantity,
    });
    
    res.status(200).json({
      message: "Stock in operation completed successfully",
      productId: Number(productId),
      warehouseId: Number(warehouseId),
      quantity: Number(quantity),
    });
  } catch (error) {
    console.error("Stock in error:", error);
    res.status(500).json({
      message: "Failed to complete stock in operation",
      error: error.message,
    });
  }
};

// Stock OUT operation
export const stockOut = async (req, res) => {
  try {
    const { productId, warehouseId, rackId, quantity, referenceNumber, notes } = req.body;
    
    // Validation
    if (!productId || !warehouseId || !quantity) {
      return res.status(400).json({
        message: "productId, warehouseId, and quantity are required",
      });
    }
    
    if (quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than zero",
      });
    }
    
    // Verify product exists
    const product = await db.orm.public.Product.first({
      id: Number(productId),
    });
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }
    
    // Verify warehouse exists
    const warehouse = await db.orm.public.Warehouse.first({
      id: Number(warehouseId),
    });
    if (!warehouse) {
      return res.status(404).json({
        message: "Warehouse not found",
      });
    }
    
    // Find inventory
    const inventory = await db.orm.public.Inventory.first({
      productId: Number(productId),
      warehouseId: Number(warehouseId),
      rackId: rackId ? Number(rackId) : null,
    });
    
    if (!inventory) {
      return res.status(404).json({
        message: "Inventory not found for this product and warehouse",
      });
    }
    
    // Check sufficient quantity
    if (inventory.quantity < Number(quantity)) {
      return res.status(400).json({
        message: `Insufficient stock. Available: ${inventory.quantity}, Requested: ${quantity}`,
        available: inventory.quantity,
        requested: Number(quantity),
      });
    }
    
    const remainingQuantity = inventory.quantity - Number(quantity);

    // Execute transaction
    await db.transaction(async (tx) => {
      // Decrease inventory
      await tx.orm.public.Inventory
        .where({ id: inventory.id })
        .update({
          quantity: remainingQuantity,
        });
      
      // Create stock movement record
      await tx.orm.public.StockMovement.create({
        productId: Number(productId),
        warehouseId: Number(warehouseId),
        rackId: rackId ? Number(rackId) : null,
        quantity: Number(quantity),
        type: "OUT",
        referenceNumber: referenceNumber || null,
        notes: notes || null,
        performedBy: req.user?.userId || null,
      });
    });

    await notifyInventoryThreshold({
      productId,
      warehouseId,
      quantity: remainingQuantity,
    });
    
    res.status(200).json({
      message: "Stock out operation completed successfully",
      productId: Number(productId),
      warehouseId: Number(warehouseId),
      quantity: Number(quantity),
      remainingStock: inventory.quantity - Number(quantity),
    });
  } catch (error) {
    console.error("Stock out error:", error);
    res.status(500).json({
      message: "Failed to complete stock out operation",
      error: error.message,
    });
  }
};

// Warehouse transfer operation
export const transfer = async (req, res) => {
  try {
    const {
      productId,
      sourceWarehouseId,
      sourceRackId,
      destinationWarehouseId,
      destinationRackId,
      quantity,
      referenceNumber,
      notes,
    } = req.body;
    
    // Validation
    if (!productId || !sourceWarehouseId || !destinationWarehouseId || !quantity) {
      return res.status(400).json({
        message: "productId, sourceWarehouseId, destinationWarehouseId, and quantity are required",
      });
    }
    
    if (quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than zero",
      });
    }
    
    // Check if source and destination are the same
    if (
      Number(sourceWarehouseId) === Number(destinationWarehouseId) &&
      (sourceRackId === destinationRackId || (!sourceRackId && !destinationRackId))
    ) {
      return res.status(400).json({
        message: "Source and destination cannot be the same location",
      });
    }
    
    // Verify product exists
    const product = await db.orm.public.Product.first({
      id: Number(productId),
    });
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }
    
    // Verify source warehouse exists
    const sourceWarehouse = await db.orm.public.Warehouse.first({
      id: Number(sourceWarehouseId),
    });
    if (!sourceWarehouse) {
      return res.status(404).json({
        message: "Source warehouse not found",
      });
    }
    
    // Verify destination warehouse exists
    const destinationWarehouse = await db.orm.public.Warehouse.first({
      id: Number(destinationWarehouseId),
    });
    if (!destinationWarehouse) {
      return res.status(404).json({
        message: "Destination warehouse not found",
      });
    }
    
    // Verify source rack if provided
    if (sourceRackId) {
      const rack = await db.orm.public.Rack.first({
        id: Number(sourceRackId),
      });
      if (!rack) {
        return res.status(404).json({
          message: "Source rack not found",
        });
      }
      if (rack.warehouseId !== Number(sourceWarehouseId)) {
        return res.status(400).json({
          message: "Source rack does not belong to source warehouse",
        });
      }
    }
    
    // Verify destination rack if provided
    if (destinationRackId) {
      const rack = await db.orm.public.Rack.first({
        id: Number(destinationRackId),
      });
      if (!rack) {
        return res.status(404).json({
          message: "Destination rack not found",
        });
      }
      if (rack.warehouseId !== Number(destinationWarehouseId)) {
        return res.status(400).json({
          message: "Destination rack does not belong to destination warehouse",
        });
      }
    }
    
    // Find source inventory
    const sourceInventory = await db.orm.public.Inventory.first({
      productId: Number(productId),
      warehouseId: Number(sourceWarehouseId),
      rackId: sourceRackId ? Number(sourceRackId) : null,
    });
    
    if (!sourceInventory) {
      return res.status(404).json({
        message: "Source inventory not found",
      });
    }
    
    // Check sufficient quantity
    if (sourceInventory.quantity < Number(quantity)) {
      return res.status(400).json({
        message: `Insufficient stock at source. Available: ${sourceInventory.quantity}, Requested: ${quantity}`,
        available: sourceInventory.quantity,
        requested: Number(quantity),
      });
    }
    
    // Execute transaction
    await db.transaction(async (tx) => {
      // Decrease source inventory
      await tx.orm.public.Inventory
        .where({ id: sourceInventory.id })
        .update({
          quantity: sourceInventory.quantity - Number(quantity),
        });
      
      // Find or create destination inventory
      const destInventory = await tx.orm.public.Inventory.first({
        productId: Number(productId),
        warehouseId: Number(destinationWarehouseId),
        rackId: destinationRackId ? Number(destinationRackId) : null,
      });
      
      if (destInventory) {
        // Update existing destination inventory
        await tx.orm.public.Inventory
          .where({ id: destInventory.id })
          .update({
            quantity: destInventory.quantity + Number(quantity),
          });
      } else {
        // Create new destination inventory
        await tx.orm.public.Inventory.create({
          productId: Number(productId),
          warehouseId: Number(destinationWarehouseId),
          rackId: destinationRackId ? Number(destinationRackId) : null,
          quantity: Number(quantity),
        });
      }
      
      // Create stock movement record for source (OUT)
      await tx.orm.public.StockMovement.create({
        productId: Number(productId),
        warehouseId: Number(sourceWarehouseId),
        rackId: sourceRackId ? Number(sourceRackId) : null,
        quantity: Number(quantity),
        type: "TRANSFER_OUT",
        referenceNumber: referenceNumber || null,
        notes: notes ? `Transfer to warehouse ${destinationWarehouseId}: ${notes}` : `Transfer to warehouse ${destinationWarehouseId}`,
        performedBy: req.user?.userId || null,
      });
      
      // Create stock movement record for destination (IN)
      await tx.orm.public.StockMovement.create({
        productId: Number(productId),
        warehouseId: Number(destinationWarehouseId),
        rackId: destinationRackId ? Number(destinationRackId) : null,
        quantity: Number(quantity),
        type: "TRANSFER_IN",
        referenceNumber: referenceNumber || null,
        notes: notes ? `Transfer from warehouse ${sourceWarehouseId}: ${notes}` : `Transfer from warehouse ${sourceWarehouseId}`,
        performedBy: req.user?.userId || null,
      });
    });
    
    res.status(200).json({
      message: "Transfer completed successfully",
      productId: Number(productId),
      sourceWarehouseId: Number(sourceWarehouseId),
      destinationWarehouseId: Number(destinationWarehouseId),
      quantity: Number(quantity),
    });
  } catch (error) {
    console.error("Transfer error:", error);
    res.status(500).json({
      message: "Failed to complete transfer operation",
      error: error.message,
    });
  }
};

// Inventory adjustment operation
export const adjustment = async (req, res) => {
  try {
    const { productId, warehouseId, rackId, newQuantity, reason } = req.body;
    
    // Validation
    if (!productId || !warehouseId || newQuantity === undefined) {
      return res.status(400).json({
        message: "productId, warehouseId, and newQuantity are required",
      });
    }
    
    if (newQuantity < 0) {
      return res.status(400).json({
        message: "New quantity cannot be negative",
      });
    }
    
    if (!reason) {
      return res.status(400).json({
        message: "Reason is required for inventory adjustment",
      });
    }
    
    // Verify product exists
    const product = await db.orm.public.Product.first({
      id: Number(productId),
    });
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }
    
    // Verify warehouse exists
    const warehouse = await db.orm.public.Warehouse.first({
      id: Number(warehouseId),
    });
    if (!warehouse) {
      return res.status(404).json({
        message: "Warehouse not found",
      });
    }
    
    // Verify rack if provided
    if (rackId) {
      const rack = await db.orm.public.Rack.first({
        id: Number(rackId),
      });
      if (!rack) {
        return res.status(404).json({
          message: "Rack not found",
        });
      }
      if (rack.warehouseId !== Number(warehouseId)) {
        return res.status(400).json({
          message: "Rack does not belong to the specified warehouse",
        });
      }
    }
    
    // Find existing inventory
    const inventory = await db.orm.public.Inventory.first({
      productId: Number(productId),
      warehouseId: Number(warehouseId),
      rackId: rackId ? Number(rackId) : null,
    });
    
    if (!inventory) {
      return res.status(404).json({
        message: "Inventory not found for this product and warehouse",
      });
    }
    
    const oldQuantity = inventory.quantity;
    const adjustmentQuantity = Number(newQuantity) - oldQuantity;
    
    // Execute transaction
    await db.transaction(async (tx) => {
      // Update inventory to new quantity
      await tx.orm.public.Inventory
        .where({ id: inventory.id })
        .update({
          quantity: Number(newQuantity),
        });
      
      // Create stock movement record
      await tx.orm.public.StockMovement.create({
        productId: Number(productId),
        warehouseId: Number(warehouseId),
        rackId: rackId ? Number(rackId) : null,
        quantity: Math.abs(adjustmentQuantity),
        type: "ADJUSTMENT",
        referenceNumber: null,
        notes: `Adjustment: ${oldQuantity} → ${newQuantity}. Reason: ${reason}`,
        performedBy: req.user?.userId || null,
      });
    });
    
    res.status(200).json({
      message: "Inventory adjustment completed successfully",
      productId: Number(productId),
      warehouseId: Number(warehouseId),
      oldQuantity,
      newQuantity: Number(newQuantity),
      adjustment: adjustmentQuantity,
    });
  } catch (error) {
    console.error("Adjustment error:", error);
    res.status(500).json({
      message: "Failed to complete adjustment operation",
      error: error.message,
    });
  }
};

// Get low stock items
export const getLowStock = async (req, res) => {
  try {
    // Get all inventory with product details
    const inventories = await db.orm.public.Inventory.all();
    
    // Get all products to check reorder levels
    const products = await db.orm.public.Product.all();
    
    // Create a product map for quick lookup
    const productMap = {};
    products.forEach(product => {
      productMap[product.id] = product;
    });
    
    // Filter low stock items
    const lowStockItems = inventories.filter(inv => {
      const product = productMap[inv.productId];
      if (!product) return false;
      return inv.quantity <= product.reorderLevel;
    });
    
    // Enrich with product and warehouse details
    const enrichedItems = await Promise.all(
      lowStockItems.map(async (inv) => {
        const product = productMap[inv.productId];
        const warehouse = await db.orm.public.Warehouse.first({
          id: inv.warehouseId,
        });
        
        let rack = null;
        if (inv.rackId) {
          rack = await db.orm.public.Rack.first({
            id: inv.rackId,
          });
        }
        
        return {
          inventoryId: inv.id,
          productId: inv.productId,
          productName: product.name,
          sku: product.sku,
          currentQuantity: inv.quantity,
          reorderLevel: product.reorderLevel,
          safetyStock: product.safetyStock,
          warehouseId: inv.warehouseId,
          warehouseName: warehouse?.name,
          rackId: inv.rackId,
          rackName: rack?.name,
          status: inv.quantity === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
        };
      })
    );
    
    res.status(200).json({
      message: "Low stock items fetched successfully",
      count: enrichedItems.length,
      items: enrichedItems,
    });
  } catch (error) {
    console.error("Get low stock error:", error);
    res.status(500).json({
      message: "Failed to fetch low stock items",
      error: error.message,
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

