import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  ChevronRight,
  Package,
  ShoppingCart,
  Truck,
  XCircle,
} from 'lucide-react-native';
import {Menu, Bell} from 'lucide-react-native';
import {useDrawer} from '../../context/DrawerContext';
import {useAppTheme, ThemeColors} from '../../context/ThemeContext';
import API from '../../services/api';
import apis from '../../services/endpoint';
import CustomAlert from '../../components/CustomAlert';

type OrderType = 'PURCHASE' | 'SALES';

const OrdersScreen = () => {
  const {openDrawer} = useDrawer();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const navigation = useNavigation<any>();

  const [type, setType] = useState<OrderType>('PURCHASE');
  const [status, setStatus] = useState('ALL');

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(
    null,
  );

  // =========================================================
  // ALERT
  // =========================================================

  const showAlert = (
    title: string,
    message: string,
    confirmAction?: () => void,
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setPendingAction(() => confirmAction || null);
    setAlertVisible(true);
  };

  // =========================================================
  // LOAD ORDERS
  // =========================================================

  const loadOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const endpoint =
        type === 'PURCHASE'
          ? apis.purchaseOrders
          : apis.salesOrders;

      const response = await API.get(endpoint);

      const data = response?.data;

      const list =
        type === 'PURCHASE'
          ? data?.purchaseOrders ||
            data?.orders ||
            data?.data ||
            data
          : data?.salesOrders ||
            data?.orders ||
            data?.data ||
            data;

      setOrders(Array.isArray(list) ? list : []);
    } catch (error: any) {
      showAlert(
        'Error',
        error?.response?.data?.message ||
          `Failed to load ${
            type === 'PURCHASE' ? 'purchase' : 'sales'
          } orders.`,
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload whenever screen gets focus
  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [type]),
  );

  // =========================================================
  // STATUS FILTERS
  // =========================================================

  const purchaseStatuses = [
    'ALL',
    'PENDING',
    'APPROVED',
    'RECEIVED',
    'CANCELLED',
  ];

  const salesStatuses = [
    'ALL',
    'PENDING',
    'CONFIRMED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
  ];

  const statuses =
    type === 'PURCHASE'
      ? purchaseStatuses
      : salesStatuses;

  const filteredOrders =
    status === 'ALL'
      ? orders
      : orders.filter(order => order.status === status);

  // =========================================================
  // UPDATE ORDER STATUS
  // =========================================================

  const updateStatus = async (
    order: any,
    nextStatus: string,
  ) => {
    try {
      setActionLoading(order.id);

      // -----------------------------------------------------
      // PURCHASE ORDER
      // -----------------------------------------------------

      if (type === 'PURCHASE') {
        // Receive has dedicated endpoint
        if (nextStatus === 'RECEIVED') {
          const url = apis.purchaseOrderReceive(order.id);

          await API.post(url);
        } else {
          // Approve / Cancel
          const url = apis.purchaseOrderStatus(order.id);

          await API.patch(url, {
            status: nextStatus,
          });
        }
      }

      // -----------------------------------------------------
      // SALES ORDER
      // -----------------------------------------------------

      else {
        // Ship has dedicated endpoint
        if (nextStatus === 'SHIPPED') {
          const url = apis.salesOrderShip(order.id);

          await API.post(url);
        } else {
          // Confirm / Cancel / Deliver
          const url = apis.salesOrderStatus(order.id);

          await API.patch(url, {
            status: nextStatus,
          });
        }
      }

      // Reload list after successful update
      await loadOrders(true);

      showAlert(
        'Success',
        `${
          type === 'PURCHASE'
            ? 'Purchase'
            : 'Sales'
        } order updated successfully.`,
      );
    } catch (error: any) {
      showAlert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Unable to update order status.',
      );
    } finally {
      setActionLoading(null);
    }
  };

  // =========================================================
  // CONFIRM ACTION
  // =========================================================

  const confirmAction = (
    order: any,
    nextStatus: string,
  ) => {
    let title = '';
    let message = '';

    switch (nextStatus) {
      case 'APPROVED':
        title = 'Approve Order';
        message =
          'Are you sure you want to approve this purchase order?';
        break;

      case 'CONFIRMED':
        title = 'Confirm Order';
        message =
          'Are you sure you want to confirm this sales order?';
        break;

      case 'RECEIVED':
        title = 'Receive Order';
        message =
          'Receiving this order will add the ordered stock to inventory. Continue?';
        break;

      case 'SHIPPED':
        title = 'Ship Order';
        message =
          'Shipping this order will deduct stock from inventory. Continue?';
        break;

      case 'DELIVERED':
        title = 'Mark Delivered';
        message =
          'Mark this sales order as delivered?';
        break;

      case 'CANCELLED':
        title = 'Cancel Order';
        message =
          'Are you sure you want to cancel this order?';
        break;

      default:
        title = 'Update Order';
        message =
          'Are you sure you want to update this order?';
    }

    showAlert(title, message, () => {
      updateStatus(order, nextStatus);
    });
  };

  // =========================================================
  // AVAILABLE ACTIONS
  // =========================================================

  const getActions = (order: any) => {
    // =======================================================
    // PURCHASE ORDER WORKFLOW
    // PENDING -> APPROVED -> RECEIVED
    // =======================================================

    if (type === 'PURCHASE') {
      if (order.status === 'PENDING') {
        return [
          {
            label: 'Approve',
            icon: CheckCircle2,
            status: 'APPROVED',
          },
          {
            label: 'Cancel',
            icon: XCircle,
            status: 'CANCELLED',
          },
        ];
      }

      if (order.status === 'APPROVED') {
        return [
          {
            label: 'Receive',
            icon: ArrowDownToLine,
            status: 'RECEIVED',
          },
          {
            label: 'Cancel',
            icon: XCircle,
            status: 'CANCELLED',
          },
        ];
      }
    }

    // =======================================================
    // SALES ORDER WORKFLOW
    // PENDING -> CONFIRMED -> SHIPPED -> DELIVERED
    // =======================================================

    if (type === 'SALES') {
      if (order.status === 'PENDING') {
        return [
          {
            label: 'Confirm',
            icon: CheckCircle2,
            status: 'CONFIRMED',
          },
          {
            label: 'Cancel',
            icon: XCircle,
            status: 'CANCELLED',
          },
        ];
      }

      if (order.status === 'CONFIRMED') {
        return [
          {
            label: 'Ship',
            icon: ArrowUpFromLine,
            status: 'SHIPPED',
          },
        ];
      }

      if (order.status === 'SHIPPED') {
        return [
          {
            label: 'Deliver',
            icon: Truck,
            status: 'DELIVERED',
          },
        ];
      }
    }

    return [];
  };

  // =========================================================
  // ORDER CARD
  // =========================================================

  const renderOrder = ({
    item,
  }: {
    item: any;
  }) => {
    const actions = getActions(item);
    const isBusy = actionLoading === item.id;

    const personName =
      type === 'PURCHASE'
        ? item.supplier?.name || 'Unknown Supplier'
        : item.customer?.name || 'Unknown Customer';

    return (
      <View style={styles.orderCard}>
        {/* MAIN ORDER INFO */}
        <Pressable
          style={styles.orderMain}
          onPress={() => {
            if (type === 'PURCHASE') {
              navigation.navigate(
                'PurchaseOrderDetails',
                {
                  purchaseOrderId: item.id,
                },
              );
            } else {
              navigation.navigate(
                'SalesOrderDetails',
                {
                  salesOrderId: item.id,
                },
              );
            }
          }}>
          {/* ICON */}
          <View style={styles.orderIcon}>
            {type === 'PURCHASE' ? (
              <ShoppingCart
                size={21}
                color="#1769E0"
              />
            ) : (
              <Package
                size={21}
                color="#1769E0"
              />
            )}
          </View>

          {/* INFO */}
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>
              {item.orderNumber ||
                `Order #${item.id}`}
            </Text>

            <Text style={styles.personName}>
              {personName}
            </Text>

            {item.warehouse?.name ? (
              <Text style={styles.warehouse}>
                Warehouse:{' '}
                {item.warehouse.name}
              </Text>
            ) : null}

            <Text style={styles.total}>
              Total: ₹
              {Number(
                item.total || 0,
              ).toLocaleString('en-IN')}
            </Text>
          </View>

          <ChevronRight
            size={20}
            color={theme.textMuted}
          />
        </Pressable>

        {/* STATUS */}
        <View style={styles.statusRow}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* ACTION BUTTONS */}
        {actions.length > 0 && (
          <View style={styles.actionRow}>
            {actions.map(action => {
              const Icon = action.icon;

              return (
                <Pressable
                  key={action.status}
                  style={styles.actionButton}
                  disabled={isBusy}
                  onPress={() =>
                    confirmAction(
                      item,
                      action.status,
                    )
                  }>
                  {isBusy ? (
                    <ActivityIndicator
                      size="small"
                      color="#1769E0"
                    />
                  ) : (
                    <>
                      <Icon
                        size={16}
                        color="#1769E0"
                      />

                      <Text
                        style={styles.actionText}>
                        {action.label}
                      </Text>
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // =========================================================
  // SCREEN
  // =========================================================

  return (
    <View style={styles.container}>
      {/* HEADER */}
     <View style={styles.header}>
  <Pressable
    style={({pressed}) => [
      styles.headerButton,
      pressed && styles.buttonPressed,
    ]}
    onPress={openDrawer}>
    <Menu size={22} color="#1769E0" strokeWidth={2} />
  </Pressable>

  <View style={styles.headerTitleContainer}>
  <Text style={styles.title}>Orders</Text>
</View>

  <Pressable
    style={({pressed}) => [
      styles.headerButton,
      pressed && styles.buttonPressed,
    ]}>
    <Bell size={20} color={theme.textPrimary} strokeWidth={2} />
    <View style={styles.notificationDot} />
  </Pressable>
</View>

      {/* PURCHASE / SALES TOGGLE */}
      <View style={styles.typeContainer}>
        <Pressable
          style={[
            styles.typeButton,
            type === 'PURCHASE' &&
              styles.typeButtonActive,
          ]}
          onPress={() => {
            setType('PURCHASE');
            setStatus('ALL');
          }}>
          <ShoppingCart
            size={18}
            color={
              type === 'PURCHASE'
                ? '#FFFFFF'
                : theme.textSecondary
            }
          />

          <Text
            style={[
              styles.typeText,
              type === 'PURCHASE' &&
                styles.typeTextActive,
            ]}>
            Purchase Orders
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.typeButton,
            type === 'SALES' &&
              styles.typeButtonActive,
          ]}
          onPress={() => {
            setType('SALES');
            setStatus('ALL');
          }}>
          <Package
            size={18}
            color={
              type === 'SALES'
                ? '#FFFFFF'
                : theme.textSecondary
            }
          />

          <Text
            style={[
              styles.typeText,
              type === 'SALES' &&
                styles.typeTextActive,
            ]}>
            Sales Orders
          </Text>
        </Pressable>
      </View>

      {/* STATUS FILTER */}
    <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  style={styles.statusFilterScroll}
  contentContainerStyle={styles.statusFilter}>
  {statuses.map(item => (
    <Pressable
      key={item}
      style={[
        styles.filterButton,
        status === item && styles.filterButtonActive,
      ]}
      onPress={() => setStatus(item)}>
      <Text
        style={[
          styles.filterText,
          status === item && styles.filterTextActive,
        ]}>
        {item === 'ALL' ? 'All' : item}
      </Text>
    </Pressable>
  ))}
</ScrollView>

      {/* ORDER LIST */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#1769E0"
          />

          <Text
            style={styles.loadingText}>
            Loading orders...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item =>
            String(item.id)
          }
          renderItem={renderOrder}
          contentContainerStyle={[
            styles.list,
            filteredOrders.length === 0 &&
              styles.emptyList,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() =>
                loadOrders(true)
              }
              tintColor="#1769E0"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Package
                size={45}
                color={theme.border}
              />

              <Text
                style={styles.emptyTitle}>
                No Orders Found
              </Text>

              <Text
                style={styles.emptyText}>
                There are no{' '}
                {status === 'ALL'
                  ? ''
                  : status.toLowerCase()}{' '}
                {type === 'PURCHASE'
                  ? 'purchase'
                  : 'sales'}{' '}
                orders.
              </Text>
            </View>
          }
        />
      )}

      {/* ALERT */}
      <CustomAlert
  visible={alertVisible}
  type="info"
  title={alertTitle}
  message={alertMessage}
  onPress={() => {
    setAlertVisible(false);
    const action = pendingAction;
    setPendingAction(null);
    if (action) {
      action();
    }
  }}
/>
    </View>
  );
};

// =========================================================
// STYLES
// =========================================================

const getStyles = (theme: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    header: {
      height: 54,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      backgroundColor: theme.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.headerBorder,
    },

    headerButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.headerButtonBg,
      alignItems: 'center',
      justifyContent: 'center',
    },

    headerTitleContainer: {
      flex: 1,
      marginLeft: 10,
    },

    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.textPrimary,
    },

    subtitle: {
      marginTop: 4,
      fontSize: 13,
      color: theme.textSecondary,
    },

    typeContainer: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: isDark ? theme.surfaceMuted : '#E8EEF7',
      borderRadius: 12,
      padding: 4,
    },

    typeButton: {
      flex: 1,
      minHeight: 44,
      borderRadius: 9,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },

    typeButtonActive: {
      backgroundColor: '#1769E0',
    },

    typeText: {
      marginLeft: 7,
      fontSize: 12,
      fontWeight: '700',
      color: theme.textSecondary,
    },

    typeTextActive: {
      color: '#FFFFFF',
    },

    list: {
      paddingHorizontal: 16,
      paddingBottom: 30,
    },

    emptyList: {
      flexGrow: 1,
    },

    orderCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 15,
      marginBottom: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadowColor,
    },

    orderMain: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    orderIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EAF2FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    orderInfo: {
      flex: 1,
      minWidth: 0,
    },

    orderNumber: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    personName: {
      marginTop: 3,
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
    },

    warehouse: {
      marginTop: 3,
      fontSize: 11,
      color: theme.textMuted,
    },

    total: {
      marginTop: 5,
      fontSize: 12,
      fontWeight: '700',
      color: '#1769E0',
    },

    statusRow: {
      marginTop: 12,
    },

    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 15,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EEF4FF',
    },

    statusText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#1769E0',
    },

    actionRow: {
      flexDirection: 'row',
      marginTop: 12,
    },

    actionButton: {
      flex: 1,
      minHeight: 40,
      marginRight: 8,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(23, 105, 224, 0.3)' : '#BBD2F7',
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.1)' : '#F6FAFF',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },

    actionText: {
      marginLeft: 6,
      fontSize: 12,
      fontWeight: '800',
      color: '#1769E0',
    },

    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    loadingText: {
      marginTop: 10,
      color: theme.textSecondary,
      fontSize: 13,
    },

    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
    },

    emptyTitle: {
      marginTop: 12,
      fontSize: 17,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    emptyText: {
      marginTop: 5,
      textAlign: 'center',
      color: theme.textMuted,
      fontSize: 13,
    },

    statusFilter: {
      paddingHorizontal: 16,
      paddingVertical: 4,
      gap: 7,
      alignItems: 'center',
    },

    filterButton: {
      height: 32,
      paddingHorizontal: 10,
      borderRadius: 16,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    filterButtonActive: {
      backgroundColor: '#1769E0',
      borderColor: '#1769E0',
    },

    filterText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textSecondary,
      includeFontPadding: false,
      textAlign: 'center',
    },

    filterTextActive: {
      color: '#FFFFFF',
    },

    statusFilterScroll: {
      flexGrow: 0,
      minHeight: 52,
    },

    buttonPressed: {
      opacity: 0.7,
    },

    notificationDot: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF4D67',
    },
  });

export default OrdersScreen;