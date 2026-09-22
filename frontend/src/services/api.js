const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const clearAuthSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.dispatchEvent(new CustomEvent("auth:logout"));
};

export const setAuthSession = (token, user) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new CustomEvent("auth:login"));
};

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
    if (response.status === 401) {
      clearAuthSession();
    }

    const error = new Error(data.message || "API request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const register = (userData) =>
  apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });

export const login = async (credentials) => {
  const response = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  if (response?.token && response?.user) {
    setAuthSession(response.token, response.user);
  }

  return response;
};

export const fetchCurrentUser = async () => {
  const response = await apiRequest("/auth/me");
  return response.user || null;
};

export const updateCurrentUser = (userData) =>
  apiRequest("/auth/me", {
    method: "PUT",
    body: JSON.stringify(userData),
  });

export const changePassword = (passwordData) =>
  apiRequest("/auth/change-password", {
    method: "PATCH",
    body: JSON.stringify(passwordData),
  });

export const logout = () => {
  clearAuthSession();
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const isAuthenticated = () => !!localStorage.getItem("token");

// ============================================
// PRODUCTS
// ============================================

export const getProducts = async () => {
  const response = await apiRequest("/products");
  return response.products || [];
};

export const getProductById = async (id) => {
  const response = await apiRequest(`/products/${id}`);
  return response.product || null;
};

export const getProductByBarcode = async (barcode) => {
  const response = await apiRequest(`/products/barcode/${barcode}`);
  return response;
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
  const response = await apiRequest("/categories");
  return response.categories || [];
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
  const response = await apiRequest("/suppliers");
  return response.suppliers || [];
};

export const getSupplierById = async (id) => {
  const response = await apiRequest(`/suppliers/${id}`);
  return response.supplier || null;
};

export const createSupplier = (supplierData) =>
  apiRequest("/suppliers", {
    method: "POST",
    body: JSON.stringify(supplierData),
  });

export const updateSupplier = (id, supplierData) =>
  apiRequest(`/suppliers/${id}`, {
    method: "PUT",
    body: JSON.stringify(supplierData),
  });

export const deleteSupplier = (id) =>
  apiRequest(`/suppliers/${id}`, {
    method: "DELETE",
  });

// ============================================
// WAREHOUSES
// ============================================

export const getWarehouses = async () => {
  const response = await apiRequest("/warehouses");
  return response.warehouses || [];
};

export const getWarehouseById = async (id) => {
  const response = await apiRequest(`/warehouses/${id}`);
  return response.warehouse || null;
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
  const response = await apiRequest("/racks");
  return response.racks || [];
};

// ============================================
// INVENTORY
// ============================================

export const getInventory = async () => {
  const response = await apiRequest("/inventory");
  return response.inventories || [];
};

export const getInventoryByProduct = async (productId) => {
  const inventory = await getInventory();
  return inventory.filter((inv) => inv.productId === Number(productId));
};

export const getInventoryByWarehouse = async (warehouseId) => {
  const inventory = await getInventory();
  return inventory.filter((inv) => inv.warehouseId === Number(warehouseId));
};

export const getLowStock = async () => {
  const response = await apiRequest("/inventory/low-stock");
  return response.items || [];
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
  const response = await apiRequest("/stock-movements");
  return response.movements || [];
};

export const getStockMovementsByProduct = async (productId) => {
  const movements = await getStockMovements();
  return movements.filter((sm) => sm.productId === Number(productId));
};

// ============================================
// ORDERS
// ============================================

export const getOrders = async () => {
  const response = await apiRequest("/orders");
  return response.orders || [];
};

export const getOrderById = async (id) => {
  const response = await apiRequest(`/orders/${id}`);
  return response.order || null;
};

export const getPurchaseOrders = async () => {
  const orders = await getOrders();
  return orders.filter((o) => o.type === "purchase");
};

export const getSalesOrders = async () => {
  const orders = await getOrders();
  return orders.filter((o) => o.type === "sales");
};

export const createOrder = (orderData) =>
  apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });

export const updateOrder = (id, orderData) =>
  apiRequest(`/orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(orderData),
  });

export const deleteOrder = (id) =>
  apiRequest(`/orders/${id}`, {
    method: "DELETE",
  });

// ============================================
// NOTIFICATIONS
// ============================================

export const getNotifications = async () => {
  const response = await apiRequest("/notifications");
  return response.notifications || [];
};

export const getUnreadNotificationCount = async () => {
  const response = await apiRequest("/notifications/unread-count");
  return Number(response.count || 0);
};

export const markNotificationAsRead = (id) =>
  apiRequest(`/notifications/${id}/read`, {
    method: "PATCH",
  });

export const markAllNotificationsAsRead = () =>
  apiRequest("/notifications/read-all", {
    method: "PATCH",
  });

export const deleteNotification = (id) =>
  apiRequest(`/notifications/${id}`, {
    method: "DELETE",
  });

// ============================================
// DASHBOARD
// ============================================

export const getDashboardStats = async () => {
  const response = await apiRequest("/dashboard");
  return response.summary || {};
};

export const getDashboard = async () => {
  const response = await apiRequest("/dashboard");
  return response;
};

// ============================================
// PREDICTIONS & RESTOCK
// ============================================

export const getPredictions = async () => {
  const [products, inventory] = await Promise.all([getProducts(), getInventory()]);

  return products.map((product) => {
    const productInventory = inventory.filter((entry) => Number(entry.productId) === Number(product.id));
    const currentStock = productInventory.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);
    const reorderLevel = Number(product.reorderLevel || 0);
    const safetyStock = Number(product.safetyStock || 0);

    const predicted7Day = Math.max(reorderLevel * 2, Math.ceil(currentStock * 0.35) + safetyStock + 5);
    const predicted30Day = Math.max(reorderLevel * 4, Math.ceil(currentStock * 0.70) + safetyStock + 12);
    const demandTrend = predicted30Day > predicted7Day ? "increasing" : "stable";

    let riskLevel = "low";
    if (currentStock <= reorderLevel * 0.5) {
      riskLevel = "critical";
    } else if (currentStock <= reorderLevel) {
      riskLevel = "high";
    } else if (currentStock <= reorderLevel * 1.5) {
      riskLevel = "medium";
    }

    const confidence = Math.max(52, Math.min(96, 72 + Math.round((reorderLevel - Math.min(currentStock, reorderLevel)) * 1.5)));

    return {
      id: product.id,
      productId: product.id,
      productName: product.name,
      currentStock,
      predicted7Day,
      predicted30Day,
      demandTrend,
      riskLevel,
      confidence,
    };
  });
};

export const getPredictionByProduct = async (productId) => {
  const predictions = await getPredictions();
  return predictions.find((prediction) => Number(prediction.productId) === Number(productId)) || null;
};

export const getRestockRecommendations = async () => {
  const [products, inventory] = await Promise.all([getProducts(), getInventory()]);

  return products
    .map((product) => {
      const productInventory = inventory.filter((entry) => Number(entry.productId) === Number(product.id));
      const currentStock = productInventory.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);
      const reorderLevel = Number(product.reorderLevel || 0);
      const safetyStock = Number(product.safetyStock || 0);
      const predictedDemand = Math.max(reorderLevel * 2, Math.ceil(safetyStock + reorderLevel * 1.5));
      const recommendedQuantity = Math.max(0, predictedDemand + safetyStock - currentStock);

      let priority = "low";
      if (currentStock <= reorderLevel * 0.5) {
        priority = "critical";
      } else if (currentStock <= reorderLevel) {
        priority = "high";
      } else if (currentStock <= reorderLevel * 1.5) {
        priority = "medium";
      }

      const explanation = recommendedQuantity > 0
        ? `Current stock is below the targeted safety buffer. Replenish ${recommendedQuantity} units to cover expected demand.`
        : `Stock is holding at a healthy range and does not require immediate replenishment.`;

      return {
        id: product.id,
        productId: product.id,
        productName: product.name,
        currentStock,
        predictedDemand,
        safetyStock,
        reorderPoint: reorderLevel,
        leadTimeDays: 7,
        recommendedQuantity,
        priority,
        explanation,
      };
    })
    .filter((item) => item.recommendedQuantity > 0 || item.currentStock <= item.reorderPoint)
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    });
};

export const getRestockByProduct = async (productId) => {
  const recommendations = await getRestockRecommendations();
  return recommendations.find((item) => Number(item.productId) === Number(productId)) || null;
};

// ============================================
// AI ASSISTANT (Future Integration)
// ============================================

export const askAI = async (question) => {
  // TODO: Implement when Gemini AI is integrated
  console.warn("AI assistant not yet implemented");
  throw new Error("AI assistant not yet implemented");
};
