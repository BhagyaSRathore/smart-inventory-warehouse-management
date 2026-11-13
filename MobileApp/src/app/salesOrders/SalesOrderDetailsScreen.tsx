import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  Mail,
  Menu,
  Package,
  Phone,
  Truck,
  User,
  Warehouse as WarehouseIcon,
  XCircle,
} from 'lucide-react-native';

import API from '../../services/api';
import apis from '../../services/endpoint';
import CustomAlert from '../../components/CustomAlert';
import {useDrawer} from '../../context/DrawerContext';
import {useAppTheme, ThemeColors} from '../../context/ThemeContext';
import {SalesOrder} from './SalesOrderListScreen';

type Props = {
  navigation: any;
  route: {
    params: {
      salesOrderId: number;
    };
  };
};

const SalesOrderDetailsScreen = ({navigation, route}: Props) => {
  const {openDrawer} = useDrawer();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const salesOrderId = route?.params?.salesOrderId;

  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Custom Alert
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    buttonText?: string;
    onPress?: () => void;
    secondaryButtonText?: string;
    onSecondaryPress?: () => void;
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
    secondaryButtonText?: string,
    onSecondaryPress?: () => void,
  ) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      onPress,
      secondaryButtonText,
      onSecondaryPress,
    });
  };

  const loadOrderDetails = async () => {
    if (!salesOrderId) return;
    try {
      setLoading(true);
      const url = apis.salesOrderById
        ? apis.salesOrderById(salesOrderId)
        : `/sales-orders/${salesOrderId}`;
      const response = await API.get(url);
      const data = response?.data;
      const so = data?.salesOrder || data?.order || data;
      setOrder(so);
    } catch (error: any) {
      console.log('GET SO DETAILS ERROR:', error?.response?.data || error);
      showAlert(
        'error',
        'Unable to Load Order',
        error?.response?.data?.message ||
          'Failed to load sales order details. Please try again.',
        () => navigation.goBack(),
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOrderDetails();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [salesOrderId]),
  );

  // Status transitions
  const handleUpdateStatus = (
    targetStatus: 'CONFIRMED' | 'DELIVERED' | 'CANCELLED',
  ) => {
    let title = 'Update Order Status?';
    let msg = `Are you sure you want to change order status to ${targetStatus}?`;

    if (targetStatus === 'CONFIRMED') {
      title = 'Confirm Sales Order?';
      msg = 'Are you sure you want to confirm this sales order for processing?';
    } else if (targetStatus === 'DELIVERED') {
      title = 'Mark Order as Delivered?';
      msg = 'Confirm that the customer has received all items in this order.';
    } else if (targetStatus === 'CANCELLED') {
      title = 'Cancel Sales Order?';
      msg = 'Are you sure you want to cancel this sales order? This cannot be undone.';
    }

    showAlert(
      'warning',
      title,
      msg,
      async () => {
        try {
          setActionLoading(true);
          const url = apis.salesOrderStatus
            ? apis.salesOrderStatus(salesOrderId)
            : `/sales-orders/${salesOrderId}/status`;
          await API.patch(url, {status: targetStatus});
          showAlert(
            'success',
            'Status Updated',
            `Sales order has been marked as ${targetStatus}.`,
            () => loadOrderDetails(),
          );
        } catch (error: any) {
          showAlert(
            'error',
            'Action Failed',
            error?.response?.data?.message || 'Failed to update order status.',
          );
        } finally {
          setActionLoading(false);
        }
      },
      'Cancel',
      () => setAlertConfig(prev => ({...prev, visible: false})),
    );
  };

  // Ship order
  const handleShipOrder = () => {
    showAlert(
      'warning',
      'Ship Sales Order?',
      `Are you sure you want to ship ${order?.orderNumber}? This will deduct inventory items from ${
        order?.warehouse?.name || 'the warehouse'
      } and record outbound stock movements.`,
      async () => {
        try {
          setActionLoading(true);
          const url = apis.salesOrderShip
            ? apis.salesOrderShip(salesOrderId)
            : `/sales-orders/${salesOrderId}/ship`;
          await API.post(url);
          showAlert(
            'success',
            'Order Shipped Successfully',
            'Inventory has been deducted and the order is now marked as SHIPPED.',
            () => loadOrderDetails(),
          );
        } catch (error: any) {
          showAlert(
            'error',
            'Shipping Failed',
            error?.response?.data?.message || 'Failed to ship order. Check stock availability.',
          );
        } finally {
          setActionLoading(false);
        }
      },
      'Cancel',
      () => setAlertConfig(prev => ({...prev, visible: false})),
    );
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return {
          bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
          text: isDark ? '#FBBF24' : '#B45309',
          border: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
          icon: Clock,
        };
      case 'CONFIRMED':
        return {
          bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
          text: isDark ? '#60A5FA' : '#1D4ED8',
          border: isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE',
          icon: CheckCircle2,
        };
      case 'SHIPPED':
        return {
          bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#EDE9FE',
          text: isDark ? '#A78BFA' : '#6D28D9',
          border: isDark ? 'rgba(139, 92, 246, 0.3)' : '#DDD6FE',
          icon: Truck,
        };
      case 'DELIVERED':
        return {
          bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
          text: isDark ? '#34D399' : '#047857',
          border: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
          icon: Check,
        };
      case 'CANCELLED':
        return {
          bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
          text: isDark ? '#F87171' : '#B91C1C',
          border: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
          icon: XCircle,
        };
      default:
        return {
          bg: isDark ? theme.surfaceMuted : '#F1F5F9',
          text: theme.textSecondary,
          border: theme.border,
          icon: Clock,
        };
    }
  };

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.header}>
          <Pressable
            style={styles.headerBtn}
            onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={theme.textPrimary} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>Sales Order Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1769E0" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.header}>
          <Pressable
            style={styles.headerBtn}
            onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={theme.textPrimary} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>Order Not Found</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Sales Order Not Found</Text>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const badgeStyle = getStatusBadgeStyle(order.status);
  const StatusIcon = badgeStyle.icon;

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
          <Text style={styles.headerTitle}>{order.orderNumber}</Text>
          <Text style={styles.headerSubtitle}>Sales Order Details</Text>
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Status Alert Banner */}
        <View
          style={[
            styles.statusBanner,
            {backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border},
          ]}>
          <View style={styles.statusBannerLeft}>
            <StatusIcon size={20} color={badgeStyle.text} strokeWidth={2.4} />
            <Text style={[styles.statusBannerText, {color: badgeStyle.text}]}>
              Status: {order.status}
            </Text>
          </View>
          <View style={styles.dateBadge}>
            <Calendar size={13} color={theme.textMuted} strokeWidth={1.8} />
            <Text style={styles.dateBadgeText}>{formatDate(order.createdAt)}</Text>
          </View>
        </View>

        {/* Entities Card: Customer & Warehouse */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Order Information</Text>

          {/* Customer Info */}
          <View style={styles.infoBlock}>
            <View style={styles.infoIconBox}>
              <User size={18} color="#1769E0" strokeWidth={2} />
            </View>
            <View style={styles.infoDetails}>
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoValue}>
                {order.customer?.name || 'N/A'}
              </Text>
              {order.customer?.phone ? (
                <View style={styles.metaRow}>
                  <Phone size={12} color={theme.textMuted} strokeWidth={2} />
                  <Text style={styles.metaText}>{order.customer.phone}</Text>
                </View>
              ) : null}
              {order.customer?.email ? (
                <View style={styles.metaRow}>
                  <Mail size={12} color={theme.textMuted} strokeWidth={2} />
                  <Text style={styles.metaText}>{order.customer.email}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Warehouse Info */}
          <View style={styles.infoBlock}>
            <View style={styles.infoIconBox}>
              <WarehouseIcon size={18} color="#1769E0" strokeWidth={2} />
            </View>
            <View style={styles.infoDetails}>
              <Text style={styles.infoLabel}>Fulfillment Warehouse</Text>
              <Text style={styles.infoValue}>
                {order.warehouse?.name || 'N/A'}
              </Text>
              {order.warehouse?.location ? (
                <Text style={styles.metaText}>
                  Location: {order.warehouse.location}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Products Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardSectionTitle}>
              Products ({order.items?.length || 0})
            </Text>
            <Package size={18} color="#1769E0" strokeWidth={2} />
          </View>

          {order.items && order.items.length > 0 ? (
            order.items.map((item, idx) => (
              <View
                key={item.id || idx}
                style={[
                  styles.productItemRow,
                  idx === order.items!.length - 1 && styles.lastProductRow,
                ]}>
                <View style={styles.productLeft}>
                  <Text style={styles.productName}>
                    {item.product?.name || `Product #${item.productId}`}
                  </Text>
                  {item.product?.sku ? (
                    <Text style={styles.productSku}>SKU: {item.product.sku}</Text>
                  ) : null}
                  <Text style={styles.productQuantity}>
                    Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                  </Text>
                </View>

                <View style={styles.productRight}>
                  <Text style={styles.productTotal}>
                    {formatCurrency(item.total)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noItemsText}>No products found in this order.</Text>
          )}
        </View>

        {/* Financial Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Pricing Summary</Text>

          <View style={styles.summaryLine}>
            <Text style={styles.summaryLineLabel}>Subtotal</Text>
            <Text style={styles.summaryLineValue}>
              {formatCurrency(order.subtotal)}
            </Text>
          </View>

          <View style={styles.summaryLine}>
            <Text style={styles.summaryLineLabel}>Tax</Text>
            <Text style={styles.summaryLineValue}>
              {formatCurrency(order.tax)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryLine}>
            <Text style={styles.totalLineLabel}>Total</Text>
            <Text style={styles.totalLineValue}>
              {formatCurrency(order.total)}
            </Text>
          </View>

          {order.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesHeading}>Notes</Text>
              <Text style={styles.notesBody}>{order.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Action Buttons Section */}
        <View style={styles.actionSection}>
          {order.status === 'PENDING' && (
            <View style={styles.actionButtonGroup}>
              <Pressable
                style={[styles.primaryActionBtn, styles.confirmBtn]}
                disabled={actionLoading}
                onPress={() => handleUpdateStatus('CONFIRMED')}>
                <CheckCircle2 size={18} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.actionBtnText}>Confirm Order</Text>
              </Pressable>

              <Pressable
                style={[styles.secondaryActionBtn, styles.editBtn]}
                disabled={actionLoading}
                onPress={() =>
                  navigation.navigate('EditSalesOrder', {
                    salesOrderId: order.id,
                  })
                }>
                <Edit3 size={18} color="#1769E0" strokeWidth={2.2} />
                <Text style={styles.editBtnText}>Edit Order</Text>
              </Pressable>

              <Pressable
                style={[styles.secondaryActionBtn, styles.cancelOrderBtn]}
                disabled={actionLoading}
                onPress={() => handleUpdateStatus('CANCELLED')}>
                <XCircle size={18} color="#EF4444" strokeWidth={2.2} />
                <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
              </Pressable>
            </View>
          )}

          {order.status === 'CONFIRMED' && (
            <View style={styles.actionButtonGroup}>
              <Pressable
                style={[styles.primaryActionBtn, styles.shipBtn]}
                disabled={actionLoading}
                onPress={handleShipOrder}>
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Truck size={18} color="#FFFFFF" strokeWidth={2.4} />
                    <Text style={styles.actionBtnText}>Ship Order</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={[styles.secondaryActionBtn, styles.cancelOrderBtn]}
                disabled={actionLoading}
                onPress={() => handleUpdateStatus('CANCELLED')}>
                <XCircle size={18} color="#EF4444" strokeWidth={2.2} />
                <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
              </Pressable>
            </View>
          )}

          {order.status === 'SHIPPED' && (
            <View style={styles.actionButtonGroup}>
              <Pressable
                style={[styles.primaryActionBtn, styles.deliverBtn]}
                disabled={actionLoading}
                onPress={() => handleUpdateStatus('DELIVERED')}>
                <Check size={18} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.actionBtnText}>Mark Delivered</Text>
              </Pressable>
            </View>
          )}

          {order.status === 'DELIVERED' && (
            <View style={styles.completedBanner}>
              <CheckCircle2 size={22} color="#059669" strokeWidth={2.5} />
              <View>
                <Text style={styles.completedBannerTitle}>Order Delivered</Text>
                <Text style={styles.completedBannerSubtitle}>
                  Order has been delivered to customer {order.customer?.name || ''}.
                </Text>
              </View>
            </View>
          )}

          {order.status === 'CANCELLED' && (
            <View style={styles.cancelledBanner}>
              <XCircle size={22} color="#DC2626" strokeWidth={2.5} />
              <View>
                <Text style={styles.cancelledBannerTitle}>Order Cancelled</Text>
                <Text style={styles.cancelledBannerSubtitle}>
                  This sales order has been cancelled.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Unified CustomAlert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttonText={alertConfig.buttonText || 'OK'}
        onPress={() => {
          const cb = alertConfig.onPress;
          setAlertConfig(prev => ({...prev, visible: false}));
          if (cb) cb();
        }}
        secondaryButtonText={alertConfig.secondaryButtonText}
        onSecondaryPress={alertConfig.onSecondaryPress}
      />
    </SafeAreaView>
  );
};

export default SalesOrderDetailsScreen;

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
    headerSpacer: {
      width: 40,
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
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 30,
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    errorTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 10,
    },
    backButton: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      backgroundColor: '#1769E0',
      borderRadius: 10,
    },
    backButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    statusBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 14,
    },
    statusBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusBannerText: {
      fontSize: 14,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    dateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    dateBadgeText: {
      fontSize: 12,
      color: theme.textMuted,
      fontWeight: '500',
    },
    card: {
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 14,
      shadowColor: theme.shadowColor,
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    cardSectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 10,
    },
    infoBlock: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 6,
    },
    infoIconBox: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    infoDetails: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    infoValue: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
      marginTop: 2,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    metaText: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    divider: {
      height: 1,
      backgroundColor: theme.borderLight,
      marginVertical: 10,
    },
    productItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    lastProductRow: {
      borderBottomWidth: 0,
    },
    productLeft: {
      flex: 1,
    },
    productName: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    productSku: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    productQuantity: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 3,
    },
    productRight: {
      alignItems: 'flex-end',
    },
    productTotal: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    noItemsText: {
      fontSize: 13,
      color: theme.textMuted,
      fontStyle: 'italic',
      paddingVertical: 8,
    },
    summaryLine: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    summaryLineLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    summaryLineValue: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    totalLineLabel: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    totalLineValue: {
      fontSize: 18,
      fontWeight: '800',
      color: '#1769E0',
    },
    notesBox: {
      backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC',
      borderRadius: 10,
      padding: 12,
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    notesHeading: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textSecondary,
      marginBottom: 4,
    },
    notesBody: {
      fontSize: 13,
      color: theme.textPrimary,
      lineHeight: 18,
    },
    actionSection: {
      marginTop: 6,
    },
    actionButtonGroup: {
      gap: 10,
    },
    primaryActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      height: 50,
      gap: 8,
      shadowColor: '#0F172A',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    confirmBtn: {
      backgroundColor: '#1769E0',
    },
    shipBtn: {
      backgroundColor: '#6D28D9',
    },
    deliverBtn: {
      backgroundColor: '#059669',
    },
    actionBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    secondaryActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      height: 46,
      gap: 8,
      borderWidth: 1,
    },
    editBtn: {
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EFF6FF',
      borderColor: isDark ? 'rgba(23, 105, 224, 0.3)' : '#BFDBFE',
    },
    editBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#1769E0',
    },
    cancelOrderBtn: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
      borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
    },
    cancelOrderBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#EF4444',
    },
    completedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#A7F3D0',
      borderRadius: 14,
      padding: 14,
    },
    completedBannerTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#34D399' : '#065F46',
    },
    completedBannerSubtitle: {
      fontSize: 12,
      color: isDark ? '#A7F3D0' : '#047857',
      marginTop: 2,
    },
    cancelledBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#FECACA',
      borderRadius: 14,
      padding: 14,
    },
    cancelledBannerTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#F87171' : '#991B1B',
    },
    cancelledBannerSubtitle: {
      fontSize: 12,
      color: isDark ? '#FECACA' : '#B91C1C',
      marginTop: 2,
    },
  });
