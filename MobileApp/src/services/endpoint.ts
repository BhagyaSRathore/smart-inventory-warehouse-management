const apis = {
  // Auth
  register: '/auth/register',
  login: '/auth/login',
  me: '/auth/me',
  updateProfile: '/auth/me',
  changePassword: '/auth/change-password',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',

  // Dashboard
  dashboard: '/dashboard',

  // Products
  products: '/products',
  productById: (id: number | string) => `/products/${id}`,
  productByBarcode: (barcode: string) => `/products/barcode/${barcode}`,

  // Categories, Warehouses, Suppliers, Racks
  categories: '/categories',
  warehouses: '/warehouses',
  racks: '/racks',
  suppliers: '/suppliers',

  // Inventory & Stock
  inventory: '/inventory',
  stockIn: '/inventory/stock-in',
  stockOut: '/inventory/stock-out',
  transfer: '/inventory/transfer',
  adjustment: '/inventory/adjustment',
  stockMovements: '/stock-movements',
  stockMovementById: (id: number | string) => `/stock-movements/${id}`,

  // Purchase Orders
  purchaseOrders: '/purchase-orders',
  purchaseOrderById: (id: number | string) => `/purchase-orders/${id}`,
  purchaseOrderStatus: (id: number | string) => `/purchase-orders/${id}/status`,
  purchaseOrderReceive: (id: number | string) => `/purchase-orders/${id}/receive`,

  // Sales Orders
  salesOrders: '/sales-orders',
  salesOrderById: (id: number | string) => `/sales-orders/${id}`,
  salesOrderStatus: (id: number | string) => `/sales-orders/${id}/status`,
  salesOrderShip: (id: number | string) => `/sales-orders/${id}/ship`,

  // Customers
  customers: '/customers',
  customerById: (id: number | string) => `/customers/${id}`,

  // AI Assistant
  aiChat: '/ai/chat',

  // Demand Prediction & ML
  predictions: (productId: number | string) => `/predictions/${productId}`,
  riskAssessment: (productId: number | string) => `/risk/${productId}`,
  restockRecommendations: (productId: number | string) => `/restock-recommendations/${productId}`,

  // Notifications
  notifications: '/notifications',
  notificationById: (id: number | string) => `/notifications/${id}`,
  unreadNotificationCount: '/notifications/unread-count',
  markNotificationAsRead: (id: number | string) =>
    `/notifications/${id}/read`,
  markAllNotificationsAsRead: '/notifications/read-all',
  deleteNotification: (id: number | string) =>
    `/notifications/${id}`,
  registerDeviceToken: '/notifications/register-token',
  unregisterDeviceToken: '/notifications/register-token',
};

export default apis;