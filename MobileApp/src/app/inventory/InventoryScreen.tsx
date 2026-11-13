import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  Menu,
  Bell,
  Search,
  X,
  Boxes,
  PackagePlus,
  PackageMinus,
  ArrowLeftRight,
  Wrench,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react-native';

import API from '../../services/api';
import {useDrawer} from '../../context/DrawerContext';
import {useAppTheme, ThemeColors} from '../../context/ThemeContext';
import {useSelector} from 'react-redux';
import {RootState} from '../../store/store';
import {normalizeRole, isStaff} from '../../utils/roles';

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
    reorderLevel?: number;
    safetyStock?: number;
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

const InventoryScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = normalizeRole(user?.role);
  const isStaffUser = isStaff(userRole);

  const [inventory, setInventory] = useState<
    InventoryItem[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInventory = useCallback(async () => {
    try {
      setError('');

      const response = await API.get('/inventory');

      const data = response?.data;

      const items = Array.isArray(data?.inventories)
        ? data.inventories
        : Array.isArray(data)
        ? data
        : [];

      setInventory(items);
    } catch (err: any) {
      console.log(
        'Error fetching inventory:',
        err?.response?.data || err?.message,
      );

      setError(
        err?.response?.data?.message ||
          'Failed to load inventory',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();

    const unsubscribe = navigation.addListener(
      'focus',
      () => {
        fetchInventory();
      },
    );

    return unsubscribe;
  }, [navigation, fetchInventory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const {openDrawer} = useDrawer();

  const handleOpenDrawer = () => {
    openDrawer();
  };

  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) {
      return inventory;
    }

    const q = searchQuery
      .toLowerCase()
      .trim();

    return inventory.filter(item => {
      const productName =
        item.product?.name?.toLowerCase() || '';

      const sku =
        item.product?.sku?.toLowerCase() || '';

      const warehouse =
        item.warehouse?.name?.toLowerCase() || '';

      const rack =
        item.rack?.name?.toLowerCase() || '';

      return (
        productName.includes(q) ||
        sku.includes(q) ||
        warehouse.includes(q) ||
        rack.includes(q)
      );
    });
  }, [inventory, searchQuery]);

  const getStatus = (
    item: InventoryItem,
  ) => {
    const quantity = Number(
      item.quantity ?? 0,
    );

    const reorderLevel = Number(
      item.product?.reorderLevel ?? 10,
    );

    if (quantity === 0) {
      return 'out';
    }

    if (
      quantity > 0 &&
      quantity <= reorderLevel
    ) {
      return 'low';
    }

    return 'in';
  };

  const renderStockBadge = (
    item: InventoryItem,
  ) => {
    const quantity = Number(
      item.quantity ?? 0,
    );

    const status = getStatus(item);

    if (status === 'out') {
      return (
        <View
          style={[
            styles.badge,
            styles.badgeOutOfStock,
          ]}>
          <Text
            style={[
              styles.badgeText,
              styles.badgeTextOutOfStock,
            ]}>
            0 units
          </Text>
        </View>
      );
    }

    if (status === 'low') {
      return (
        <View
          style={[
            styles.badge,
            styles.badgeLowStock,
          ]}>
          <Text
            style={[
              styles.badgeText,
              styles.badgeTextLowStock,
            ]}>
            {quantity} units
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.badge,
          styles.badgeInStock,
        ]}>
        <Text
          style={[
            styles.badgeText,
            styles.badgeTextInStock,
          ]}>
          {quantity} units
        </Text>
      </View>
    );
  };

  const renderInventoryItem = ({
    item,
  }: {
    item: InventoryItem;
  }) => {
    const warehouseName =
      item.warehouse?.name ||
      'Warehouse';

    const rackName =
      item.rack?.name ||
      'No Rack';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => {
          if (item.productId) {
            navigation.navigate(
              'Products',
              {
                screen: 'ProductDetails',
                params: {
                  productId: item.productId,
                },
              },
            );
          }
        }}>
        {/* Left icon */}
        <View style={styles.thumbnailBox}>
          <Boxes
            size={26}
            color="#1769E0"
            strokeWidth={1.8}
          />
        </View>

        {/* Center details */}
        <View style={styles.cardDetails}>
          <Text
            style={styles.productName}
            numberOfLines={1}>
            {item.product?.name ||
              'Unknown Product'}
          </Text>

          <View style={styles.skuRow}>
            <Text
              style={styles.skuText}
              numberOfLines={1}>
              {item.product?.sku ||
                'SKU unavailable'}
            </Text>
          </View>

          <Text
            style={styles.locationText}
            numberOfLines={1}>
            {warehouseName} • {rackName}
          </Text>
        </View>

        {/* Right quantity */}
        <View style={styles.cardRight}>
          {renderStockBadge(item)}

          <ChevronRight
            size={18}
            color="#9FB3C8"
            style={styles.chevron}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderQuickAction = (
    title: string,
    subtitle: string,
    type:
      | 'in'
      | 'out'
      | 'transfer'
      | 'adjust',
    onPress: () => void,
  ) => {
    const icon =
      type === 'in' ? (
        <PackagePlus
          size={24}
          color="#16A34A"
          strokeWidth={2}
        />
      ) : type === 'out' ? (
        <PackageMinus
          size={24}
          color="#DC2626"
          strokeWidth={2}
        />
      ) : type === 'transfer' ? (
        <ArrowLeftRight
          size={24}
          color="#1769E0"
          strokeWidth={2}
        />
      ) : (
        <Wrench
          size={24}
          color="#7C3AED"
          strokeWidth={2}
        />
      );

    const iconStyle =
      type === 'in'
        ? styles.actionIconIn
        : type === 'out'
        ? styles.actionIconOut
        : type === 'transfer'
        ? styles.actionIconTransfer
        : styles.actionIconAdjust;

    return (
      <TouchableOpacity
        style={styles.actionCard}
        activeOpacity={0.75}
        onPress={onPress}>
        <View
          style={[
            styles.actionIcon,
            iconStyle,
          ]}>
          {icon}
        </View>

        <Text style={styles.actionTitle}>
          {title}
        </Text>

        <Text
          style={styles.actionSubtitle}
          numberOfLines={1}>
          {subtitle}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={[]}>

      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleOpenDrawer}
          activeOpacity={0.7}>
          <Menu
            size={22}
            color="#1769E0"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Inventory
        </Text>

        <TouchableOpacity
          style={styles.headerButton}
          activeOpacity={0.7}>
          <Bell
            size={20}
            color={theme.textPrimary}
          />

          <View
            style={styles.notificationDot}
          />
        </TouchableOpacity>
      </View>

      {/* ================= SEARCH ================= */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search
            size={18}
            color={theme.textMuted}
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search inventory..."
            placeholderTextColor={theme.placeholderText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() =>
                setSearchQuery('')
              }>
              <X
                size={16}
                color={theme.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ================= BODY ================= */}
      {loading ? (
        <View
          style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color="#1769E0"
          />

          <Text style={styles.loadingText}>
            Loading inventory...
          </Text>
        </View>
      ) : error ? (
        <View
          style={styles.centerContainer}>
          <AlertTriangle
            size={40}
            color="#D64545"
          />

          <Text style={styles.errorText}>
            {error}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchInventory}>
            <Text
              style={styles.retryButtonText}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredInventory}
          keyExtractor={item =>
            item.id.toString()
          }
          renderItem={
            renderInventoryItem
          }
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom:
                30 + insets.bottom,
            },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1769E0']}
            />
          }
          ListHeaderComponent={
            <>
              {/* ================= QUICK ACTIONS ================= */}
              <View
                style={styles.sectionHeader}>
                <Text
                  style={styles.sectionTitle}>
                  Quick Actions
                </Text>
              </View>

              <View
                style={styles.actionsGrid}>
                {renderQuickAction(
                  'Stock In',
                  'Add inventory',
                  'in',
                  () =>
                    navigation.navigate(
                      'StockIn',
                    ),
                )}

                {renderQuickAction(
                  'Stock Out',
                  'Remove inventory',
                  'out',
                  () =>
                    navigation.navigate(
                      'StockOut',
                    ),
                )}

                {!isStaffUser &&
                  renderQuickAction(
                    'Transfer',
                    'Move stock',
                    'transfer',
                    () =>
                      navigation.navigate(
                        'TransferStock',
                      ),
                  )}

                {!isStaffUser &&
                  renderQuickAction(
                    'Adjustment',
                    'Correct stock',
                    'adjust',
                    () =>
                      navigation.navigate(
                        'StockAdjustment',
                      ),
                  )}
              </View>

              {/* ================= INVENTORY TITLE ================= */}
              <View
                style={styles.inventoryHeader}>
                <View>
                  <Text
                    style={
                      styles.inventoryTitle
                    }>
                    Inventory
                  </Text>

                  <Text
                    style={
                      styles.inventoryCount
                    }>
                    {filteredInventory.length}{' '}
                    {filteredInventory.length ===
                    1
                      ? 'item'
                      : 'items'}
                  </Text>
                </View>
              </View>
            </>
          }
          ListEmptyComponent={
            <View
              style={styles.emptyContainer}>
              <Boxes
                size={50}
                color="#CBD2D9"
                strokeWidth={1.5}
              />

              <Text
                style={styles.emptyTitle}>
                No inventory found
              </Text>

              <Text
                style={
                  styles.emptySubtitle
                }>
                {searchQuery
                  ? 'Try searching with another keyword'
                  : 'Add inventory using Stock In'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const getStyles = (theme: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    /* ================= HEADER ================= */

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
      flex: 1,
      marginLeft: 12,
      fontSize: 18,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    notificationDot: {
      position: 'absolute',
      top: 9,
      right: 9,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF4D67',
    },

    /* ================= SEARCH ================= */

    searchContainer: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
    },

    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBg,
      borderRadius: 14,
      paddingHorizontal: 14,
      height: 46,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },

    searchInput: {
      flex: 1,
      marginLeft: 10,
      fontSize: 14,
      color: theme.textPrimary,
      paddingVertical: 0,
    },

    /* ================= LIST ================= */

    listContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },

    /* ================= QUICK ACTIONS ================= */

    sectionHeader: {
      paddingTop: 8,
      paddingBottom: 10,
    },

    sectionTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    actionCard: {
      width: '48%',
      minHeight: 116,
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      padding: 14,
      marginBottom: 2,
      borderWidth: 1,
      borderColor: theme.border,

      shadowColor: theme.shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },

    actionIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },

    actionIconIn: {
      backgroundColor: isDark ? theme.surfaceMuted : '#E7F8F1',
    },

    actionIconOut: {
      backgroundColor: isDark ? theme.surfaceMuted : '#FFECEE',
    },

    actionIconTransfer: {
      backgroundColor: isDark ? theme.surfaceMuted : '#EAF2FD',
    },

    actionIconAdjust: {
      backgroundColor: isDark ? theme.surfaceMuted : '#F0EBFF',
    },

    actionTitle: {
      marginTop: 10,
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
    },

    actionSubtitle: {
      marginTop: 3,
      fontSize: 11,
      color: theme.textMuted,
    },

    /* ================= INVENTORY HEADING ================= */

    inventoryHeader: {
      paddingTop: 20,
      paddingBottom: 10,
    },

    inventoryTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    inventoryCount: {
      marginTop: 3,
      fontSize: 12,
      color: theme.textMuted,
    },

    /* ================= INVENTORY CARD ================= */

    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,

      shadowColor: theme.shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,

      borderWidth: 1,
      borderColor: theme.border,
    },

    thumbnailBox: {
      width: 52,
      height: 52,
      borderRadius: 12,
      backgroundColor: isDark ? theme.surfaceMuted : '#EAF2FD',
      alignItems: 'center',
      justifyContent: 'center',
    },

    cardDetails: {
      flex: 1,
      marginLeft: 14,
      marginRight: 6,
    },

    productName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 3,
    },

    skuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },

    skuText: {
      fontSize: 12,
      color: theme.textMuted,
      fontWeight: '500',
    },

    locationText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '500',
    },

    cardRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },

    badge: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 12,
    },

    badgeText: {
      fontSize: 11,
      fontWeight: '700',
    },

    badgeInStock: {
      backgroundColor: isDark ? theme.surfaceMuted : '#E7F8F1',
    },

    badgeTextInStock: {
      color: '#00A884',
    },

    badgeLowStock: {
      backgroundColor: isDark ? theme.surfaceMuted : '#FFF3E5',
    },

    badgeTextLowStock: {
      color: '#D97706',
    },

    badgeOutOfStock: {
      backgroundColor: isDark ? theme.surfaceMuted : '#FFECEE',
    },

    badgeTextOutOfStock: {
      color: '#D64545',
    },

    chevron: {
      marginLeft: 1,
    },

    /* ================= LOADING / ERROR ================= */

    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },

    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.textMuted,
    },

    errorText: {
      marginTop: 10,
      fontSize: 14,
      color: theme.errorText,
      textAlign: 'center',
    },

    retryButton: {
      marginTop: 16,
      backgroundColor: theme.primary,
      paddingHorizontal: 22,
      paddingVertical: 10,
      borderRadius: 10,
    },

    retryButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },

    /* ================= EMPTY ================= */

    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },

    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
      marginTop: 14,
    },

    emptySubtitle: {
      fontSize: 13,
      color: theme.textMuted,
      marginTop: 6,
      textAlign: 'center',
    },
  });

export default InventoryScreen;