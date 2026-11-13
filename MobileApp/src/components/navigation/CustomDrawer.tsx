import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';

import {
  LayoutDashboard,
  Package,
  Boxes,
  Building2,
  Users,
  ShoppingCart,
  Receipt,
  ArrowLeftRight,
  Sparkles,
  TrendingUp,
  BellRing,
  User,
  Settings,
  LogOut,
  ChevronRight,
  X,
} from 'lucide-react-native';

import {logout} from '../../store/slices/authSlice';
import {navigationRef} from '../../navigation/navigationRef';
import {unregisterDeviceToken} from '../../services/notificationService';
import {RootState} from '../../store/store';
import {normalizeRole, isStaff} from '../../utils/roles';
import CustomAlert from '../CustomAlert';
import {useAppTheme} from '../../context/ThemeContext';

type SidebarProps = {
  visible: boolean;
  onClose: () => void;
  navigation?: any;
};

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{
    size: number;
    color: string;
    strokeWidth?: number;
  }>;
  route: string;
  params?: {
    title: string;
    description: string;
  };
  hasChevron?: boolean;
};

const MAIN_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    route: 'DashboardHome',
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    route: 'Products',
    hasChevron: true,
  },
  {
  id: 'inventory',
  label: 'Inventory Management',
  icon: Boxes,
  route: 'Inventory',
  hasChevron: true,
},
  {
    id: 'warehouses',
    label: 'Warehouses',
    icon: Building2,
    route: 'Warehouses',
    hasChevron: true,
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    icon: Users,
    route: 'Suppliers',
    hasChevron: true,
  },
];

const OPERATIONS_ITEMS: NavItem[] = [
  {
    id: 'purchases',
    label: 'Purchase Orders',
    icon: ShoppingCart,
    route: 'PurchaseOrders',
    hasChevron: true,
  },
  {
    id: 'sales',
    label: 'Sales Orders',
    icon: Receipt,
    route: 'SalesOrders',
    hasChevron: true,
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: ShoppingCart,
    route: 'Orders',
    hasChevron: true,
  },
  {
    id: 'stock-movements',
    label: 'Stock Movements',
    icon: ArrowLeftRight,
    route: 'StockMovements',
    hasChevron: true,
  },
];

const ANALYTICS_ITEMS: NavItem[] = [
  {
    id: 'ai-assistant',
    label: 'AI Assistant',
    icon: Sparkles,
    route: 'AIAssistantPlaceholder',
  },
  {
    id: 'demand-prediction',
    label: 'Demand Prediction',
    icon: TrendingUp,
    route: 'DemandPredictionPlaceholder',
  },
  {
    id: 'restock-alerts',
    label: 'Restock Alerts',
    icon: BellRing,
    route: 'Notifications',
  },
];

const ACCOUNT_ITEMS: NavItem[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    route: 'Profile',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    route: 'Settings',
  },
];

const CustomDrawer: React.FC<SidebarProps> = ({
  visible,
  onClose,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const {theme, isDark} = useAppTheme();
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = normalizeRole(user?.role);
  const isStaffUser = isStaff(userRole);

  const filteredMainItems = MAIN_ITEMS.filter(item => {
    if (isStaffUser && (item.id === 'warehouses' || item.id === 'suppliers')) {
      return false;
    }
    return true;
  });

  const filteredOperationsItems = isStaffUser ? [] : OPERATIONS_ITEMS;
  const filteredAnalyticsItems = isStaffUser ? [] : ANALYTICS_ITEMS;

  const [logoutAlertVisible, setLogoutAlertVisible] = useState(false);

  const handleNavigate = (item: NavItem) => {
    onClose();

    if (navigationRef.isReady()) {
      try {
        if (item.params) {
          (navigationRef as any).navigate('Dashboard', {
            screen: item.route,
            params: item.params,
          });
        } else {
          (navigationRef as any).navigate('Dashboard', {
            screen: item.route,
          });
        }
      } catch {
        if (item.params) {
          (navigationRef as any).navigate(item.route, item.params);
        } else {
          (navigationRef as any).navigate(item.route);
        }
      }
    } else if (navigation) {
      if (item.params) {
        navigation.navigate(item.route, item.params);
      } else {
        navigation.navigate(item.route);
      }
    }
  };

  const handleLogout = () => {
    setLogoutAlertVisible(true);
  };

  const confirmLogout = () => {
    setLogoutAlertVisible(false);
    onClose();
    unregisterDeviceToken().catch(err => {
      console.warn('Failed to unregister device token on logout:', err);
    });
    dispatch(logout());

    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{name: 'Login'}],
      });
    } else {
      navigation?.getParent()?.reset({
        index: 0,
        routes: [{name: 'Login'}],
      });
    }
  };

  const renderSection = (title: string, items: NavItem[]) => (
    <View>
      <Text style={[styles.sectionHeader, {color: theme.textMuted}]}>{title}</Text>

      {items.map(item => {
        const IconComponent = item.icon;

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => handleNavigate(item)}
            activeOpacity={0.75}>
            <View style={styles.menuItemLeft}>
              <IconComponent
                size={20}
                color={isDark ? theme.textSecondary : '#486581'}
                strokeWidth={1.8}
              />

              <Text style={[styles.menuItemText, {color: theme.textPrimary}]}>{item.label}</Text>
            </View>

            {item.hasChevron && (
              <ChevronRight
                size={16}
                color={isDark ? theme.border : '#9FB3C8'}
                strokeWidth={2}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <>
      <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
  
  <View style={styles.modalContainer}>

    {/* SIDEBAR */}
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: theme.cardBg,
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}>

          {/* Header */}
          <View style={[styles.header, {borderBottomColor: theme.border}]}>
            <View style={[styles.logoBox, isDark && {backgroundColor: theme.inputBg}]}>
              <Image
                source={require('../../assets/images/inventory-cart-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.headerText}>
              <Text style={[styles.brandTitle, {color: theme.textPrimary}]}>Smart Inventory</Text>
              <Text style={[styles.brandSubtitle, {color: theme.textSecondary}]}>
                {user?.name ? `${user.name} • ${userRole}` : 'Track • Manage • Grow'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}>
              <X size={22} color={isDark ? theme.textSecondary : '#486581'} />
            </TouchableOpacity>
          </View>

          {/* Menu */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {filteredMainItems.length > 0 && renderSection('MAIN', filteredMainItems)}
            {filteredOperationsItems.length > 0 &&
              renderSection('OPERATIONS', filteredOperationsItems)}
            {filteredAnalyticsItems.length > 0 &&
              renderSection('ANALYTICS', filteredAnalyticsItems)}
            {renderSection('ACCOUNT', ACCOUNT_ITEMS)}
          </ScrollView>

          {/* Logout */}
          <View style={[styles.footer, {borderTopColor: theme.border}]}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.75}>
              <LogOut
                size={20}
                color="#D64545"
                strokeWidth={2}
              />

              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
               </View>

        <Pressable
          style={styles.overlay}
          onPress={onClose}
        />

      </View>
    </Modal>

    <CustomAlert
      visible={logoutAlertVisible}
      type="warning"
      title="Sign Out"
      message="Are you sure you want to log out?"
      buttonText="Log Out"
      secondaryButtonText="Cancel"
      onPress={confirmLogout}
      onSecondaryPress={() => setLogoutAlertVisible(false)}
    />
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },

  overlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.25)',
},

  sidebar: {
  width: '78%',
  height: '100%',
  alignSelf: 'flex-start',
  backgroundColor: '#FFFFFF',
  elevation: 12,
  shadowColor: '#000000',
  shadowOffset: {
    width: 4,
    height: 0,
  },
  shadowOpacity: 0.15,
  shadowRadius: 8,
},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },

  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  logoImage: {
    width: 32,
    height: 32,
  },

  headerText: {
    flex: 1,
  },

  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#102A43',
    letterSpacing: 0.2,
  },

  brandSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#627D98',
    marginTop: 2,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },

  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9FB3C8',
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 6,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 3,
  },

  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334E68',
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FFF5F5',
    gap: 12,
  },

  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D64545',
  },
});

export default CustomDrawer;