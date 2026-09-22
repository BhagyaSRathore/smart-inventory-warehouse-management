// import mlRoutes from "./src/routes/ml.routes.js";  // Commented out - ML integration pending
// import aiRoutes from "./src/routes/ai.routes.js";  // Commented out - AI integration pending
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

const app = express();
app.use(cors());
app.use(express.json());
// app.use("/api/ai", aiRoutes);  // Commented out - AI integration pending
// app.use("/api", mlRoutes);  // Commented out - ML integration pending
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

app.get("/", (req, res) => {
  res.json({
    message: "Smart Inventory Backend is running!",
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const users = await db.orm.public.User.all();

    res.json({
      message: "Database connected successfully!",
      users,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});