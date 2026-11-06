import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {
  ArrowLeft,
  ArrowLeftRight,
  Check,
  Menu,
} from 'lucide-react-native';

import API from '../../services/api';
import CustomAlert from '../../components/CustomAlert';
import {useDrawer} from '../../context/DrawerContext';
import {useAppTheme, ThemeColors} from '../../context/ThemeContext';

type Product = {
  id: number;
  name: string;
  sku?: string;
};

type Warehouse = {
  id: number;
  name: string;
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

const TransferStockScreen = ({navigation}: any) => {
  const {openDrawer} = useDrawer();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [allRacks, setAllRacks] = useState<Rack[]>([]);
  const [sourceRacks, setSourceRacks] = useState<Rack[]>([]);
  const [destinationRacks, setDestinationRacks] = useState<Rack[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [sourceWarehouse, setSourceWarehouse] =
    useState<Warehouse | null>(null);

  const [sourceRack, setSourceRack] =
    useState<Rack | null>(null);

  const [destinationWarehouse, setDestinationWarehouse] =
    useState<Warehouse | null>(null);

  const [destinationRack, setDestinationRack] =
    useState<Rack | null>(null);

  const [quantity, setQuantity] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [openDropdown, setOpenDropdown] =
    useState<string | null>(null);

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

      if (Array.isArray(productData)) {
        setProducts(productData);
      } else if (Array.isArray(productData?.products)) {
        setProducts(productData.products);
      } else if (Array.isArray(productData?.data)) {
        setProducts(productData.data);
      } else {
        setProducts([]);
      }

      if (Array.isArray(warehouseData)) {
        setWarehouses(warehouseData);
      } else if (Array.isArray(warehouseData?.warehouses)) {
        setWarehouses(warehouseData.warehouses);
      } else if (Array.isArray(warehouseData?.data)) {
        setWarehouses(warehouseData.data);
      } else {
        setWarehouses([]);
      }

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
    } catch (error) {
      console.log('TRANSFER LOAD ERROR:', error);

      showAlert(
        'error',
        'Load Failed',
        'Unable to load products, warehouses, racks or inventory.',
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const selectSourceWarehouse = (warehouse: Warehouse) => {
    setSourceWarehouse(warehouse);
    setSourceRack(null);
    setOpenDropdown(null);

    const warehouseRacks = allRacks.filter(
      rack => Number(rack.warehouseId) === Number(warehouse.id),
    );
    setSourceRacks(warehouseRacks);
  };

  const selectDestinationWarehouse = (warehouse: Warehouse) => {
    setDestinationWarehouse(warehouse);
    setDestinationRack(null);
    setOpenDropdown(null);

    const warehouseRacks = allRacks.filter(
      rack => Number(rack.warehouseId) === Number(warehouse.id),
    );
    setDestinationRacks(warehouseRacks);
  };

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

  const currentSourceInventory = useMemo(() => {
    if (!selectedProduct || !sourceWarehouse) {
      return null;
    }
    return findMatchingInventory(
      inventoryList,
      selectedProduct.id,
      sourceWarehouse.id,
      sourceRack?.id,
    );
  }, [selectedProduct, sourceWarehouse, sourceRack, inventoryList]);

  const handleTransfer = async () => {
    if (!selectedProduct) {
      showAlert('warning', 'Required', 'Please select a product.');
      return;
    }

    if (!sourceWarehouse) {
      showAlert('warning', 'Required', 'Please select source warehouse.');
      return;
    }

    if (!destinationWarehouse) {
      showAlert(
        'warning',
        'Required',
        'Please select destination warehouse.',
      );
      return;
    }

    if (
      sourceWarehouse.id === destinationWarehouse.id
    ) {
      showAlert(
        'warning',
        'Invalid Transfer',
        'Source and destination warehouse must be different.',
      );
      return;
    }

    const numericQuantity = Number(quantity);

    if (
      !quantity.trim() ||
      !Number.isFinite(numericQuantity) ||
      numericQuantity <= 0
    ) {
      showAlert(
        'warning',
        'Invalid Quantity',
        'Please enter a quantity greater than zero.',
      );
      return;
    }

    try {
      setSubmitting(true);

      // Fetch fresh inventory data from backend before validation
      const invResponse = await API.get('/inventory');
      const invData = invResponse?.data;
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

      // Find exact source inventory record
      const sourceInventory = findMatchingInventory(
        freshInventory,
        selectedProduct.id,
        sourceWarehouse.id,
        sourceRack?.id,
      );

      if (!sourceInventory) {
        showAlert(
          'error',
          'Transfer Failed',
          'Source inventory not found for the selected product, warehouse and rack.',
        );
        setSubmitting(false);
        return;
      }

      if (numericQuantity > Number(sourceInventory.quantity)) {
        showAlert(
          'warning',
          'Insufficient Stock',
          `Insufficient stock. Available: ${sourceInventory.quantity}, Requested: ${numericQuantity}`,
        );
        setSubmitting(false);
        return;
      }

      const payload = {
        productId: selectedProduct.id,
        sourceWarehouseId: sourceWarehouse.id,
        sourceRackId: sourceRack?.id,
        destinationWarehouseId: destinationWarehouse.id,
        destinationRackId: destinationRack?.id,
        quantity: numericQuantity,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      console.log('TRANSFER PAYLOAD:', payload);

      const response = await API.post(
        '/inventory/transfer',
        payload,
      );

      console.log('TRANSFER RESPONSE:', response.data);

      showAlert(
        'success',
        'Transfer Successful',
        response?.data?.message ||
          'Stock transferred successfully.',
        () => {
          setSelectedProduct(null);
          setSourceWarehouse(null);
          setSourceRack(null);
          setDestinationWarehouse(null);
          setDestinationRack(null);
          setQuantity('');
          setReferenceNumber('');
          setNotes('');
          setSourceRacks([]);
          setDestinationRacks([]);

          navigation.goBack();
        },
      );
    } catch (error: any) {
      console.log(
        'TRANSFER ERROR:',
        error?.response?.data || error,
      );

      showAlert(
        'error',
        'Transfer Failed',
        error?.response?.data?.message ||
          'Unable to transfer stock.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft
            size={22}
            color={theme.textPrimary}
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            Transfer Stock
          </Text>

          <Text style={styles.headerSubtitle}>
            Move stock between warehouses
          </Text>
        </View>

        <Pressable
          style={styles.menuHeaderButton}
          onPress={handleOpenDrawer}>
          <Menu size={22} color="#1769E0" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <ArrowLeftRight
            size={32}
            color="#2563EB"
          />
        </View>

        <Text style={styles.title}>
          Transfer Details
        </Text>

        <Text style={styles.description}>
          Select the product, source location and destination location.
        </Text>

        {/* Product */}
        <Text style={styles.label}>
          Product *
        </Text>

        <Pressable
          style={styles.selectBox}
          onPress={() =>
            setOpenDropdown(
              openDropdown === 'product'
                ? null
                : 'product',
            )
          }>
          <Text
            style={
              selectedProduct
                ? styles.selectedText
                : styles.placeholder
            }>
            {selectedProduct
              ? `${selectedProduct.name}${
                  selectedProduct.sku
                    ? ` • ${selectedProduct.sku}`
                    : ''
                }`
              : 'Select Product'}
          </Text>

          <Text style={styles.arrow}>
            {openDropdown === 'product'
              ? '▲'
              : '▼'}
          </Text>
        </Pressable>

        {openDropdown === 'product' && (
          <View style={styles.dropdown}>
            {products.length === 0 ? (
              <Text style={styles.noData}>
                No products found
              </Text>
            ) : (
              products.map(product => (
                <Pressable
                  key={product.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedProduct(product);
                    setOpenDropdown(null);
                  }}>
                  <Text
                    style={styles.dropdownTitle}>
                    {product.name}
                  </Text>

                  {product.sku ? (
                    <Text
                      style={styles.dropdownSubtitle}>
                      SKU: {product.sku}
                    </Text>
                  ) : null}
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* Source Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sourceDot} />

            <View>
              <Text style={styles.locationTitle}>
                Source Location
              </Text>

              <Text
                style={styles.locationSubtitle}>
                Where stock is coming from
              </Text>
            </View>
          </View>

          <Text style={styles.label}>
            Source Warehouse *
          </Text>

          <Pressable
            style={styles.selectBox}
            onPress={() =>
              setOpenDropdown(
                openDropdown ===
                  'sourceWarehouse'
                  ? null
                  : 'sourceWarehouse',
              )
            }>
            <Text
              style={
                sourceWarehouse
                  ? styles.selectedText
                  : styles.placeholder
              }>
              {sourceWarehouse
                ? sourceWarehouse.name
                : 'Select Source Warehouse'}
            </Text>

            <Text style={styles.arrow}>
              {openDropdown ===
              'sourceWarehouse'
                ? '▲'
                : '▼'}
            </Text>
          </Pressable>

          {openDropdown ===
            'sourceWarehouse' && (
            <View style={styles.dropdown}>
              {warehouses.map(warehouse => (
                <Pressable
                  key={warehouse.id}
                  style={styles.dropdownItem}
                  onPress={() =>
                    selectSourceWarehouse(
                      warehouse,
                    )
                  }>
                  <Text
                    style={
                      styles.dropdownTitle
                    }>
                    {warehouse.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.label}>
            Source Rack
          </Text>

          <Pressable
            disabled={!sourceWarehouse}
            style={[
              styles.selectBox,
              !sourceWarehouse &&
                styles.disabledBox,
            ]}
            onPress={() =>
              setOpenDropdown(
                openDropdown ===
                  'sourceRack'
                  ? null
                  : 'sourceRack',
              )
            }>
            <Text
              style={
                sourceRack
                  ? styles.selectedText
                  : styles.placeholder
              }>
              {sourceRack
                ? sourceRack.name
                : sourceWarehouse
                ? 'Select Source Rack (Optional)'
                : 'Select warehouse first'}
            </Text>

            <Text style={styles.arrow}>
              {openDropdown ===
              'sourceRack'
                ? '▲'
                : '▼'}
            </Text>
          </Pressable>

          {openDropdown === 'sourceRack' && (
            <View style={styles.dropdown}>
              <Pressable
                style={styles.dropdownItem}
                onPress={() => {
                  setSourceRack(null);
                  setOpenDropdown(null);
                }}>
                <Text style={[styles.dropdownTitle, {color: '#6B7280'}]}>
                  -- No Rack (Default Warehouse Location) --
                </Text>
              </Pressable>
              {sourceRacks.length === 0 ? (
                <Text style={styles.noData}>
                  No racks found for this warehouse
                </Text>
              ) : (
                sourceRacks.map(rack => (
                  <Pressable
                    key={rack.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSourceRack(rack);
                      setOpenDropdown(null);
                    }}>
                    <Text
                      style={
                        styles.dropdownTitle
                      }>
                      {rack.name}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          )}

          {/* Available Source Stock Display */}
          {selectedProduct && sourceWarehouse && (
            <View style={styles.stockStatusCard}>
              <Text style={styles.stockStatusLabel}>
                Available Source Stock:
              </Text>
              <Text
                style={[
                  styles.stockStatusValue,
                  !currentSourceInventory || currentSourceInventory.quantity === 0
                    ? styles.stockStatusZero
                    : styles.stockStatusPositive,
                ]}>
                {currentSourceInventory
                  ? `${currentSourceInventory.quantity} units`
                  : '0 units (No record at this location)'}
              </Text>
            </View>
          )}
        </View>

        {/* Transfer Arrow */}
        <View style={styles.transferIcon}>
          <ArrowLeftRight
            size={23}
            color="#2563EB"
          />
        </View>

        {/* Destination Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.destinationDot} />

            <View>
              <Text style={styles.locationTitle}>
                Destination Location
              </Text>

              <Text
                style={styles.locationSubtitle}>
                Where stock is going
              </Text>
            </View>
          </View>

          <Text style={styles.label}>
            Destination Warehouse *
          </Text>

          <Pressable
            style={styles.selectBox}
            onPress={() =>
              setOpenDropdown(
                openDropdown ===
                  'destinationWarehouse'
                  ? null
                  : 'destinationWarehouse',
              )
            }>
            <Text
              style={
                destinationWarehouse
                  ? styles.selectedText
                  : styles.placeholder
              }>
              {destinationWarehouse
                ? destinationWarehouse.name
                : 'Select Destination Warehouse'}
            </Text>

            <Text style={styles.arrow}>
              {openDropdown ===
              'destinationWarehouse'
                ? '▲'
                : '▼'}
            </Text>
          </Pressable>

          {openDropdown ===
            'destinationWarehouse' && (
            <View style={styles.dropdown}>
              {warehouses.map(warehouse => (
                <Pressable
                  key={warehouse.id}
                  style={styles.dropdownItem}
                  onPress={() =>
                    selectDestinationWarehouse(
                      warehouse,
                    )
                  }>
                  <Text
                    style={
                      styles.dropdownTitle
                    }>
                    {warehouse.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.label}>
            Destination Rack
          </Text>

          <Pressable
            disabled={!destinationWarehouse}
            style={[
              styles.selectBox,
              !destinationWarehouse &&
                styles.disabledBox,
            ]}
            onPress={() =>
              setOpenDropdown(
                openDropdown ===
                  'destinationRack'
                  ? null
                  : 'destinationRack',
              )
            }>
            <Text
              style={
                destinationRack
                  ? styles.selectedText
                  : styles.placeholder
              }>
              {destinationRack
                ? destinationRack.name
                : destinationWarehouse
                ? 'Select Destination Rack (Optional)'
                : 'Select warehouse first'}
            </Text>

            <Text style={styles.arrow}>
              {openDropdown ===
              'destinationRack'
                ? '▲'
                : '▼'}
            </Text>
          </Pressable>

          {openDropdown ===
            'destinationRack' && (
            <View style={styles.dropdown}>
              <Pressable
                style={styles.dropdownItem}
                onPress={() => {
                  setDestinationRack(null);
                  setOpenDropdown(null);
                }}>
                <Text style={[styles.dropdownTitle, {color: '#6B7280'}]}>
                  -- No Rack (Default Warehouse Location) --
                </Text>
              </Pressable>
              {destinationRacks.length === 0 ? (
                <Text style={styles.noData}>
                  No racks found for this warehouse
                </Text>
              ) : (
                destinationRacks.map(rack => (
                  <Pressable
                    key={rack.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setDestinationRack(
                        rack,
                      );
                      setOpenDropdown(null);
                    }}>
                    <Text
                      style={
                        styles.dropdownTitle
                      }>
                      {rack.name}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          )}
        </View>

        {/* Quantity */}
        <Text style={styles.label}>
          Quantity *
        </Text>

        <TextInput
          value={quantity}
          onChangeText={setQuantity}
          placeholder="Enter quantity"
          placeholderTextColor={theme.placeholderText}
          keyboardType="numeric"
          style={styles.input}
        />

        {/* Reference */}
        <Text style={styles.label}>
          Reference Number
        </Text>

        <TextInput
          value={referenceNumber}
          onChangeText={setReferenceNumber}
          placeholder="e.g. TR-1001"
          placeholderTextColor={theme.placeholderText}
          style={styles.input}
        />

        {/* Notes */}
        <Text style={styles.label}>
          Notes
        </Text>

        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Add notes (optional)"
          placeholderTextColor={theme.placeholderText}
          multiline
          textAlignVertical="top"
          style={[
            styles.input,
            styles.notesInput,
          ]}
        />

        {/* Submit */}
        <Pressable
          disabled={submitting}
          style={[
            styles.submitButton,
            submitting &&
              styles.disabledButton,
          ]}
          onPress={handleTransfer}>
          {submitting ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <>
              <Check
                size={19}
                color="#FFFFFF"
                strokeWidth={2.5}
              />

              <Text
                style={styles.submitText}>
                Transfer Stock
              </Text>
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
      marginTop: 10,
      color: theme.textSecondary,
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
      fontSize: 22,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    headerSubtitle: {
      marginTop: 2,
      fontSize: 12,
      color: theme.textSecondary,
    },

    content: {
      padding: 18,
      paddingBottom: 45,
    },

    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#DBEAFE',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginTop: 8,
    },

    title: {
      marginTop: 14,
      textAlign: 'center',
      fontSize: 21,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    description: {
      marginTop: 6,
      marginBottom: 20,
      textAlign: 'center',
      fontSize: 13,
      lineHeight: 19,
      color: theme.textSecondary,
    },

    label: {
      marginTop: 14,
      marginBottom: 7,
      fontSize: 13,
      fontWeight: '700',
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

    disabledBox: {
      backgroundColor: theme.inputDisabledBg,
    },

    selectedText: {
      flex: 1,
      fontSize: 14,
      color: theme.textPrimary,
    },

    placeholder: {
      flex: 1,
      fontSize: 14,
      color: theme.placeholderText,
    },

    arrow: {
      fontSize: 11,
      color: theme.textSecondary,
    },

    dropdown: {
      marginTop: 5,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      backgroundColor: theme.cardBg,
      overflow: 'hidden',
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

    dropdownSubtitle: {
      marginTop: 3,
      fontSize: 11,
      color: theme.textSecondary,
    },

    noData: {
      padding: 14,
      textAlign: 'center',
      color: theme.textMuted,
      fontSize: 13,
    },

    sectionCard: {
      marginTop: 18,
      padding: 15,
      borderRadius: 16,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.border,
    },

    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },

    sourceDot: {
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: '#DC2626',
      marginRight: 10,
    },

    destinationDot: {
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: '#16A34A',
      marginRight: 10,
    },

    locationTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    locationSubtitle: {
      marginTop: 2,
      fontSize: 11,
      color: theme.textSecondary,
    },

    stockStatusCard: {
      marginTop: 14,
      padding: 12,
      borderRadius: 10,
      backgroundColor: theme.surfaceMuted,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },

    stockStatusLabel: {
      flex: 1,
      flexShrink: 1,
      fontSize: 12,
      fontWeight: '700',
      color: theme.textSecondary,
    },

    stockStatusValue: {
      flex: 1,
      flexShrink: 1,
      fontSize: 13,
      fontWeight: '800',
      textAlign: 'right',
    },

    stockStatusPositive: {
      color: '#16A34A',
    },

    stockStatusZero: {
      color: '#DC2626',
    },

    transferIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(37, 99, 235, 0.4)' : '#BFDBFE',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginVertical: 10,
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

    notesInput: {
      minHeight: 100,
      paddingTop: 14,
    },

    submitButton: {
      height: 53,
      borderRadius: 13,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      marginTop: 26,
    },

    disabledButton: {
      opacity: 0.7,
    },

    submitText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    menuHeaderButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bottomSpace: {
      height: 40,
    },
  });

export default TransferStockScreen;