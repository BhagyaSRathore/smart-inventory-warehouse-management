export const inventory = [
  // Warehouse A
  { id: 'INV-1', productId: 'M101', productName: 'Wireless Mouse', warehouseId: 'WH-A', warehouseName: 'Warehouse A', rackId: 'A-R1', rackNumber: 'R1', quantityAvailable: 85, quantityReserved: 10, reorderLevel: 50, status: 'in_stock' },
  { id: 'INV-2', productId: 'K201', productName: 'Mechanical Keyboard', warehouseId: 'WH-A', warehouseName: 'Warehouse A', rackId: 'A-R1', rackNumber: 'R1', quantityAvailable: 20, quantityReserved: 5, reorderLevel: 40, status: 'low_stock' },
  { id: 'INV-3', productId: 'L401', productName: 'LED Monitor 24"', warehouseId: 'WH-A', warehouseName: 'Warehouse A', rackId: 'A-R2', rackNumber: 'R2', quantityAvailable: 18, quantityReserved: 2, reorderLevel: 15, status: 'in_stock' },
  { id: 'INV-4', productId: 'W501', productName: 'Wireless Headphones', warehouseId: 'WH-A', warehouseName: 'Warehouse A', rackId: 'A-R2', rackNumber: 'R2', quantityAvailable: 35, quantityReserved: 5, reorderLevel: 40, status: 'low_stock' },
  { id: 'INV-5', productId: 'P701', productName: 'Power Bank 20000mAh', warehouseId: 'WH-A', warehouseName: 'Warehouse A', rackId: 'A-R3', rackNumber: 'R3', quantityAvailable: 55, quantityReserved: 8, reorderLevel: 50, status: 'in_stock' },
  { id: 'INV-6', productId: 'S801', productName: 'Smartphone Stand', warehouseId: 'WH-A', warehouseName: 'Warehouse A', rackId: 'A-R3', rackNumber: 'R3', quantityAvailable: 120, quantityReserved: 15, reorderLevel: 100, status: 'in_stock' },
  { id: 'INV-7', productId: 'T901', productName: 'USB-C Cable 2m', warehouseId: 'WH-A', warehouseName: 'Warehouse A', rackId: 'A-R4', rackNumber: 'R4', quantityAvailable: 8, quantityReserved: 4, reorderLevel: 150, status: 'low_stock' },
  { id: 'INV-8', productId: 'L102', productName: 'Laptop Stand', warehouseId: 'WH-A', warehouseName: 'Warehouse A', rackId: 'A-R4', rackNumber: 'R4', quantityAvailable: 25, quantityReserved: 3, reorderLevel: 30, status: 'low_stock' },
  
  // Warehouse B
  { id: 'INV-9', productId: 'M101', productName: 'Wireless Mouse', warehouseId: 'WH-B', warehouseName: 'Warehouse B', rackId: 'B-R1', rackNumber: 'R1', quantityAvailable: 60, quantityReserved: 8, reorderLevel: 50, status: 'in_stock' },
  { id: 'INV-10', productId: 'K201', productName: 'Mechanical Keyboard', warehouseId: 'WH-B', warehouseName: 'Warehouse B', rackId: 'B-R1', rackNumber: 'R1', quantityAvailable: 15, quantityReserved: 3, reorderLevel: 40, status: 'low_stock' },
  { id: 'INV-11', productId: 'H301', productName: 'USB-C Hub', warehouseId: 'WH-B', warehouseName: 'Warehouse B', rackId: 'B-R2', rackNumber: 'R2', quantityAvailable: 0, quantityReserved: 0, reorderLevel: 30, status: 'out_of_stock' },
  { id: 'INV-12', productId: 'C601', productName: 'Webcam HD', warehouseId: 'WH-B', warehouseName: 'Warehouse B', rackId: 'B-R2', rackNumber: 'R2', quantityAvailable: 12, quantityReserved: 2, reorderLevel: 25, status: 'low_stock' },
  { id: 'INV-13', productId: 'W501', productName: 'Wireless Headphones', warehouseId: 'WH-B', warehouseName: 'Warehouse B', rackId: 'B-R3', rackNumber: 'R3', quantityAvailable: 27, quantityReserved: 4, reorderLevel: 40, status: 'low_stock' },
  { id: 'INV-14', productId: 'P701', productName: 'Power Bank 20000mAh', warehouseId: 'WH-B', warehouseName: 'Warehouse B', rackId: 'B-R3', rackNumber: 'R3', quantityAvailable: 40, quantityReserved: 5, reorderLevel: 50, status: 'low_stock' },
  { id: 'INV-15', productId: 'B105', productName: 'Backpack Laptop 15"', warehouseId: 'WH-B', warehouseName: 'Warehouse B', rackId: 'B-R4', rackNumber: 'R4', quantityAvailable: 35, quantityReserved: 5, reorderLevel: 35, status: 'in_stock' },
  { id: 'INV-16', productId: 'M106', productName: 'Mouse Pad XL', warehouseId: 'WH-B', warehouseName: 'Warehouse B', rackId: 'B-R4', rackNumber: 'R4', quantityAvailable: 48, quantityReserved: 6, reorderLevel: 60, status: 'low_stock' },
  { id: 'INV-17', productId: 'N103', productName: 'Notebook A5', warehouseId: 'WH-B', warehouseName: 'Warehouse B', rackId: 'B-R5', rackNumber: 'R5', quantityAvailable: 220, quantityReserved: 30, reorderLevel: 200, status: 'in_stock' },
  { id: 'INV-18', productId: 'P104', productName: 'Ballpoint Pen Set', warehouseId: 'WH-B', warehouseName: 'Warehouse B', rackId: 'B-R5', rackNumber: 'R5', quantityAvailable: 15, quantityReserved: 5, reorderLevel: 100, status: 'low_stock' },
  
  // Warehouse C
  { id: 'INV-19', productId: 'L401', productName: 'LED Monitor 24"', warehouseId: 'WH-C', warehouseName: 'Warehouse C', rackId: 'C-R1', rackNumber: 'R1', quantityAvailable: 10, quantityReserved: 2, reorderLevel: 15, status: 'low_stock' },
  { id: 'INV-20', productId: 'C601', productName: 'Webcam HD', warehouseId: 'WH-C', warehouseName: 'Warehouse C', rackId: 'C-R1', rackNumber: 'R1', quantityAvailable: 6, quantityReserved: 1, reorderLevel: 25, status: 'low_stock' },
  { id: 'INV-21', productId: 'S801', productName: 'Smartphone Stand', warehouseId: 'WH-C', warehouseName: 'Warehouse C', rackId: 'C-R2', rackNumber: 'R2', quantityAvailable: 100, quantityReserved: 12, reorderLevel: 100, status: 'in_stock' },
  { id: 'INV-22', productId: 'T901', productName: 'USB-C Cable 2m', warehouseId: 'WH-C', warehouseName: 'Warehouse C', rackId: 'C-R2', rackNumber: 'R2', quantityAvailable: 4, quantityReserved: 2, reorderLevel: 150, status: 'low_stock' },
  { id: 'INV-23', productId: 'L102', productName: 'Laptop Stand', warehouseId: 'WH-C', warehouseName: 'Warehouse C', rackId: 'C-R3', rackNumber: 'R3', quantityAvailable: 20, quantityReserved: 3, reorderLevel: 30, status: 'low_stock' },
  { id: 'INV-24', productId: 'D102', productName: 'Desk Lamp LED', warehouseId: 'WH-C', warehouseName: 'Warehouse C', rackId: 'C-R3', rackNumber: 'R3', quantityAvailable: 0, quantityReserved: 0, reorderLevel: 40, status: 'out_of_stock' },
  { id: 'INV-25', productId: 'N103', productName: 'Notebook A5', warehouseId: 'WH-C', warehouseName: 'Warehouse C', rackId: 'C-R3', rackNumber: 'R3', quantityAvailable: 160, quantityReserved: 20, reorderLevel: 200, status: 'low_stock' },
  { id: 'INV-26', productId: 'P104', productName: 'Ballpoint Pen Set', warehouseId: 'WH-C', warehouseName: 'Warehouse C', rackId: 'C-R3', rackNumber: 'R3', quantityAvailable: 7, quantityReserved: 2, reorderLevel: 100, status: 'low_stock' },
  { id: 'INV-27', productId: 'M106', productName: 'Mouse Pad XL', warehouseId: 'WH-C', warehouseName: 'Warehouse C', rackId: 'C-R2', rackNumber: 'R2', quantityAvailable: 40, quantityReserved: 5, reorderLevel: 60, status: 'low_stock' },
  { id: 'INV-28', productId: 'B105', productName: 'Backpack Laptop 15"', warehouseId: 'WH-C', warehouseName: 'Warehouse C', rackId: 'C-R1', rackNumber: 'R1', quantityAvailable: 23, quantityReserved: 3, reorderLevel: 35, status: 'low_stock' }
];
