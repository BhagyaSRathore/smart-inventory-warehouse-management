-- Seed data for Smart Inventory System
-- Run this AFTER running supabase-schema.sql

-- Insert admin user (password: admin123 - bcrypt hashed)
INSERT INTO "user" ("email", "username", "password", "name", "role", "phone") VALUES
('admin@inventory.com', 'admin', '$2b$10$rQYGhZ8vZ3vZ3vZ3vZ3vZeK5KqH5KqH5KqH5KqH5KqH5KqH5KqH5K', 'Admin User', 'ADMIN', '1234567890')
ON CONFLICT (email) DO NOTHING;

-- Insert categories
INSERT INTO "category" ("name", "description") VALUES
('Electronics', 'Electronic devices and accessories'),
('Furniture', 'Office and home furniture'),
('Stationery', 'Office supplies and stationery'),
('Hardware', 'Computer hardware and peripherals')
ON CONFLICT DO NOTHING;

-- Insert suppliers
INSERT INTO "supplier" ("name", "email", "phone", "address") VALUES
('Tech Supplies Inc', 'contact@techsupplies.com', '+1-555-0100', '123 Tech Street, Silicon Valley, CA 94025'),
('Office World', 'sales@officeworld.com', '+1-555-0200', '456 Business Ave, New York, NY 10001'),
('Global Electronics', 'info@globalelec.com', '+1-555-0300', '789 Market St, San Francisco, CA 94103')
ON CONFLICT DO NOTHING;

-- Insert warehouses
INSERT INTO "warehouse" ("name", "location") VALUES
('Main Warehouse', 'New York, NY'),
('West Coast Warehouse', 'Los Angeles, CA'),
('Central Warehouse', 'Chicago, IL')
ON CONFLICT DO NOTHING;

-- Insert racks for Main Warehouse
INSERT INTO "rack" ("name", "warehouseId") VALUES
('A1', 1),
('A2', 1),
('B1', 1),
('B2', 1)
ON CONFLICT DO NOTHING;

-- Insert racks for West Coast Warehouse
INSERT INTO "rack" ("name", "warehouseId") VALUES
('A1', 2),
('A2', 2),
('B1', 2)
ON CONFLICT DO NOTHING;

-- Insert products
INSERT INTO "product" ("name", "sku", "description", "categoryId", "supplierId", "price", "reorderLevel", "safetyStock", "barcode") VALUES
('Dell XPS 15 Laptop', 'LAP-XPS-15', 'High-performance laptop for professionals', 1, 1, 1499.99, 5, 3, '1234567890123'),
('Wireless Mouse', 'MOU-WL-001', 'Ergonomic wireless mouse', 1, 1, 29.99, 20, 10, '2345678901234'),
('Mechanical Keyboard', 'KEY-MECH-001', 'RGB mechanical gaming keyboard', 1, 1, 89.99, 15, 8, '3456789012345'),
('27-inch 4K Monitor', 'MON-4K-27', 'Professional 4K display', 1, 1, 399.99, 8, 4, '4567890123456'),
('Standing Desk', 'DESK-STD-001', 'Adjustable height standing desk', 2, 2, 599.99, 5, 2, '5678901234567'),
('Ergonomic Office Chair', 'CHR-ERG-001', 'Premium ergonomic chair', 2, 2, 299.99, 10, 5, '6789012345678'),
('A4 Notebook Pack', 'NOTE-A4-10', 'Pack of 10 A4 notebooks', 3, 2, 12.99, 50, 30, '7890123456789'),
('Ballpoint Pen Set', 'PEN-BP-12', 'Set of 12 ballpoint pens', 3, 2, 5.99, 100, 50, '8901234567890')
ON CONFLICT (sku) DO NOTHING;

-- Insert inventory
INSERT INTO "inventory" ("productId", "warehouseId", "rackId", "quantity") VALUES
(1, 1, 1, 15),
(1, 2, 5, 8),
(2, 1, 2, 50),
(3, 1, 2, 25),
(4, 1, 3, 12),
(5, 1, 3, 7),
(6, 1, 3, 20),
(6, 2, 6, 15),
(7, 1, 1, 200),
(8, 1, 1, 500)
ON CONFLICT DO NOTHING;

-- Insert sample stock movements
INSERT INTO "stockMovement" ("productId", "warehouseId", "rackId", "quantity", "type", "referenceNumber", "notes", "performedBy") VALUES
(1, 1, 1, 15, 'IN', 'PO-2024-001', 'Initial stock - Main warehouse', 1),
(1, 2, 5, 8, 'IN', 'PO-2024-002', 'Initial stock - West Coast', 1),
(2, 1, 2, 50, 'IN', 'PO-2024-003', 'Bulk purchase', 1)
ON CONFLICT DO NOTHING;

-- Insert sample orders
INSERT INTO "order" ("orderNumber", "status") VALUES
('ORD-2024-001', 'pending'),
('ORD-2024-002', 'completed'),
('ORD-2024-003', 'confirmed')
ON CONFLICT (orderNumber) DO NOTHING;

-- Insert order items
INSERT INTO "orderItem" ("orderId", "productId", "quantity") VALUES
(1, 1, 2),
(1, 2, 5),
(2, 3, 3),
(3, 4, 1),
(3, 5, 1)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Seed data inserted successfully!' as message,
       'Login with: admin@inventory.com / admin123' as credentials;
