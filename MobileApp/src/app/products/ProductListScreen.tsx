import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Menu,
  Bell,
  Search,
  X,
  Plus,
  Package,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react-native';

import { getProducts, Product } from '../../services/productService';
import { useDrawer } from '../../context/DrawerContext';
import { useAppTheme, ThemeColors } from '../../context/ThemeContext';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { normalizeRole, isStaff } from '../../utils/roles';

type FilterType = 'all' | 'lowStock' | 'outOfStock';

type Props = {
  navigation: any;
  route: {
    params?: {
      mode?: 'all' | 'low_stock' | 'out_of_stock';
    };
  };
};

const ProductListScreen = ({ navigation, route }: Props) => {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = normalizeRole(user?.role);
  const isStaffUser = isStaff(userRole);
  const mode = route?.params?.mode ?? 'all';
  const isDedicatedStockView = mode === 'low_stock' || mode === 'out_of_stock';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const fetchProducts = useCallback(async () => {
    try {
      setError('');
      const data = await getProducts();
      setProducts(data);
    } catch (err: any) {
      console.log(
        'Error fetching products:',
        err?.response?.data || err?.message,
      );
      setError(err?.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    // Refresh when screen focuses
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProducts();
    });
    return unsubscribe;
  }, [navigation, fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const {openDrawer} = useDrawer();

  const handleOpenDrawer = () => {
    openDrawer();
  };

  // Filter and Search logic
  const filteredProducts = useMemo(() => {
    let result = products;

    // Dedicated Dashboard views
    if (mode === 'low_stock') {
      result = result.filter(
        p =>
          (p.totalStock ?? 0) > 0 &&
          (p.totalStock ?? 0) <= (p.reorderLevel ?? 10),
      );
    } else if (mode === 'out_of_stock') {
      result = result.filter(p => (p.totalStock ?? 0) === 0);
    }

    // Normal Products screen filters
    else if (activeFilter === 'lowStock') {
      result = result.filter(
        p =>
          (p.totalStock ?? 0) > 0 &&
          (p.totalStock ?? 0) <= (p.reorderLevel ?? 10),
      );
    } else if (activeFilter === 'outOfStock') {
      result = result.filter(p => (p.totalStock ?? 0) === 0);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();

      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category?.name?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [products, activeFilter, searchQuery, mode]);

  const renderStockBadge = (stock: number, reorderLevel: number) => {
    if (stock === 0) {
      return (
        <View style={[styles.badge, styles.badgeOutOfStock]}>
          <Text style={[styles.badgeText, styles.badgeTextOutOfStock]}>
            0 units
          </Text>
        </View>
      );
    }

    if (stock <= reorderLevel) {
      return (
        <View style={[styles.badge, styles.badgeLowStock]}>
          <Text style={[styles.badgeText, styles.badgeTextLowStock]}>
            {stock} units
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.badge, styles.badgeInStock]}>
        <Text style={[styles.badgeText, styles.badgeTextInStock]}>
          {stock} units
        </Text>
      </View>
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const stock = item.totalStock ?? 0;
    const reorder = item.reorderLevel ?? 10;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('ProductDetails', {
            productId: item.id,
            product: item,
          })
        }
      >
        {/* Left Thumbnail */}
        <View style={styles.thumbnailBox}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <Package size={26} color="#1769E0" strokeWidth={1.8} />
          )}
        </View>

        {/* Center Details */}
        <View style={styles.cardDetails}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.skuRow}>
            <Text style={styles.skuText}>{item.sku}</Text>
            {item.category?.name && (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.categoryText}>{item.category.name}</Text>
              </>
            )}
          </View>
          <Text style={styles.priceText}>
            ₹{Number(item.price).toLocaleString()}
          </Text>
        </View>

        {/* Right Stock Badge */}
        <View style={styles.cardRight}>
          {renderStockBadge(stock, reorder)}
          <ChevronRight size={18} color="#9FB3C8" style={styles.chevron} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
   <SafeAreaView style={styles.safeArea} edges={[]}>
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleOpenDrawer}
          activeOpacity={0.7}
        >
          <Menu size={22} color="#1769E0" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {mode === 'low_stock'
            ? 'Low Stock Products'
            : mode === 'out_of_stock'
            ? 'Out of Stock Products'
            : 'Products'}
        </Text>

        <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
          <Bell size={20} color={theme.textPrimary} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      {/* ================= SEARCH BAR ================= */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={18} color={theme.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={theme.placeholderText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ================= FILTER TABS ================= */}
      {!isDedicatedStockView && (
        <View style={styles.filterRow}>
          {/* All */}
          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === 'all' && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter('all')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'all' && styles.filterTabTextActive,
              ]}
            >
              All ({products.length})
            </Text>
          </TouchableOpacity>

          {/* Low Stock */}
          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === 'lowStock' && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter('lowStock')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'lowStock' && styles.filterTabTextActive,
              ]}
            >
              Low Stock
            </Text>
          </TouchableOpacity>

          {/* Out of Stock */}
          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === 'outOfStock' && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter('outOfStock')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'outOfStock' && styles.filterTabTextActive,
              ]}
            >
              Out of Stock
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ================= BODY LIST ================= */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1769E0" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AlertTriangle size={40} color="#D64545" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id.toString()}
          renderItem={renderProductItem}
          contentContainerStyle={[
            styles.listContent,
            {paddingBottom: 90},
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1769E0']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={50} color="#CBD2D9" strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try searching with another keyword'
                  : 'Add your first product to get started'}
              </Text>
            </View>
          }
        />
      )}

      {/* ================= FLOATING/DOCKED BOTTOM BUTTON ================= */}
      {!isStaffUser && (
        <View style={[styles.bottomBar, {paddingBottom: 14}]}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddProduct')}
            activeOpacity={0.85}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.addButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>
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
    searchContainer: {
      paddingHorizontal: 16,
      paddingTop: 10,
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
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
    },
    filterTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterTabActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterTabText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    filterTabTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 0,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 2 },
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
      overflow: 'hidden',
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
    },
    cardDetails: {
      flex: 1,
      marginLeft: 14,
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
    dotSeparator: {
      fontSize: 12,
      color: isDark ? theme.border : '#CBD2D9',
      marginHorizontal: 5,
    },
    categoryText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    priceText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.primary,
    },
    cardRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '700',
    },
    badgeInStock: {
      backgroundColor: isDark ? theme.surfaceMuted : '#E7F8F1',
    },
    badgeTextInStock: {
      fontSize: 12,
      fontWeight: '700',
      color: '#00A884',
    },
    badgeLowStock: {
      backgroundColor: isDark ? theme.surfaceMuted : '#FFF3E5',
    },
    badgeTextLowStock: {
      fontSize: 12,
      fontWeight: '700',
      color: '#D97706',
    },
    badgeOutOfStock: {
      backgroundColor: isDark ? theme.surfaceMuted : '#FFECEE',
    },
    badgeTextOutOfStock: {
      fontSize: 12,
      fontWeight: '700',
      color: '#D64545',
    },
    chevron: {
      marginLeft: 2,
    },
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
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(248, 251, 255, 0.95)',
      paddingHorizontal: 16,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      height: 52,
      borderRadius: 14,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
      gap: 8,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
  });

export default ProductListScreen;
