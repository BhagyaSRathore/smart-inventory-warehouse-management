import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Trash2,
  Edit,
  Package,
  Layers,
  Building2,
  Users,
  Barcode,
  History,
  TrendingUp,
  ChevronRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  CheckCircle,
  Menu,
} from 'lucide-react-native';

import {
  getProductById,
  deleteProduct,
  updateProduct,
  recordStockIn,
  recordStockOut,
  Product,
  ProductInventoryLocation,
} from '../../services/productService';
import CustomAlert from '../../components/CustomAlert';
import {useDrawer} from '../../context/DrawerContext';
import {useAppTheme, ThemeColors} from '../../context/ThemeContext';

type Props = {
  route: any;
  navigation: any;
};

const ProductDetailsScreen = ({route, navigation}: Props) => {
  const insets = useSafeAreaInsets();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const {openDrawer} = useDrawer();
  const {productId, product: initialProduct} = route.params || {};

  const [product, setProduct] = useState<Product | null>(initialProduct || null);
  const [locations, setLocations] = useState<ProductInventoryLocation[]>([]);
  const [loading, setLoading] = useState(!initialProduct);
  const [actionLoading, setActionLoading] = useState(false);

  // Stock In / Out Modal State
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [stockModalType, setStockModalType] = useState<'in' | 'out' | null>(null);
  const [stockQuantity, setStockQuantity] = useState('');
  const [stockNotes, setStockNotes] = useState('');

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editReorderLevel, setEditReorderLevel] = useState('');

  // Custom Alert
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

  const fetchDetails = useCallback(async () => {
    if (!productId) return;
    try {
      const data = await getProductById(Number(productId));
      setProduct(data.product);
      if (data.inventory?.locations) {
        setLocations(data.inventory.locations);
      }
    } catch (err: any) {
      console.log('Error fetching product details:', err?.response?.data || err?.message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Handle Delete
  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product?.name}"? This action cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!product?.id) return;
            try {
              setActionLoading(true);
              await deleteProduct(product.id);
              setAlertConfig({
                visible: true,
                type: 'success',
                title: 'Deleted',
                message: 'Product has been deleted successfully.',
                onSuccess: () => navigation.goBack(),
              });
            } catch (err: any) {
              setAlertConfig({
                visible: true,
                type: 'error',
                title: 'Error',
                message: err?.response?.data?.message || 'Failed to delete product',
              });
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (!product) return;
    setEditName(product.name);
    setEditPrice(product.price.toString());
    setEditReorderLevel((product.reorderLevel ?? 10).toString());
    setEditModalVisible(true);
  };

  // Submit Edit
  const handleSaveEdit = async () => {
    if (!product?.id) return;
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Product name cannot be empty.');
      return;
    }
    if (!editPrice.trim() || isNaN(Number(editPrice)) || Number(editPrice) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price.');
      return;
    }

    try {
      setActionLoading(true);
      const updated = await updateProduct(product.id, {
        name: editName.trim(),
        price: Number(editPrice),
        reorderLevel: Number(editReorderLevel) || 10,
      });
      setProduct(prev => (prev ? {...prev, ...updated} : updated));
      setEditModalVisible(false);
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Updated!',
        message: 'Product details updated successfully.',
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update product');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Quick Stock Operation (Stock In / Stock Out)
  const handleStockActionSubmit = async () => {
    if (!product?.id) return;
    const qty = Number(stockQuantity);
    if (!qty || qty <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity greater than 0.');
      return;
    }

    // Default to first warehouse location or warehouseId = 1
    const warehouseId = locations[0]?.warehouse?.id || 1;

    try {
      setActionLoading(true);
      if (stockModalType === 'in') {
        await recordStockIn({
          productId: product.id,
          warehouseId,
          quantity: qty,
          notes: stockNotes || 'Quick Stock In from Mobile App',
        });
      } else {
        await recordStockOut({
          productId: product.id,
          warehouseId,
          quantity: qty,
          notes: stockNotes || 'Quick Stock Out from Mobile App',
        });
      }

      setStockModalVisible(false);
      setStockQuantity('');
      setStockNotes('');
      // Refresh details to update total stock count
      await fetchDetails();

      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Stock Updated!',
        message: `Successfully processed ${stockModalType === 'in' ? 'Stock In' : 'Stock Out'} of ${qty} units.`,
      });
    } catch (err: any) {
      Alert.alert('Stock Error', err?.response?.data?.message || 'Failed to update stock');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1769E0" />
          <Text style={styles.loadingText}>Loading product details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Product not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentStock = product.totalStock ?? 0;
  const reorderLevel = product.reorderLevel ?? 10;
  const warehouseName =
    locations[0]?.warehouse?.name || 'Main Warehouse';

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <ArrowLeft size={22} color="#102A43" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Product Details</Text>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleOpenEdit}
            activeOpacity={0.7}>
            <Edit size={18} color="#1769E0" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, styles.deleteHeaderBtn]}
            onPress={handleDelete}
            activeOpacity={0.7}>
            <Trash2 size={18} color="#D64545" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={openDrawer}
            activeOpacity={0.7}>
            <Menu size={18} color="#1769E0" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ================= CONTENT SCROLLVIEW ================= */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContainer,
          {paddingBottom: 95 + insets.bottom},
        ]}>
        {/* HERO SECTION */}
        <View style={styles.heroCard}>
          <View style={styles.heroImageBox}>
            {product.imageUrl ? (
              <Image source={{uri: product.imageUrl}} style={styles.heroImage} resizeMode="contain" />
            ) : (
              <Package size={54} color="#1769E0" strokeWidth={1.8} />
            )}
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{product.name}</Text>
            <Text style={styles.heroSku}>{product.sku}</Text>
            {product.category?.name && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{product.category.name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 2x1 STATS ROW */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Current Stock</Text>
            <Text
              style={[
                styles.statValue,
                currentStock === 0
                  ? styles.textRed
                  : currentStock <= reorderLevel
                  ? styles.textOrange
                  : styles.textGreen,
              ]}>
              {currentStock}
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Reorder Level</Text>
            <Text style={[styles.statValue, styles.textDark]}>{reorderLevel}</Text>
          </View>
        </View>

        {/* DETAILS SECTION */}
        <View style={styles.sectionCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValueBold}>
              ₹{Number(product.price).toLocaleString()}
            </Text>
          </View>

          {product.costPrice ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cost Price</Text>
              <Text style={styles.detailValue}>
                ₹{Number(product.costPrice).toLocaleString()}
              </Text>
            </View>
          ) : null}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Warehouse</Text>
            <Text style={styles.detailValue}>{warehouseName}</Text>
          </View>

          {product.supplier?.name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Supplier</Text>
              <Text style={styles.detailValue}>{product.supplier.name}</Text>
            </View>
          )}

          {product.barcode ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Barcode</Text>
              <Text style={styles.detailValue}>{product.barcode}</Text>
            </View>
          ) : null}

          {product.description ? (
            <View style={styles.descriptionBox}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          ) : null}
        </View>

        {/* ACTION ROWS */}
        <View style={styles.actionListCard}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() =>
              Alert.alert('Stock History', 'Full movement audit log is available in Operations.')
            }>
            <View style={styles.actionRowLeft}>
              <History size={18} color="#1769E0" />
              <Text style={styles.actionRowText}>Stock History</Text>
            </View>
            <ChevronRight size={18} color="#9FB3C8" />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() =>
              Alert.alert('Demand Prediction', 'AI Demand Prediction module will arrive in Phase 2.')
            }>
            <View style={styles.actionRowLeft}>
              <TrendingUp size={18} color="#1769E0" />
              <Text style={styles.actionRowText}>Demand Prediction</Text>
            </View>
            <ChevronRight size={18} color="#9FB3C8" />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity style={styles.actionRow} onPress={handleOpenEdit}>
            <View style={styles.actionRowLeft}>
              <Edit size={18} color="#1769E0" />
              <Text style={styles.actionRowText}>Edit Product</Text>
            </View>
            <ChevronRight size={18} color="#9FB3C8" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ================= BOTTOM QUICK STOCK ACTIONS DOCK ================= */}
      <View
        style={[
          styles.bottomDock,
          {
            paddingBottom: 0,
          },
        ]}>
        <TouchableOpacity
          style={styles.dockButton}
          onPress={() => {
            setStockModalType('in');
            setStockModalVisible(true);
          }}
          activeOpacity={0.8}>
          <ArrowDownToLine size={20} color="#1769E0" strokeWidth={2.2} />
          <Text style={styles.dockButtonText}>Stock In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dockButton}
          onPress={() => {
            setStockModalType('out');
            setStockModalVisible(true);
          }}
          activeOpacity={0.8}>
          <ArrowUpFromLine size={20} color="#D97706" strokeWidth={2.2} />
          <Text style={[styles.dockButtonText, {color: '#D97706'}]}>Stock Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dockButton}
          onPress={() => {
            Alert.alert(
              'Warehouse Transfer',
              'Transfer inventory between warehouse zones or racks.',
            );
          }}
          activeOpacity={0.8}>
          <ArrowLeftRight size={20} color="#486581" strokeWidth={2.2} />
          <Text style={[styles.dockButtonText, {color: '#486581'}]}>Transfer</Text>
        </TouchableOpacity>
      </View>

      {/* ================= STOCK IN/OUT MODAL ================= */}
      <Modal
        visible={stockModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStockModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStockModalVisible(false)}>
          <View style={[styles.modalSheet, {paddingBottom: insets.bottom + 20}]}>
            <Text style={styles.modalSheetTitle}>
              {stockModalType === 'in' ? 'Stock In' : 'Stock Out'}
            </Text>
            <Text style={styles.modalSheetSubtitle}>
              Update inventory level for {product.name}
            </Text>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Quantity to {stockModalType === 'in' ? 'Add' : 'Deduct'}</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 10"
                placeholderTextColor="#9FB3C8"
                value={stockQuantity}
                onChangeText={setStockQuantity}
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Notes / Reference (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Received from Supplier / Sale"
                placeholderTextColor="#9FB3C8"
                value={stockNotes}
                onChangeText={setStockNotes}
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setStockModalVisible(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  stockModalType === 'out' && {backgroundColor: '#D97706'},
                ]}
                onPress={handleStockActionSubmit}
                disabled={actionLoading}>
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>
                    Confirm {stockModalType === 'in' ? 'Stock In' : 'Stock Out'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ================= EDIT PRODUCT MODAL ================= */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditModalVisible(false)}>
          <View style={[styles.modalSheet, {paddingBottom: insets.bottom + 20}]}>
            <Text style={styles.modalSheetTitle}>Edit Product</Text>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Product Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Price (₹)</Text>
              <TextInput
                style={styles.modalInput}
                value={editPrice}
                onChangeText={setEditPrice}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Reorder Level</Text>
              <TextInput
                style={styles.modalInput}
                value={editReorderLevel}
                onChangeText={setEditReorderLevel}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleSaveEdit}
                disabled={actionLoading}>
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
    deleteHeaderBtn: {
      backgroundColor: isDark ? theme.surfaceMuted : '#FFF5F5',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    headerRightActions: {
      flexDirection: 'row',
      gap: 8,
    },
    scrollContainer: {
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    heroCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBg,
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 2,
      shadowColor: theme.shadowColor,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.05,
      shadowRadius: 6,
    },
    heroImageBox: {
      width: 80,
      height: 80,
      borderRadius: 16,
      backgroundColor: isDark ? theme.surfaceMuted : '#EAF2FD',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroInfo: {
      flex: 1,
      marginLeft: 16,
    },
    heroName: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    heroSku: {
      fontSize: 13,
      color: theme.textMuted,
      fontWeight: '600',
      marginBottom: 8,
    },
    categoryBadge: {
      alignSelf: 'flex-start',
      backgroundColor: isDark ? theme.surfaceMuted : '#EAF2FD',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    categoryBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.primary,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 14,
    },
    statBox: {
      flex: 1,
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 2,
      shadowColor: theme.shadowColor,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.04,
      shadowRadius: 4,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textMuted,
      marginBottom: 6,
    },
    statValue: {
      fontSize: 26,
      fontWeight: '800',
    },
    textGreen: {
      color: '#00A884',
    },
    textOrange: {
      color: '#D97706',
    },
    textRed: {
      color: '#D64545',
    },
    textDark: {
      color: theme.textPrimary,
    },
    sectionCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 2,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    detailLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    detailValue: {
      fontSize: 14,
      color: theme.textPrimary,
      fontWeight: '600',
    },
    detailValueBold: {
      fontSize: 16,
      color: theme.primary,
      fontWeight: '800',
    },
    descriptionBox: {
      paddingTop: 10,
    },
    descriptionText: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 4,
      lineHeight: 18,
    },
    actionListCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      paddingHorizontal: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 2,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
    },
    actionRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    actionRowText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    rowDivider: {
      height: 1,
      backgroundColor: theme.borderLight,
    },
    bottomDock: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.cardBg,
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      elevation: 8,
      shadowColor: theme.shadowColor,
      shadowOffset: {width: 0, height: -3},
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    dockButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 20,
      borderRadius: 12,
    },
    dockButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.primary,
      marginTop: 4,
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    loadingText: {
      marginTop: 12,
      color: theme.textMuted,
      fontSize: 14,
    },
    errorText: {
      fontSize: 16,
      color: theme.errorText,
      fontWeight: '700',
      marginBottom: 16,
    },
    backButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
    },
    backButtonText: {
      color: '#FFFFFF',
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
      paddingTop: 20,
    },
    modalSheetTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    modalSheetSubtitle: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
      marginBottom: 16,
    },
    modalField: {
      marginBottom: 14,
    },
    modalLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 6,
    },
    modalInput: {
      height: 48,
      backgroundColor: theme.inputBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      paddingHorizontal: 14,
      fontSize: 14,
      color: theme.textPrimary,
    },
    modalBtnRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 10,
    },
    modalCancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCancelBtnText: {
      color: theme.textSecondary,
      fontWeight: '700',
      fontSize: 15,
    },
    modalConfirmBtn: {
      flex: 1.5,
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalConfirmBtnText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15,
    },
  });

export default ProductDetailsScreen;
