// Backend API connection
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Helper function for API requests
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
    error.data = data;
    throw error;
  }

  return data;
}

// ============================================
// AUTHENTICATION
// ============================================

export const register = (userData) =>
  apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });

export const login = (credentials) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

// ============================================
// PRODUCTS
// ============================================

export const getProducts = async () => {
  try {
    const response = await apiRequest("/products");
    return response.products || [];
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
};

export const getProductById = async (id) => {
  try {
    const response = await apiRequest(`/products/${id}`);
    return response.product;
  } catch (error) {
    console.error(`Failed to fetch product ${id}:`, error);
    return null;
  }
};

export const getProductByBarcode = async (barcode) => {
  try {
    const response = await apiRequest(`/products/barcode/${barcode}`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch product by barcode ${barcode}:`, error);
    throw error;
  }
};

export const createProduct = (productData) =>
  apiRequest("/products", {
    method: "POST",
    body: JSON.stringify(productData),
  });

export const updateProduct = (id, productData) =>
  apiRequest(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(productData),
  });

export const deleteProduct = (id) =>
  apiRequest(`/products/${id}`, {
    method: "DELETE",
  });

// ============================================
// CATEGORIES
// ============================================

export const getCategories = async () => {
  try {
    const response = await apiRequest("/categories");
    return response.categories || [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
};

export const createCategory = (categoryData) =>
  apiRequest("/categories", {
    method: "POST",
    body: JSON.stringify(categoryData),
  });

// ============================================
// SUPPLIERS
// ============================================

export const getSuppliers = async () => {
  try {
    const response = await apiRequest("/suppliers");
    return response.suppliers || [];
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);
    return [];
  }
};

export const getSupplierById = async (id) => {
  try {
    const response = await apiRequest(`/suppliers/${id}`);
    return response.supplier;
  } catch (error) {
    console.error(`Failed to fetch supplier ${id}:`, error);
    return null;
  }
};

export const createSupplier = (supplierData) =>
  apiRequest("/suppliers", {
    method: "POST",
    body: JSON.stringify(supplierData),
  });

// ============================================
// WAREHOUSES
// ============================================

export const getWarehouses = async () => {
  try {
    const response = await apiRequest("/warehouses");
    return response.warehouses || [];
  } catch (error) {
    console.error("Failed to fetch warehouses:", error);
    return [];
  }
};

export const getWarehouseById = async (id) => {
  try {
    const response = await apiRequest(`/warehouses/${id}`);
    return response.warehouse;
  } catch (error) {
    console.error(`Failed to fetch warehouse ${id}:`, error);
    return null;
  }
};

export const createWarehouse = (warehouseData) =>
  apiRequest("/warehouses", {
    method: "POST",
    body: JSON.stringify(warehouseData),
  });

// ============================================
// RACKS
// ============================================

export const getRacks = async () => {
  try {
    const response = await apiRequest("/racks");
    return response.racks || [];
  } catch (error) {
    console.error("Failed to fetch racks:", error);
    return [];
  }
};

// ============================================
// INVENTORY
// ============================================

export const getInventory = async () => {
  try {
    const response = await apiRequest("/inventory");
    return response.inventories || [];
  } catch (error) {
    console.error("Failed to fetch inventory:", error);
    return [];
  }
};

export const getInventoryByProduct = async (productId) => {
  try {
    const inventory = await getInventory();
    return inventory.filter(inv => inv.productId === Number(productId));
  } catch (error) {
    console.error(`Failed to fetch inventory for product ${productId}:`, error);
    return [];
  }
};

export const getInventoryByWarehouse = async (warehouseId) => {
  try {
    const inventory = await getInventory();
    return inventory.filter(inv => inv.warehouseId === Number(warehouseId));
  } catch (error) {
    console.error(`Failed to fetch inventory for warehouse ${warehouseId}:`, error);
    return [];
  }
};

export const getLowStock = async () => {
  try {
    const response = await apiRequest("/inventory/low-stock");
    return response.items || [];
  } catch (error) {
    console.error("Failed to fetch low stock items:", error);
    return [];
  }
};

// Stock Operations
export const stockIn = (stockData) =>
  apiRequest("/inventory/stock-in", {
    method: "POST",
    body: JSON.stringify(stockData),
  });

export const stockOut = (stockData) =>
  apiRequest("/inventory/stock-out", {
    method: "POST",
    body: JSON.stringify(stockData),
  });

export const transferStock = (transferData) =>
  apiRequest("/inventory/transfer", {
    method: "POST",
    body: JSON.stringify(transferData),
  });

export const adjustInventory = (adjustmentData) =>
  apiRequest("/inventory/adjustment", {
    method: "POST",
    body: JSON.stringify(adjustmentData),
  });

// ============================================
// STOCK MOVEMENTS
// ============================================

export const getStockMovements = async () => {
  try {
    const response = await apiRequest("/stock-movements");
    return response.movements || [];
  } catch (error) {
    console.error("Failed to fetch stock movements:", error);
    return [];
  }
};

export const getStockMovementsByProduct = async (productId) => {
  try {
    const movements = await getStockMovements();
    return movements.filter(sm => sm.productId === Number(productId));
  } catch (error) {
    console.error(`Failed to fetch movements for product ${productId}:`, error);
    return [];
  }
};

// ============================================
// ORDERS
// ============================================

export const getOrders = async () => {
  try {
    const response = await apiRequest("/orders");
    return response.orders || [];
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return [];
  }
};

export const getOrderById = async (id) => {
  try {
    const response = await apiRequest(`/orders/${id}`);
    return response.order;
  } catch (error) {
    console.error(`Failed to fetch order ${id}:`, error);
    return null;
  }
};

export const getPurchaseOrders = async () => {
  try {
    const orders = await getOrders();
    return orders.filter(o => o.type === 'purchase');
  } catch (error) {
    console.error("Failed to fetch purchase orders:", error);
    return [];
  }
};

export const getSalesOrders = async () => {
  try {
    const orders = await getOrders();
    return orders.filter(o => o.type === 'sales');
  } catch (error) {
    console.error("Failed to fetch sales orders:", error);
    return [];
  }
};

export const createOrder = (orderData) =>
  apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });

// ============================================
// DASHBOARD
// ============================================

export const getDashboardStats = async () => {
  try {
    const response = await apiRequest("/dashboard");
    return response.summary || {};
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return {
      totalProducts: 0,
      totalWarehouses: 0,
      totalStock: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      pendingOrders: 0,
      totalOrders: 0,
    };
  }
};

export const getDashboard = async () => {
  try {
    const response = await apiRequest("/dashboard");
    return response;
  } catch (error) {
    console.error("Failed to fetch dashboard:", error);
    return {
      summary: {},
      lowStockProducts: [],
      outOfStockProducts: [],
      recentStockMovements: [],
    };
  }
};

// ============================================
// PREDICTIONS & RESTOCK (Future ML Integration)
// ============================================

export const getPredictions = async () => {
  // TODO: Implement when ML service is ready
  console.warn("ML predictions not yet implemented");
  return [];
};

export const getPredictionByProduct = async (productId) => {
  // TODO: Implement when ML service is ready
  console.warn("ML predictions not yet implemented");
  return null;
};

export const getRestockRecommendations = async () => {
  // TODO: Implement when ML service is ready
  console.warn("Restock recommendations not yet implemented");
  return [];
};

export const getRestockByProduct = async (productId) => {
  // TODO: Implement when ML service is ready
  console.warn("Restock recommendations not yet implemented");
  return null;
};

// ============================================
// AI ASSISTANT (Future Integration)
// ============================================

export const askAI = async (question) => {
  // TODO: Implement when Gemini AI is integrated
  console.warn("AI assistant not yet implemented");
  throw new Error("AI assistant not yet implemented");
};
