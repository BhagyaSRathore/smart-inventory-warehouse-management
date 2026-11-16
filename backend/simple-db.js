import bcrypt from 'bcrypt';

// In-memory database - simple and fast!
const db = {
  users: [],
  categories: [],
  suppliers: [],
  warehouses: [],
  racks: [],
  products: [],
  inventory: [],
  stockMovements: [],
  orders: [],
  notifications: [],
};

// Auto-increment IDs
let nextIds = {
  user: 1,
  category: 1,
  supplier: 1,
  warehouse: 1,
  rack: 1,
  product: 1,
  inventory: 1,
  stockMovement: 1,
  order: 1,
  notification: 1,
};

// Initialize with admin user
export async function initializeDatabase() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  db.users.push({
    id: nextIds.user++,
    email: 'admin@inventory.com',
    username: 'admin',
    passwordHash: passwordHash,
    name: 'Admin User',
    role: 'ADMIN',
    phone: '1234567890',
    fcmToken: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Add sample categories
  db.categories.push(
    { id: nextIds.category++, name: 'Electronics', description: 'Electronic devices', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: nextIds.category++, name: 'Furniture', description: 'Office furniture', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: nextIds.category++, name: 'Stationery', description: 'Office supplies', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  );

  // Add sample supplier
  db.suppliers.push({
    id: nextIds.supplier++,
    name: 'Tech Supplies Inc',
    email: 'contact@techsupplies.com',
    phone: '555-0100',
    address: '123 Business St',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Add sample warehouse
  db.warehouses.push({
    id: nextIds.warehouse++,
    name: 'Main Warehouse',
    location: 'Downtown',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Add sample rack
  db.racks.push({
    id: nextIds.rack++,
    name: 'Rack A1',
    warehouseId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Add sample products
  db.products.push({
    id: nextIds.product++,
    name: 'Laptop',
    sku: 'LAP-001',
    barcode: '123456789',
    description: 'Business laptop',
    price: 899.99,
    costPrice: 700.00,
    reorderLevel: 10,
    safetyStock: 5,
    categoryId: 1,
    supplierId: 1,
    imageUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Add sample inventory
  db.inventory.push({
    id: nextIds.inventory++,
    productId: 1,
    warehouseId: 1,
    rackId: 1,
    quantity: 25,
    updatedAt: new Date().toISOString(),
  });

  console.log('✅ In-memory database initialized with admin user and sample data');
}

// Simple ORM-like interface
export const simpleDb = {
  User: {
    all: () => Promise.resolve([...db.users]),
    first: (filter) => Promise.resolve(db.users.find(u => Object.keys(filter).every(k => u[k] === filter[k]))),
    create: (data) => {
      const user = { id: nextIds.user++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      db.users.push(user);
      return Promise.resolve(user);
    },
    where: (filter) => ({
      update: (data) => {
        const user = db.users.find(u => Object.keys(filter).every(k => u[k] === filter[k]));
        if (user) {
          Object.assign(user, data, { updatedAt: new Date().toISOString() });
          return Promise.resolve(user);
        }
        return Promise.resolve(null);
      },
    }),
  },
  Category: {
    all: () => Promise.resolve([...db.categories]),
    create: (data) => {
      const category = { id: nextIds.category++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      db.categories.push(category);
      return Promise.resolve(category);
    },
  },
  Supplier: {
    all: () => Promise.resolve([...db.suppliers]),
    first: (filter) => Promise.resolve(db.suppliers.find(s => Object.keys(filter).every(k => s[k] === filter[k]))),
    create: (data) => {
      const supplier = { id: nextIds.supplier++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      db.suppliers.push(supplier);
      return Promise.resolve(supplier);
    },
    where: (filter) => ({
      update: (data) => {
        const supplier = db.suppliers.find(s => Object.keys(filter).every(k => s[k] === filter[k]));
        if (supplier) {
          Object.assign(supplier, data, { updatedAt: new Date().toISOString() });
          return Promise.resolve(supplier);
        }
        return Promise.resolve(null);
      },
      delete: () => {
        const index = db.suppliers.findIndex(s => Object.keys(filter).every(k => s[k] === filter[k]));
        if (index !== -1) {
          db.suppliers.splice(index, 1);
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      },
    }),
  },
  Warehouse: {
    all: () => Promise.resolve([...db.warehouses]),
    first: (filter) => Promise.resolve(db.warehouses.find(w => Object.keys(filter).every(k => w[k] === filter[k]))),
    create: (data) => {
      const warehouse = { id: nextIds.warehouse++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      db.warehouses.push(warehouse);
      return Promise.resolve(warehouse);
    },
  },
  Rack: {
    all: () => Promise.resolve([...db.racks]),
    first: (filter) => Promise.resolve(db.racks.find(r => Object.keys(filter).every(k => r[k] === filter[k]))),
    create: (data) => {
      const rack = { id: nextIds.rack++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      db.racks.push(rack);
      return Promise.resolve(rack);
    },
  },
  Product: {
    all: () => Promise.resolve([...db.products]),
    first: (filter) => Promise.resolve(db.products.find(p => Object.keys(filter).every(k => p[k] === filter[k]))),
    create: (data) => {
      const product = { id: nextIds.product++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      db.products.push(product);
      return Promise.resolve(product);
    },
    where: (filter) => ({
      update: (data) => {
        const product = db.products.find(p => Object.keys(filter).every(k => p[k] === filter[k]));
        if (product) {
          Object.assign(product, data, { updatedAt: new Date().toISOString() });
          return Promise.resolve(product);
        }
        return Promise.resolve(null);
      },
      delete: () => {
        const index = db.products.findIndex(p => Object.keys(filter).every(k => p[k] === filter[k]));
        if (index !== -1) {
          db.products.splice(index, 1);
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      },
    }),
  },
  Inventory: {
    all: () => Promise.resolve([...db.inventory]),
    first: (filter) => Promise.resolve(db.inventory.find(i => Object.keys(filter).every(k => i[k] === filter[k]))),
    create: (data) => {
      const inventory = { id: nextIds.inventory++, ...data, updatedAt: new Date().toISOString() };
      db.inventory.push(inventory);
      return Promise.resolve(inventory);
    },
    where: (filter) => ({
      update: (data) => {
        const inventory = db.inventory.find(i => Object.keys(filter).every(k => i[k] === filter[k]));
        if (inventory) {
          Object.assign(inventory, data, { updatedAt: new Date().toISOString() });
          return Promise.resolve(inventory);
        }
        return Promise.resolve(null);
      },
    }),
  },
  StockMovement: {
    all: () => Promise.resolve([...db.stockMovements]),
    create: (data) => {
      const movement = { id: nextIds.stockMovement++, ...data, createdAt: new Date().toISOString() };
      db.stockMovements.push(movement);
      return Promise.resolve(movement);
    },
  },
  Order: {
    all: () => Promise.resolve([...db.orders]),
    first: (filter) => Promise.resolve(db.orders.find(o => Object.keys(filter).every(k => o[k] === filter[k]))),
    create: (data) => {
      const order = { id: nextIds.order++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      db.orders.push(order);
      return Promise.resolve(order);
    },
    where: (filter) => ({
      update: (data) => {
        const order = db.orders.find(o => Object.keys(filter).every(k => o[k] === filter[k]));
        if (order) {
          Object.assign(order, data, { updatedAt: new Date().toISOString() });
          return Promise.resolve(order);
        }
        return Promise.resolve(null);
      },
      delete: () => {
        const index = db.orders.findIndex(o => Object.keys(filter).every(k => o[k] === filter[k]));
        if (index !== -1) {
          db.orders.splice(index, 1);
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      },
    }),
  },
  Notification: {
    all: () => Promise.resolve([...db.notifications]),
    first: (filter) => Promise.resolve(db.notifications.find(n => Object.keys(filter).every(k => n[k] === filter[k]))),
    create: (data) => {
      const notification = { id: nextIds.notification++, ...data, createdAt: new Date().toISOString() };
      db.notifications.push(notification);
      return Promise.resolve(notification);
    },
    where: (filter) => ({
      update: (data) => {
        const notification = db.notifications.find(n => Object.keys(filter).every(k => n[k] === filter[k]));
        if (notification) {
          Object.assign(notification, data);
          return Promise.resolve(notification);
        }
        return Promise.resolve(null);
      },
      delete: () => {
        const index = db.notifications.findIndex(n => Object.keys(filter).every(k => n[k] === filter[k]));
        if (index !== -1) {
          db.notifications.splice(index, 1);
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      },
    }),
  },
  Customer: {
    all: () => Promise.resolve([]),
  },
  Prediction: {
    all: () => Promise.resolve([]),
  },
};
