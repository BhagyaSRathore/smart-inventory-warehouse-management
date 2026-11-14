import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {
  Bell,
  Calendar,
  ChevronRight,
  Menu,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Warehouse as WarehouseIcon,
} from 'lucide-react-native';

import API from '../../services/api';
import apis from '../../services/endpoint';
import CustomAlert from '../../components/CustomAlert';
import {useDrawer} from '../../context/DrawerContext';
import {useAppTheme, ThemeColors} from '../../context/ThemeContext';

export type SalesOrder = {
  id: number;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  subtotal: number | string;
  tax: number | string;
  total: number | string;
  notes?: string | null;
  createdAt: string;
  itemsCount?: number;
  customer?: {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  warehouse?: {
    id: number;
    name: string;
    location?: string | null;
  } | null;
  items?: Array<{
    id: number;
    productId: number;
    quantity: number;
    unitPrice: number | string;
    total: number | string;
    product?: {
      id: number;
      name: string;
      sku?: string | null;
    } | null;
  }>;
};

type Props = {
  navigation: any;
};

const SalesOrderListScreen = ({navigation}: Props) => {
  const {openDrawer} = useDrawer();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<SalesOrder[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Custom Alert
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
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
  ) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
    });
  };

  const loadOrders = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setErrorMessage(null);

      const endpoint = apis.salesOrders || '/sales-orders';
      const response = await API.get(endpoint);
      const data = response?.data;

      let list: SalesOrder[] = [];
      if (Array.isArray(data?.salesOrders)) {
        list = data.salesOrders;
      } else if (Array.isArray(data?.orders)) {
        list = data.orders;
      } else if (Array.isArray(data?.data)) {
        list = data.data;
      } else if (Array.isArray(data)) {
        list = data;
      }

      setOrders(list);
      applyFilter(search, list);
    } catch (error: any) {
      console.log('GET SALES ORDERS ERROR:', error?.response?.data || error);
      const msg =
        error?.response?.data?.message ||
        'Unable to load sales orders. Please try again.';
      setErrorMessage(msg);
      if (!isRefreshing) {
        showAlert('error', 'Error Loading Orders', msg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders(true);
  };

  const applyFilter = (text: string, data: SalesOrder[] = orders) => {
    setSearch(text);
    const query = text.trim().toLowerCase();
    if (!query) {
      setFilteredOrders(data);
      return;
    }

    const filtered = data.filter(so => {
      const orderNum = so.orderNumber?.toLowerCase() || '';
      const customerName = so.customer?.name?.toLowerCase() || '';
      const warehouseName = so.warehouse?.name?.toLowerCase() || '';
      const status = so.status?.toLowerCase() || '';
      return (
        orderNum.includes(query) ||
        customerName.includes(query) ||
        warehouseName.includes(query) ||
        status.includes(query)
      );
    });

    setFilteredOrders(filtered);
  };

  useFocusEffect(
    useCallback(() => {
      loadOrders();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return {
          bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
          text: isDark ? '#FBBF24' : '#B45309',
          border: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
        };
      case 'CONFIRMED':
        return {
          bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
          text: isDark ? '#60A5FA' : '#1D4ED8',
          border: isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE',
        };
      case 'SHIPPED':
        return {
          bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#EDE9FE',
          text: isDark ? '#A78BFA' : '#6D28D9',
          border: isDark ? 'rgba(139, 92, 246, 0.3)' : '#DDD6FE',
        };
      case 'DELIVERED':
        return {
          bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
          text: isDark ? '#34D399' : '#047857',
          border: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
        };
      case 'CANCELLED':
        return {
          bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
          text: isDark ? '#F87171' : '#B91C1C',
          border: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
        };
      default:
        return {
          bg: isDark ? theme.surfaceMuted : '#F1F5F9',
          text: theme.textSecondary,
          border: theme.border,
        };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (val: number | string) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const renderOrderItem = ({item}: {item: SalesOrder}) => {
    const badgeStyle = getStatusBadgeStyle(item.status);
    const productCount = item.itemsCount ?? item.items?.length ?? 0;

    return (
      <Pressable
        style={({pressed}) => [
          styles.orderCard,
          pressed && styles.cardPressed,
        ]}
        onPress={() =>
          navigation.navigate('SalesOrderDetails', {
            salesOrderId: item.id,
          })
        }>
        {/* Top Row: Order Number & Status Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.orderNumberRow}>
            <View style={styles.soIconBox}>
              <Receipt size={16} color="#1769E0" strokeWidth={2.2} />
            </View>
            <Text style={styles.orderNumberText}>{item.orderNumber}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: badgeStyle.bg,
                borderColor: badgeStyle.border,
              },
            ]}>
            <Text style={[styles.statusBadgeText, {color: badgeStyle.text}]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Customer & Warehouse Details */}
        <View style={styles.cardBody}>
          <Text style={styles.customerName} numberOfLines={1}>
            {item.customer?.name || 'Unknown Customer'}
          </Text>

          <View style={styles.metaRow}>
            <WarehouseIcon size={14} color={theme.textMuted} strokeWidth={1.8} />
            <Text style={styles.metaText} numberOfLines={1}>
              Warehouse: {item.warehouse?.name || 'Unassigned'}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* Bottom Row: Products Count, Amount, Date */}
        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <View style={styles.productCountBadge}>
              <Package size={13} color={theme.textSecondary} strokeWidth={2} />
              <Text style={styles.productCountText}>
                {productCount} {productCount === 1 ? 'Product' : 'Products'}
              </Text>
            </View>
            <Text style={styles.orderTotalText}>
              {formatCurrency(item.total)}
            </Text>
          </View>

          <View style={styles.footerRight}>
            <View style={styles.dateRow}>
              <Calendar size={13} color={theme.textMuted} strokeWidth={1.8} />
              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            </View>
            <ChevronRight size={18} color={theme.textMuted} strokeWidth={2} />
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEmptyOrError = () => {
    if (loading) return null;

    if (errorMessage) {
      return (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconBox, styles.errorIconBox]}>
            <RefreshCw size={32} color="#DC2626" strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>Failed to Load Orders</Text>
          <Text style={styles.emptySubtitle}>{errorMessage}</Text>
          <Pressable
            style={({pressed}) => [
              styles.retryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => loadOrders()}>
            <RefreshCw size={16} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    if (search.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Search size={32} color="#1769E0" strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>No Matching Orders</Text>
          <Text style={styles.emptySubtitle}>
            No sales order matches "{search}".
          </Text>
          <Pressable
            style={styles.clearSearchBtn}
            onPress={() => applyFilter('')}>
            <Text style={styles.clearSearchText}>Clear Search</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBox}>
          <Receipt size={36} color="#1769E0" strokeWidth={1.8} />
        </View>
        <Text style={styles.emptyTitle}>No Sales Orders</Text>
        <Text style={styles.emptySubtitle}>
          Create your first sales order to start fulfilling customer requests.
        </Text>
        <Pressable
          style={({pressed}) => [
            styles.emptyCreateButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.navigate('AddSalesOrder')}>
          <Plus size={18} color="#FFFFFF" strokeWidth={2.4} />
          <Text style={styles.emptyCreateButtonText}>Create Sales Order</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header: [☰] Sales Orders [🔔] */}
      <View style={styles.header}>
        <Pressable
          style={({pressed}) => [
            styles.menuButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={openDrawer}>
          <Menu size={22} color="#1769E0" strokeWidth={2} />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Sales Orders</Text>
          <Text style={styles.headerSubtitle}>
            Manage outbound customer orders
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerNotificationBtn}
          activeOpacity={0.7}>
          <Bell size={20} color={theme.textPrimary} strokeWidth={2} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      {/* Search Bar & Create Button */}
      <View style={styles.actionSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={theme.textMuted} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={applyFilter}
            placeholder="Search sales orders..."
            placeholderTextColor={theme.placeholderText}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <Pressable onPress={() => applyFilter('')} hitSlop={10}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={({pressed}) => [
            styles.createButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.navigate('AddSalesOrder')}>
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.createButtonText}>Create Sales Order</Text>
        </Pressable>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1769E0" />
          <Text style={styles.loaderText}>Loading sales orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderOrderItem}
          ListEmptyComponent={renderEmptyOrError}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#1769E0']}
              tintColor="#1769E0"
            />
          }
        />
      )}

      {/* Unified CustomAlert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onPress={() => setAlertConfig(prev => ({...prev, visible: false}))}
      />
    </SafeAreaView>
  );
};

export default SalesOrderListScreen;

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
    menuButton: {
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
    headerNotificationBtn: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: theme.headerButtonBg,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    notificationDot: {
      position: 'absolute',
      top: 9,
      right: 10,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#EF4444',
    },
    actionSection: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
      backgroundColor: theme.bg,
      gap: 10,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      paddingHorizontal: 14,
      height: 46,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.textPrimary,
      marginLeft: 10,
      paddingVertical: 0,
    },
    clearText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#1769E0',
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1769E0',
      borderRadius: 12,
      height: 46,
      gap: 8,
      shadowColor: '#1769E0',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    createButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    buttonPressed: {
      opacity: 0.85,
      transform: [{scale: 0.99}],
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 24,
      flexGrow: 1,
    },
    orderCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 12,
      shadowColor: theme.shadowColor,
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    cardPressed: {
      opacity: 0.9,
      backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    orderNumberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    soIconBox: {
      width: 28,
      height: 28,
      borderRadius: 7,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    orderNumberText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    statusBadge: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 20,
      borderWidth: 1,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    cardBody: {
      marginBottom: 10,
      gap: 4,
    },
    customerName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    cardDivider: {
      height: 1,
      backgroundColor: theme.borderLight,
      marginBottom: 10,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    footerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    productCountBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: isDark ? theme.surfaceMuted : '#F1F5F9',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    productCountText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    orderTotalText: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    footerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    dateText: {
      fontSize: 12,
      color: theme.textMuted,
      fontWeight: '500',
    },
    loaderContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      gap: 10,
    },
    loaderText: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
      paddingVertical: 60,
    },
    emptyIconBox: {
      width: 68,
      height: 68,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    errorIconBox: {
      backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEE2E2',
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 6,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 19,
      marginBottom: 20,
    },
    emptyCreateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1769E0',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    emptyCreateButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#DC2626',
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 10,
      gap: 8,
    },
    retryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    clearSearchBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EFF6FF',
      borderRadius: 8,
    },
    clearSearchText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#1769E0',
    },
  });
