import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import {
  Menu,
  Bell,
  ScanBarcode,
  Package,
  AlertTriangle,
  AlertCircle,
  Building2,
  TrendingUp,
  Plus,
  Minus,
  ArrowLeftRight,
  ChevronRight,
  CheckCircle,
} from 'lucide-react-native';
import {useDrawer} from '../context/DrawerContext';
import {useAppTheme, ThemeColors} from '../context/ThemeContext';

import {getDashboard, DashboardResponse} from '../services/dashboardService';
import {getUnreadNotificationCount} from '../services/notificationService';
import {syncFCMTokenWithBackend} from '../services/pushNotificationService';
import {getPendingNotificationNav, clearPendingNotificationNav} from '../navigation/navigationRef';
import {RootState} from '../store/store';
import {normalizeRole, isStaff} from '../utils/roles';

type Props = {
  navigation: any;
};

const DashboardScreen = ({navigation}: Props) => {
  const insets = useSafeAreaInsets();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = normalizeRole(user?.role);
  const isStaffUser = isStaff(userRole);
  const {openDrawer} = useDrawer();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setError('');
      const [data, unread] = await Promise.all([
        getDashboard(),
        getUnreadNotificationCount().catch(() => 0),
      ]);
      setDashboard(data);
      setUnreadCount(unread);
    } catch (err: any) {
      console.log('Dashboard API Error:', err?.response?.data || err?.message);
      setError(err?.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Sync FCM token with backend when user accesses dashboard
    syncFCMTokenWithBackend();

    // Check if there is a queued notification navigation from cold start
    const pending = getPendingNotificationNav();
    if (pending) {
      clearPendingNotificationNav();
      navigation.navigate(pending.route || 'Notifications', pending);
    }
  }, [navigation]);

  useEffect(() => {
    loadDashboard();
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboard();
    });
    return unsubscribe;
  }, [navigation, loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleNavigateProducts = () => {
  navigation.navigate('Products', {
    screen: 'ProductList',
  });
};

const handleNavigateLowStock = () => {
  navigation.navigate('Products', {
    screen: 'ProductList',
    params: {
      mode: 'low_stock',
    },
  });
};

const handleNavigateOutOfStock = () => {
  navigation.navigate('Products', {
    screen: 'ProductList',
    params: {
      mode: 'out_of_stock',
    },
  });
};

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1769E0" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <AlertCircle size={44} color="#D64545" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboard}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const summary = dashboard?.summary;
  const lowStockItems = Array.from(
  new Map(
    (dashboard?.lowStockProducts || []).map(item => [
      item.productId ?? item.product?.id,
      item,
    ]),
  ).values(),
);

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1769E0']}
          />
        }
        contentContainerStyle={[
          styles.container,
          {paddingBottom: Math.max(insets.bottom + 20, 32)},
        ]}>
        {/* ================= HEADER ================= */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={openDrawer}
            activeOpacity={0.75}>
            <Menu size={22} color="#1769E0" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.appName}>Smart Inventory</Text>
            <Text style={styles.tagline}>Track • Manage • Grow</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.75}>
            <Bell size={20} color={theme.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ================= GREETING ================= */}
        <View style={styles.greetingBox}>
          <Text style={styles.greeting}>
            Hello, {user?.name || 'Admin'} 👋
          </Text>
          <Text style={styles.greetingSubtext}>
            Let’s keep things moving!
          </Text>
        </View>

        {/* ================= SCAN BARCODE CARD ================= */}
        <TouchableOpacity
          style={styles.scanCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Scanner')}>
          <View style={styles.scanIconBox}>
            <ScanBarcode size={24} color="#FFFFFF" strokeWidth={2} />
          </View>

          <View style={styles.scanContent}>
            <Text style={styles.scanTitle}>Scan Barcode</Text>
            <Text style={styles.scanSubtitle}>Tap to scan product</Text>
          </View>

          <ChevronRight size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* ================= OVERVIEW (2x2 GRID) ================= */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Overview</Text>
        </View>

        <View style={styles.statsGrid}>
          {/* Total Products */}
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.8}
            onPress={handleNavigateProducts}>
            <View style={[styles.statIcon, {backgroundColor: '#EAF1FF'}]}>
              <Package size={20} color="#1769E0" />
            </View>
            <Text style={styles.statValue}>
              {summary?.totalProducts ?? 0}
            </Text>
            <Text style={styles.statLabel}>Total Products</Text>
          </TouchableOpacity>

          {/* Low Stock */}
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.8}
            onPress={handleNavigateLowStock}>
            <View style={[styles.statIcon, {backgroundColor: '#FFF3E5'}]}>
              <AlertTriangle size={20} color="#D97706" />
            </View>
            <Text style={[styles.statValue, {color: '#D97706'}]}>
              {summary?.lowStockCount ?? 0}
            </Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </TouchableOpacity>

          {/* Out of Stock */}
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.8}
            onPress={handleNavigateOutOfStock}>
            <View style={[styles.statIcon, {backgroundColor: '#FFECEE'}]}>
              <AlertCircle size={20} color="#D64545" />
            </View>
            <Text style={[styles.statValue, {color: '#D64545'}]}>
              {summary?.outOfStockCount ?? 0}
            </Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
          </TouchableOpacity>

          {/* Warehouses */}
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Warehouses')}>
            <View style={[styles.statIcon, {backgroundColor: '#E7F8F1'}]}>
              <Building2 size={20} color="#00A884" />
            </View>
            <Text style={[styles.statValue, {color: '#00A884'}]}>
              {summary?.totalWarehouses ?? 0}
            </Text>
            <Text style={styles.statLabel}>Warehouses</Text>
          </TouchableOpacity>
        </View>

        {/* ================= INVENTORY OVERVIEW (CHART) ================= */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Inventory Overview</Text>
          <TouchableOpacity>
            <Text style={styles.viewText}>Last 7 days</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartTop}>
            <View>
              <Text style={styles.chartTitle}>Stock Movement</Text>
              <Text style={styles.chartSubtitle}>Inventory activity</Text>
            </View>

            <View style={styles.growthBadge}>
              <TrendingUp size={12} color="#00A884" />
              <Text style={styles.growthText}>+8.4%</Text>
            </View>
          </View>

          {/* Bar Chart */}
          <View style={styles.chart}>
            <View style={styles.yAxis}>
              <Text style={styles.axisText}>100</Text>
              <Text style={styles.axisText}>75</Text>
              <Text style={styles.axisText}>50</Text>
              <Text style={styles.axisText}>25</Text>
              <Text style={styles.axisText}>0</Text>
            </View>

            <View style={styles.chartBars}>
              <View style={styles.barItem}>
                <View style={[styles.bar, {height: 55}]} />
                <Text style={styles.day}>Mon</Text>
              </View>

              <View style={styles.barItem}>
                <View style={[styles.bar, {height: 85}]} />
                <Text style={styles.day}>Tue</Text>
              </View>

              <View style={styles.barItem}>
                <View style={[styles.bar, {height: 60}]} />
                <Text style={styles.day}>Wed</Text>
              </View>

              <View style={styles.barItem}>
                <View style={[styles.bar, {height: 110, backgroundColor: '#1769E0'}]} />
                <Text style={[styles.day, {color: '#1769E0', fontWeight: '700'}]}>Thu</Text>
              </View>

              <View style={styles.barItem}>
                <View style={[styles.bar, {height: 75}]} />
                <Text style={styles.day}>Fri</Text>
              </View>

              <View style={styles.barItem}>
                <View style={[styles.bar, {height: 95}]} />
                <Text style={styles.day}>Sat</Text>
              </View>

              <View style={styles.barItem}>
                <View style={[styles.bar, {height: 80}]} />
                <Text style={styles.day}>Sun</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================= QUICK ACTIONS ================= */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleNavigateProducts}
            activeOpacity={0.75}>
            <View style={[styles.actionIcon, {backgroundColor: '#EAF1FF'}]}>
              <Plus size={18} color="#1769E0" strokeWidth={2.5} />
            </View>
            <Text style={styles.actionText}>Stock In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleNavigateProducts}
            activeOpacity={0.75}>
            <View style={[styles.actionIcon, {backgroundColor: '#FFF3E5'}]}>
              <Minus size={18} color="#D97706" strokeWidth={2.5} />
            </View>
            <Text style={styles.actionText}>Stock Out</Text>
          </TouchableOpacity>

          {!isStaffUser && (
            <>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('TransferStock')}
                activeOpacity={0.75}>
                <View style={[styles.actionIcon, {backgroundColor: '#E7F8F1'}]}>
                  <ArrowLeftRight size={18} color="#00A884" strokeWidth={2.2} />
                </View>
                <Text style={styles.actionText}>Transfer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('StockAdjustment')}
                activeOpacity={0.75}>
                <View style={[styles.actionIcon, {backgroundColor: '#F1EBFF'}]}>
                  <Package size={18} color="#7C3AED" strokeWidth={2} />
                </View>
                <Text style={styles.actionText}>Adjustment</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ================= LOW STOCK LIST ================= */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
          <TouchableOpacity onPress={handleNavigateLowStock}>
            <Text style={styles.viewText}>View All</Text>
          </TouchableOpacity>
        </View>

        {lowStockItems.length > 0 ? (
          lowStockItems.slice(0, 4).map((item, index) => {
            const productName = item.product?.name || `Product #${item.productId}`;
            const sku = item.product?.sku || 'SKU-001';
            const qty = item.quantity ?? 0;

            return (
              <TouchableOpacity
                key={item.id || index}
                style={styles.productCard}
                activeOpacity={0.75}
                onPress={handleNavigateLowStock}>
                <View style={styles.productImage}>
                  <Package size={22} color="#D97706" />
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{productName}</Text>
                  <Text style={styles.productSku}>{sku}</Text>
                  <Text style={styles.lowStockText}>{qty} units left</Text>
                </View>

                <ChevronRight size={20} color="#A0AEC0" />
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyStockNotice}>
            <CheckCircle size={24} color="#00A884" />
            <Text style={styles.emptyStockText}>All stock levels are currently healthy!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    container: {
      paddingHorizontal: 18,
      paddingTop: 0,
    },
    header: {
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    menuButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: theme.cardBg,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: theme.shadowColor,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.05,
      shadowRadius: 4,
      borderWidth: isDark ? 1 : 0,
      borderColor: theme.border,
    },
    headerCenter: {
      flex: 1,
      marginLeft: 14,
    },
    appName: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    tagline: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 1,
      fontWeight: '500',
    },
    notificationButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: theme.cardBg,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: theme.shadowColor,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.05,
      shadowRadius: 4,
      borderWidth: isDark ? 1 : 0,
      borderColor: theme.border,
    },
    badge: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#FF4D67',
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '800',
    },
    greetingBox: {
      marginTop: 10,
      marginBottom: 16,
    },
    greeting: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    greetingSubtext: {
      marginTop: 4,
      fontSize: 13,
      color: theme.textMuted,
      fontWeight: '500',
    },
    scanCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1769E0',
      borderRadius: 18,
      padding: 16,
      marginBottom: 20,
      elevation: 3,
      shadowColor: '#1769E0',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    scanIconBox: {
      width: 46,
      height: 46,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    scanContent: {
      flex: 1,
      marginLeft: 14,
    },
    scanTitle: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
    },
    scanSubtitle: {
      color: '#DCE8FF',
      fontSize: 12,
      marginTop: 2,
      fontWeight: '500',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    viewText: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    statCard: {
      width: '48%',
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      padding: 15,
      marginBottom: 12,
      elevation: 2,
      shadowColor: theme.shadowColor,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.04,
      shadowRadius: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
      fontWeight: '600',
    },
    chartCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 18,
      padding: 16,
      marginBottom: 20,
      elevation: 2,
      borderWidth: 1,
      borderColor: theme.border,
    },
    chartTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    chartTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    chartSubtitle: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },
    growthBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? theme.surfaceMuted : '#E7F8F1',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      gap: 4,
    },
    growthText: {
      color: '#00A884',
      fontSize: 11,
      fontWeight: '800',
    },
    chart: {
      height: 160,
      flexDirection: 'row',
      marginTop: 16,
    },
    yAxis: {
      width: 28,
      justifyContent: 'space-between',
      paddingBottom: 20,
    },
    axisText: {
      color: theme.textMuted,
      fontSize: 9,
    },
    chartBars: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-around',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    barItem: {
      height: '100%',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    bar: {
      width: 18,
      backgroundColor: isDark ? '#3B82F6' : '#4A90E2',
      borderRadius: 5,
      marginBottom: 6,
    },
    day: {
      fontSize: 10,
      color: theme.textMuted,
      fontWeight: '600',
    },
    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: 10,
      marginBottom: 16,
    },
    actionCard: {
      width: '48%',
      backgroundColor: theme.cardBg,
      borderRadius: 15,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      elevation: 2,
      borderWidth: 1,
      borderColor: theme.border,
    },
    actionIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    actionText: {
      fontSize: 13,
      color: theme.textPrimary,
      fontWeight: '700',
    },
    productCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      padding: 13,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      elevation: 2,
      borderWidth: 1,
      borderColor: theme.border,
    },
    productImage: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: isDark ? theme.surfaceMuted : '#FFF3E5',
      alignItems: 'center',
      justifyContent: 'center',
    },
    productInfo: {
      flex: 1,
      marginLeft: 12,
    },
    productName: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    productSku: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },
    lowStockText: {
      fontSize: 11,
      color: '#D97706',
      fontWeight: '700',
      marginTop: 4,
    },
    emptyStockNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      padding: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: isDark ? theme.border : '#E7F8F1',
      marginBottom: 10,
    },
    emptyStockText: {
      fontSize: 13,
      color: isDark ? theme.textSecondary : '#00A884',
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: theme.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.textMuted,
    },
    errorText: {
      color: theme.errorText,
      fontSize: 14,
      marginTop: 10,
      marginBottom: 15,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    retryButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 10,
    },
    retryText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });

export default DashboardScreen;