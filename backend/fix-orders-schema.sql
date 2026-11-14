-- Create PurchaseOrder and SalesOrder tables that are missing from migrations

-- PurchaseOrder table
CREATE TABLE IF NOT EXISTS "public"."PurchaseOrder" (
  "id" SERIAL PRIMARY KEY,
  "orderNumber" TEXT UNIQUE NOT NULL,
  "supplierId" INTEGER NOT NULL REFERENCES "public"."Supplier"("id"),
  "warehouseId" INTEGER NOT NULL REFERENCES "public"."Warehouse"("id"),
  "status" TEXT DEFAULT 'PENDING' NOT NULL,
  "subtotal" DECIMAL(10,2) NOT NULL,
  "tax" DECIMAL(10,2) NOT NULL,
  "total" DECIMAL(10,2) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "PurchaseOrder_orderNumber_idx" ON "public"."PurchaseOrder"("orderNumber");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_status_idx" ON "public"."PurchaseOrder"("status");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_supplierId_idx" ON "public"."PurchaseOrder"("supplierId");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_warehouseId_idx" ON "public"."PurchaseOrder"("warehouseId");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_createdAt_idx" ON "public"."PurchaseOrder"("createdAt");

-- PurchaseOrderItem table
CREATE TABLE IF NOT EXISTS "public"."PurchaseOrderItem" (
  "id" SERIAL PRIMARY KEY,
  "purchaseOrderId" INTEGER NOT NULL REFERENCES "public"."PurchaseOrder"("id") ON DELETE CASCADE,
  "productId" INTEGER NOT NULL REFERENCES "public"."Product"("id"),
  "quantity" INTEGER NOT NULL,
  "unitPrice" DECIMAL(10,2) NOT NULL,
  "total" DECIMAL(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS "PurchaseOrderItem_purchaseOrderId_idx" ON "public"."PurchaseOrderItem"("purchaseOrderId");
CREATE INDEX IF NOT EXISTS "PurchaseOrderItem_productId_idx" ON "public"."PurchaseOrderItem"("productId");

-- SalesOrder table
CREATE TABLE IF NOT EXISTS "public"."SalesOrder" (
  "id" SERIAL PRIMARY KEY,
  "orderNumber" TEXT UNIQUE NOT NULL,
  "customerId" INTEGER NOT NULL REFERENCES "public"."Customer"("id"),
  "warehouseId" INTEGER NOT NULL REFERENCES "public"."Warehouse"("id"),
  "status" TEXT DEFAULT 'PENDING' NOT NULL,
  "subtotal" DECIMAL(10,2) NOT NULL,
  "tax" DECIMAL(10,2) NOT NULL,
  "total" DECIMAL(10,2) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "SalesOrder_orderNumber_idx" ON "public"."SalesOrder"("orderNumber");
CREATE INDEX IF NOT EXISTS "SalesOrder_status_idx" ON "public"."SalesOrder"("status");
CREATE INDEX IF NOT EXISTS "SalesOrder_customerId_idx" ON "public"."SalesOrder"("customerId");
CREATE INDEX IF NOT EXISTS "SalesOrder_warehouseId_idx" ON "public"."SalesOrder"("warehouseId");
CREATE INDEX IF NOT EXISTS "SalesOrder_createdAt_idx" ON "public"."SalesOrder"("createdAt");

-- SalesOrderItem table
CREATE TABLE IF NOT EXISTS "public"."SalesOrderItem" (
  "id" SERIAL PRIMARY KEY,
  "salesOrderId" INTEGER NOT NULL REFERENCES "public"."SalesOrder"("id") ON DELETE CASCADE,
  "productId" INTEGER NOT NULL REFERENCES "public"."Product"("id"),
  "quantity" INTEGER NOT NULL,
  "unitPrice" DECIMAL(10,2) NOT NULL,
  "total" DECIMAL(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS "SalesOrderItem_salesOrderId_idx" ON "public"."SalesOrderItem"("salesOrderId");
CREATE INDEX IF NOT EXISTS "SalesOrderItem_productId_idx" ON "public"."SalesOrderItem"("productId");

-- Customer table (might also be missing)
CREATE TABLE IF NOT EXISTS "public"."Customer" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
