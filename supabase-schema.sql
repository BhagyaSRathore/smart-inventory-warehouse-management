-- Smart Inventory System Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS "user" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "username" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT DEFAULT 'STAFF' NOT NULL,
  "phone" TEXT,
  "fcmToken" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Categories table
CREATE TABLE IF NOT EXISTS "category" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS "supplier" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Warehouses table
CREATE TABLE IF NOT EXISTS "warehouse" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "location" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Racks table
CREATE TABLE IF NOT EXISTS "rack" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "warehouseId" INTEGER NOT NULL REFERENCES "warehouse"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Products table
CREATE TABLE IF NOT EXISTS "product" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "sku" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "categoryId" INTEGER REFERENCES "category"("id"),
  "supplierId" INTEGER REFERENCES "supplier"("id"),
  "price" DECIMAL(10,2) NOT NULL,
  "reorderLevel" INTEGER DEFAULT 10 NOT NULL,
  "safetyStock" INTEGER DEFAULT 5 NOT NULL,
  "barcode" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Inventory table
CREATE TABLE IF NOT EXISTS "inventory" (
  "id" SERIAL PRIMARY KEY,
  "productId" INTEGER NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "warehouseId" INTEGER NOT NULL REFERENCES "warehouse"("id") ON DELETE CASCADE,
  "rackId" INTEGER REFERENCES "rack"("id") ON DELETE SET NULL,
  "quantity" INTEGER DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE("productId", "warehouseId", "rackId")
);

-- Stock Movements table
CREATE TABLE IF NOT EXISTS "stockMovement" (
  "id" SERIAL PRIMARY KEY,
  "productId" INTEGER NOT NULL REFERENCES "product"("id"),
  "warehouseId" INTEGER NOT NULL REFERENCES "warehouse"("id"),
  "rackId" INTEGER REFERENCES "rack"("id"),
  "quantity" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "referenceNumber" TEXT,
  "notes" TEXT,
  "performedBy" INTEGER REFERENCES "user"("id"),
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Orders table
CREATE TABLE IF NOT EXISTS "order" (
  "id" SERIAL PRIMARY KEY,
  "orderNumber" TEXT UNIQUE NOT NULL,
  "status" TEXT DEFAULT 'pending' NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Order Items table
CREATE TABLE IF NOT EXISTS "orderItem" (
  "id" SERIAL PRIMARY KEY,
  "orderId" INTEGER NOT NULL REFERENCES "order"("id") ON DELETE CASCADE,
  "productId" INTEGER NOT NULL REFERENCES "product"("id"),
  "quantity" INTEGER NOT NULL
);

-- Customers table
CREATE TABLE IF NOT EXISTS "customer" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS "notification" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "user"("id") ON DELETE SET NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT FALSE NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Predictions table (for ML)
CREATE TABLE IF NOT EXISTS "prediction" (
  "id" SERIAL PRIMARY KEY,
  "productId" INTEGER NOT NULL REFERENCES "product"("id"),
  "predictionData" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_inventory_product" ON "inventory"("productId");
CREATE INDEX IF NOT EXISTS "idx_inventory_warehouse" ON "inventory"("warehouseId");
CREATE INDEX IF NOT EXISTS "idx_stockMovement_product" ON "stockMovement"("productId");
CREATE INDEX IF NOT EXISTS "idx_stockMovement_warehouse" ON "stockMovement"("warehouseId");
CREATE INDEX IF NOT EXISTS "idx_stockMovement_createdAt" ON "stockMovement"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_order_status" ON "order"("status");
CREATE INDEX IF NOT EXISTS "idx_notification_userId" ON "notification"("userId");
CREATE INDEX IF NOT EXISTS "idx_rack_warehouse" ON "rack"("warehouseId");

-- Success message
SELECT 'Database schema created successfully!' as message;
