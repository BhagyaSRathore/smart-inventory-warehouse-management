# Backend API

## Overview

Node.js + Express REST API for the Smart Inventory & Warehouse Management System.

## Technology Stack (Planned)

- **Node.js** - Runtime environment
- **Express** - Web framework
- **PostgreSQL** - Database
- **Sequelize/Prisma** - ORM
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Joi** - Validation

## API Endpoints (Planned)

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Inventory
- `GET /api/inventory` - List inventory
- `GET /api/inventory/:id` - Get inventory item
- `POST /api/inventory/stock-in` - Stock in operation
- `POST /api/inventory/stock-out` - Stock out operation
- `POST /api/inventory/transfer` - Transfer between warehouses

### Warehouses
- `GET /api/warehouses` - List warehouses
- `GET /api/warehouses/:id` - Get warehouse details
- `POST /api/warehouses` - Create warehouse
- `PUT /api/warehouses/:id` - Update warehouse

### Suppliers
- `GET /api/suppliers` - List suppliers
- `GET /api/suppliers/:id` - Get supplier details
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status

### Stock Movements
- `GET /api/stock-movements` - List stock movements
- `GET /api/stock-movements/:id` - Get movement details

### ML Integration
- `GET /api/predictions` - Get demand predictions
- `GET /api/predictions/:productId` - Get product prediction

### AI Assistant
- `POST /api/ai/chat` - Chat with AI assistant
- `GET /api/ai/insights` - Get AI insights

## Database Schema (Planned)

Tables:
- users
- products
- categories
- suppliers
- warehouses
- racks
- inventory
- stock_movements
- orders
- order_items
- predictions

## Setup Instructions (When Implemented)

1. Install dependencies
   ```bash
   npm install
   ```

2. Configure environment variables
   ```bash
   cp .env.example .env
   ```

3. Run migrations
   ```bash
   npm run migrate
   ```

4. Seed database
   ```bash
   npm run seed
   ```

5. Start server
   ```bash
   npm run dev
   ```

## Status

🔄 **Not yet implemented** - This will be Phase 2 of development
