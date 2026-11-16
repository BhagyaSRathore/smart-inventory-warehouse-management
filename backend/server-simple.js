import express from "express";
import cors from "cors";
import "dotenv/config";
import { initializeDatabase, simpleDb } from "./simple-db.js";
import authRoutes from "./src/routes/auth.routes.js";
import productRoutes from "./src/routes/product.routes.js";
import categoryRoutes from "./src/routes/category.routes.js";
import supplierRoutes from "./src/routes/supplier.routes.js";
import warehouseRoutes from "./src/routes/warehouse.routes.js";
import rackRoutes from "./src/routes/rack.routes.js";
import inventoryRoutes from "./src/routes/inventory.routes.js";
import stockRoutes from "./src/routes/stock.routes.js";
import orderRoutes from "./src/routes/order.routes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import customerRoutes from "./src/routes/customer.routes.js";

// Initialize database with sample data
await initializeDatabase();

// Make simple db available globally
global.db = { orm: { public: simpleDb } };

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
  'https://smart-inventory-warehouse-managemen.vercel.app'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || (origin && origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/racks", rackRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/stock-movements", stockRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/customers", customerRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Smart Inventory Backend is running! (Simple In-Memory Database)",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'in-memory'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: In-Memory (Simple & Fast!)`);
  console.log(`✅ Admin Login: admin@inventory.com / admin123`);
  console.log(`${'='.repeat(60)}\n`);
});
