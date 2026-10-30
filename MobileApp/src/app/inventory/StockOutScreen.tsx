import React, {useCallback, useState, useMemo} from 'react';
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
import {ArrowLeft, Menu, PackageMinus} from 'lucide-react-native';

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

type Props = {
  navigation: any;
  route?: any;
};

const StockOutScreen = ({navigation, route}: Props) => {
  const {openDrawer} = useDrawer();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [selectedWarehouse, setSelectedWarehouse] =
    useState<Warehouse | null>(null);

  const [selectedRack, setSelectedRack] =
    useState<Rack | null>(null);

  const [quantity, setQuantity] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showProducts, setShowProducts] = useState(false);
  const [showWarehouses, setShowWarehouses] = useState(false);
  const [showRacks, setShowRacks] = useState(false);

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
    setShowProducts(false);
    setShowWarehouses(false);
    setShowRacks(false);
    openDrawer();
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [productsResponse, warehousesResponse] =
        await Promise.all([
          API.get('/products'),
          API.get('/warehouses'),
        ]);

      const productData = productsResponse?.data;
      const warehouseData = warehousesResponse?.data;

      let resolvedProducts: Product[] = [];
      if (Array.isArray(productData)) {
        resolvedProducts = productData;
      } else if (Array.isArray(productData?.products)) {
        resolvedProducts = productData.products;
      } else if (Array.isArray(productData?.data)) {
        resolvedProducts = productData.data;
      }
      setProducts(resolvedProducts);

      if (route?.params?.productId) {
        const targetId = Number(route.params.productId);
        const match = resolvedProducts.find(p => p.id === targetId);
        if (match) {
          setSelectedProduct(match);
        } else if (route.params.product) {
          setSelectedProduct(route.params.product);
        }
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
    } catch (error) {
      console.log('STOCK OUT LOAD ERROR:', error);

      showAlert(
        'error',
        'Error',
        'Unable to load products and warehouses.',
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

  const handleWarehouseSelect = async (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setSelectedRack(null);
    setShowWarehouses(false);
    setShowRacks(false);

    try {
      const response = await API.get('/racks');

      const data = response?.data;

      let rackData: Rack[] = [];

      if (Array.isArray(data)) {
        rackData = data;
      } else if (Array.isArray(data?.racks)) {
        rackData = data.racks;
      } else if (Array.isArray(data?.data)) {
        rackData = data.data;
      }

      const warehouseRacks = rackData.filter(
        rack => Number(rack.warehouseId) === Number(warehouse.id),
      );

      setRacks(warehouseRacks);
    } catch (error) {
      console.log('RACK LOAD ERROR:', error);
      setRacks([]);
    }
  };

  const handleStockOut = async () => {
    if (!selectedProduct) {
      showAlert('warning', 'Required', 'Please select a product.');
      return;
    }

    if (!selectedWarehouse) {
      showAlert('warning', 'Required', 'Please select a warehouse.');
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

      const payload = {
        productId: selectedProduct.id,
        warehouseId: selectedWarehouse.id,
        rackId: selectedRack?.id,
        quantity: numericQuantity,
        referenceNumber:
          referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      console.log('STOCK OUT PAYLOAD:', payload);

      const response = await API.post(
        '/inventory/stock-out',
        payload,
      );

      console.log('STOCK OUT RESPONSE:', response.data);

      showAlert(
        'success',
        'Stock Out Successful',
        response?.data?.message || 'Stock removed successfully.',
        () => {
          setSelectedProduct(null);
          setSelectedWarehouse(null);
          setSelectedRack(null);
          setQuantity('');
          setReferenceNumber('');
          setNotes('');
          setRacks([]);

          navigation.goBack();
        },
      );
    } catch (error: any) {
      console.log(
        'STOCK OUT ERROR:',
        error?.response?.data || error,
      );

      showAlert(
        'error',
        'Stock Out Failed',
        error?.response?.data?.message || 'Unable to remove stock.',
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
          color="#DC2626"
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
        Platform.OS === 'ios' ? 'padding' : undefined
      }>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#111827" />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            Stock Out
          </Text>

          <Text style={styles.headerSubtitle}>
            Remove stock from inventory
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
        {/* Top Icon */}
        <View style={styles.iconContainer}>
          <PackageMinus
            size={32}
            color="#DC2626"
          />
        </View>

        <Text style={styles.title}>
          Stock Out Details
        </Text>

        <Text style={styles.description}>
          Select the product and warehouse, then enter
          the quantity you want to remove.
        </Text>

        {/* Product */}
        <Text style={styles.label}>
          Product *
        </Text>

        <Pressable
          style={styles.selectBox}
          onPress={() =>
            setShowProducts(!showProducts)
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
            {showProducts ? '▲' : '▼'}
          </Text>
        </Pressable>

        {showProducts && (
          <View style={styles.dropdown}>
            {products.map(product => (
              <Pressable
                key={product.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedProduct(product);
                  setShowProducts(false);
                }}>
                <Text style={styles.dropdownTitle}>
                  {product.name}
                </Text>

                {product.sku ? (
                  <Text style={styles.dropdownSubtitle}>
                    SKU: {product.sku}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        )}

        {/* Warehouse */}
        <Text style={styles.label}>
          Warehouse *
        </Text>

        <Pressable
          style={styles.selectBox}
          onPress={() =>
            setShowWarehouses(!showWarehouses)
          }>
          <Text
            style={
              selectedWarehouse
                ? styles.selectedText
                : styles.placeholder
            }>
            {selectedWarehouse
              ? selectedWarehouse.name
              : 'Select Warehouse'}
          </Text>

          <Text style={styles.arrow}>
            {showWarehouses ? '▲' : '▼'}
          </Text>
        </Pressable>

        {showWarehouses && (
          <View style={styles.dropdown}>
            {warehouses.map(warehouse => (
              <Pressable
                key={warehouse.id}
                style={styles.dropdownItem}
                onPress={() =>
                  handleWarehouseSelect(warehouse)
                }>
                <Text style={styles.dropdownTitle}>
                  {warehouse.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Rack */}
        <Text style={styles.label}>
          Rack (Optional)
        </Text>

        <Pressable
          disabled={!selectedWarehouse}
          style={[
            styles.selectBox,
            !selectedWarehouse &&
              styles.disabledBox,
          ]}
          onPress={() =>
            setShowRacks(!showRacks)
          }>
          <Text
            style={
              selectedRack
                ? styles.selectedText
                : styles.placeholder
            }>
            {selectedRack
              ? selectedRack.name
              : selectedWarehouse
              ? 'Select Rack (Optional)'
              : 'Select warehouse first'}
          </Text>

          <Text style={styles.arrow}>
            {showRacks ? '▲' : '▼'}
          </Text>
        </Pressable>

        {showRacks && selectedWarehouse && (
          <View style={styles.dropdown}>
            <Pressable
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedRack(null);
                setShowRacks(false);
              }}>
              <Text style={[styles.dropdownTitle, {color: '#6B7280'}]}>
                -- No Rack (Default Warehouse Location) --
              </Text>
            </Pressable>
            {racks.length === 0 ? (
              <Text style={styles.noData}>
                No racks found for this warehouse
              </Text>
            ) : (
              racks.map(rack => (
                <Pressable
                  key={rack.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedRack(rack);
                    setShowRacks(false);
                  }}>
                  <Text style={styles.dropdownTitle}>
                    {rack.name}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* Quantity */}
        <Text style={styles.label}>
          Quantity *
        </Text>

        <TextInput
          value={quantity}
          onChangeText={setQuantity}
          placeholder="Enter quantity"
          placeholderTextColor="#9CA3AF"
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
          placeholder="e.g. SO-1001"
          placeholderTextColor="#9CA3AF"
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
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={[
            styles.input,
            styles.notesInput,
          ]}
        />

        {/* Submit */}
        <Pressable
          style={[
            styles.submitButton,
            submitting && styles.disabledButton,
          ]}
          disabled={submitting}
          onPress={handleStockOut}>
          {submitting ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.submitText}>
              Remove Stock
            </Text>
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
      color: theme.textMuted,
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
      color: theme.textMuted,
    },

    menuHeaderButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: isDark ? theme.surfaceMuted : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    content: {
      padding: 16,
    },

    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 18,
      backgroundColor: isDark ? theme.surfaceMuted : '#FEE2E2',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginTop: 10,
    },

    title: {
      marginTop: 16,
      textAlign: 'center',
      fontSize: 22,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    description: {
      marginTop: 6,
      marginBottom: 20,
      textAlign: 'center',
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 18,
    },

    label: {
      marginTop: 14,
      marginBottom: 6,
      fontSize: 13,
      fontWeight: '700',
      color: theme.textPrimary,
    },

    selectBox: {
      height: 52,
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
      fontSize: 14,
      color: theme.textPrimary,
    },

    placeholder: {
      fontSize: 14,
      color: theme.placeholderText,
    },

    arrow: {
      fontSize: 12,
      color: theme.textMuted,
    },

    dropdown: {
      marginTop: 6,
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
      marginTop: 2,
      fontSize: 12,
      color: theme.textMuted,
    },

    noData: {
      padding: 14,
      textAlign: 'center',
      color: theme.textMuted,
      fontSize: 13,
    },

    input: {
      height: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      backgroundColor: theme.inputBg,
      paddingHorizontal: 14,
      fontSize: 14,
      color: theme.textPrimary,
    },

    notesInput: {
      height: 90,
      paddingTop: 12,
    },

    submitButton: {
      marginTop: 24,
      height: 52,
      borderRadius: 12,
      backgroundColor: theme.errorText,
      alignItems: 'center',
      justifyContent: 'center',
    },

    disabledButton: {
      opacity: 0.7,
    },

    submitText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    bottomSpace: {
      height: 30,
    },
  });

export default StockOutScreen;