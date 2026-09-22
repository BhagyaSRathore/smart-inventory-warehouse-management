import { db } from "./src/db.ts";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create admin user
    console.log("Creating admin user...");
    const passwordHash = await bcrypt.hash("admin123", 10);
    const admin = await db.orm.public.User.create({
      email: "admin@inventory.com",
      username: "admin",
      name: "System Admin",
      passwordHash,
      role: "admin",
    });
    console.log("✅ Created admin user");

    // Create categories
    console.log("Creating categories...");
    const electronics = await db.orm.public.Category.create({
      name: "Electronics",
      description: "Electronic devices and accessories",
    });
    const furniture = await db.orm.public.Category.create({
      name: "Furniture",
      description: "Office furniture",
    });
    const stationery = await db.orm.public.Category.create({
      name: "Stationery",
      description: "Office supplies and stationery",
    });
    console.log("✅ Created 3 categories");

    // Create suppliers
    console.log("Creating suppliers...");
    const supplier1 = await db.orm.public.Supplier.create({
      name: "Tech Supplies Inc",
      email: "contact@techsupplies.com",
      phone: "+1-555-0100",
      address: "123 Tech Street, Silicon Valley, CA 94025",
    });
    const supplier2 = await db.orm.public.Supplier.create({
      name: "Office World",
      email: "sales@officeworld.com",
      phone: "+1-555-0200",
      address: "456 Business Ave, New York, NY 10001",
    });
    console.log("✅ Created 2 suppliers");

    // Create warehouses
    console.log("Creating warehouses...");
    const warehouse1 = await db.orm.public.Warehouse.create({
      name: "Main Warehouse",
      location: "New York, NY",
    });
    const warehouse2 = await db.orm.public.Warehouse.create({
      name: "West Coast Warehouse",
      location: "Los Angeles, CA",
    });
    const warehouse3 = await db.orm.public.Warehouse.create({
      name: "Central Warehouse",
      location: "Chicago, IL",
    });
    console.log("✅ Created 3 warehouses");

    // Create racks for warehouse 1
    console.log("Creating racks...");
    const rack1A = await db.orm.public.Rack.create({
      name: "A1",
      warehouseId: warehouse1.id,
    });
    const rack1B = await db.orm.public.Rack.create({
      name: "A2",
      warehouseId: warehouse1.id,
    });
    const rack1C = await db.orm.public.Rack.create({
      name: "B1",
      warehouseId: warehouse1.id,
    });

    // Create racks for warehouse 2
    const rack2A = await db.orm.public.Rack.create({
      name: "A1",
      warehouseId: warehouse2.id,
    });
    const rack2B = await db.orm.public.Rack.create({
      name: "A2",
      warehouseId: warehouse2.id,
    });
    console.log("✅ Created 5 racks");

    // Create products
    console.log("Creating products...");
    const laptop = await db.orm.public.Product.create({
      name: "Dell XPS 15 Laptop",
      sku: "LAP-XPS-15",
      barcode: "1234567890123",
      description: "15-inch premium laptop with Intel i7",
      price: 1499.99,
      costPrice: 1200.00,
      reorderLevel: 5,
      safetyStock: 3,
      categoryId: electronics.id,
      supplierId: supplier1.id,
    });

    const mouse = await db.orm.public.Product.create({
      name: "Wireless Mouse",
      sku: "MOU-WL-001",
      barcode: "2345678901234",
      description: "Ergonomic wireless mouse with USB receiver",
      price: 29.99,
      costPrice: 15.00,
      reorderLevel: 20,
      safetyStock: 10,
      categoryId: electronics.id,
      supplierId: supplier1.id,
    });

    const keyboard = await db.orm.public.Product.create({
      name: "Mechanical Keyboard",
      sku: "KEY-MECH-001",
      barcode: "3456789012345",
      description: "RGB mechanical keyboard with Cherry MX switches",
      price: 89.99,
      costPrice: 50.00,
      reorderLevel: 15,
      safetyStock: 8,
      categoryId: electronics.id,
      supplierId: supplier1.id,
    });

    const monitor = await db.orm.public.Product.create({
      name: "27-inch 4K Monitor",
      sku: "MON-4K-27",
      barcode: "4567890123456",
      description: "27-inch 4K UHD IPS monitor",
      price: 399.99,
      costPrice: 280.00,
      reorderLevel: 8,
      safetyStock: 4,
      categoryId: electronics.id,
      supplierId: supplier1.id,
    });

    const desk = await db.orm.public.Product.create({
      name: "Standing Desk",
      sku: "DESK-STD-001",
      barcode: "5678901234567",
      description: "Electric height-adjustable standing desk",
      price: 599.99,
      costPrice: 400.00,
      reorderLevel: 5,
      safetyStock: 2,
      categoryId: furniture.id,
      supplierId: supplier2.id,
    });

    const chair = await db.orm.public.Product.create({
      name: "Ergonomic Office Chair",
      sku: "CHR-ERG-001",
      barcode: "6789012345678",
      description: "Mesh back ergonomic office chair with lumbar support",
      price: 299.99,
      costPrice: 180.00,
      reorderLevel: 10,
      safetyStock: 5,
      categoryId: furniture.id,
      supplierId: supplier2.id,
    });

    const notebook = await db.orm.public.Product.create({
      name: "A4 Notebook Pack",
      sku: "NOTE-A4-10",
      barcode: "7890123456789",
      description: "Pack of 10 A4 ruled notebooks",
      price: 12.99,
      costPrice: 6.00,
      reorderLevel: 50,
      safetyStock: 30,
      categoryId: stationery.id,
      supplierId: supplier2.id,
    });

    const pens = await db.orm.public.Product.create({
      name: "Ballpoint Pen Set",
      sku: "PEN-BP-12",
      barcode: "8901234567890",
      description: "Set of 12 blue ballpoint pens",
      price: 5.99,
      costPrice: 2.50,
      reorderLevel: 100,
      safetyStock: 50,
      categoryId: stationery.id,
      supplierId: supplier2.id,
    });

    console.log("✅ Created 8 products");

    // Create initial inventory
    console.log("Creating inventory records...");
    
    // Laptops
    await db.orm.public.Inventory.create({
      productId: laptop.id,
      warehouseId: warehouse1.id,
      rackId: rack1A.id,
      quantity: 15,
    });
    await db.orm.public.Inventory.create({
      productId: laptop.id,
      warehouseId: warehouse2.id,
      rackId: rack2A.id,
      quantity: 8,
    });

    // Mice
    await db.orm.public.Inventory.create({
      productId: mouse.id,
      warehouseId: warehouse1.id,
      rackId: rack1B.id,
      quantity: 50,
    });

    // Keyboards
    await db.orm.public.Inventory.create({
      productId: keyboard.id,
      warehouseId: warehouse1.id,
      rackId: rack1B.id,
      quantity: 25,
    });

    // Monitors (low stock scenario)
    await db.orm.public.Inventory.create({
      productId: monitor.id,
      warehouseId: warehouse1.id,
      rackId: rack1C.id,
      quantity: 3, // Below reorder level!
    });

    // Desks
    await db.orm.public.Inventory.create({
      productId: desk.id,
      warehouseId: warehouse1.id,
      rackId: rack1C.id,
      quantity: 7,
    });

    // Chairs
    await db.orm.public.Inventory.create({
      productId: chair.id,
      warehouseId: warehouse1.id,
      rackId: rack1C.id,
      quantity: 20,
    });
    await db.orm.public.Inventory.create({
      productId: chair.id,
      warehouseId: warehouse2.id,
      rackId: rack2B.id,
      quantity: 15,
    });

    // Notebooks (high stock)
    await db.orm.public.Inventory.create({
      productId: notebook.id,
      warehouseId: warehouse1.id,
      rackId: rack1A.id,
      quantity: 200,
    });

    // Pens (high stock)
    await db.orm.public.Inventory.create({
      productId: pens.id,
      warehouseId: warehouse1.id,
      rackId: rack1A.id,
      quantity: 500,
    });

    console.log("✅ Created 10 inventory records");

    // Create stock movements (initial stock)
    console.log("Creating stock movements...");
    await db.orm.public.StockMovement.create({
      productId: laptop.id,
      warehouseId: warehouse1.id,
      rackId: rack1A.id,
      quantity: 15,
      type: "IN",
      referenceNumber: "PO-2024-001",
      notes: "Initial stock - Main warehouse",
      performedBy: admin.id,
    });

    await db.orm.public.StockMovement.create({
      productId: laptop.id,
      warehouseId: warehouse2.id,
      rackId: rack2A.id,
      quantity: 8,
      type: "IN",
      referenceNumber: "PO-2024-002",
      notes: "Initial stock - West Coast",
      performedBy: admin.id,
    });

    await db.orm.public.StockMovement.create({
      productId: mouse.id,
      warehouseId: warehouse1.id,
      rackId: rack1B.id,
      quantity: 50,
      type: "IN",
      referenceNumber: "PO-2024-003",
      notes: "Bulk purchase",
      performedBy: admin.id,
    });

    console.log("✅ Created 3 stock movements");

    // Create sample order
    console.log("Creating sample order...");
    const order1 = await db.orm.public.Order.create({
      orderNumber: "ORD-2024-001",
      status: "pending",
    });

    await db.orm.public.OrderItem.create({
      orderId: order1.id,
      productId: laptop.id,
      quantity: 2,
    });

    await db.orm.public.OrderItem.create({
      orderId: order1.id,
      productId: mouse.id,
      quantity: 5,
    });

    console.log("✅ Created 1 order with 2 items");

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Database seeded successfully!");
    console.log("=".repeat(60));
    console.log("\n📊 Summary:");
    console.log("   • 1 Admin user");
    console.log("   • 3 Categories");
    console.log("   • 2 Suppliers");
    console.log("   • 3 Warehouses");
    console.log("   • 5 Racks");
    console.log("   • 8 Products");
    console.log("   • 10 Inventory records");
    console.log("   • 3 Stock movements");
    console.log("   • 1 Order");
    console.log("\n🔑 Login Credentials:");
    console.log("   Email: admin@inventory.com");
    console.log("   Password: admin123");
    console.log("\n📝 Notes:");
    console.log("   • Monitor has LOW STOCK (3 units, reorder at 8)");
    console.log("   • Laptops distributed across 2 warehouses");
    console.log("   • Order ORD-2024-001 is pending");
    console.log("\n🚀 Test the system:");
    console.log("   1. Login with credentials above");
    console.log("   2. Check dashboard for low stock alerts");
    console.log("   3. Test stock operations (IN/OUT/TRANSFER)");
    console.log("   4. Scan barcode: 1234567890123 (Laptop)");
    console.log("=".repeat(60) + "\n");
    
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    console.error("\nError details:", error.message);
    throw error;
  }
}

// Run the seed
seed()
  .then(() => {
    console.log("✅ Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
