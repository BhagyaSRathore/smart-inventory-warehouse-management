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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
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
export function askAI(question) {
  // Demo responses for common questions
  const responses = {
    'low stock': 'Based on current inventory data, you have 12 products with low stock levels:\n\n1. USB-C Cable 2m (12 units)\n2. Webcam HD (18 units)\n3. Ballpoint Pen Set (22 units)\n4. Mechanical Keyboard (35 units)\n\nI recommend prioritizing restocking USB-C Cable 2m as it has the highest predicted demand.',
    
    'restock': 'Here are the top 5 products requiring immediate restocking:\n\n1. USB-C Hub (Critical - Out of stock)\n2. Desk Lamp LED (Critical - Out of stock)\n3. USB-C Cable 2m (Critical - Only 12 units left)\n4. Mechanical Keyboard (High priority - 35 units)\n5. Webcam HD (High priority - 18 units)\n\nWould you like me to generate purchase orders for these items?',
    
    'warehouse': 'Warehouse B in Delhi NCR currently has the most stock with 9,500 units (63% capacity utilization). It holds 685 different products across 5 racks.\n\nWarehouse A in Jaipur has 7,200 units (72% utilization) and Warehouse C in Mumbai has 4,800 units (60% utilization).',
    
    'run out': 'Based on ML predictions, these products may run out in the next 7 days:\n\n1. USB-C Hub - Already out of stock\n2. Desk Lamp LED - Already out of stock\n3. USB-C Cable 2m - Will run out in 2-3 days\n4. Webcam HD - Will reach critical levels in 4-5 days\n5. Ballpoint Pen Set - Will reach low stock in 5-6 days',
    
    'risk': 'Product M101 (Wireless Mouse) currently shows LOW risk because:\n\n• Current stock: 145 units\n• Predicted 7-day demand: 32 units\n• Predicted 30-day demand: 135 units\n• Reorder level: 50 units\n• Demand trend: Increasing\n\nThe stock level is well above the reorder point and can cover more than 30 days of expected demand. However, monitor the increasing trend closely.',
    
    'default': 'I\'m your AI Inventory Assistant. I can help you with:\n\n• Identifying low stock products\n• Recommending restock quantities\n• Analyzing warehouse capacity\n• Predicting stock risks\n• Explaining demand trends\n• Optimizing inventory levels\n\nWhat would you like to know?'
  };

  // Simple keyword matching for demo
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('low') && lowerQuestion.includes('stock')) {
    return responses['low stock'];
  }
  if (lowerQuestion.includes('restock') || lowerQuestion.includes('replenish')) {
    return responses['restock'];
  }
  if (lowerQuestion.includes('warehouse') || lowerQuestion.includes('most stock')) {
    return responses['warehouse'];
  }
  if (lowerQuestion.includes('run out') || lowerQuestion.includes('run-out')) {
    return responses['run out'];
  }
  if (lowerQuestion.includes('risk') || lowerQuestion.includes('m101')) {
    return responses['risk'];
  }
  
  return responses['default'];
}

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
