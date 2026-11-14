-- Smart Inventory System Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS "prediction" CASCADE;
DROP TABLE IF EXISTS "notification" CASCADE;
DROP TABLE IF EXISTS "orderItem" CASCADE;
DROP TABLE IF EXISTS "order" CASCADE;
DROP TABLE IF EXISTS "stockMovement" CASCADE;
DROP TABLE IF EXISTS "inventory" CASCADE;
DROP TABLE IF EXISTS "product" CASCADE;
DROP TABLE IF EXISTS "rack" CASCADE;
DROP TABLE IF EXISTS "warehouse" CASCADE;
DROP TABLE IF EXISTS "customer" CASCADE;
DROP TABLE IF EXISTS "supplier" CASCADE;
DROP TABLE IF EXISTS "category" CASCADE;
DROP TABLE IF EXISTS "app_user" CASCADE;

-- Users table (renamed to avoid PostgreSQL reserved keyword)
CREATE TABLE "app_user" (
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
CREATE TABLE "category" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Suppliers table
CREATE TABLE "supplier" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Customers table
CREATE TABLE "customer" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Warehouses table
CREATE TABLE "warehouse" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "location" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Racks table
CREATE TABLE "rack" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "warehouseId" INTEGER NOT NULL REFERENCES "warehouse"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Products table
CREATE TABLE "product" (
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
CREATE TABLE "inventory" (
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
CREATE TABLE "stockMovement" (
  "id" SERIAL PRIMARY KEY,
  "productId" INTEGER NOT NULL REFERENCES "product"("id"),
  "warehouseId" INTEGER NOT NULL REFERENCES "warehouse"("id"),
  "rackId" INTEGER REFERENCES "rack"("id"),
  "quantity" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "referenceNumber" TEXT,
  "notes" TEXT,
  "performedBy" INTEGER REFERENCES "app_user"("id"),
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Orders table
CREATE TABLE "order" (
  "id" SERIAL PRIMARY KEY,
  "orderNumber" TEXT UNIQUE NOT NULL,
  "status" TEXT DEFAULT 'pending' NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Order Items table
CREATE TABLE "orderItem" (
  "id" SERIAL PRIMARY KEY,
  "orderId" INTEGER NOT NULL REFERENCES "order"("id") ON DELETE CASCADE,
  "productId" INTEGER NOT NULL REFERENCES "product"("id"),
  "quantity" INTEGER NOT NULL
);

-- Notifications table
CREATE TABLE "notification" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "app_user"("id") ON DELETE SET NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT FALSE NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Predictions table (for ML)
CREATE TABLE "prediction" (
  "id" SERIAL PRIMARY KEY,
  "productId" INTEGER NOT NULL REFERENCES "product"("id"),
  "predictionData" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX "idx_inventory_product" ON "inventory"("productId");
CREATE INDEX "idx_inventory_warehouse" ON "inventory"("warehouseId");
CREATE INDEX "idx_stockMovement_product" ON "stockMovement"("productId");
CREATE INDEX "idx_stockMovement_warehouse" ON "stockMovement"("warehouseId");
CREATE INDEX "idx_stockMovement_createdAt" ON "stockMovement"("createdAt");
CREATE INDEX "idx_order_status" ON "order"("status");
CREATE INDEX "idx_notification_userId" ON "notification"("userId");
CREATE INDEX "idx_rack_warehouse" ON "rack"("warehouseId");

-- Success message
SELECT 'Database schema created successfully! User table is named: app_user' as message;
