import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronDown,
  Menu,
  Minus,
  Package,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react-native';

import API from '../../services/api';
import apis from '../../services/endpoint';
import CustomAlert from '../../components/CustomAlert';
import {useDrawer} from '../../context/DrawerContext';
import {useAppTheme, ThemeColors} from '../../context/ThemeContext';

type Customer = {
  id: number;
  name: string;
};

type Warehouse = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  name: string;
  sku?: string | null;
  price?: number | string | null;
};

type SelectedItem = {
  productId: number;
  productName: string;
  productSku?: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
};

type Props = {
  navigation: any;
  route: {
    params: {
      salesOrderId: number;
    };
  };
};

const EditSalesOrderScreen = ({navigation, route}: Props) => {
  const {openDrawer} = useDrawer();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const salesOrderId = route?.params?.salesOrderId;

  // Data sources
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Form State
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [orderItems, setOrderItems] = useState<SelectedItem[]>([]);
  const [tax, setTax] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Add Item Sub-form State
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [currentQty, setCurrentQty] = useState<number>(1);
  const [currentUnitPrice, setCurrentUnitPrice] = useState<string>('');

  // Dropdown Modals
  const [modalType, setModalType] = useState<
    'customer' | 'warehouse' | 'product' | null
  >(null);
  const [modalSearch, setModalSearch] = useState('');

  // Custom Alert
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    onPress?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showAlert = (
    type: 'success' | 'error' | 'warning' | 'info',
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

  useEffect(() => {
    loadOrderAndPrerequisites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesOrderId]);

  const loadOrderAndPrerequisites = async () => {
    if (!salesOrderId) return;
    try {
      setInitialLoading(true);
      const [custRes, whRes, prodRes, soRes] = await Promise.all([
        API.get(apis.customers || '/customers'),
        API.get(apis.warehouses || '/warehouses'),
        API.get(apis.products || '/products'),
        API.get(
          apis.salesOrderById
            ? apis.salesOrderById(salesOrderId)
            : `/sales-orders/${salesOrderId}`,
        ),
      ]);

      const custData = custRes?.data?.customers || custRes?.data?.data || custRes?.data || [];
      const whData = whRes?.data?.warehouses || whRes?.data?.data || whRes?.data || [];
      const prodData = prodRes?.data?.products || prodRes?.data?.data || prodRes?.data || [];
      const soData = soRes?.data?.salesOrder || soRes?.data?.order || soRes?.data;

      setCustomers(Array.isArray(custData) ? custData : []);
      setWarehouses(Array.isArray(whData) ? whData : []);
      setProducts(Array.isArray(prodData) ? prodData : []);

      if (!soData) {
        showAlert('error', 'Not Found', 'Sales order could not be loaded.', () =>
          navigation.goBack(),
        );
        return;
      }

      // Enforce only PENDING allowed
      if (soData.status !== 'PENDING') {
        showAlert(
          'warning',
          'Cannot Edit Order',
          `Only PENDING sales orders can be edited. Current status is ${soData.status}.`,
          () => navigation.goBack(),
        );
        return;
      }

      // Pre-fill form state
      setOrderNumber(soData.orderNumber || '');
      if (soData.customer) {
        setSelectedCustomer({
          id: soData.customer.id,
          name: soData.customer.name,
        });
      }
      if (soData.warehouse) {
        setSelectedWarehouse({
          id: soData.warehouse.id,
          name: soData.warehouse.name,
        });
      }

      setTax(String(soData.tax ?? 0));
      setNotes(soData.notes || '');

      if (Array.isArray(soData.items)) {
        const loadedItems: SelectedItem[] = soData.items.map((i: any) => ({
          productId: i.productId,
          productName: i.product?.name || `Product #${i.productId}`,
          productSku: i.product?.sku || null,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          total: Number(i.total),
        }));
        setOrderItems(loadedItems);
      }
    } catch (error: any) {
      console.log('LOAD ORDER AND PREREQUISITES ERROR:', error);
      showAlert(
        'error',
        'Failed to Load Details',
        'Could not load sales order or prerequisites.',
        () => navigation.goBack(),
      );
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSelectProduct = (prod: Product) => {
    setCurrentProduct(prod);
    const parsedPrice = prod.price ? Number(prod.price) : 0;
    setCurrentUnitPrice(parsedPrice > 0 ? String(parsedPrice) : '');
    setCurrentQty(1);
    setModalType(null);
  };

  const handleAddProductToList = () => {
    if (!currentProduct) {
      showAlert('warning', 'Product Required', 'Please select a product first.');
      return;
    }

    const qty = Number(currentQty);
    if (!qty || qty <= 0) {
      showAlert('warning', 'Invalid Quantity', 'Quantity must be at least 1.');
      return;
    }

    const unitPrice = parseFloat(currentUnitPrice);
    if (isNaN(unitPrice) || unitPrice < 0) {
      showAlert('warning', 'Invalid Price', 'Selling price must be a valid number >= 0.');
      return;
    }

    const existingIndex = orderItems.findIndex(i => i.productId === currentProduct.id);
    if (existingIndex > -1) {
      const updated = [...orderItems];
      const existing = updated[existingIndex];
      const newQty = existing.quantity + qty;
      const newTotal = Number((newQty * unitPrice).toFixed(2));
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        unitPrice,
        total: newTotal,
      };
      setOrderItems(updated);
    } else {
      const itemTotal = Number((qty * unitPrice).toFixed(2));
      setOrderItems(prev => [
        ...prev,
        {
          productId: currentProduct.id,
          productName: currentProduct.name,
          productSku: currentProduct.sku,
          quantity: qty,
          unitPrice,
          total: itemTotal,
        },
      ]);
    }

    setCurrentProduct(null);
    setCurrentQty(1);
    setCurrentUnitPrice('');
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  // Totals
  const subtotal = orderItems.reduce((acc, curr) => acc + curr.total, 0);
  const taxAmount = parseFloat(tax) || 0;
  const grandTotal = Number((subtotal + (taxAmount > 0 ? taxAmount : 0)).toFixed(2));

  // Submit update
  const handleUpdate = async () => {
    if (!selectedCustomer) {
      showAlert('warning', 'Customer Required', 'Please select a customer.');
      return;
    }

    if (!selectedWarehouse) {
      showAlert('warning', 'Warehouse Required', 'Please select an inventory warehouse.');
      return;
    }

    if (orderItems.length === 0) {
      showAlert(
        'warning',
        'Products Required',
        'Please add at least one product to the sales order.',
      );
      return;
    }

    if (isNaN(taxAmount) || taxAmount < 0) {
      showAlert('warning', 'Invalid Tax', 'Tax amount cannot be negative.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        customerId: selectedCustomer.id,
        warehouseId: selectedWarehouse.id,
        tax: taxAmount,
        notes: notes.trim() || undefined,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      const url = apis.salesOrderById
        ? apis.salesOrderById(salesOrderId)
        : `/sales-orders/${salesOrderId}`;
      await API.put(url, payload);

      showAlert(
        'success',
        'Order Updated',
        'Sales order has been successfully updated.',
        () => navigation.goBack(),
      );
    } catch (error: any) {
      console.log('UPDATE SALES ORDER ERROR:', error?.response?.data || error);
      const msg =
        error?.response?.data?.message ||
        'Failed to update sales order. Please check all fields.';
      showAlert('error', 'Update Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number | string) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({pressed}) => [
            styles.headerBtn,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={theme.textPrimary} strokeWidth={2} />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Edit {orderNumber || 'Order'}</Text>
          <Text style={styles.headerSubtitle}>Update customer order items</Text>
        </View>

        <Pressable
          style={({pressed}) => [
            styles.headerBtn,
            pressed && styles.buttonPressed,
          ]}
          onPress={openDrawer}>
          <Menu size={22} color="#1769E0" strokeWidth={2} />
        </Pressable>
      </View>

      {initialLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1769E0" />
          <Text style={styles.loaderText}>Loading sales order...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {/* Section 1: Customer & Warehouse */}
            <View style={styles.formSection}>
              <Text style={styles.sectionHeading}>Order Details</Text>

              {/* Customer Dropdown */}
              <Text style={styles.fieldLabel}>Customer *</Text>
              <Pressable
                style={styles.dropdownSelector}
                onPress={() => {
                  setModalSearch('');
                  setModalType('customer');
                }}>
                <Text
                  style={
                    selectedCustomer
                      ? styles.dropdownValueText
                      : styles.dropdownPlaceholderText
                  }>
                  {selectedCustomer?.name || 'Select Customer'}
                </Text>
                <ChevronDown size={18} color={theme.textMuted} strokeWidth={2} />
              </Pressable>

              {/* Warehouse Dropdown */}
              <Text style={styles.fieldLabel}>Fulfillment Warehouse *</Text>
              <Pressable
                style={styles.dropdownSelector}
                onPress={() => {
                  setModalSearch('');
                  setModalType('warehouse');
                }}>
                <Text
                  style={
                    selectedWarehouse
                      ? styles.dropdownValueText
                      : styles.dropdownPlaceholderText
                  }>
                  {selectedWarehouse?.name || 'Select Warehouse'}
                </Text>
                <ChevronDown size={18} color={theme.textMuted} strokeWidth={2} />
              </Pressable>
            </View>

            {/* Section 2: Products Sub-form */}
            <View style={styles.formSection}>
              <Text style={styles.sectionHeading}>Add / Edit Products</Text>

              {/* Product Select */}
              <Text style={styles.fieldLabel}>Product</Text>
              <Pressable
                style={styles.dropdownSelector}
                onPress={() => {
                  setModalSearch('');
                  setModalType('product');
                }}>
                <Text
                  style={
                    currentProduct
                      ? styles.dropdownValueText
                      : styles.dropdownPlaceholderText
                  }>
                  {currentProduct
                    ? `${currentProduct.name}${
                        currentProduct.sku ? ` (${currentProduct.sku})` : ''
                      }`
                    : 'Select Product'}
                </Text>
                <ChevronDown size={18} color={theme.textMuted} strokeWidth={2} />
              </Pressable>

              {currentProduct && (
                <View style={styles.itemConfigBox}>
                  <View style={styles.inputRow}>
                    <View style={styles.inputCol}>
                      <Text style={styles.fieldLabel}>Quantity</Text>
                      <View style={styles.stepperContainer}>
                        <Pressable
                          style={styles.stepperBtn}
                          onPress={() =>
                            setCurrentQty(prev => Math.max(1, prev - 1))
                          }>
                          <Minus size={16} color="#1769E0" strokeWidth={2.5} />
                        </Pressable>
                        <TextInput
                          style={styles.stepperInput}
                          keyboardType="numeric"
                          value={String(currentQty)}
                          onChangeText={text => {
                            const val = parseInt(text.replace(/[^0-9]/g, ''), 10);
                            setCurrentQty(isNaN(val) ? 1 : Math.max(1, val));
                          }}
                        />
                        <Pressable
                          style={styles.stepperBtn}
                          onPress={() => setCurrentQty(prev => prev + 1)}>
                          <Plus size={16} color="#1769E0" strokeWidth={2.5} />
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.inputCol}>
                      <Text style={styles.fieldLabel}>Selling Price (₹)</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="0.00"
                        placeholderTextColor={theme.placeholderText}
                        keyboardType="decimal-pad"
                        value={currentUnitPrice}
                        onChangeText={setCurrentUnitPrice}
                      />
                    </View>
                  </View>

                  <Pressable
                    style={({pressed}) => [
                      styles.addProductBtn,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={handleAddProductToList}>
                    <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.addProductBtnText}>Add to Order</Text>
                  </Pressable>
                </View>
              )}

              {/* Selected Products List */}
              {orderItems.length > 0 && (
                <View style={styles.selectedItemsContainer}>
                  <Text style={styles.subHeading}>
                    Items in Order ({orderItems.length})
                  </Text>
                  {orderItems.map((item, idx) => (
                    <View key={`${item.productId}-${idx}`} style={styles.itemCard}>
                      <View style={styles.itemIconBox}>
                        <Package size={18} color="#1769E0" strokeWidth={2} />
                      </View>
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.productName}
                        </Text>
                        <Text style={styles.itemMeta}>
                          Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                        </Text>
                        <Text style={styles.itemTotal}>
                          Total: {formatCurrency(item.total)}
                        </Text>
                      </View>
                      <Pressable
                        style={styles.deleteItemBtn}
                        onPress={() => handleRemoveItem(idx)}>
                        <Trash2 size={18} color="#EF4444" strokeWidth={2} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Section 3: Totals & Notes */}
            <View style={styles.formSection}>
              <Text style={styles.sectionHeading}>Summary & Notes</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(subtotal)}
                </Text>
              </View>

              <View style={styles.taxInputRow}>
                <Text style={styles.summaryLabel}>Tax (₹)</Text>
                <TextInput
                  style={styles.taxInput}
                  placeholder="0.00"
                  placeholderTextColor={theme.placeholderText}
                  keyboardType="decimal-pad"
                  value={tax}
                  onChangeText={setTax}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.grandTotalLabel}>Total Amount</Text>
                <Text style={styles.grandTotalValue}>
                  {formatCurrency(grandTotal)}
                </Text>
              </View>

              <Text style={styles.fieldLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Enter customer notes, delivery instructions..."
                placeholderTextColor={theme.placeholderText}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Pressable
                style={[
                  styles.submitBtn,
                  submitting && styles.disabledBtn,
                ]}
                disabled={submitting}
                onPress={handleUpdate}>
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Save size={18} color="#FFFFFF" strokeWidth={2.4} />
                    <Text style={styles.submitBtnText}>Save Changes</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={styles.cancelBtn}
                onPress={() => navigation.goBack()}
                disabled={submitting}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Universal Selection Modal */}
      <Modal
        visible={modalType !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setModalType(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'customer'
                  ? 'Select Customer'
                  : modalType === 'warehouse'
                  ? 'Select Warehouse'
                  : 'Select Product'}
              </Text>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setModalType(null)}>
                <X size={20} color={theme.textMuted} strokeWidth={2} />
              </Pressable>
            </View>

            <View style={styles.modalSearchBox}>
              <Search size={16} color={theme.placeholderText} strokeWidth={2} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search..."
                placeholderTextColor={theme.placeholderText}
                value={modalSearch}
                onChangeText={setModalSearch}
                autoCapitalize="none"
              />
            </View>

            <FlatList
              data={
                modalType === 'customer'
                  ? customers.filter(c =>
                      c.name.toLowerCase().includes(modalSearch.toLowerCase()),
                    )
                  : modalType === 'warehouse'
                  ? warehouses.filter(w =>
                      w.name.toLowerCase().includes(modalSearch.toLowerCase()),
                    )
                  : products.filter(p =>
                      p.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
                      p.sku?.toLowerCase().includes(modalSearch.toLowerCase()),
                    )
              }
              keyExtractor={(item: any) => item.id.toString()}
              renderItem={({item}: {item: any}) => (
                <Pressable
                  style={styles.modalItem}
                  onPress={() => {
                    if (modalType === 'customer') {
                      setSelectedCustomer(item);
                      setModalType(null);
                    } else if (modalType === 'warehouse') {
                      setSelectedWarehouse(item);
                      setModalType(null);
                    } else if (modalType === 'product') {
                      handleSelectProduct(item);
                    }
                  }}>
                  <View>
                    <Text style={styles.modalItemTitle}>{item.name}</Text>
                    {item.email || item.sku ? (
                      <Text style={styles.modalItemSubtitle}>
                        {item.email || `SKU: ${item.sku}`}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              )}
              contentContainerStyle={styles.modalList}
              ListEmptyComponent={
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>No items found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onPress={() => {
          const cb = alertConfig.onPress;
          setAlertConfig(prev => ({...prev, visible: false}));
          if (cb) cb();
        }}
      />
    </SafeAreaView>
  );
};

export default EditSalesOrderScreen;

const getStyles = (theme: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: theme.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.headerBorder,
    },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: theme.headerButtonBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleContainer: {
      flex: 1,
      marginLeft: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    headerSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    buttonPressed: {
      opacity: 0.85,
      transform: [{scale: 0.99}],
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    loaderContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 30,
      gap: 12,
    },
    loaderText: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    formSection: {
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 16,
      shadowColor: theme.shadowColor,
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    sectionHeading: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 12,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 6,
      marginTop: 8,
    },
    dropdownSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 48,
    },
    dropdownValueText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    dropdownPlaceholderText: {
      fontSize: 14,
      color: theme.placeholderText,
    },
    itemConfigBox: {
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.12)' : '#EFF6FF',
      borderRadius: 12,
      padding: 12,
      marginTop: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(23, 105, 224, 0.25)' : '#BFDBFE',
    },
    inputRow: {
      flexDirection: 'row',
      gap: 12,
    },
    inputCol: {
      flex: 1,
    },
    stepperContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      height: 44,
    },
    stepperBtn: {
      width: 36,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperInput: {
      flex: 1,
      textAlign: 'center',
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
      paddingVertical: 0,
    },
    textInput: {
      backgroundColor: theme.inputBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      paddingHorizontal: 12,
      height: 44,
      fontSize: 15,
      color: theme.textPrimary,
      fontWeight: '600',
    },
    addProductBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1769E0',
      borderRadius: 10,
      height: 42,
      marginTop: 12,
      gap: 8,
    },
    addProductBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    selectedItemsContainer: {
      marginTop: 16,
    },
    subHeading: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textSecondary,
      marginBottom: 8,
    },
    itemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12,
      marginBottom: 8,
    },
    itemIconBox: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    itemDetails: {
      flex: 1,
    },
    itemName: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    itemMeta: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    itemTotal: {
      fontSize: 13,
      fontWeight: '700',
      color: '#1769E0',
      marginTop: 2,
    },
    deleteItemBtn: {
      padding: 8,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    summaryLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    summaryValue: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    taxInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    taxInput: {
      backgroundColor: theme.inputBg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      width: 110,
      height: 38,
      textAlign: 'right',
      paddingHorizontal: 10,
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    divider: {
      height: 1,
      backgroundColor: theme.borderLight,
      marginVertical: 8,
    },
    grandTotalLabel: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    grandTotalValue: {
      fontSize: 18,
      fontWeight: '800',
      color: '#1769E0',
    },
    notesInput: {
      backgroundColor: theme.inputBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      padding: 12,
      height: 76,
      fontSize: 13,
      color: theme.textPrimary,
      marginTop: 6,
    },
    buttonContainer: {
      gap: 10,
    },
    submitBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1769E0',
      borderRadius: 14,
      height: 50,
      gap: 8,
      shadowColor: '#1769E0',
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 3,
    },
    disabledBtn: {
      opacity: 0.7,
    },
    submitBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    cancelBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 46,
      borderRadius: 12,
      backgroundColor: isDark ? theme.surfaceMuted : '#F1F5F9',
    },
    cancelBtnText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: theme.cardBg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '75%',
      paddingBottom: 24,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    modalCloseBtn: {
      padding: 4,
    },
    modalSearchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      margin: 14,
      paddingHorizontal: 12,
      height: 42,
    },
    modalSearchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 14,
      color: theme.textPrimary,
      paddingVertical: 0,
    },
    modalList: {
      paddingHorizontal: 14,
    },
    modalItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    modalItemTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    modalItemSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    modalEmpty: {
      paddingVertical: 30,
      alignItems: 'center',
    },
    modalEmptyText: {
      fontSize: 14,
      color: theme.textMuted,
    },
  });
