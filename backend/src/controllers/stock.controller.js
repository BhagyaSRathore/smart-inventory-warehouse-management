import { db } from "../db.ts";

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
    const { type, search, productId, warehouseId } = req.query;

    const allMovements = await db.orm.public.StockMovement.all();
    const allProducts = await db.orm.public.Product.all();
    const allWarehouses = await db.orm.public.Warehouse.all();
    const allRacks = await db.orm.public.Rack.all();
    const allUsers = await db.orm.public.User.all();

    const productMap = new Map();
    allProducts.forEach((p) => {
      productMap.set(p.id, {
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        price: p.price,
      });
    });

    const warehouseMap = new Map();
    allWarehouses.forEach((w) => {
      warehouseMap.set(w.id, {
        id: w.id,
        name: w.name,
        location: w.location,
      });
    });

    const rackMap = new Map();
    allRacks.forEach((r) => {
      rackMap.set(r.id, {
        id: r.id,
        name: r.name,
      });
    });

    const userMap = new Map();
    allUsers.forEach((u) => {
      userMap.set(u.id, {
        id: u.id,
        name: u.name,
        email: u.email,
      });
    });

    let enriched = allMovements.map((m) => ({
      ...m,
      product: productMap.get(m.productId) || null,
      warehouse: warehouseMap.get(m.warehouseId) || null,
      rack: m.rackId ? rackMap.get(m.rackId) || null : null,
      user: m.performedBy ? userMap.get(m.performedBy) || null : null,
    }));

    if (type && type !== "ALL") {
      const upperType = String(type).toUpperCase();
      if (upperType === "TRANSFER" || upperType === "TRANSFER_IN" || upperType === "TRANSFER_OUT") {
        enriched = enriched.filter(
          (m) =>
            m.type === "TRANSFER_IN" ||
            m.type === "TRANSFER_OUT" ||
            m.type === "TRANSFER"
        );
      } else {
        enriched = enriched.filter((m) => m.type === upperType);
      }
    }

    if (productId) {
      enriched = enriched.filter((m) => m.productId === Number(productId));
    }

    if (warehouseId) {
      enriched = enriched.filter((m) => m.warehouseId === Number(warehouseId));
    }

    if (search) {
      const q = String(search).toLowerCase();
      enriched = enriched.filter((m) => {
        const prodName = m.product?.name?.toLowerCase() || "";
        const prodSku = m.product?.sku?.toLowerCase() || "";
        const prodBarcode = m.product?.barcode?.toLowerCase() || "";
        const ref = m.referenceNumber?.toLowerCase() || "";
        const notes = m.notes?.toLowerCase() || "";
        return (
          prodName.includes(q) ||
          prodSku.includes(q) ||
          prodBarcode.includes(q) ||
          ref.includes(q) ||
          notes.includes(q)
        );
      });
    }

    // Sort descending by createdAt
    enriched.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({
      message: "Stock movements fetched successfully",
      movements: enriched,
    });
  } catch (error) {
    console.error("Failed to fetch stock movements:", error);
    res.status(500).json({
      message: "Failed to fetch stock movements",
      error: error.message,
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

    const product = await db.orm.public.Product.first({
      id: movement.productId,
    });
    const warehouse = await db.orm.public.Warehouse.first({
      id: movement.warehouseId,
    });
    let rack = null;
    if (movement.rackId) {
      rack = await db.orm.public.Rack.first({
        id: movement.rackId,
      });
    }
    let user = null;
    if (movement.performedBy) {
      user = await db.orm.public.User.first({
        id: movement.performedBy,
      });
    }

    res.json({
      message: "Stock movement fetched successfully",
      movement: {
        ...movement,
        product: product
          ? {
              id: product.id,
              name: product.name,
              sku: product.sku,
              barcode: product.barcode,
              price: product.price,
            }
          : null,
        warehouse: warehouse
          ? {
              id: warehouse.id,
              name: warehouse.name,
              location: warehouse.location,
            }
          : null,
        rack: rack ? { id: rack.id, name: rack.name } : null,
        user: user
          ? { id: user.id, name: user.name, email: user.email }
          : null,
      },
    });
  } catch (error) {
    console.error("Failed to fetch stock movement:", error);
    res.status(500).json({
      message: "Failed to fetch stock movement",
      error: error.message,
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