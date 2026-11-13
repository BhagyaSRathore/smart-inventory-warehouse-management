import React from 'react';
import {View, StyleSheet, StatusBar} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useDrawer} from '../context/DrawerContext';
import EditSupplierScreen from '../app/suppliers/EditSupplierScreen';
import WarehouseListScreen from '../app/warehouses/WarehouseListScreen';
import AddWarehouseScreen from '../app/warehouses/AddWarehouseScreen';
import BarcodeScannerScreen from '../app/scanner/BarcodeScannerScreen';
import DashboardScreen from '../app/DashboardScreen';
import ProductStack from './ProductStack';
import ComingSoonScreen from '../app/common/ComingSoonScreen';
import WarehouseDetailsScreen from '../app/warehouses/WarehouseDetailsScreen';
import StockInScreen from '../app/inventory/StockInScreen';
import StockOutScreen from '../app/inventory/StockOutScreen';
import InventoryScreen from '../app/inventory/InventoryScreen';
import TransferStockScreen from '../app/inventory/TransferStockScreen';
import StockAdjustmentScreen from '../app/inventory/StockAdjustmentScreen';
import StockMovementsScreen from '../app/inventory/StockMovementsScreen';
import EditWarehouseScreen from '../app/warehouses/EditWarehouseScreen';
import SupplierListScreen from '../app/suppliers/SupplierListScreen';
import AddSupplierScreen from '../app/suppliers/AddSupplierScreen';
import SupplierDetailsScreen from '../app/suppliers/SupplierDetailsScreen';
import OrdersScreen from '../app/orders/OrdersScreen';
import PurchaseOrderListScreen from '../app/purchaseOrders/PurchaseOrderListScreen';
import AddPurchaseOrderScreen from '../app/purchaseOrders/AddPurchaseOrderScreen';
import PurchaseOrderDetailsScreen from '../app/purchaseOrders/PurchaseOrderDetailsScreen';
import EditPurchaseOrderScreen from '../app/purchaseOrders/EditPurchaseOrderScreen';

import SalesOrderListScreen from '../app/salesOrders/SalesOrderListScreen';
import AddSalesOrderScreen from '../app/salesOrders/AddSalesOrderScreen';
import SalesOrderDetailsScreen from '../app/salesOrders/SalesOrderDetailsScreen';
import EditSalesOrderScreen from '../app/salesOrders/EditSalesOrderScreen';

import AIAssistantScreen from '../app/ai/AIAssistantScreen';
import DemandPredictionScreen from '../app/predictions/DemandPredictionScreen';
import ProfileScreen from '../app/profile/ProfileScreen';
import SettingsScreen from '../app/settings/SettingsScreen';
import NotificationScreen from '../app/notification/NotificationScreen';

import CustomDrawer from '../components/navigation/CustomDrawer';
import {withRoleGuard} from '../components/RoleGuard';
import {ROLES} from '../utils/roles';

const OPERATIONAL_ROLES = [ROLES.ADMIN, ROLES.WAREHOUSE_MANAGER] as const;

const GuardedAIAssistantScreen = withRoleGuard(
  AIAssistantScreen,
  OPERATIONAL_ROLES,
);
const GuardedDemandPredictionScreen = withRoleGuard(
  DemandPredictionScreen,
  OPERATIONAL_ROLES,
);

const GuardedTransferStockScreen = withRoleGuard(
  TransferStockScreen,
  OPERATIONAL_ROLES,
);
const GuardedStockAdjustmentScreen = withRoleGuard(
  StockAdjustmentScreen,
  OPERATIONAL_ROLES,
);
const GuardedWarehouseListScreen = withRoleGuard(
  WarehouseListScreen,
  OPERATIONAL_ROLES,
);
const GuardedAddWarehouseScreen = withRoleGuard(
  AddWarehouseScreen,
  OPERATIONAL_ROLES,
);
const GuardedWarehouseDetailsScreen = withRoleGuard(
  WarehouseDetailsScreen,
  OPERATIONAL_ROLES,
);
const GuardedEditWarehouseScreen = withRoleGuard(
  EditWarehouseScreen,
  OPERATIONAL_ROLES,
);
const GuardedSupplierListScreen = withRoleGuard(
  SupplierListScreen,
  OPERATIONAL_ROLES,
);
const GuardedAddSupplierScreen = withRoleGuard(
  AddSupplierScreen,
  OPERATIONAL_ROLES,
);
const GuardedSupplierDetailsScreen = withRoleGuard(
  SupplierDetailsScreen,
  OPERATIONAL_ROLES,
);
const GuardedEditSupplierScreen = withRoleGuard(
  EditSupplierScreen,
  OPERATIONAL_ROLES,
);
const GuardedPurchaseOrderListScreen = withRoleGuard(
  PurchaseOrderListScreen,
  OPERATIONAL_ROLES,
);
const GuardedAddPurchaseOrderScreen = withRoleGuard(
  AddPurchaseOrderScreen,
  OPERATIONAL_ROLES,
);
const GuardedPurchaseOrderDetailsScreen = withRoleGuard(
  PurchaseOrderDetailsScreen,
  OPERATIONAL_ROLES,
);
const GuardedEditPurchaseOrderScreen = withRoleGuard(
  EditPurchaseOrderScreen,
  OPERATIONAL_ROLES,
);
const GuardedSalesOrderListScreen = withRoleGuard(
  SalesOrderListScreen,
  OPERATIONAL_ROLES,
);
const GuardedAddSalesOrderScreen = withRoleGuard(
  AddSalesOrderScreen,
  OPERATIONAL_ROLES,
);
const GuardedSalesOrderDetailsScreen = withRoleGuard(
  SalesOrderDetailsScreen,
  OPERATIONAL_ROLES,
);
const GuardedEditSalesOrderScreen = withRoleGuard(
  EditSalesOrderScreen,
  OPERATIONAL_ROLES,
);
const GuardedOrdersScreen = withRoleGuard(
  OrdersScreen,
  OPERATIONAL_ROLES,
);
const GuardedStockMovementsScreen = withRoleGuard(
  StockMovementsScreen,
  OPERATIONAL_ROLES,
);

export type DrawerParamList = {
  DashboardHome: undefined;
  Products: undefined;
  Scanner: undefined;
  StockIn: {productId?: number; product?: any} | undefined;
  StockOut: {productId?: number; product?: any} | undefined;
  Inventory: undefined;
  TransferStock: undefined;
  StockAdjustment: undefined;
  StockMovements: undefined;
   Warehouses: undefined;
AddWarehouse: undefined;
Suppliers: undefined;
AddSupplier: undefined;
EditSupplier: {
  supplierId: number;
  supplier?: any;
};
Orders: undefined;
SupplierDetails: {supplierId: number};
  PurchaseOrders: undefined;
  AddPurchaseOrder: undefined;
  PurchaseOrderDetails: {purchaseOrderId: number};
  EditPurchaseOrder: {purchaseOrderId: number};
  SalesOrders: undefined;
  AddSalesOrder: undefined;
  SalesOrderDetails: {salesOrderId: number};
  EditSalesOrder: {salesOrderId: number};
  InventoryPlaceholder: {title: string; description: string};
  WarehousesPlaceholder: {title: string; description: string};
  SuppliersPlaceholder: {title: string; description: string};
  PurchaseOrdersPlaceholder: {title: string; description: string};
  SalesOrdersPlaceholder: {title: string; description: string};
  StockMovementsPlaceholder: {title: string; description: string};
  AIAssistant: undefined;
  AIAssistantPlaceholder?: {title?: string; description?: string};
  DemandPrediction: undefined;
  DemandPredictionPlaceholder?: {title?: string; description?: string};
  Notifications:
    | {
        filter?: string;
        notificationId?: string | number;
        productId?: string | number;
        warehouseId?: string | number;
        alertId?: string | number;
        title?: string;
        message?: string;
        [key: string]: any;
      }
    | undefined;
  RestockAlerts:
    | {
        filter?: string;
        notificationId?: string | number;
        productId?: string | number;
        warehouseId?: string | number;
        alertId?: string | number;
        title?: string;
        message?: string;
        [key: string]: any;
      }
    | undefined;
  RestockAlertsPlaceholder?: {title?: string; description?: string};
  Profile: undefined;
  ProfilePlaceholder?: {title?: string; description?: string};
  Settings: undefined;
  SettingsPlaceholder?: {title?: string; description?: string};
    EditWarehouse: {
    warehouseId: number;
    warehouse: {
      id: number;
      name: string;
      location?: string | null;
    };
  };

WarehouseDetails: {
  warehouseId: number;
};
};

const Stack = createNativeStackNavigator<DrawerParamList>();

const DrawerNavigator = ({navigation}: any) => {
  const {drawerVisible, closeDrawer} = useDrawer();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Navigator
        initialRouteName="DashboardHome"
        screenOptions={{
          headerShown: false,
        }}>
        
       <Stack.Screen
  name="DashboardHome"
  component={DashboardScreen}
/>

        <Stack.Screen
          name="Scanner"
          component={BarcodeScannerScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="StockIn"
          component={StockInScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="StockOut"
          component={StockOutScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="Inventory"
          component={InventoryScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="EditWarehouse"
          component={GuardedEditWarehouseScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="Products"
          component={ProductStack}
        />

        <Stack.Screen
          name="TransferStock"
          component={GuardedTransferStockScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="StockAdjustment"
          component={GuardedStockAdjustmentScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="InventoryPlaceholder"
          component={ComingSoonScreen}
          initialParams={{
            title: 'Inventory Management',
            description:
              'Multi-location inventory tracking, stock adjustments, and inventory valuation will be available in Phase 2.',
          }}
        />

        <Stack.Screen
          name="Warehouses"
          component={GuardedWarehouseListScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="AddWarehouse"
          component={GuardedAddWarehouseScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="WarehouseDetails"
          component={GuardedWarehouseDetailsScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="Suppliers"
          component={GuardedSupplierListScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="AddSupplier"
          component={GuardedAddSupplierScreen}
          options={{headerShown: false}}
        /> 

        <Stack.Screen
          name="SupplierDetails"
          component={GuardedSupplierDetailsScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="EditSupplier"
          component={GuardedEditSupplierScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="PurchaseOrders"
          component={GuardedPurchaseOrderListScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="AddPurchaseOrder"
          component={GuardedAddPurchaseOrderScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="PurchaseOrderDetails"
          component={GuardedPurchaseOrderDetailsScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="EditPurchaseOrder"
          component={GuardedEditPurchaseOrderScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="SalesOrders"
          component={GuardedSalesOrderListScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="AddSalesOrder"
          component={GuardedAddSalesOrderScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="SalesOrderDetails"
          component={GuardedSalesOrderDetailsScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="EditSalesOrder"
          component={GuardedEditSalesOrderScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="Orders"
          component={GuardedOrdersScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="StockMovements"
          component={GuardedStockMovementsScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="StockMovementsPlaceholder"
          component={GuardedStockMovementsScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="AIAssistant"
          component={GuardedAIAssistantScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="AIAssistantPlaceholder"
          component={GuardedAIAssistantScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="DemandPrediction"
          component={GuardedDemandPredictionScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="DemandPredictionPlaceholder"
          component={GuardedDemandPredictionScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="Notifications"
          component={NotificationScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="RestockAlerts"
          component={NotificationScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="RestockAlertsPlaceholder"
          component={NotificationScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="ProfilePlaceholder"
          component={ProfileScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="SettingsPlaceholder"
          component={SettingsScreen}
          options={{headerShown: false}}
        />
      </Stack.Navigator>

      <CustomDrawer
        visible={drawerVisible}
        onClose={closeDrawer}
        navigation={navigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default DrawerNavigator;