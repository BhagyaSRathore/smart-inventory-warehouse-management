import mlRoutes from "./src/routes/ml.routes.js";
import aiRoutes from "./src/routes/ai.routes.js";
import express from "express";
import cors from "cors";
import "dotenv/config";
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
import { db } from "./src/db.ts";
import notificationRoutes from "./src/routes/notification.routes.js";
import purchaseOrderRoutes from "./src/routes/purchaseOrder.routes.js";
import salesOrderRoutes from "./src/routes/salesOrder.routes.js";
import customerRoutes from "./src/routes/customer.routes.js";

const app = express();

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
  'https://smart-inventory-warehouse-managemen.vercel.app'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/api/ai", aiRoutes);
app.use("/api", mlRoutes);
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
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/sales-orders", salesOrderRoutes);
app.use("/api/customers", customerRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Smart Inventory Backend is running!",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const users = await db.orm.public.User.all();

    res.json({
      message: "Database connected successfully!",
      userCount: users.length,
      users: users.map(u => ({ id: u.id, email: u.email, username: u.username, role: u.role }))
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database connection failed",
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});