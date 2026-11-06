import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Camera,
  ChevronDown,
  Check,
  Package,
  Layers,
  Building2,
  Users,
  Menu,
} from 'lucide-react-native';

import {
  createProduct,
  getCategories,
  getWarehouses,
  getSuppliers,
  createInventory,
  Category,
  Warehouse,
  Supplier,
} from '../../services/productService';
import CustomAlert from '../../components/CustomAlert';
import {useDrawer} from '../../context/DrawerContext';
import {useAppTheme, ThemeColors} from '../../context/ThemeContext';

type Props = {
  navigation: any;
};

const AddProductScreen = ({navigation}: Props) => {
  const insets = useSafeAreaInsets();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const {openDrawer} = useDrawer();

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [reorderLevel, setReorderLevel] = useState('10');
  const [safetyStock, setSafetyStock] = useState('5');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Dropdown States
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Picker Modals
  const [pickerModalType, setPickerModalType] = useState<
    'category' | 'warehouse' | 'supplier' | null
  >(null);

  // Status
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Alert
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    onSuccess?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [catList, whList, supList] = await Promise.all([
          getCategories(),
          getWarehouses(),
          getSuppliers(),
        ]);
        setCategories(catList);
        setWarehouses(whList);
        setSuppliers(supList);

        if (whList.length > 0) setSelectedWarehouse(whList[0]);
        if (catList.length > 0) setSelectedCategory(catList[0]);
        if (supList.length > 0) setSelectedSupplier(supList[0]);
      } catch (err) {
        console.log('Error loading dropdown data:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadDropdownData();
  }, []);

  const handleGenerateSku = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = name ? name.substring(0, 3).toUpperCase() : 'PRD';
    setSku(`${prefix}-${randomNum}`);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Validation Error',
        message: 'Product name is required.',
      });
      return;
    }

    if (!sku.trim()) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Validation Error',
        message: 'SKU is required.',
      });
      return;
    }

    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Validation Error',
        message: 'Please enter a valid price.',
      });
      return;
    }

    setLoading(true);
    try {
      const created = await createProduct({
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        barcode: barcode.trim() || undefined,
        price: Number(price),
        costPrice: costPrice.trim() ? Number(costPrice) : undefined,
        reorderLevel: reorderLevel.trim() ? Number(reorderLevel) : 10,
        safetyStock: safetyStock.trim() ? Number(safetyStock) : 5,
        imageUrl: imageUrl.trim() || undefined,
        description: description.trim() || undefined,
        categoryId: selectedCategory?.id,
        supplierId: selectedSupplier?.id,
      });

      // If initial stock was given and warehouse is chosen, create inventory
      const stockQty = Number(initialStock);
      if (stockQty > 0 && selectedWarehouse?.id && created.id) {
        try {
          await createInventory({
            productId: created.id,
            warehouseId: selectedWarehouse.id,
            quantity: stockQty,
          });
        } catch (invErr) {
          console.log('Error creating initial inventory:', invErr);
        }
      }

      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Success!',
        message: 'Product has been created successfully.',
        onSuccess: () => navigation.goBack(),
      });
    } catch (err: any) {
      console.log('Error creating product:', err?.response?.data || err?.message);
      const msg = err?.response?.data?.message || 'Failed to create product. Please try again.';
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Error',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPickerModal = () => {
    let title = '';
    let items: Array<{ id: number; name: string }> = [];
    let selectedId = 0;
    let onSelect = (_item: any) => {};

    if (pickerModalType === 'category') {
      title = 'Select Category';
      items = categories;
      selectedId = selectedCategory?.id || 0;
      onSelect = (item: Category) => setSelectedCategory(item);
    } else if (pickerModalType === 'warehouse') {
      title = 'Select Warehouse';
      items = warehouses;
      selectedId = selectedWarehouse?.id || 0;
      onSelect = (item: Warehouse) => setSelectedWarehouse(item);
    } else if (pickerModalType === 'supplier') {
      title = 'Select Supplier';
      items = suppliers;
      selectedId = selectedSupplier?.id || 0;
      onSelect = (item: Supplier) => setSelectedSupplier(item);
    }

    return (
      <Modal
        visible={pickerModalType !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerModalType(null)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerModalType(null)}>
          <View style={[styles.modalSheet, {paddingBottom: insets.bottom + 16}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setPickerModalType(null)}>
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {items.map(item => {
                const isSelected = item.id === selectedId;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.modalItem, isSelected && styles.modalItemActive]}
                    onPress={() => {
                      onSelect(item);
                      setPickerModalType(null);
                    }}>
                    <Text
                      style={[
                        styles.modalItemText,
                        isSelected && styles.modalItemTextActive,
                      ]}>
                      {item.name}
                    </Text>
                    {isSelected && <Check size={18} color="#1769E0" strokeWidth={2.5} />}
                  </TouchableOpacity>
                );
              })}

              {items.length === 0 && (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>No items available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
  style={styles.headerButton}
  onPress={openDrawer}
  activeOpacity={0.7}>
  <Menu size={22} color="#1769E0" />
</TouchableOpacity>

<Text style={styles.headerTitle}>Add Product</Text>

<View style={styles.headerRightSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContainer,
            {paddingBottom: 90},
          ]}
          keyboardShouldPersistTaps="handled">
          {/* Image Upload Box */}
          <TouchableOpacity
            style={styles.imageBox}
            activeOpacity={0.8}
            onPress={() => {
              // Could prompt for URL or camera in Phase 2
            }}>
            {imageUrl ? (
              <Image source={{uri: imageUrl}} style={styles.uploadedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.cameraCircle}>
                  <Camera size={26} color="#1769E0" />
                </View>
                <Text style={styles.addImageText}>Add Image</Text>
                <Text style={styles.addImageSubtext}>Optional photo or URL</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Product Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Wireless Ergonomic Mouse"
              placeholderTextColor="#9FB3C8"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* SKU Field with Auto-Generate */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                SKU <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity onPress={handleGenerateSku}>
                <Text style={styles.autoGenText}>Generate SKU</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g. MOU-1029"
              placeholderTextColor="#9FB3C8"
              value={sku}
              onChangeText={setSku}
              autoCapitalize="characters"
            />
          </View>

          {/* Category Dropdown */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setPickerModalType('category')}>
              <Text
                style={[
                  styles.pickerButtonText,
                  !selectedCategory && styles.placeholderText,
                ]}>
                {selectedCategory ? selectedCategory.name : 'Select Category'}
              </Text>
              <ChevronDown size={18} color="#829AB1" />
            </TouchableOpacity>
          </View>

          {/* Price and Cost Price Row */}
          <View style={styles.row}>
            <View style={[styles.formGroup, styles.halfCol]}>
              <Text style={styles.label}>
                Price (₹) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1500"
                placeholderTextColor="#9FB3C8"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, styles.halfCol]}>
              <Text style={styles.label}>Cost Price (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1000"
                placeholderTextColor="#9FB3C8"
                value={costPrice}
                onChangeText={setCostPrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Initial Stock */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Initial Stock Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 50"
              placeholderTextColor="#9FB3C8"
              value={initialStock}
              onChangeText={setInitialStock}
              keyboardType="numeric"
            />
          </View>

          {/* Reorder Level and Safety Stock */}
          <View style={styles.row}>
            <View style={[styles.formGroup, styles.halfCol]}>
              <Text style={styles.label}>Reorder Level</Text>
              <TextInput
                style={styles.input}
                placeholder="10"
                placeholderTextColor="#9FB3C8"
                value={reorderLevel}
                onChangeText={setReorderLevel}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, styles.halfCol]}>
              <Text style={styles.label}>Safety Stock</Text>
              <TextInput
                style={styles.input}
                placeholder="5"
                placeholderTextColor="#9FB3C8"
                value={safetyStock}
                onChangeText={setSafetyStock}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Warehouse Dropdown */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Warehouse</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setPickerModalType('warehouse')}>
              <Text
                style={[
                  styles.pickerButtonText,
                  !selectedWarehouse && styles.placeholderText,
                ]}>
                {selectedWarehouse ? selectedWarehouse.name : 'Select Warehouse'}
              </Text>
              <ChevronDown size={18} color="#829AB1" />
            </TouchableOpacity>
          </View>

          {/* Supplier Dropdown */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Supplier</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setPickerModalType('supplier')}>
              <Text
                style={[
                  styles.pickerButtonText,
                  !selectedSupplier && styles.placeholderText,
                ]}>
                {selectedSupplier ? selectedSupplier.name : 'Select Supplier'}
              </Text>
              <ChevronDown size={18} color="#829AB1" />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add product specifications or notes..."
              placeholderTextColor="#9FB3C8"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Docked Save Button */}
      <View
        style={[
          styles.bottomBar,
          {
           paddingBottom: 18,
          },
        ]}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Picker Modal */}
      {renderPickerModal()}

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onPress={() => {
          setAlertConfig(prev => ({...prev, visible: false}));
          if (alertConfig.onSuccess) {
            alertConfig.onSuccess();
          }
        }}
      />
    </SafeAreaView>
  );
};

const getStyles = (theme: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    flexOne: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    header: {
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      backgroundColor: theme.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.headerBorder,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.headerButtonBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    headerRightSpacer: {
      width: 40,
    },
    scrollContainer: {
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    imageBox: {
      width: '100%',
      height: 150,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderStyle: 'dashed',
      backgroundColor: theme.cardBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      overflow: 'hidden',
    },
    imagePlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    cameraCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: isDark ? theme.surfaceMuted : '#EAF2FD',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    addImageText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.primary,
    },
    addImageSubtext: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },
    uploadedImage: {
      width: '100%',
      height: '100%',
      borderRadius: 16,
    },
    formGroup: {
      marginBottom: 16,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 6,
    },
    required: {
      color: theme.errorText,
    },
    autoGenText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.primary,
    },
    input: {
      height: 48,
      backgroundColor: theme.inputBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      paddingHorizontal: 14,
      fontSize: 14,
      color: theme.textPrimary,
    },
    textArea: {
      height: 80,
      paddingTop: 12,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    halfCol: {
      flex: 1,
    },
    pickerButton: {
      height: 48,
      backgroundColor: theme.inputBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    pickerButtonText: {
      fontSize: 14,
      color: theme.textPrimary,
      fontWeight: '500',
    },
    placeholderText: {
      color: theme.placeholderText,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(248, 251, 255, 0.95)',
      paddingHorizontal: 20,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    saveButton: {
      backgroundColor: theme.primary,
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.primary,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: theme.cardBg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 18,
      maxHeight: '60%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    modalCloseText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.primary,
    },
    modalList: {
      paddingTop: 8,
    },
    modalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 10,
    },
    modalItemActive: {
      backgroundColor: isDark ? theme.surfaceMuted : '#EAF2FD',
    },
    modalItemText: {
      fontSize: 15,
      color: theme.textPrimary,
      fontWeight: '600',
    },
    modalItemTextActive: {
      color: theme.primary,
      fontWeight: '700',
    },
    modalEmpty: {
      paddingVertical: 24,
      alignItems: 'center',
    },
    modalEmptyText: {
      color: theme.textMuted,
      fontSize: 14,
    },
  });

export default AddProductScreen;
