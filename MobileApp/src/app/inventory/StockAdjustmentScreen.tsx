import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  MapPin,
  Menu,
  Minus,
  Package,
  Plus,
  Sliders,
  Wrench,
} from 'lucide-react-native';

import API from '../../services/api';
import apis from '../../services/endpoint';
import CustomAlert from '../../components/CustomAlert';
import {useDrawer} from '../../context/DrawerContext';
import {useAppTheme, ThemeColors} from '../../context/ThemeContext';

type Product = {
  id: number;
  name: string;
  sku?: string;
  price?: number;
};

type Warehouse = {
  id: number;
  name: string;
  location?: string | null;
};

type Rack = {
  id: number;
  name: string;
  warehouseId?: number;
};

type InventoryItem = {
  id: number;
  productId: number;
  warehouseId: number;
  rackId?: number | null;
  quantity: number;
  product?: {
    id: number;
    name: string;
    sku?: string;
  } | null;
  warehouse?: {
    id: number;
    name: string;
  } | null;
  rack?: {
    id: number;
    name: string;
  } | null;
};

type Props = {
  navigation: any;
  route?: any;
};

const StockAdjustmentScreen = ({navigation, route}: Props) => {
  const {openDrawer} = useDrawer();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [allRacks, setAllRacks] = useState<Rack[]>([]);
  const [filteredRacks, setFilteredRacks] = useState<Rack[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [selectedRack, setSelectedRack] = useState<Rack | null>(null);

  const [newQuantity, setNewQuantity] = useState('');
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [openDropdown, setOpenDropdown] = useState<'product' | 'warehouse' | 'rack' | null>(null);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'warning' | 'error';
    title: string;
    message: string;
    onPress?: () => void;
  }>({
    visible: false,
    type: 'warning',
    title: '',
    message: '',
  });

  const showAlert = (
    type: 'success' | 'warning' | 'error',
    title: string,
    message: string,
    onPress?: () => void,
  ) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      onPress,
    });
  };

  const hideAlert = () => {
    const callback = alertConfig.onPress;
    setAlertConfig(prev => ({...prev, visible: false}));
    if (callback) {
      callback();
    }
  };

  const handleOpenDrawer = () => {
    setOpenDropdown(null);
    openDrawer();
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [productsResponse, warehousesResponse, racksResponse, inventoryResponse] =
        await Promise.all([
          API.get('/products'),
          API.get('/warehouses'),
          API.get('/racks'),
          API.get('/inventory'),
        ]);

      const productData = productsResponse?.data;
      const warehouseData = warehousesResponse?.data;
      const rackData = racksResponse?.data;
      const inventoryData = inventoryResponse?.data;

      let resolvedProducts: Product[] = [];
      if (Array.isArray(productData)) {
        resolvedProducts = productData;
      } else if (Array.isArray(productData?.products)) {
        resolvedProducts = productData.products;
      } else if (Array.isArray(productData?.data)) {
        resolvedProducts = productData.data;
      }
      setProducts(resolvedProducts);

      let resolvedWarehouses: Warehouse[] = [];
      if (Array.isArray(warehouseData)) {
        resolvedWarehouses = warehouseData;
      } else if (Array.isArray(warehouseData?.warehouses)) {
        resolvedWarehouses = warehouseData.warehouses;
      } else if (Array.isArray(warehouseData?.data)) {
        resolvedWarehouses = warehouseData.data;
      }
      setWarehouses(resolvedWarehouses);

      let loadedRacks: Rack[] = [];
      if (Array.isArray(rackData)) {
        loadedRacks = rackData;
      } else if (Array.isArray(rackData?.racks)) {
        loadedRacks = rackData.racks;
      } else if (Array.isArray(rackData?.data)) {
        loadedRacks = rackData.data;
      }
      setAllRacks(loadedRacks);

      let loadedInventory: InventoryItem[] = [];
      if (Array.isArray(inventoryData)) {
        loadedInventory = inventoryData;
      } else if (Array.isArray(inventoryData?.inventories)) {
        loadedInventory = inventoryData.inventories;
      } else if (Array.isArray(inventoryData?.data)) {
        loadedInventory = inventoryData.data;
      }
      setInventoryList(loadedInventory);

      // Handle route param preselection if provided
      if (route?.params?.productId) {
        const targetId = Number(route.params.productId);
        const match = resolvedProducts.find(p => p.id === targetId);
        if (match) {
          handleProductSelect(match, loadedInventory, resolvedWarehouses, loadedRacks);
        } else if (route.params.product) {
          handleProductSelect(route.params.product, loadedInventory, resolvedWarehouses, loadedRacks);
        }
      }
    } catch (error) {
      console.log('STOCK ADJUSTMENT LOAD ERROR:', error);
      showAlert('error', 'Load Failed', 'Unable to load products, warehouses, or inventory.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const findMatchingInventory = (
    items: InventoryItem[],
    productId: number,
    warehouseId: number,
    rackId?: number | null,
  ) => {
    return items.find(inv => {
      const matchesProduct = Number(inv.productId) === Number(productId);
      const matchesWarehouse = Number(inv.warehouseId) === Number(warehouseId);
      const matchesRack =
        rackId !== undefined && rackId !== null
          ? Number(inv.rackId) === Number(rackId)
          : inv.rackId === null || inv.rackId === undefined;
      return matchesProduct && matchesWarehouse && matchesRack;
    });
  };

  const handleProductSelect = (
    product: Product,
    invList: InventoryItem[] = inventoryList,
    whList: Warehouse[] = warehouses,
    rkList: Rack[] = allRacks,
  ) => {
    setSelectedProduct(product);
    setOpenDropdown(null);

    // Auto-detect warehouse if product inventory only exists in one warehouse
    const productInventories = invList.filter(
      inv => Number(inv.productId) === Number(product.id),
    );

    if (productInventories.length === 1) {
      const matchWarehouse = whList.find(
        w => Number(w.id) === Number(productInventories[0].warehouseId),
      );
      if (matchWarehouse) {
        setSelectedWarehouse(matchWarehouse);
        const warehouseRacks = rkList.filter(
          rack => Number(rack.warehouseId) === Number(matchWarehouse.id),
        );
        setFilteredRacks(warehouseRacks);

        if (productInventories[0].rackId) {
          const matchRack = warehouseRacks.find(
            r => Number(r.id) === Number(productInventories[0].rackId),
          );
          setSelectedRack(matchRack || null);
        } else {
          setSelectedRack(null);
        }
        return;
      }
    }

    // If warehouse already selected, verify and keep rack
    if (selectedWarehouse) {
      const matchingInv = productInventories.find(
        inv => Number(inv.warehouseId) === Number(selectedWarehouse.id),
      );
      if (matchingInv && matchingInv.rackId) {
        const matchingRack = rkList.find(
          r => Number(r.id) === Number(matchingInv.rackId),
        );
        setSelectedRack(matchingRack || null);
      }
    }
  };

  const handleWarehouseSelect = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setOpenDropdown(null);

    const warehouseRacks = allRacks.filter(
      rack => Number(rack.warehouseId) === Number(warehouse.id),
    );
    setFilteredRacks(warehouseRacks);

    // Auto-detect existing inventory rack for this product in this warehouse
    if (selectedProduct) {
      const productInventories = inventoryList.filter(
        inv =>
          Number(inv.productId) === Number(selectedProduct.id) &&
          Number(inv.warehouseId) === Number(warehouse.id),
      );

      if (productInventories.length === 1 && productInventories[0].rackId) {
        const matchingRack = warehouseRacks.find(
          r => Number(r.id) === Number(productInventories[0].rackId),
        );
        if (matchingRack) {
          setSelectedRack(matchingRack);
          return;
        }
      }
    }

    setSelectedRack(null);
  };

  const currentInventory = useMemo(() => {
    if (!selectedProduct || !selectedWarehouse) {
      return null;
    }
    return findMatchingInventory(
      inventoryList,
      selectedProduct.id,
      selectedWarehouse.id,
      selectedRack?.id,
    );
  }, [selectedProduct, selectedWarehouse, selectedRack, inventoryList]);

  // Calculate quantity difference
  const quantityDiff = useMemo(() => {
    if (!currentInventory || !newQuantity.trim()) {
      return null;
    }
    const num = Number(newQuantity.trim());
    if (!Number.isFinite(num) || num < 0) {
      return null;
    }
    return num - currentInventory.quantity;
  }, [currentInventory, newQuantity]);

  const handleAdjustStock = async () => {
    if (submitting) return;

    if (!selectedProduct) {
      showAlert('warning', 'Product Required', 'Please select a product.');
      return;
    }

    if (!selectedWarehouse) {
      showAlert('warning', 'Warehouse Required', 'Please select a warehouse location.');
      return;
    }

    const trimmedQuantity = newQuantity.trim();
    if (!trimmedQuantity) {
      showAlert('warning', 'Quantity Required', 'Please enter the new physical quantity.');
      return;
    }

    const numericNewQuantity = Number(trimmedQuantity);
    if (!Number.isFinite(numericNewQuantity) || numericNewQuantity < 0) {
      showAlert(
        'warning',
        'Invalid Quantity',
        'New quantity cannot be negative (must be 0 or greater).',
      );
      return;
    }

    if (!reason.trim()) {
      showAlert('warning', 'Reason Required', 'Please enter a mandatory reason for this inventory adjustment.');
      return;
    }

    try {
      setSubmitting(true);

      // Fetch fresh inventory data from backend before validation
      const invRes = await API.get('/inventory');
      const invData = invRes?.data;
      let freshInventory: InventoryItem[] = [];
      if (Array.isArray(invData)) {
        freshInventory = invData;
      } else if (Array.isArray(invData?.inventories)) {
        freshInventory = invData.inventories;
      } else if (Array.isArray(invData?.data)) {
        freshInventory = invData.data;
      } else {
        freshInventory = inventoryList;
      }
      setInventoryList(freshInventory);

      const matchingInv = findMatchingInventory(
        freshInventory,
        selectedProduct.id,
        selectedWarehouse.id,
        selectedRack?.id,
      );

      if (!matchingInv) {
        showAlert(
          'error',
          'Inventory Not Found',
          'No inventory record found for the selected product and location. Adjustment can only be performed on existing inventory records.',
        );
        setSubmitting(false);
        return;
      }

      const payload = {
        productId: selectedProduct.id,
        warehouseId: selectedWarehouse.id,
        rackId: selectedRack?.id,
        newQuantity: numericNewQuantity,
        reason: reason.trim(),
      };

      console.log('ADJUSTMENT PAYLOAD:', payload);

      const endpoint = apis.adjustment || '/inventory/adjustment';
      const response = await API.post(endpoint, payload);

      console.log('ADJUSTMENT RESPONSE:', response?.data);

      const successMsg =
        `Inventory adjustment completed successfully. On-hand stock for ${selectedProduct.name} has been updated to ${numericNewQuantity} units.`;

      showAlert(
        'success',
        'Adjustment Completed',
        successMsg,
        () => {
          setSelectedProduct(null);
          setSelectedWarehouse(null);
          setSelectedRack(null);
          setNewQuantity('');
          setReason('');
          setFilteredRacks([]);
          navigation.goBack();
        },
      );
    } catch (error: any) {
      console.log('ADJUSTMENT ERROR:', error?.response?.data || error);

      const message =
        error?.response?.data?.message ||
        'Failed to complete inventory adjustment operation.';
      showAlert('error', 'Adjustment Failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1769E0" />
        <Text style={styles.loadingText}>Loading inventory details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}>
          <ArrowLeft size={22} color={theme.textPrimary} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Stock Adjustment</Text>
          <Text style={styles.headerSubtitle}>Correct physical inventory</Text>
        </View>

        <Pressable
          style={styles.menuHeaderButton}
          onPress={handleOpenDrawer}
          hitSlop={8}>
          <Menu size={22} color="#1769E0" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {/* Top Header Card */}
        <View style={styles.topCard}>
          <View style={styles.iconContainer}>
            <Sliders size={26} color="#1769E0" strokeWidth={2.2} />
          </View>
          <Text style={styles.title}>Adjust Inventory</Text>
          <Text style={styles.description}>
            Reconcile physical stock counts with the warehouse database. Updates inventory and logs an official stock movement audit record.
          </Text>
        </View>

        {/* ================= STEP 1: SELECT PRODUCT ================= */}
        <Text style={styles.label}>Product *</Text>
        <Pressable
          style={[styles.selectBox, openDropdown === 'product' && styles.selectBoxActive]}
          onPress={() =>
            setOpenDropdown(openDropdown === 'product' ? null : 'product')
          }>
          <View style={styles.selectBoxInner}>
            <Package size={18} color="#1769E0" style={{marginRight: 10}} />
            <Text
              style={
                selectedProduct ? styles.selectedText : styles.placeholder
              }
              numberOfLines={1}>
              {selectedProduct
                ? `${selectedProduct.name}${
                    selectedProduct.sku ? ` • ${selectedProduct.sku}` : ''
                  }`
                : 'Select Product'}
            </Text>
          </View>
          {openDropdown === 'product' ? (
            <ChevronUp size={18} color="#64748B" />
          ) : (
            <ChevronDown size={18} color="#64748B" />
          )}
        </Pressable>

        {openDropdown === 'product' && (
          <View style={styles.dropdown}>
            {products.length === 0 ? (
              <Text style={styles.noData}>No products found</Text>
            ) : (
              products.map(product => {
                const totalStock = inventoryList
                  .filter(inv => Number(inv.productId) === Number(product.id))
                  .reduce((sum, inv) => sum + (inv.quantity || 0), 0);

                return (
                  <Pressable
                    key={product.id}
                    style={styles.dropdownItem}
                    onPress={() => handleProductSelect(product)}>
                    <View style={{flex: 1}}>
                      <Text style={styles.dropdownTitle}>{product.name}</Text>
                      <View style={styles.dropdownMetaRow}>
                        {product.sku && (
                          <Text style={styles.dropdownSubtitle}>
                            SKU: {product.sku}
                          </Text>
                        )}
                        <Text style={styles.dropdownStockBadge}>
                          {totalStock} in stock
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        )}

        {/* ================= STEP 2: LOCATION ================= */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Inventory Location</Text>

          {/* Warehouse Dropdown */}
          <Text style={styles.subLabel}>Warehouse *</Text>
          <Pressable
            style={[styles.selectBox, openDropdown === 'warehouse' && styles.selectBoxActive]}
            onPress={() =>
              setOpenDropdown(openDropdown === 'warehouse' ? null : 'warehouse')
            }>
            <View style={styles.selectBoxInner}>
              <MapPin size={18} color="#1769E0" style={{marginRight: 10}} />
              <Text
                style={
                  selectedWarehouse
                    ? styles.selectedText
                    : styles.placeholder
                }
                numberOfLines={1}>
                {selectedWarehouse
                  ? selectedWarehouse.name
                  : 'Select Warehouse'}
              </Text>
            </View>
            {openDropdown === 'warehouse' ? (
              <ChevronUp size={18} color="#64748B" />
            ) : (
              <ChevronDown size={18} color="#64748B" />
            )}
          </Pressable>

          {openDropdown === 'warehouse' && (
            <View style={styles.dropdown}>
              {warehouses.length === 0 ? (
                <Text style={styles.noData}>No warehouses found</Text>
              ) : (
                warehouses.map(warehouse => {
                  let whStock = 0;
                  if (selectedProduct) {
                    whStock = inventoryList
                      .filter(
                        inv =>
                          Number(inv.productId) === Number(selectedProduct.id) &&
                          Number(inv.warehouseId) === Number(warehouse.id),
                      )
                      .reduce((sum, inv) => sum + (inv.quantity || 0), 0);
                  }

                  return (
                    <Pressable
                      key={warehouse.id}
                      style={styles.dropdownItem}
                      onPress={() => handleWarehouseSelect(warehouse)}>
                      <View style={{flex: 1}}>
                        <Text style={styles.dropdownTitle}>{warehouse.name}</Text>
                        {selectedProduct && (
                          <Text style={styles.dropdownSubtitle}>
                            {whStock > 0
                              ? `${whStock} units on hand`
                              : 'No stock recorded'}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          )}

          {/* Rack Dropdown */}
          <Text style={styles.subLabel}>Rack (Optional / If Applicable)</Text>
          <Pressable
            disabled={!selectedWarehouse}
            style={[
              styles.selectBox,
              !selectedWarehouse && styles.disabledBox,
              openDropdown === 'rack' && styles.selectBoxActive,
            ]}
            onPress={() =>
              setOpenDropdown(openDropdown === 'rack' ? null : 'rack')
            }>
            <View style={styles.selectBoxInner}>
              <Layers size={18} color={selectedWarehouse ? '#1769E0' : '#94A3B8'} style={{marginRight: 10}} />
              <Text
                style={
                  selectedRack
                    ? styles.selectedText
                    : styles.placeholder
                }
                numberOfLines={1}>
                {selectedRack
                  ? selectedRack.name
                  : selectedWarehouse
                  ? '-- No Specific Rack (Warehouse Floor) --'
                  : 'Select warehouse first'}
              </Text>
            </View>
            {openDropdown === 'rack' ? (
              <ChevronUp size={18} color="#64748B" />
            ) : (
              <ChevronDown size={18} color="#64748B" />
            )}
          </Pressable>

          {openDropdown === 'rack' && (
            <View style={styles.dropdown}>
              <Pressable
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedRack(null);
                  setOpenDropdown(null);
                }}>
                <Text style={[styles.dropdownTitle, {color: '#64748B'}]}>
                  -- No Specific Rack (Warehouse Floor) --
                </Text>
              </Pressable>
              {filteredRacks.length === 0 ? (
                <Text style={styles.noData}>
                  No racks registered for this warehouse
                </Text>
              ) : (
                filteredRacks.map(rack => {
                  let rackStock: number | null = null;
                  if (selectedProduct && selectedWarehouse) {
                    const rkInv = inventoryList.find(
                      inv =>
                        Number(inv.productId) === Number(selectedProduct.id) &&
                        Number(inv.warehouseId) === Number(selectedWarehouse.id) &&
                        Number(inv.rackId) === Number(rack.id),
                    );
                    if (rkInv) {
                      rackStock = rkInv.quantity;
                    }
                  }

                  return (
                    <Pressable
                      key={rack.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedRack(rack);
                        setOpenDropdown(null);
                      }}>
                      <View style={{flex: 1}}>
                        <Text style={styles.dropdownTitle}>{rack.name}</Text>
                        {rackStock !== null && (
                          <Text style={styles.dropdownSubtitle}>
                            {rackStock} units on this rack
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          )}
        </View>

        {/* ================= STEP 3: CURRENT QUANTITY ================= */}
        <Text style={styles.label}>Current On-Hand Stock</Text>
        <View style={styles.currentQuantityContainer}>
          <View style={styles.currentQuantityRow}>
            <Text style={styles.currentQuantityLabel}>
              {selectedProduct && selectedWarehouse
                ? currentInventory
                  ? 'Current Quantity:'
                  : 'Status:'
                : 'Status:'}
            </Text>
            <Text
              style={[
                styles.currentQuantityValue,
                !selectedProduct || !selectedWarehouse
                  ? styles.currentQuantityMuted
                  : currentInventory
                  ? styles.currentQuantityActive
                  : styles.currentQuantityNotFound,
              ]}>
              {!selectedProduct || !selectedWarehouse
                ? 'Select product & warehouse above'
                : currentInventory
                ? `${currentInventory.quantity} units`
                : 'No inventory record at this location'}
            </Text>
          </View>
          {selectedProduct && selectedWarehouse && currentInventory && (
            <Text style={styles.currentQuantitySubtext}>
              Location: {selectedWarehouse.name}
              {selectedRack ? ` • Rack ${selectedRack.name}` : ' • No Rack'}
            </Text>
          )}
        </View>

        {/* ================= STEP 4: NEW QUANTITY ================= */}
        <Text style={styles.label}>New Physical Quantity *</Text>
        <TextInput
          value={newQuantity}
          onChangeText={setNewQuantity}
          placeholder="e.g. 47"
          placeholderTextColor={theme.placeholderText}
          keyboardType="numeric"
          style={styles.input}
        />

        {/* QUANTITY COMPARISON FLOW BANNER */}
        {currentInventory && newQuantity.trim().length > 0 && quantityDiff !== null && (
          <View
            style={[
              styles.diffBanner,
              quantityDiff < 0
                ? styles.diffBannerReduction
                : quantityDiff > 0
                ? styles.diffBannerAddition
                : styles.diffBannerNeutral,
            ]}>
            <View style={styles.diffFlowRow}>
              <View style={styles.diffFlowItem}>
                <Text style={styles.diffFlowLabel}>Current</Text>
                <Text style={styles.diffFlowValue}>
                  {currentInventory.quantity}
                </Text>
              </View>

              <ArrowRight size={18} color="#64748B" />

              <View style={styles.diffFlowItem}>
                <Text style={styles.diffFlowLabel}>New Count</Text>
                <Text style={[styles.diffFlowValue, {color: theme.textPrimary}]}>
                  {Number(newQuantity.trim())}
                </Text>
              </View>

              <View style={styles.diffDivider} />

              <View style={styles.diffFlowItem}>
                <Text style={styles.diffFlowLabel}>Adjustment</Text>
                <Text
                  style={[
                    styles.diffFlowValue,
                    quantityDiff < 0
                      ? {color: '#DC2626'}
                      : quantityDiff > 0
                      ? {color: '#16A34A'}
                      : {color: '#64748B'},
                  ]}>
                  {quantityDiff > 0 ? `+${quantityDiff}` : quantityDiff}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.diffSubtext,
                quantityDiff < 0
                  ? {color: '#B91C1C'}
                  : quantityDiff > 0
                  ? {color: '#15803D'}
                  : {color: '#64748B'},
              ]}>
              {quantityDiff < 0
                ? `Stock reduction of ${Math.abs(quantityDiff)} units`
                : quantityDiff > 0
                ? `Stock increase of ${quantityDiff} units`
                : 'No difference in stock quantity'}
            </Text>
          </View>
        )}

        {/* ================= STEP 5: REASON ================= */}
        <Text style={styles.label}>Reason for Adjustment *</Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="e.g. Damaged items during handling, Physical count discrepancy, Found uncounted items"
          placeholderTextColor={theme.placeholderText}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.reasonInput]}
        />

        {/* ================= SUBMIT BUTTON ================= */}
        <Pressable
          disabled={submitting}
          style={[
            styles.submitButton,
            submitting && styles.disabledButton,
          ]}
          onPress={handleAdjustStock}>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Check size={19} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.submitText}>Adjust Inventory</Text>
            </>
          )}
        </Pressable>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Unified CustomAlert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onPress={hideAlert}
      />
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.bg,
    },
    loadingText: {
      marginTop: 12,
      color: theme.textSecondary,
      fontSize: 14,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 14,
      backgroundColor: theme.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.headerBorder,
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: theme.headerButtonBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
      marginLeft: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    headerSubtitle: {
      marginTop: 2,
      fontSize: 12,
      color: theme.textSecondary,
    },
    menuHeaderButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      padding: 16,
      paddingBottom: 45,
    },
    topCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 8,
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.2)' : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    title: {
      fontSize: 19,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    description: {
      marginTop: 6,
      textAlign: 'center',
      fontSize: 13,
      lineHeight: 18,
      color: theme.textSecondary,
    },
    label: {
      marginTop: 16,
      marginBottom: 7,
      fontSize: 13,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    subLabel: {
      marginTop: 12,
      marginBottom: 6,
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    selectBox: {
      minHeight: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      backgroundColor: theme.inputBg,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectBoxActive: {
      borderColor: '#1769E0',
    },
    selectBoxInner: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    disabledBox: {
      backgroundColor: theme.inputDisabledBg,
      borderColor: theme.borderLight,
    },
    selectedText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    placeholder: {
      flex: 1,
      fontSize: 14,
      color: theme.placeholderText,
    },
    dropdown: {
      marginTop: 6,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      backgroundColor: theme.cardBg,
      overflow: 'hidden',
      shadowColor: theme.shadowColor,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 6,
      elevation: 3,
    },
    dropdownItem: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    dropdownTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    dropdownMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    dropdownSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    dropdownStockBadge: {
      fontSize: 11,
      fontWeight: '700',
      color: '#1769E0',
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.2)' : '#EFF6FF',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    noData: {
      padding: 14,
      textAlign: 'center',
      color: theme.textMuted,
      fontSize: 13,
    },
    sectionCard: {
      marginTop: 16,
      padding: 14,
      borderRadius: 14,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionHeading: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    currentQuantityContainer: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceMuted,
      padding: 14,
    },
    currentQuantityRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    currentQuantityLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    currentQuantityValue: {
      fontSize: 15,
      fontWeight: '800',
    },
    currentQuantityActive: {
      color: '#16A34A',
    },
    currentQuantityNotFound: {
      color: '#DC2626',
      fontSize: 13,
    },
    currentQuantityMuted: {
      color: theme.textMuted,
      fontSize: 13,
    },
    currentQuantitySubtext: {
      marginTop: 6,
      fontSize: 12,
      color: theme.textSecondary,
    },
    input: {
      minHeight: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      backgroundColor: theme.inputBg,
      paddingHorizontal: 14,
      fontSize: 14,
      color: theme.textPrimary,
    },
    reasonInput: {
      minHeight: 88,
      paddingTop: 12,
    },
    diffBanner: {
      marginTop: 10,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
    },
    diffBannerReduction: {
      backgroundColor: theme.errorBg,
      borderColor: theme.errorBorder,
    },
    diffBannerAddition: {
      backgroundColor: theme.successBg,
      borderColor: theme.successBorder,
    },
    diffBannerNeutral: {
      backgroundColor: theme.surfaceMuted,
      borderColor: theme.border,
    },
    diffFlowRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginBottom: 6,
    },
    diffFlowItem: {
      alignItems: 'center',
    },
    diffFlowLabel: {
      fontSize: 11,
      color: theme.textSecondary,
      marginBottom: 2,
    },
    diffFlowValue: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    diffDivider: {
      width: 1,
      height: 24,
      backgroundColor: theme.border,
    },
    diffSubtext: {
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '600',
      marginTop: 2,
      color: theme.textSecondary,
    },
    submitButton: {
      height: 52,
      borderRadius: 13,
      backgroundColor: '#1769E0',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      marginTop: 24,
      shadowColor: '#1769E0',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    disabledButton: {
      opacity: 0.7,
    },
    submitText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    bottomSpace: {
      height: 40,
    },
  });

export default StockAdjustmentScreen;
