import API from './api';
import apis from './endpoint';

export interface DashboardSummary {
  totalProducts: number;
  totalWarehouses: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingOrders: number;
  totalOrders: number;
}

export interface DashboardResponse {
  message: string;
  summary: DashboardSummary;
  lowStockProducts: any[];
  outOfStockProducts: any[];
  recentStockMovements: any[];
}

export const getDashboard = async (): Promise<DashboardResponse> => {
  const response = await API.get<DashboardResponse>(
    apis.dashboard,
  );

  return response.data;
};