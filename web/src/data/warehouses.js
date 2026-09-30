export const warehouses = [
  {
    id: 'WH-A',
    name: 'Warehouse A',
    location: 'Jaipur, Rajasthan',
    capacity: 10000,
    currentUtilization: 7200,
    manager: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'rajesh@warehouse-a.com',
    totalProducts: 428,
    lowStockProducts: 12,
    status: 'active',
    racks: [
      { id: 'A-R1', rackNumber: 'R1', capacity: 500, utilized: 380 },
      { id: 'A-R2', rackNumber: 'R2', capacity: 500, utilized: 450 },
      { id: 'A-R3', rackNumber: 'R3', capacity: 500, utilized: 420 },
      { id: 'A-R4', rackNumber: 'R4', capacity: 500, utilized: 390 }
    ]
  },
  {
    id: 'WH-B',
    name: 'Warehouse B',
    location: 'Delhi NCR',
    capacity: 15000,
    currentUtilization: 9500,
    manager: 'Priya Sharma',
    phone: '+91 98765 43211',
    email: 'priya@warehouse-b.com',
    totalProducts: 685,
    lowStockProducts: 18,
    status: 'active',
    racks: [
      { id: 'B-R1', rackNumber: 'R1', capacity: 750, utilized: 600 },
      { id: 'B-R2', rackNumber: 'R2', capacity: 750, utilized: 680 },
      { id: 'B-R3', rackNumber: 'R3', capacity: 750, utilized: 720 },
      { id: 'B-R4', rackNumber: 'R4', capacity: 750, utilized: 650 },
      { id: 'B-R5', rackNumber: 'R5', capacity: 750, utilized: 700 }
    ]
  },
  {
    id: 'WH-C',
    name: 'Warehouse C',
    location: 'Mumbai, Maharashtra',
    capacity: 8000,
    currentUtilization: 4800,
    manager: 'Amit Patel',
    phone: '+91 98765 43212',
    email: 'amit@warehouse-c.com',
    totalProducts: 312,
    lowStockProducts: 8,
    status: 'active',
    racks: [
      { id: 'C-R1', rackNumber: 'R1', capacity: 400, utilized: 350 },
      { id: 'C-R2', rackNumber: 'R2', capacity: 400, utilized: 380 },
      { id: 'C-R3', rackNumber: 'R3', capacity: 400, utilized: 320 }
    ]
  }
];
