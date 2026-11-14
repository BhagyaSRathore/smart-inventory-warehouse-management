import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Bell,
  MapPin,
  Menu,
  Package,
  Plus,
  Search,
  Warehouse as WarehouseIcon,
  X,
} from 'lucide-react-native';

import API from '../../services/api';
import {useDrawer} from '../../context/DrawerContext';
import {useAppTheme, ThemeColors} from '../../context/ThemeContext';

type Warehouse = {
  id: number;
  name: string;
  location?: string | null;
};

type Props = {
  navigation: any;
};

const WarehouseListScreen = ({navigation}: Props) => {
  const {openDrawer} = useDrawer();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleOpenDrawer = () => {
    openDrawer();
  };

  const fetchWarehouses = async () => {
    try {
      setLoading(true);

      const response = await API.get('/warehouses');

      const data = response?.data;

      if (Array.isArray(data)) {
        setWarehouses(data);
      } else if (Array.isArray(data?.warehouses)) {
        setWarehouses(data.warehouses);
      } else if (Array.isArray(data?.data)) {
        setWarehouses(data.data);
      } else {
        setWarehouses([]);
      }
    } catch (error) {
      console.log('WAREHOUSE LOAD ERROR:', error);
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);

      const response = await API.get('/warehouses');

      const data = response?.data;

      if (Array.isArray(data?.warehouses)) {
        setWarehouses(data.warehouses);
      } else if (Array.isArray(data)) {
        setWarehouses(data);
      } else {
        setWarehouses([]);
      }
    } catch (error) {
      console.log('WAREHOUSE REFRESH ERROR:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const filteredWarehouses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return warehouses;
    }

    return warehouses.filter(warehouse => {
      return (
        warehouse.name?.toLowerCase().includes(query) ||
        warehouse.location?.toLowerCase().includes(query)
      );
    });
  }, [warehouses, searchQuery]);

  const renderWarehouseItem = ({item}: {item: Warehouse}) => {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.card}
        onPress={() =>
          navigation.navigate('WarehouseDetails', {
            warehouseId: item.id,
          })
        }>
        <View style={styles.iconBox}>
          <WarehouseIcon size={25} color="#1769E0" strokeWidth={2} />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.warehouseName} numberOfLines={1}>
            {item.name}
          </Text>

          <View style={styles.locationRow}>
            <MapPin size={14} color="#829AB1" />

            <Text style={styles.locationText} numberOfLines={1}>
              {item.location || 'Location not specified'}
            </Text>
          </View>

          <View style={styles.stockRow}>
            <Package size={14} color="#64748B" />

            <Text style={styles.stockText}>
              Warehouse #{item.id}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleOpenDrawer}
          activeOpacity={0.7}>
          <Menu size={22} color="#1769E0" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Warehouses</Text>

        <View style={styles.headerRight}>
  <TouchableOpacity
    style={styles.addHeaderButton}
    activeOpacity={0.7}
    onPress={() => navigation.navigate('AddWarehouse')}>
    <Plus
      size={21}
      color="#FFFFFF"
      strokeWidth={2.5}
    />
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.headerButton}
    activeOpacity={0.7}>
    <Bell size={20} color={theme.textPrimary} />

    <View style={styles.notificationDot} />
  </TouchableOpacity>
</View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={19} color={theme.placeholderText} />

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search warehouses..."
            placeholderTextColor={theme.placeholderText}
            style={styles.searchInput}
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              activeOpacity={0.7}>
              <X size={18} color={theme.placeholderText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1769E0" />

          <Text style={styles.loadingText}>
            Loading warehouses...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredWarehouses}
          keyExtractor={item => item.id.toString()}
          renderItem={renderWarehouseItem}
          contentContainerStyle={styles.listContent}
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
              <WarehouseIcon
                size={52}
                color="#CBD5E1"
                strokeWidth={1.5}
              />

              <Text style={styles.emptyTitle}>
                No warehouses found
              </Text>

              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try searching with another keyword'
                  : 'Add your first warehouse to get started'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default WarehouseListScreen;

const getStyles = (theme: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    header: {
      height: 60,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.headerBorder,
    },

    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      backgroundColor: theme.headerButtonBg,
    },

    headerTitle: {
      flex: 1,
      marginLeft: 8,
      fontSize: 20,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    notificationDot: {
      position: 'absolute',
      top: 9,
      right: 9,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#D64545',
    },

    searchContainer: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
    },

    searchBox: {
      height: 46,
      borderRadius: 14,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
    },

    searchInput: {
      flex: 1,
      marginLeft: 10,
      fontSize: 14,
      color: theme.textPrimary,
      paddingVertical: 0,
    },

    listContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 20,
    },

    card: {
      flexDirection: 'row',
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 6,
      elevation: 2,
    },

    iconBox: {
      width: 52,
      height: 52,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.2)' : '#EAF2FD',
      alignItems: 'center',
      justifyContent: 'center',
    },

    cardContent: {
      flex: 1,
      marginLeft: 12,
      minWidth: 0,
    },

    warehouseName: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 7,
      minWidth: 0,
    },

    locationText: {
      flex: 1,
      marginLeft: 5,
      fontSize: 13,
      color: theme.textSecondary,
    },

    stockRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 7,
    },

    stockText: {
      marginLeft: 5,
      fontSize: 12,
      color: theme.textSecondary,
    },

    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    loadingText: {
      marginTop: 10,
      fontSize: 14,
      color: theme.textSecondary,
    },

    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 90,
      paddingHorizontal: 30,
    },

    emptyTitle: {
      marginTop: 16,
      fontSize: 17,
      fontWeight: '800',
      color: theme.textPrimary,
      textAlign: 'center',
    },

    emptySubtitle: {
      marginTop: 7,
      fontSize: 13,
      lineHeight: 20,
      color: theme.textSecondary,
      textAlign: 'center',
    },

    bottomBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 14,
      backgroundColor: theme.bg,
    },

    addButton: {
      height: 52,
      borderRadius: 14,
      backgroundColor: '#1769E0',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#1769E0',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },

    addButtonText: {
      marginLeft: 8,
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },

    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    addHeaderButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#1769E0',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
    },
  });