// Backend API connection
const API_BASE_URL = "http://localhost:5000/api";

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
      ...options.headers,
    },
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data.message || "API request failed");
    error.status = response.status;
    throw error;
  }

  return data;
}

export const getProductsFromBackend = () =>
  apiRequest("/products");

export const getCategoriesFromBackend = () =>
  apiRequest("/categories");

export const getSuppliersFromBackend = () =>
  apiRequest("/suppliers");

export const getWarehousesFromBackend = () =>
  apiRequest("/warehouses");

export const getRacksFromBackend = () =>
  apiRequest("/racks");

export const getInventoryFromBackend = () =>
  apiRequest("/inventory");

export const getStockMovementsFromBackend = () =>
  apiRequest("/stock-movements");

export const getOrdersFromBackend = () =>
  apiRequest("/orders");

export const getDashboardFromBackend = () =>
  apiRequest("/dashboard");

// Existing demo API code below
// API Service Layer
// Currently returns demo data

// API Service Layer
// Currently returns demo data
// Will be replaced with actual API calls when backend is ready

import { products, categories } from '../data/products';
import { warehouses } from '../data/warehouses';
import { inventory } from '../data/inventory';
import { suppliers } from '../data/suppliers';
import { stockMovements } from '../data/stockMovements';
import { orders } from '../data/orders';
import { predictions } from '../data/predictions';
import { restockRecommendations } from '../data/restock';

// Products
export function getProducts() {
  return products;
}

export function getProductById(id) {
  return products.find(p => p.id === id || p.sku === id);
}

export function getCategories() {
  return categories;
}

// Warehouses
export function getWarehouses() {
  return warehouses;
}

export function getWarehouseById(id) {
  return warehouses.find(w => w.id === id);
}

// Inventory
export function getInventory() {
  return inventory;
}

export function getInventoryByProduct(productId) {
  return inventory.filter(inv => inv.productId === productId);
}

export function getInventoryByWarehouse(warehouseId) {
  return inventory.filter(inv => inv.warehouseId === warehouseId);
}

// Suppliers
export function getSuppliers() {
  return suppliers;
}

export function getSupplierById(id) {
  return suppliers.find(s => s.id === id);
}

// Stock Movements
export function getStockMovements() {
  return stockMovements;
}

export function getStockMovementsByProduct(productId) {
  return stockMovements.filter(sm => sm.productId === productId);
}

// Orders
export function getOrders() {
  return orders;
}

export function getOrderById(id) {
  return orders.find(o => o.id === id);
}

export function getPurchaseOrders() {
  return orders.filter(o => o.type === 'purchase');
}

export function getSalesOrders() {
  return orders.filter(o => o.type === 'sales');
}

// Predictions
export function getPredictions() {
  return predictions;
}

export function getPredictionByProduct(productId) {
  return predictions.find(p => p.productId === productId);
}

// Restock
export function getRestockRecommendations() {
  return restockRecommendations;
}

export function getRestockByProduct(productId) {
  return restockRecommendations.find(r => r.productId === productId);
}

// AI Assistant
export const askAI = (question) =>
  apiRequest("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message: question }),
  });

// Dashboard Statistics
export function getDashboardStats() {
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.currentStock, 0);
  const lowStockProducts = products.filter(p => p.status === 'low_stock').length;
  const outOfStockProducts = products.filter(p => p.status === 'out_of_stock').length;
  const pendingPurchases = orders.filter(o => o.type === 'purchase' && o.status === 'pending').length;
  
  return {
    totalProducts,
    totalStock,
    lowStockProducts,
    outOfStockProducts,
    pendingPurchases,
    salesToday: 12450,
    salesThisMonth: 156780
  };
}
