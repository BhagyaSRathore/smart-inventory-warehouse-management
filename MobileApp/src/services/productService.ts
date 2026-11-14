import API from './api';
import apis from './endpoint';

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Warehouse {
  id: number;
  name: string;
  location?: string;
}

export interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface ProductInventoryLocation {
  inventoryId: number;
  quantity: number;
  warehouse: Warehouse | null;
  rack?: { id: number; name: string } | null;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string | null;
  description?: string | null;
  price: number;
  costPrice?: number | null;
  reorderLevel: number;
  safetyStock: number;
  imageUrl?: string | null;
  categoryId?: number | null;
  supplierId?: number | null;
  totalStock?: number;
  category?: Category | null;
  supplier?: Supplier | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductPayload {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  price: number;
  costPrice?: number;
  reorderLevel?: number;
  safetyStock?: number;
  imageUrl?: string;
  categoryId?: number;
  supplierId?: number;
}

export interface ProductDetailsResponse {
  message: string;
  product: Product;
  inventory?: {
    totalStock: number;
    locations: ProductInventoryLocation[];
  };
}

export const getProducts = async (): Promise<Product[]> => {
  const response = await API.get<{ message: string; products: Product[] }>(apis.products);
  return response.data.products || [];
};

export const getProductById = async (id: number): Promise<ProductDetailsResponse> => {
  const response = await API.get<ProductDetailsResponse>(apis.productById(id));
  return response.data;
};

export const createProduct = async (data: CreateProductPayload): Promise<Product> => {
  const response = await API.post<{ message: string; product: Product }>(apis.products, data);
  return response.data.product;
};

export const updateProduct = async (
  id: number,
  data: Partial<CreateProductPayload>,
): Promise<Product> => {
  const response = await API.put<{ message: string; product: Product }>(apis.productById(id), data);
  return response.data.product;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await API.delete(apis.productById(id));
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await API.get<{ message: string; categories: Category[] }>(apis.categories);
  return response.data.categories || [];
};

export const getWarehouses = async (): Promise<Warehouse[]> => {
  const response = await API.get<{ message: string; warehouses: Warehouse[] }>(apis.warehouses);
  return response.data.warehouses || [];
};

export const getSuppliers = async (): Promise<Supplier[]> => {
  const response = await API.get<{ message: string; suppliers: Supplier[] }>(apis.suppliers);
  return response.data.suppliers || [];
};

export const createInventory = async (data: {
  productId: number;
  warehouseId: number;
  quantity: number;
}): Promise<any> => {
  const response = await API.post(apis.inventory, data);
  return response.data;
};

export const recordStockIn = async (data: {
  productId: number;
  warehouseId: number;
  quantity: number;
  notes?: string;
}): Promise<any> => {
  const response = await API.post(apis.stockIn, data);
  return response.data;
};

export const recordStockOut = async (data: {
  productId: number;
  warehouseId: number;
  quantity: number;
  notes?: string;
}): Promise<any> => {
  const response = await API.post(apis.stockOut, data);
  return response.data;
};
