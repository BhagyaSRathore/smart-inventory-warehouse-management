# Database

## Overview

PostgreSQL database schema and migrations for the Smart Inventory & Warehouse Management System.

## Technology

- **PostgreSQL 14+** - Relational database
- **Sequelize/Prisma** - ORM and migrations

## Database Schema (Planned)

### Tables

#### users
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- full_name (VARCHAR)
- role (ENUM: admin, manager, worker)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### categories
- id (UUID, PK)
- name (VARCHAR)
- description (TEXT)
- created_at (TIMESTAMP)

#### suppliers
- id (UUID, PK)
- name (VARCHAR)
- contact_person (VARCHAR)
- email (VARCHAR)
- phone (VARCHAR)
- address (TEXT)
- average_lead_time_days (INTEGER)
- status (ENUM: active, inactive)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### products
- id (UUID, PK)
- sku (VARCHAR, UNIQUE)
- barcode (VARCHAR, UNIQUE)
- name (VARCHAR)
- description (TEXT)
- category_id (UUID, FK)
- supplier_id (UUID, FK)
- cost_price (DECIMAL)
- selling_price (DECIMAL)
- reorder_level (INTEGER)
- safety_stock (INTEGER)
- image_url (VARCHAR)
- status (ENUM: active, inactive)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### warehouses
- id (UUID, PK)
- name (VARCHAR)
- location (VARCHAR)
- capacity (INTEGER)
- manager_id (UUID, FK)
- status (ENUM: active, inactive)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### racks
- id (UUID, PK)
- warehouse_id (UUID, FK)
- rack_number (VARCHAR)
- capacity (INTEGER)
- created_at (TIMESTAMP)

#### inventory
- id (UUID, PK)
- product_id (UUID, FK)
- warehouse_id (UUID, FK)
- rack_id (UUID, FK)
- quantity_available (INTEGER)
- quantity_reserved (INTEGER)
- last_updated (TIMESTAMP)
- updated_by (UUID, FK)

#### stock_movements
- id (UUID, PK)
- product_id (UUID, FK)
- warehouse_id (UUID, FK)
- rack_id (UUID, FK)
- movement_type (ENUM: stock_in, stock_out, transfer, adjustment)
- quantity (INTEGER)
- reference_number (VARCHAR)
- notes (TEXT)
- performed_by (UUID, FK)
- created_at (TIMESTAMP)

#### orders
- id (UUID, PK)
- order_number (VARCHAR, UNIQUE)
- order_type (ENUM: purchase, sales)
- supplier_id (UUID, FK)
- status (ENUM: pending, confirmed, completed, cancelled)
- order_date (DATE)
- expected_delivery_date (DATE)
- total_amount (DECIMAL)
- created_by (UUID, FK)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### order_items
- id (UUID, PK)
- order_id (UUID, FK)
- product_id (UUID, FK)
- quantity (INTEGER)
- unit_price (DECIMAL)
- total_price (DECIMAL)

#### predictions
- id (UUID, PK)
- product_id (UUID, FK)
- prediction_date (DATE)
- period_days (INTEGER)
- predicted_demand (INTEGER)
- confidence_score (DECIMAL)
- model_version (VARCHAR)
- created_at (TIMESTAMP)

### Indexes (Planned)

- products(sku), products(barcode)
- inventory(product_id, warehouse_id)
- stock_movements(product_id, created_at)
- orders(order_number)
- predictions(product_id, prediction_date)

### Relations

```
products → categories (many-to-one)
products → suppliers (many-to-one)
inventory → products (many-to-one)
inventory → warehouses (many-to-one)
inventory → racks (many-to-one)
racks → warehouses (many-to-one)
stock_movements → products (many-to-one)
stock_movements → warehouses (many-to-one)
stock_movements → users (many-to-one)
orders → suppliers (many-to-one)
order_items → orders (many-to-one)
order_items → products (many-to-one)
predictions → products (many-to-one)
```

## Migrations (Planned)

Migrations will be version-controlled and applied in sequence:

1. `001_create_users_table`
2. `002_create_categories_table`
3. `003_create_suppliers_table`
4. `004_create_products_table`
5. `005_create_warehouses_table`
6. `006_create_racks_table`
7. `007_create_inventory_table`
8. `008_create_stock_movements_table`
9. `009_create_orders_table`
10. `010_create_predictions_table`

## Seeds (Planned)

Initial data for development:
- Admin user
- Sample categories
- Sample suppliers
- Sample warehouses
- Sample products

## Backup Strategy (Planned)

- Daily automated backups
- Point-in-time recovery
- Backup retention: 30 days

## Status

🔄 **Not yet implemented** - This will be part of Phase 2 of development
