import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import ProductListScreen from '../app/products/ProductListScreen';
import AddProductScreen from '../app/products/AddProductScreen';
import ProductDetailsScreen from '../app/products/ProductDetailsScreen';
import {withRoleGuard} from '../components/RoleGuard';
import {ROLES} from '../utils/roles';

export type ProductListMode = 'all' | 'low_stock' | 'out_of_stock';

export type ProductStackParamList = {
  ProductList: {mode?: ProductListMode} | undefined;
  AddProduct: undefined;
  ProductDetails: {productId: number; product?: any};
};

const Stack = createNativeStackNavigator<ProductStackParamList>();

const GuardedAddProductScreen = withRoleGuard(AddProductScreen, [
  ROLES.ADMIN,
  ROLES.WAREHOUSE_MANAGER,
]);

const ProductStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="ProductList"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="ProductList" component={ProductListScreen} />
      <Stack.Screen name="AddProduct" component={GuardedAddProductScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
    </Stack.Navigator>
  );
};

export default ProductStack;
