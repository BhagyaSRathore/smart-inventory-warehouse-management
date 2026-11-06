import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  ScrollView,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  Bell,
  AlertTriangle,
  PackageX,
  Boxes,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Check,
  CheckCheck,
  RefreshCw,
  Menu,
  ChevronLeft,
  Inbox,
  Warehouse,
  X,
  Eye,
} from 'lucide-react-native';
import {useAppTheme, ThemeColors} from '../../context/ThemeContext';
import {useDrawer} from '../../context/DrawerContext';
import {
  AppNotification,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationById,
} from '../../services/notificationService';
import {
  getProductById,
  ProductDetailsResponse,
} from '../../services/productService';
import CustomAlert from '../../components/CustomAlert';

type FilterType = 'all' | 'unread' | 'inventory' | 'orders' | 'system';

type Props = {
  navigation: any;
  route?: any;
};

// Helper: Format relative timestamp
const formatTimeAgo = (dateString?: string): string => {
  if (!dateString) return 'Recent';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 0 || isNaN(diffInSeconds)) return 'Just now';
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
};

// Helper: Filter classification
const isInventoryType = (type: string = '', title: string = ''): boolean => {
  const t = type.toUpperCase();
  const tit = title.toUpperCase();
  return (
    t === 'LOW_STOCK' ||
    t === 'OUT_OF_STOCK' ||
    t === 'INVENTORY_UPDATE' ||
    t.includes('INVENTORY') ||
    t.includes('STOCK') ||
    tit.includes('LOW STOCK') ||
    tit.includes('OUT OF STOCK')
  );
};

const isOrderType = (type: string = '', title: string = ''): boolean => {
  const t = type.toUpperCase();
  const tit = title.toUpperCase();
  return (
    t === 'ORDER_CREATED' ||
    t === 'ORDER_STATUS' ||
    t.includes('ORDER') ||
    tit.includes('ORDER')
  );
};

const isSystemType = (type: string = '', title: string = ''): boolean => {
  const t = type.toUpperCase();
  return (
    t === 'SYSTEM_ALERT' ||
    t.includes('SYSTEM') ||
    (!isInventoryType(type, title) && !isOrderType(type, title))
  );
};

// Helper: Extract structured metadata from low stock / out of stock messages
interface ParsedAlertInfo {
  productName?: string;
  warehouseName?: string;
  currentQuantity?: string;
  threshold?: string;
}

const parseStockDetails = (
  type: string,
  title: string,
  message: string,
): ParsedAlertInfo => {
  const result: ParsedAlertInfo = {};

  // Extract Product Name from title e.g. "Low stock: Widget A", "Out of stock: Motor", "Restocked: Laptop"
  const titleProductMatch = title.match(/(?:Low stock|Out of stock|Restocked|Replenished):\s*(.*)/i);
  if (titleProductMatch && titleProductMatch[1]) {
    result.productName = titleProductMatch[1].trim();
  }

  // Extract Warehouse Name e.g. "is running low in Main Warehouse." or "out of stock in West Branch." or "Laptop in West Coast Warehouse has been replenished"
  const warehouseMatch = message.match(/(?:in|at)\s+([A-Za-z0-9\s-]+?)(?:\.|\s+has been|\s+Immediate|\s+Current)/i);
  if (warehouseMatch && warehouseMatch[1]) {
    result.warehouseName = warehouseMatch[1].trim();
  }

  // Extract Current Quantity e.g. "Current quantity: 4." or "Quantity: 0."
  const quantityMatch = message.match(/Current quantity:\s*(\d+)/i);
  if (quantityMatch && quantityMatch[1]) {
    result.currentQuantity = quantityMatch[1];
  } else if (type.toUpperCase() === 'OUT_OF_STOCK' || title.toLowerCase().includes('out of stock')) {
    result.currentQuantity = '0';
  }

  // Extract Reorder Threshold e.g. "Reorder threshold: 15."
  const thresholdMatch = message.match(/Reorder threshold:\s*(\d+)/i);
  if (thresholdMatch && thresholdMatch[1]) {
    result.threshold = thresholdMatch[1];
  }

  return result;
};

const NotificationScreen: React.FC<Props> = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const {openDrawer} = useDrawer();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterType>(() => {
    const initial = route?.params?.filter;
    if (initial) {
      const lower = String(initial).toLowerCase();
      if (
        lower === 'inventory' ||
        lower === 'orders' ||
        lower === 'unread' ||
        lower === 'system'
      ) {
        return lower as FilterType;
      }
    }
    return 'all';
  });
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState<boolean>(false);

  // Active Restock Alert details state
  const [selectedAlertItem, setSelectedAlertItem] = useState<{
    id?: number;
    productId?: number;
    productName?: string;
    warehouseName?: string;
    title?: string;
    message?: string;
    severity?: string;
    type?: string;
    currentQuantity?: string | number;
    threshold?: string | number;
    reorderLevel?: string | number;
    safetyStock?: string | number;
    actionUrl?: string | null;
  } | null>(null);

  const [productDetails, setProductDetails] =
    useState<ProductDetailsResponse | null>(null);
  const [alertDetailsLoading, setAlertDetailsLoading] =
    useState<boolean>(false);
  const [alertDetailsError, setAlertDetailsError] = useState<string>('');

  // Custom alert dialog state
  const [customAlertConfig, setCustomAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    buttonText?: string;
    secondaryButtonText?: string;
    onPress?: () => void;
    onSecondaryPress?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  // Mark single notification as read silently (for tap interactions)
  const handleMarkAsReadSilently = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? {...n, read: true} : n)),
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Ignore silent failures
    }
  };

  // Handle selecting an alert to load full product & inventory details
  const handleSelectAlert = useCallback(
    async (alertInfo: {
      id?: number;
      productId?: number;
      productName?: string;
      warehouseName?: string;
      title?: string;
      message?: string;
      severity?: string;
      type?: string;
      currentQuantity?: string | number;
      threshold?: string | number;
      reorderLevel?: string | number;
      safetyStock?: string | number;
      actionUrl?: string | null;
    }) => {
      setSelectedAlertItem(alertInfo);
      setAlertDetailsError('');
      setProductDetails(null);

      // Optimistically mark notification as read if id provided
      if (alertInfo.id) {
        handleMarkAsReadSilently(alertInfo.id);
      }

      let targetProductId = alertInfo.productId;

      // Extract from actionUrl if productId missing
      if (!targetProductId && alertInfo.actionUrl) {
        const match = alertInfo.actionUrl.match(/productId=(\d+)/);
        if (match && match[1]) {
          targetProductId = Number(match[1]);
        }
      }

      // If productId still missing, try fetching notification details from backend
      if (!targetProductId && alertInfo.id) {
        try {
          const notif = await getNotificationById(alertInfo.id);
          if (notif?.actionUrl) {
            const match = notif.actionUrl.match(/productId=(\d+)/);
            if (match && match[1]) {
              targetProductId = Number(match[1]);
            }
          }
        } catch (e) {
          console.warn('Could not fetch notification by id:', e);
        }
      }

      if (!targetProductId) {
        if (!alertInfo.productName && !alertInfo.title) {
          setAlertDetailsError(
            'No valid product or alert identifier was provided for this notification.',
          );
        }
        return;
      }

      setAlertDetailsLoading(true);
      try {
        const data = await getProductById(targetProductId);
        if (data && data.product) {
          setProductDetails(data);
        } else {
          setAlertDetailsError(
            'Product details could not be found for the specified product ID.',
          );
        }
      } catch (err: any) {
        console.warn('Failed to load product details for alert:', err?.message);
        setAlertDetailsError(
          err?.response?.data?.message ||
            'Failed to load restock alert details from server.',
        );
      } finally {
        setAlertDetailsLoading(false);
      }
    },
    [],
  );

  // Sync active filter and route params when navigated via push notification
  useEffect(() => {
    const params = route?.params;
    if (!params) return;

    if (params.filter) {
      const f = String(params.filter).toLowerCase();
      if (
        f === 'inventory' ||
        f === 'orders' ||
        f === 'unread' ||
        f === 'system' ||
        f === 'all'
      ) {
        setActiveFilter(f as FilterType);
      }
    }

    const hasIdentifier =
      params.productId ||
      params.alertId ||
      params.notificationId ||
      params.productName ||
      params.title;

    if (hasIdentifier) {
      handleSelectAlert({
        id: params.notificationId ? Number(params.notificationId) : undefined,
        productId: params.productId ? Number(params.productId) : undefined,
        productName: params.productName,
        warehouseName: params.warehouseName,
        title: params.title,
        message: params.message,
        severity: params.severity,
        type: params.type,
        currentQuantity: params.currentQuantity,
        threshold: params.threshold,
        reorderLevel: params.reorderLevel,
        safetyStock: params.safetyStock,
        actionUrl: params.actionUrl,
      });
    }
  }, [route?.params, handleSelectAlert]);

  // Fetch notifications and unread count
  const loadData = useCallback(async (isPullToRefresh = false) => {
    if (isPullToRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const [notifsData, countData] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);

      // Sort newest first
      const sorted = [...notifsData].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setNotifications(sorted);
      setUnreadCount(countData);
    } catch (err: any) {
      console.log('Failed to fetch notifications:', err?.message);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load notifications. Please check your connection.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  // Mark single notification as read
  const handleMarkAsRead = async (id: number) => {
    setActionLoadingId(id);
    try {
      await markNotificationAsRead(id);

      // Optimistically update local notifications
      setNotifications(prev =>
        prev.map(n => (n.id === id ? {...n, read: true} : n)),
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      setCustomAlertConfig({
        visible: true,
        type: 'error',
        title: 'Action Failed',
        message:
          err?.response?.data?.message || 'Could not mark notification as read.',
        buttonText: 'OK',
        onPress: () => setCustomAlertConfig(p => ({...p, visible: false})),
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    setMarkingAllRead(true);
    try {
      await markAllNotificationsAsRead();

      // Optimistically mark all read locally
      setNotifications(prev => prev.map(n => ({...n, read: true})));
      setUnreadCount(0);
    } catch (err: any) {
      setCustomAlertConfig({
        visible: true,
        type: 'error',
        title: 'Action Failed',
        message:
          err?.response?.data?.message ||
          'Could not mark all notifications as read.',
        buttonText: 'OK',
        onPress: () => setCustomAlertConfig(p => ({...p, visible: false})),
      });
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Delete notification with confirmation using CustomAlert
  const handleDelete = (id: number, title?: string) => {
    setCustomAlertConfig({
      visible: true,
      type: 'warning',
      title: 'Delete Notification',
      message: `Are you sure you want to delete "${title || 'this notification'}"?`,
      buttonText: 'Delete',
      secondaryButtonText: 'Cancel',
      onPress: () => {
        setCustomAlertConfig(p => ({...p, visible: false}));
        confirmDelete(id);
      },
      onSecondaryPress: () => {
        setCustomAlertConfig(p => ({...p, visible: false}));
      },
    });
  };

  const confirmDelete = async (id: number) => {
    setActionLoadingId(id);
    try {
      await deleteNotification(id);

      const deletedItem = notifications.find(n => n.id === id);
      if (deletedItem && !deletedItem.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Remove from local list
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (selectedAlertItem?.id === id) {
        setSelectedAlertItem(null);
        setProductDetails(null);
      }
    } catch (err: any) {
      setCustomAlertConfig({
        visible: true,
        type: 'error',
        title: 'Delete Failed',
        message:
          err?.response?.data?.message ||
          'Could not delete the notification.',
        buttonText: 'OK',
        onPress: () => setCustomAlertConfig(p => ({...p, visible: false})),
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      if (activeFilter === 'unread') {
        return !item.read;
      }
      if (activeFilter === 'inventory') {
        return isInventoryType(item.type, item.title);
      }
      if (activeFilter === 'orders') {
        return isOrderType(item.type, item.title);
      }
      if (activeFilter === 'system') {
        return isSystemType(item.type, item.title);
      }
      return true; // 'all'
    });
  }, [notifications, activeFilter]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      inventory: notifications.filter(n => isInventoryType(n.type, n.title))
        .length,
      orders: notifications.filter(n => isOrderType(n.type, n.title)).length,
      system: notifications.filter(n => isSystemType(n.type, n.title)).length,
    };
  }, [notifications]);

  // Styling helper for notification types
  const getStyleForNotification = (item: AppNotification) => {
    const type = (item.type || '').toUpperCase();
    const severity = (item.severity || '').toUpperCase();
    const title = (item.title || '').toLowerCase();

    if (type === 'OUT_OF_STOCK' || title.includes('out of stock')) {
      return {
        icon: PackageX,
        color: '#DC2626',
        bg: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEF2F2',
        border: '#DC2626',
        badgeBg: isDark ? 'rgba(220, 38, 38, 0.25)' : '#FEE2E2',
        badgeText: isDark ? '#FCA5A5' : '#991B1B',
        label: 'Out of Stock',
        isStockAlert: true,
      };
    }

    if (
      type === 'LOW_STOCK' ||
      severity === 'WARNING' ||
      title.includes('low stock')
    ) {
      return {
        icon: AlertTriangle,
        color: '#D97706',
        bg: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FFFBEB',
        border: '#D97706',
        badgeBg: isDark ? 'rgba(217, 119, 6, 0.25)' : '#FEF3C7',
        badgeText: isDark ? '#FCD34D' : '#92400E',
        label: 'Low Stock Alert',
        isStockAlert: true,
      };
    }

    if (title.includes('restocked') || title.includes('replenished')) {
      return {
        icon: CheckCircle2,
        color: '#16A34A',
        bg: isDark ? 'rgba(22, 163, 74, 0.15)' : '#F0FDF4',
        border: '#16A34A',
        badgeBg: isDark ? 'rgba(22, 163, 74, 0.25)' : '#DCFCE7',
        badgeText: isDark ? '#86EFAC' : '#166534',
        label: 'Restocked',
        isStockAlert: true,
      };
    }

    if (type.includes('INVENTORY')) {
      return {
        icon: Boxes,
        color: '#2563EB',
        bg: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
        border: '#2563EB',
        badgeBg: isDark ? 'rgba(37, 99, 235, 0.25)' : '#DBEAFE',
        badgeText: isDark ? '#93C5FD' : '#1E40AF',
        label: 'Inventory Update',
        isStockAlert: false,
      };
    }

    if (type.includes('ORDER')) {
      const isComplete =
        title.includes('approved') ||
        title.includes('completed') ||
        title.includes('delivered');
      return {
        icon: isComplete ? CheckCircle2 : ShoppingCart,
        color: isComplete ? '#16A34A' : '#0284C7',
        bg: isDark
          ? isComplete
            ? 'rgba(22, 163, 74, 0.15)'
            : 'rgba(2, 132, 199, 0.15)'
          : isComplete
          ? '#F0FDF4'
          : '#F0F9FF',
        border: isComplete ? '#16A34A' : '#0284C7',
        badgeBg: isDark
          ? isComplete
            ? 'rgba(22, 163, 74, 0.25)'
            : 'rgba(2, 132, 199, 0.25)'
          : isComplete
          ? '#DCFCE7'
          : '#E0F2FE',
        badgeText: isDark
          ? isComplete
            ? '#86EFAC'
            : '#7DD3FC'
          : isComplete
          ? '#166534'
          : '#075985',
        label: isComplete ? 'Order Complete' : 'Order Update',
        isStockAlert: false,
      };
    }

    if (severity === 'CRITICAL' || severity === 'ERROR') {
      return {
        icon: AlertCircle,
        color: '#DC2626',
        bg: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEF2F2',
        border: '#DC2626',
        badgeBg: isDark ? 'rgba(220, 38, 38, 0.25)' : '#FEE2E2',
        badgeText: isDark ? '#FCA5A5' : '#991B1B',
        label: 'System Error',
        isStockAlert: false,
      };
    }

    // Default System Notification
    return {
      icon: Bell,
      color: '#64748B',
      bg: isDark ? 'rgba(100, 116, 139, 0.15)' : '#F8FAFC',
      border: '#64748B',
      badgeBg: isDark ? 'rgba(100, 116, 139, 0.25)' : '#F1F5F9',
      badgeText: isDark ? '#CBD5E1' : '#334155',
      label: 'System Alert',
      isStockAlert: false,
    };
  };

  // Render active Restock Alert details card
  const renderAlertDetailsCard = () => {
    if (!selectedAlertItem) return null;

    const product = productDetails?.product;
    const productName =
      product?.name ||
      selectedAlertItem.productName ||
      selectedAlertItem.title ||
      'Product Alert';

    const currentQtyNum =
      productDetails?.inventory?.totalStock ??
      product?.totalStock ??
      (selectedAlertItem.currentQuantity !== undefined
        ? Number(selectedAlertItem.currentQuantity)
        : undefined);

    const reorderLevelNum =
      product?.reorderLevel ??
      (selectedAlertItem.reorderLevel !== undefined
        ? Number(selectedAlertItem.reorderLevel)
        : selectedAlertItem.threshold !== undefined
        ? Number(selectedAlertItem.threshold)
        : undefined);

    const safetyStockNum =
      product?.safetyStock ??
      (selectedAlertItem.safetyStock !== undefined
        ? Number(selectedAlertItem.safetyStock)
        : undefined);

    const isCritical = currentQtyNum !== undefined && currentQtyNum <= 0;
    const isWarning =
      currentQtyNum !== undefined &&
      reorderLevelNum !== undefined &&
      currentQtyNum <= reorderLevelNum;

    const statusBadgeColor = isCritical
      ? '#DC2626'
      : isWarning
      ? '#D97706'
      : '#16A34A';

    const statusBadgeBg = isDark
      ? isCritical
        ? 'rgba(220, 38, 38, 0.2)'
        : isWarning
        ? 'rgba(217, 119, 6, 0.2)'
        : 'rgba(22, 163, 74, 0.2)'
      : isCritical
      ? '#FEE2E2'
      : isWarning
      ? '#FEF3C7'
      : '#DCFCE7';

    const statusLabel = isCritical
      ? 'Out of Stock'
      : isWarning
      ? 'Low Stock Warning'
      : 'Stock Normal';

    return (
      <View style={styles.alertDetailCard}>
        {/* Detail Card Header */}
        <View style={styles.alertDetailHeader}>
          <View style={styles.alertDetailBadgeRow}>
            <View
              style={[
                styles.alertDetailStatusBadge,
                {backgroundColor: statusBadgeBg},
              ]}>
              {isCritical ? (
                <PackageX size={14} color={statusBadgeColor} />
              ) : (
                <AlertTriangle size={14} color={statusBadgeColor} />
              )}
              <Text
                style={[
                  styles.alertDetailStatusText,
                  {color: statusBadgeColor},
                ]}>
                {statusLabel}
              </Text>
            </View>

            <View style={styles.activeAlertPill}>
              <Text style={styles.activeAlertPillText}>Active Restock Alert</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.closeDetailBtn}
            onPress={() => {
              setSelectedAlertItem(null);
              setProductDetails(null);
              setAlertDetailsError('');
            }}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <X size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {alertDetailsLoading ? (
          <View style={styles.alertDetailLoadingBox}>
            <ActivityIndicator size="small" color="#1769E0" />
            <Text style={styles.alertDetailLoadingText}>
              Loading real-time product & warehouse stock levels...
            </Text>
          </View>
        ) : alertDetailsError ? (
          <View style={styles.alertDetailErrorBox}>
            <AlertCircle size={18} color="#EF4444" />
            <View style={styles.alertDetailErrorTextGroup}>
              <Text style={styles.alertDetailErrorTitle}>Alert Details Notice</Text>
              <Text style={styles.alertDetailErrorText}>
                {alertDetailsError}
              </Text>
            </View>
            {selectedAlertItem.productId ? (
              <TouchableOpacity
                style={styles.alertDetailRetryBtn}
                onPress={() => handleSelectAlert(selectedAlertItem)}>
                <Text style={styles.alertDetailRetryBtnText}>Retry</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <>
            {/* Product Title, SKU, and Category */}
            <View style={styles.alertProductInfo}>
              <Text style={styles.alertProductName}>{productName}</Text>
              <View style={styles.alertProductSubRow}>
                {product?.sku ? (
                  <View style={styles.alertProductMetaChip}>
                    <Text style={styles.alertProductMetaChipText}>
                      SKU: {product.sku}
                    </Text>
                  </View>
                ) : null}
                {product?.category?.name ? (
                  <View style={styles.alertProductMetaChip}>
                    <Text style={styles.alertProductMetaChipText}>
                      {product.category.name}
                    </Text>
                  </View>
                ) : null}
                {product?.barcode ? (
                  <View style={styles.alertProductMetaChip}>
                    <Text style={styles.alertProductMetaChipText}>
                      Barcode: {product.barcode}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Key Stock Metrics Grid */}
            <View style={styles.alertMetricsGrid}>
              {/* Current Quantity */}
              <View style={styles.alertMetricBox}>
                <Text style={styles.alertMetricLabel}>Current Stock</Text>
                <Text
                  style={[
                    styles.alertMetricValue,
                    {color: statusBadgeColor},
                  ]}>
                  {currentQtyNum !== undefined ? currentQtyNum : '0'}
                </Text>
                <Text style={styles.alertMetricSub}>Units in stock</Text>
              </View>

              {/* Minimum / Reorder Level */}
              <View style={styles.alertMetricBox}>
                <Text style={styles.alertMetricLabel}>Min Stock Level</Text>
                <Text style={styles.alertMetricValue}>
                  {reorderLevelNum !== undefined ? reorderLevelNum : '—'}
                </Text>
                <Text style={styles.alertMetricSub}>Reorder threshold</Text>
              </View>

              {/* Safety Stock */}
              <View style={styles.alertMetricBox}>
                <Text style={styles.alertMetricLabel}>Safety Stock</Text>
                <Text style={styles.alertMetricValue}>
                  {safetyStockNum !== undefined ? safetyStockNum : '—'}
                </Text>
                <Text style={styles.alertMetricSub}>Buffer level</Text>
              </View>

              {/* Price / Cost */}
              <View style={styles.alertMetricBox}>
                <Text style={styles.alertMetricLabel}>Unit Price</Text>
                <Text style={styles.alertMetricValue}>
                  {product?.price ? `$${Number(product.price).toFixed(2)}` : '—'}
                </Text>
                <Text style={styles.alertMetricSub}>Catalog price</Text>
              </View>
            </View>

            {/* Warehouse Locations Breakdown */}
            {productDetails?.inventory?.locations &&
            productDetails.inventory.locations.length > 0 ? (
              <View style={styles.alertLocationsSection}>
                <Text style={styles.alertLocationsTitle}>
                  Warehouse Breakdown ({productDetails.inventory.locations.length})
                </Text>
                {productDetails.inventory.locations.map(loc => (
                  <View key={loc.inventoryId} style={styles.alertLocationRow}>
                    <View style={styles.alertLocationLeft}>
                      <Warehouse size={14} color={theme.primary} />
                      <Text style={styles.alertLocationName} numberOfLines={1}>
                        {loc.warehouse?.name || 'Warehouse'}
                      </Text>
                      {loc.rack?.name ? (
                        <View style={styles.alertRackBadge}>
                          <Text style={styles.alertRackText}>
                            Rack {loc.rack.name}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.alertLocationQty,
                        {
                          color:
                            loc.quantity <= 0
                              ? '#DC2626'
                              : loc.quantity <= (reorderLevelNum ?? 5)
                              ? '#D97706'
                              : theme.textPrimary,
                        },
                      ]}>
                      {loc.quantity} units
                    </Text>
                  </View>
                ))}
              </View>
            ) : selectedAlertItem.warehouseName ? (
              <View style={styles.alertLocationsSection}>
                <Text style={styles.alertLocationsTitle}>Warehouse Location</Text>
                <View style={styles.alertLocationRow}>
                  <View style={styles.alertLocationLeft}>
                    <Warehouse size={14} color={theme.primary} />
                    <Text style={styles.alertLocationName} numberOfLines={1}>
                      {selectedAlertItem.warehouseName}
                    </Text>
                  </View>
                  <Text style={styles.alertLocationQty}>
                    {selectedAlertItem.currentQuantity ?? 0} units
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.alertActionsRow}>
              <TouchableOpacity
                style={styles.alertActionBtnSecondary}
                onPress={() => {
                  setSelectedAlertItem(null);
                  navigation.navigate('Inventory');
                }}
                activeOpacity={0.8}>
                <Boxes size={14} color={theme.primary} />
                <Text style={styles.alertActionBtnSecondaryText}>
                  View in Inventory
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.alertActionBtnPrimary}
                onPress={() => {
                  if (product) {
                    navigation.navigate('StockIn', {
                      productId: product.id,
                      product,
                    });
                  } else if (selectedAlertItem.productId) {
                    navigation.navigate('StockIn', {
                      productId: selectedAlertItem.productId,
                    });
                  } else {
                    navigation.navigate('StockIn');
                  }
                }}
                activeOpacity={0.8}>
                <CheckCircle2 size={14} color="#FFFFFF" />
                <Text style={styles.alertActionBtnPrimaryText}>
                  Restock Now
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  // Render individual notification item
  const renderItem = ({item}: {item: AppNotification}) => {
    const cardStyle = getStyleForNotification(item);
    const IconComponent = cardStyle.icon;
    const isActionLoading = actionLoadingId === item.id;
    const parsedStock = cardStyle.isStockAlert
      ? parseStockDetails(item.type, item.title, item.message)
      : null;

    const handleCardPress = () => {
      if (!item.read) {
        handleMarkAsReadSilently(item.id);
      }
      if (cardStyle.isStockAlert || isInventoryType(item.type, item.title)) {
        const parsed = parseStockDetails(item.type, item.title, item.message);
        const prodId = item.actionUrl?.match(/productId=(\d+)/)?.[1]
          ? Number(item.actionUrl.match(/productId=(\d+)/)![1])
          : undefined;
        handleSelectAlert({
          id: item.id,
          productId: prodId,
          productName: parsed.productName,
          warehouseName: parsed.warehouseName,
          title: item.title,
          message: item.message,
          severity: item.severity,
          type: item.type,
          currentQuantity: parsed.currentQuantity,
          threshold: parsed.threshold,
          actionUrl: item.actionUrl,
        });
      }
    };

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleCardPress}
        style={[
          styles.card,
          !item.read && {
            borderColor: cardStyle.border,
            borderLeftWidth: 4,
          },
        ]}>
        {/* Unread Accent Dot */}
        {!item.read && (
          <View
            style={[
              styles.unreadDot,
              {backgroundColor: cardStyle.color},
            ]}
          />
        )}

        <View style={styles.cardHeader}>
          {/* Icon */}
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: cardStyle.bg,
                borderColor: cardStyle.border,
              },
            ]}>
            <IconComponent size={22} color={cardStyle.color} />
          </View>

          {/* Right Header: Tag & Time */}
          <View style={styles.cardHeaderInfo}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.typeBadge,
                  {backgroundColor: cardStyle.badgeBg},
                ]}>
                <Text
                  style={[
                    styles.typeBadgeText,
                    {color: cardStyle.badgeText},
                  ]}>
                  {cardStyle.label}
                </Text>
              </View>

              {item.severity && (
                <View
                  style={[
                    styles.severityBadge,
                    item.severity === 'CRITICAL'
                      ? styles.severityCritical
                      : item.severity === 'WARNING'
                      ? styles.severityWarning
                      : styles.severityInfo,
                  ]}>
                  <Text style={styles.severityText}>{item.severity}</Text>
                </View>
              )}
            </View>

            <View style={styles.timeRow}>
              <Clock size={12} color={theme.textMuted} />
              <Text style={styles.timeText}>
                {formatTimeAgo(item.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMessage}>{item.message}</Text>

          {/* Parsed Restock / Inventory Metadata Chips */}
          {parsedStock &&
            (parsedStock.warehouseName ||
              parsedStock.currentQuantity !== undefined ||
              parsedStock.threshold !== undefined) && (
              <View style={styles.metadataContainer}>
                {parsedStock.warehouseName ? (
                  <View style={styles.metaChip}>
                    <Warehouse size={12} color={theme.textSecondary} />
                    <Text style={styles.metaChipText} numberOfLines={1}>
                      {parsedStock.warehouseName}
                    </Text>
                  </View>
                ) : null}

                {parsedStock.currentQuantity !== undefined ? (
                  <View
                    style={[
                      styles.metaChip,
                      parsedStock.currentQuantity === '0'
                        ? styles.metaChipDanger
                        : styles.metaChipWarning,
                    ]}>
                    <Text style={styles.metaChipTextBold}>
                      Qty: {parsedStock.currentQuantity}
                    </Text>
                  </View>
                ) : null}

                {parsedStock.threshold !== undefined ? (
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipText}>
                      Threshold: {parsedStock.threshold}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
        </View>

        {/* Actions Row */}
        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            {!item.read ? (
              <TouchableOpacity
                style={styles.markReadBtn}
                onPress={() => handleMarkAsRead(item.id)}
                disabled={isActionLoading}
                activeOpacity={0.7}>
                {isActionLoading ? (
                  <ActivityIndicator size="small" color="#1769E0" />
                ) : (
                  <>
                    <Check size={14} color="#1769E0" strokeWidth={2.5} />
                    <Text style={styles.markReadText}>Mark read</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.readStatusTag}>
                <CheckCheck size={13} color={theme.textMuted} />
                <Text style={styles.readStatusText}>Read</Text>
              </View>
            )}

            {cardStyle.isStockAlert && (
              <TouchableOpacity
                style={[styles.viewStockBtn, {borderColor: theme.border}]}
                onPress={handleCardPress}
                activeOpacity={0.7}>
                <Eye size={12} color={theme.primary} />
                <Text style={[styles.viewStockText, {color: theme.primary}]}>
                  Alert Details
                </Text>
              </TouchableOpacity>
            )}

            {cardStyle.isStockAlert && (
              <TouchableOpacity
                style={[styles.viewStockBtn, {borderColor: theme.border}]}
                onPress={() => {
                  if (!item.read) handleMarkAsReadSilently(item.id);
                  navigation.navigate('Inventory');
                }}
                activeOpacity={0.7}>
                <Boxes size={12} color={theme.primary} />
                <Text style={[styles.viewStockText, {color: theme.primary}]}>
                  View Stock
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id, item.title)}
            disabled={isActionLoading}
            activeOpacity={0.7}>
            <Trash2 size={14} color="#EF4444" />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Filter tab list
  const filterTabs: {key: FilterType; label: string; count: number}[] = [
    {key: 'all', label: 'All', count: counts.all},
    {key: 'unread', label: 'Unread', count: counts.unread},
    {key: 'inventory', label: 'Inventory', count: counts.inventory},
    {key: 'orders', label: 'Orders', count: counts.orders},
    {key: 'system', label: 'System', count: counts.system},
  ];

  return (
    <SafeAreaView
  style={styles.safeArea}
  edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                openDrawer();
              }
            }}
            activeOpacity={0.7}>
            {navigation.canGoBack() ? (
              <ChevronLeft size={22} color={theme.textPrimary} />
            ) : (
              <Menu size={22} color={theme.textPrimary} />
            )}
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.screenTitle}>Restock Alerts</Text>
            <Text style={styles.screenSubtitle}>
              {unreadCount > 0
                ? `${unreadCount} unread alert${unreadCount === 1 ? '' : 's'}`
                : 'All caught up!'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => loadData()}
            disabled={loading || refreshing}
            activeOpacity={0.7}>
            <RefreshCw
              size={18}
              color={theme.textPrimary}
              style={refreshing ? styles.rotating : undefined}
            />
          </TouchableOpacity>

          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllReadHeaderBtn}
              onPress={handleMarkAllRead}
              disabled={markingAllRead}
              activeOpacity={0.8}>
              {markingAllRead ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCheck size={14} color="#FFFFFF" />
                  <Text style={styles.markAllReadHeaderText}>Read all</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsContent}>
          {filterTabs.map(tab => {
            const isActive = activeFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.filterTab,
                  isActive && styles.filterTabActive,
                ]}
                onPress={() => setActiveFilter(tab.key)}
                activeOpacity={0.75}>
                <Text
                  style={[
                    styles.filterTabText,
                    isActive && styles.filterTabTextActive,
                  ]}>
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View
                    style={[
                      styles.filterBadge,
                      isActive && styles.filterBadgeActive,
                    ]}>
                    <Text
                      style={[
                        styles.filterBadgeText,
                        isActive && styles.filterBadgeTextActive,
                      ]}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Error Banner */}
      {error ? (
        <View style={styles.errorBanner}>
          <AlertCircle size={18} color="#EF4444" />
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => loadData()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Notification List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1769E0" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          ListHeaderComponent={renderAlertDetailsCard() || undefined}
          contentContainerStyle={[
            styles.listContent,
            {paddingBottom: Math.max(insets.bottom, 16) + 32},
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              colors={['#1769E0']}
              tintColor="#1769E0"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Inbox size={42} color={theme.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>
                {activeFilter === 'all'
                  ? 'No notifications yet'
                  : activeFilter === 'unread'
                  ? 'No unread notifications'
                  : `No ${activeFilter} notifications`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'all'
                  ? 'You will receive updates here whenever inventory thresholds, order statuses, or system events occur.'
                  : activeFilter === 'unread'
                  ? 'You are all caught up! There are no unread alerts at this time.'
                  : `There are currently no alerts matching the "${activeFilter}" filter.`}
              </Text>
            </View>
          }
        />
      )}

      {/* Custom Alert Modal - Replaces all native Alert.alert popups */}
      <CustomAlert
        visible={customAlertConfig.visible}
        type={customAlertConfig.type}
        title={customAlertConfig.title}
        message={customAlertConfig.message}
        buttonText={customAlertConfig.buttonText || 'OK'}
        secondaryButtonText={customAlertConfig.secondaryButtonText}
        onPress={
          customAlertConfig.onPress ||
          (() => setCustomAlertConfig(p => ({...p, visible: false})))
        }
        onSecondaryPress={customAlertConfig.onSecondaryPress}
      />
    </SafeAreaView>
  );
};

export default NotificationScreen;

const getStyles = (theme: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.cardBg,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleGroup: {
      flex: 1,
    },
    screenTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    screenSubtitle: {
      fontSize: 12.5,
      color: theme.textSecondary,
      marginTop: 1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    markAllReadHeaderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: '#1769E0',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
    },
    markAllReadHeaderText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    rotating: {
      transform: [{rotate: '45deg'}],
    },

    // Filter Tabs
    filtersWrapper: {
      backgroundColor: theme.cardBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    filterTabsContent: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
      alignItems: 'center',
    },
    filterTab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    filterTabActive: {
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.18)' : '#EAF2FD',
      borderColor: '#1769E0',
    },
    filterTabText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    filterTabTextActive: {
      color: '#1769E0',
      fontWeight: '700',
    },
    filterBadge: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 10,
    },
    filterBadgeActive: {
      backgroundColor: '#1769E0',
    },
    filterBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    filterBadgeTextActive: {
      color: '#FFFFFF',
    },

    // Error Banner
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      margin: 16,
      marginBottom: 8,
      padding: 12,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FEE2E2',
    },
    errorBannerText: {
      flex: 1,
      fontSize: 13,
      color: '#EF4444',
      fontWeight: '500',
    },
    retryBtn: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: '#EF4444',
      borderRadius: 8,
    },
    retryBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },

    // List & Cards
    listContent: {
      padding: 16,
      gap: 12,
    },
    card: {
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      position: 'relative',
      shadowColor: theme.shadowColor,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: isDark ? 0.2 : 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    unreadDot: {
      position: 'absolute',
      top: 14,
      right: 14,
      width: 9,
      height: 9,
      borderRadius: 5,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardHeaderInfo: {
      flex: 1,
      gap: 4,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    typeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    typeBadgeText: {
      fontSize: 10.5,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    severityBadge: {
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 5,
    },
    severityCritical: {
      backgroundColor: 'rgba(220, 38, 38, 0.15)',
    },
    severityWarning: {
      backgroundColor: 'rgba(217, 119, 6, 0.15)',
    },
    severityInfo: {
      backgroundColor: 'rgba(37, 99, 235, 0.15)',
    },
    severityText: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.4,
      color: theme.textSecondary,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    timeText: {
      fontSize: 11.5,
      color: theme.textMuted,
    },

    // Card Body
    cardBody: {
      marginTop: 10,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    cardMessage: {
      fontSize: 13.5,
      lineHeight: 19,
      color: theme.textSecondary,
    },

    // Metadata Chips
    metadataContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
    },
    metaChipWarning: {
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7',
    },
    metaChipDanger: {
      backgroundColor: isDark ? 'rgba(220, 38, 38, 0.2)' : '#FEE2E2',
    },
    metaChipText: {
      fontSize: 11.5,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    metaChipTextBold: {
      fontSize: 11.5,
      color: theme.textPrimary,
      fontWeight: '700',
    },

    // Card Footer Actions
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    footerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    markReadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EAF2FD',
    },
    markReadText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#1769E0',
    },
    readStatusTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    readStatusText: {
      fontSize: 12,
      color: theme.textMuted,
      fontWeight: '500',
    },
    viewStockBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 5,
      marginLeft: 8,
      borderRadius: 8,
      borderWidth: 1,
    },
    viewStockText: {
      fontSize: 11.5,
      fontWeight: '600',
    },
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
    },
    deleteText: {
      fontSize: 12,
      color: '#EF4444',
      fontWeight: '500',
    },

    // Empty & Loading States
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.textSecondary,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 24,
    },
    emptyIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.textSecondary,
      textAlign: 'center',
      maxWidth: 320,
    },

    // Restock Alert Details Card
    alertDetailCard: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: '#D97706',
      padding: 16,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 6,
      elevation: 4,
    },
    alertDetailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    alertDetailBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
      flex: 1,
    },
    alertDetailStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    alertDetailStatusText: {
      fontSize: 12,
      fontWeight: '700',
    },
    activeAlertPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
    },
    activeAlertPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    closeDetailBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
      marginLeft: 8,
    },
    alertDetailLoadingBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
      gap: 10,
    },
    alertDetailLoadingText: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    alertDetailErrorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#FCA5A5',
      marginVertical: 4,
    },
    alertDetailErrorTextGroup: {
      flex: 1,
    },
    alertDetailErrorTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#DC2626',
      marginBottom: 2,
    },
    alertDetailErrorText: {
      fontSize: 12,
      color: '#B91C1C',
      lineHeight: 16,
    },
    alertDetailRetryBtn: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: '#DC2626',
      borderRadius: 6,
    },
    alertDetailRetryBtnText: {
      color: '#FFFFFF',
      fontSize: 11.5,
      fontWeight: '700',
    },
    alertProductInfo: {
      marginBottom: 12,
    },
    alertProductName: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    alertProductSubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    alertProductMetaChip: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
    },
    alertProductMetaChipText: {
      fontSize: 11.5,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    alertMetricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 14,
    },
    alertMetricBox: {
      flex: 1,
      minWidth: '46%',
      padding: 10,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
      borderWidth: 1,
      borderColor: theme.border,
    },
    alertMetricLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textMuted,
      marginBottom: 2,
    },
    alertMetricValue: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: 2,
    },
    alertMetricSub: {
      fontSize: 10.5,
      color: theme.textSecondary,
    },
    alertLocationsSection: {
      marginBottom: 14,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    alertLocationsTitle: {
      fontSize: 12.5,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 8,
    },
    alertLocationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
    },
    alertLocationLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    alertLocationName: {
      fontSize: 12.5,
      fontWeight: '600',
      color: theme.textPrimary,
      flexShrink: 1,
    },
    alertRackBadge: {
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 4,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
    },
    alertRackText: {
      fontSize: 10.5,
      color: theme.textSecondary,
    },
    alertLocationQty: {
      fontSize: 12.5,
      fontWeight: '700',
      color: theme.textPrimary,
      marginLeft: 8,
    },
    alertActionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    alertActionBtnSecondary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
    },
    alertActionBtnSecondaryText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: theme.primary,
    },
    alertActionBtnPrimary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: theme.primary,
    },
    alertActionBtnPrimaryText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
