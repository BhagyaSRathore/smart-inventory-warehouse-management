import { db } from "../db.ts";
import {
  assessRisk,
  predictDemand,
  recommendRestock,
} from "./mlService.js";

const normalize = (value) => String(value ?? "").trim().toLowerCase();

const toIsoString = (value) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
};

const getProductNameHint = (message) => {
  const quotedMatch = message.match(/\b(?:product|item)\s+(?:named\s+)?["']([^"']+)["']/i);
  if (quotedMatch) {
    return quotedMatch[1].trim();
  }

  const unquotedMatch = message.match(/\b(?:product|item)\s+(?:named\s+)?([A-Za-z][A-Za-z0-9 _-]{1,80})/i);
  return unquotedMatch ? unquotedMatch[1].trim() : null;
};

const getMLIntent = (message) => {
  const asksDemand = /\b(?:demand|predict(?:ed|ion)?|forecast)\b/i.test(message);
  const asksRisk = /\b(?:risk|attention|below\s+(?:the\s+)?reorder|low\s+stock)\b/i.test(message);
  const asksRestock = /\b(?:restock|replenish(?:ed|ment)?|replenishment)\b/i.test(message);

  if (!asksDemand && !asksRisk && !asksRestock) {
    return null;
  }

  return {
    asksDemand,
    asksRisk,
    asksRestock,
  };
};

const getPredictionDays = (message) => {
  const daysMatch = message.match(/\b(7|14|30)\s*[- ]?days?\b/i);
  return daysMatch ? Number(daysMatch[1]) : 7;
};

const getProductReference = (message, products) => {
  const productIdMatch = message.match(/\b(?:product|item)(?:\s+id)?\s*#?\s*(\d+)\b/i);
  if (productIdMatch) {
    const productId = Number(productIdMatch[1]);
    return {
      kind: "id",
      value: productId,
      product: products.find((candidate) => candidate.id === productId) || null,
    };
  }

  const skuMatch = message.match(/\bsku\s*[:#-]?\s*([A-Za-z0-9_-]+)\b/i);
  if (skuMatch) {
    const sku = normalize(skuMatch[1]);
    return {
      kind: "sku",
      value: skuMatch[1],
      product: products.find((candidate) => normalize(candidate.sku) === sku) || null,
    };
  }

  const matchingNames = products.filter((candidate) => {
    const name = normalize(candidate.name);
    return name && message.toLowerCase().includes(name);
  });

  const nameHint = getProductNameHint(message);
  if (nameHint) {
    const hintedProducts = products.filter((candidate) => normalize(candidate.name) === normalize(nameHint));
    return {
      kind: "name",
      value: nameHint,
      products: hintedProducts.length ? hintedProducts : matchingNames,
    };
  }

  if (matchingNames.length) {
    return {
      kind: "name",
      value: matchingNames[0].name,
      products: matchingNames,
    };
  }

  return null;
};

const formatProduct = (product) => ({
  id: product.id,
  name: product.name,
  sku: product.sku,
  barcode: product.barcode,
  description: product.description,
  reorderLevel: product.reorderLevel,
  safetyStock: product.safetyStock,
});

const formatInventory = async (inventory) => {
  const warehouse = await db.orm.public.Warehouse.first({
    id: inventory.warehouseId,
  });

  let rack = null;
  if (inventory.rackId) {
    rack = await db.orm.public.Rack.first({
      id: inventory.rackId,
    });
  }

  return {
    inventoryId: inventory.id,
    warehouse: warehouse
      ? {
          id: warehouse.id,
          name: warehouse.name,
          location: warehouse.location,
        }
      : null,
    rack: rack
      ? {
          id: rack.id,
          name: rack.name,
        }
      : null,
    quantity: inventory.quantity,
    updatedAt: toIsoString(inventory.updatedAt),
  };
};

const formatMovement = async (movement) => {
  const warehouse = await db.orm.public.Warehouse.first({
    id: movement.warehouseId,
  });

  let rack = null;
  if (movement.rackId) {
    rack = await db.orm.public.Rack.first({
      id: movement.rackId,
    });
  }

  return {
    id: movement.id,
    type: movement.type,
    quantity: movement.quantity,
    warehouse: warehouse
      ? {
          id: warehouse.id,
          name: warehouse.name,
          location: warehouse.location,
        }
      : null,
    rack: rack
      ? {
          id: rack.id,
          name: rack.name,
        }
      : null,
    referenceNumber: movement.referenceNumber,
    notes: movement.notes,
    createdAt: toIsoString(movement.createdAt),
  };
};

const getMLContext = async (product, inventories, movements, message, intent) => {
  if (!intent) {
    return {
      status: "not_requested",
    };
  }

  const days = getPredictionDays(message);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const historicalDataByDate = new Map();

  for (const movement of movements) {
    if (movement.type !== "OUT") {
      continue;
    }

    const createdAt = new Date(movement.createdAt);
    if (Number.isNaN(createdAt.getTime()) || createdAt < cutoff) {
      continue;
    }

    const date = createdAt.toISOString().slice(0, 10);
    historicalDataByDate.set(
      date,
      (historicalDataByDate.get(date) || 0) + Number(movement.quantity || 0),
    );
  }

  const historicalData = Array.from(historicalDataByDate.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, quantity]) => ({ date, quantity }));
  const currentStock = inventories.reduce(
    (total, inventory) => total + Number(inventory.quantity || 0),
    0,
  );

  try {
    const prediction = await predictDemand({
      productId: product.id,
      days,
      historicalData,
    });

    const mlContext = {
      status: "available",
      days,
      currentStock,
      historicalOutMovementCount: historicalData.length,
      prediction,
    };

    if (intent.asksRisk) {
      const assessment = await assessRisk({
        productId: product.id,
        currentStock,
        predictedDemand: prediction.predictedDemand,
      });

      mlContext.risk = assessment;
    }

    if (intent.asksRestock) {
      mlContext.recommendation = await recommendRestock({
        productId: product.id,
        currentStock,
        predictedDemand: prediction.predictedDemand,
      });
    }

    return mlContext;
  } catch (error) {
    console.error("AI ML context error:", error);
    return {
      status: "unavailable",
      message: "ML service information is currently unavailable.",
    };
  }
};

const getProductContext = async (product, message, intent) => {
  const inventories = await db.orm.public.Inventory.where({
    productId: product.id,
  }).all();
  const movements = await db.orm.public.StockMovement.where({
    productId: product.id,
  }).all();

  const inventoryDetails = await Promise.all(inventories.map(formatInventory));
  const movementDetails = await Promise.all(
    movements
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, 10)
      .map(formatMovement),
  );
  const ml = await getMLContext(product, inventories, movements, message, intent);

  return {
    status: "found",
    product: formatProduct(product),
    totalQuantity: inventoryDetails.reduce((total, inventory) => total + inventory.quantity, 0),
    inventory: inventoryDetails,
    recentStockMovements: movementDetails,
    ml,
  };
};

const getOverviewContext = async (products, intent) => {
  const inventories = await db.orm.public.Inventory.all();
  const warehouses = await db.orm.public.Warehouse.all();
  const movements = await db.orm.public.StockMovement.all();
  const productsById = new Map(products.map((product) => [product.id, product]));
  const warehousesById = new Map(warehouses.map((warehouse) => [warehouse.id, warehouse]));

  const inventoryDetails = inventories.map((inventory) => ({
    product: productsById.has(inventory.productId)
      ? formatProduct(productsById.get(inventory.productId))
      : null,
    warehouse: warehousesById.has(inventory.warehouseId)
      ? {
          id: warehousesById.get(inventory.warehouseId).id,
          name: warehousesById.get(inventory.warehouseId).name,
          location: warehousesById.get(inventory.warehouseId).location,
        }
      : null,
    rackId: inventory.rackId,
    quantity: inventory.quantity,
    updatedAt: toIsoString(inventory.updatedAt),
  }));

  const movementDetails = movements
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 20)
    .map((movement) => ({
      id: movement.id,
      product: productsById.has(movement.productId) ? formatProduct(productsById.get(movement.productId)) : null,
      warehouse: warehousesById.has(movement.warehouseId)
        ? {
            id: warehousesById.get(movement.warehouseId).id,
            name: warehousesById.get(movement.warehouseId).name,
          }
        : null,
      type: movement.type,
      quantity: movement.quantity,
      createdAt: toIsoString(movement.createdAt),
    }));

  return {
    status: "overview",
    products: products.map(formatProduct),
    warehouses: warehouses.map((warehouse) => ({
      id: warehouse.id,
      name: warehouse.name,
      location: warehouse.location,
    })),
    inventory: inventoryDetails,
    recentStockMovements: movementDetails,
    ml: intent
      ? {
          status: "product_required",
          message: "A specific product is required for a demand, risk, or restock analysis.",
        }
      : {
          status: "not_requested",
        },
  };
};

export const getAIContext = async (message) => {
  const products = await db.orm.public.Product.all();
  const intent = getMLIntent(message);
  const reference = getProductReference(message, products);

  if (!reference) {
    return getOverviewContext(products, intent);
  }

  if (reference.kind === "name" && reference.products.length > 1) {
    return {
      status: "ambiguous",
      query: reference.value,
      products: reference.products.map(formatProduct),
    };
  }

  if (!reference.product && reference.kind === "name" && reference.products.length === 1) {
    return getProductContext(reference.products[0], message, intent);
  }

  if (!reference.product) {
    return {
      status: "not_found",
      query: reference.value,
    };
  }

  return getProductContext(reference.product, message, intent);
};