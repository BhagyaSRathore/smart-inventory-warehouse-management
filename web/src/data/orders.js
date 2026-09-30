export const orders = [
  {
    id: 'PO-2024-001',
    orderNumber: 'PO-2024-001',
    type: 'purchase',
    supplier: 'TechSupply Co',
    status: 'pending',
    orderDate: '2024-01-08',
    expectedDelivery: '2024-01-15',
    totalAmount: 3500.00,
    items: [
      { product: 'Wireless Mouse', quantity: 50, unitPrice: 15.00 },
      { product: 'Mechanical Keyboard', quantity: 30, unitPrice: 45.00 }
    ]
  },
  {
    id: 'PO-2024-002',
    orderNumber: 'PO-2024-002',
    type: 'purchase',
    supplier: 'AccessoryHub',
    status: 'confirmed',
    orderDate: '2024-01-07',
    expectedDelivery: '2024-01-12',
    totalAmount: 2200.00,
    items: [
      { product: 'USB-C Cable 2m', quantity: 200, unitPrice: 5.00 },
      { product: 'Smartphone Stand', quantity: 150, unitPrice: 8.00 }
    ]
  },
  {
    id: 'PO-2024-003',
    orderNumber: 'PO-2024-003',
    type: 'purchase',
    supplier: 'DisplayTech Inc',
    status: 'completed',
    orderDate: '2023-12-28',
    expectedDelivery: '2024-01-05',
    totalAmount: 6000.00,
    items: [
      { product: 'LED Monitor 24"', quantity: 50, unitPrice: 120.00 }
    ]
  },
  {
    id: 'SO-2024-001',
    orderNumber: 'SO-2024-001',
    type: 'sales',
    customer: 'Retail Store A',
    status: 'completed',
    orderDate: '2024-01-05',
    deliveryDate: '2024-01-07',
    totalAmount: 2899.00,
    items: [
      { product: 'Wireless Mouse', quantity: 20, unitPrice: 29.99 },
      { product: 'LED Monitor 24"', quantity: 10, unitPrice: 199.99 }
    ]
  },
  {
    id: 'SO-2024-002',
    orderNumber: 'SO-2024-002',
    type: 'sales',
    customer: 'Corporate Client B',
    status: 'confirmed',
    orderDate: '2024-01-08',
    expectedDelivery: '2024-01-10',
    totalAmount: 8999.10,
    items: [
      { product: 'Mechanical Keyboard', quantity: 100, unitPrice: 89.99 }
    ]
  },
  {
    id: 'PO-2024-004',
    orderNumber: 'PO-2024-004',
    type: 'purchase',
    supplier: 'AudioMax Ltd',
    status: 'pending',
    orderDate: '2024-01-09',
    expectedDelivery: '2024-01-16',
    totalAmount: 2750.00,
    items: [
      { product: 'Wireless Headphones', quantity: 50, unitPrice: 55.00 }
    ]
  },
  {
    id: 'SO-2024-003',
    orderNumber: 'SO-2024-003',
    type: 'sales',
    customer: 'E-commerce Partner C',
    status: 'pending',
    orderDate: '2024-01-09',
    expectedDelivery: '2024-01-11',
    totalAmount: 3499.50,
    items: [
      { product: 'Power Bank 20000mAh', quantity: 50, unitPrice: 44.99 },
      { product: 'Wireless Headphones', quantity: 10, unitPrice: 129.99 }
    ]
  },
  {
    id: 'PO-2024-005',
    orderNumber: 'PO-2024-005',
    type: 'purchase',
    supplier: 'OfficePlus',
    status: 'confirmed',
    orderDate: '2024-01-07',
    expectedDelivery: '2024-01-13',
    totalAmount: 900.00,
    items: [
      { product: 'Desk Lamp LED', quantity: 50, unitPrice: 18.00 }
    ]
  },
  {
    id: 'SO-2024-004',
    orderNumber: 'SO-2024-004',
    type: 'sales',
    customer: 'Retail Store D',
    status: 'completed',
    orderDate: '2024-01-04',
    deliveryDate: '2024-01-06',
    totalAmount: 1349.30,
    items: [
      { product: 'Notebook A5', quantity: 100, unitPrice: 8.99 },
      { product: 'Ballpoint Pen Set', quantity: 50, unitPrice: 9.99 }
    ]
  },
  {
    id: 'PO-2024-006',
    orderNumber: 'PO-2024-006',
    type: 'purchase',
    supplier: 'TechSupply Co',
    status: 'pending',
    orderDate: '2024-01-09',
    expectedDelivery: '2024-01-16',
    totalAmount: 1050.00,
    items: [
      { product: 'USB-C Hub', quantity: 30, unitPrice: 25.00 },
      { product: 'Webcam HD', quantity: 10, unitPrice: 30.00 }
    ]
  }
];
