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
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Mail,
  Phone,
  Plus,
  Search,
  Truck,
  Menu,
  Bell,
} from 'lucide-react-native';
import {useFocusEffect} from '@react-navigation/native';

import API from '../../services/api';
import CustomAlert from '../../components/CustomAlert';
import {useDrawer} from '../../context/DrawerContext';
import {useAppTheme, ThemeColors} from '../../context/ThemeContext';

type Supplier = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

type Props = {
  navigation: any;
};

const SupplierListScreen = ({navigation}: Props) => {
  const {openDrawer} = useDrawer();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('info');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
  ) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const loadSuppliers = async () => {
    try {
      setLoading(true);

      const response = await API.get('/suppliers');

      const data = response?.data?.suppliers || [];

      setSuppliers(data);
      setFilteredSuppliers(data);
    } catch (error: any) {
      console.log(
        'GET SUPPLIERS ERROR:',
        error?.response?.data || error,
      );

      showAlert(
        'error',
        'Unable to Load Suppliers',
        error?.response?.data?.message ||
          'Something went wrong while loading suppliers.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      const response = await API.get('/suppliers');

      const data = response?.data?.suppliers || [];

      setSuppliers(data);
      filterSuppliers(search, data);
    } catch (error: any) {
      console.log(
        'REFRESH SUPPLIERS ERROR:',
        error?.response?.data || error,
      );
    } finally {
      setRefreshing(false);
    }
  };

  const filterSuppliers = (
    text: string,
    data: Supplier[] = suppliers,
  ) => {
    const query = text.trim().toLowerCase();

    setSearch(text);

    if (!query) {
      setFilteredSuppliers(data);
      return;
    }

    const filtered = data.filter(supplier => {
      return (
        supplier.name?.toLowerCase().includes(query) ||
        supplier.email?.toLowerCase().includes(query) ||
        supplier.phone?.toLowerCase().includes(query) ||
        supplier.address?.toLowerCase().includes(query)
      );
    });

    setFilteredSuppliers(filtered);
  };

  useFocusEffect(
    useCallback(() => {
      loadSuppliers();
    }, []),
  );

  const renderSupplier = ({item}: {item: Supplier}) => (
    <Pressable
      style={({pressed}) => [
        styles.supplierCard,
        pressed && styles.cardPressed,
      ]}
      onPress={() =>
        navigation.navigate('SupplierDetails', {
          supplierId: item.id,
          supplier: item,
        })
      }>
      <View style={styles.supplierIcon}>
        <Truck
          size={24}
          color="#1769E0"
          strokeWidth={1.9}
        />
      </View>

      <View style={styles.supplierContent}>
        <Text
          style={styles.supplierName}
          numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.infoRow}>
          <Mail
            size={14}
            color="#829AB1"
            strokeWidth={2}
          />

          <Text
            style={styles.infoText}
            numberOfLines={1}>
            {item.email || 'No email'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Phone
            size={14}
            color="#829AB1"
            strokeWidth={2}
          />

          <Text
            style={styles.infoText}
            numberOfLines={1}>
            {item.phone || 'No phone'}
          </Text>
        </View>
      </View>

      <ChevronRight
        size={20}
        color="#9AA9B8"
        strokeWidth={2}
      />
    </Pressable>
  );

  const renderEmpty = () => {
    if (loading) {
      return null;
    }

    if (search.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Search
              size={30}
              color="#1769E0"
              strokeWidth={1.8}
            />
          </View>

          <Text style={styles.emptyTitle}>
            No Suppliers Found
          </Text>

          <Text style={styles.emptyText}>
            No supplier matches "{search}".
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Building2
            size={30}
            color="#1769E0"
            strokeWidth={1.8}
          />
        </View>

        <Text style={styles.emptyTitle}>
          No Suppliers Yet
        </Text>

        <Text style={styles.emptyText}>
          Add your first supplier to start managing supplier information.
        </Text>

        <Pressable
          style={({pressed}) => [
            styles.emptyButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.navigate('AddSupplier')}>
          <Plus
            size={18}
            color="#FFFFFF"
            strokeWidth={2.4}
          />

          <Text style={styles.emptyButtonText}>
            Add Supplier
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
  <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
       <Pressable
            style={({pressed}) => [
              styles.menuButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={openDrawer}>
            <Menu
              size={22}
              color="#1769E0"
              strokeWidth={2}
            />
          </Pressable>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            Suppliers
          </Text>

          <Text style={styles.headerSubtitle}>
            Manage your suppliers
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          <Pressable
            style={({pressed}) => [
              styles.addButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => navigation.navigate('AddSupplier')}>
            <Plus
              size={22}
              color="#FFFFFF"
              strokeWidth={2.5}
            />
          </Pressable>

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
        <Search
          size={19}
          color={theme.placeholderText}
          strokeWidth={2}
        />

        <TextInput
          value={search}
          onChangeText={text => filterSuppliers(text)}
          placeholder="Search suppliers..."
          placeholderTextColor={theme.placeholderText}
          style={styles.searchInput}
        />

        {search.length > 0 && (
          <Pressable
            onPress={() => filterSuppliers('')}>
            <Text style={styles.clearText}>
              Clear
            </Text>
          </Pressable>
        )}
      </View>

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filteredSuppliers.length}{' '}
          {filteredSuppliers.length === 1
            ? 'Supplier'
            : 'Suppliers'}
        </Text>

        <Text style={styles.countSubtext}>
          Total available
        </Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color="#1769E0"
          />

          <Text style={styles.loadingText}>
            Loading suppliers...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSuppliers}
          keyExtractor={item => String(item.id)}
          renderItem={renderSupplier}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={
            filteredSuppliers.length === 0
              ? styles.emptyList
              : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#1769E0"
            />
          }
        />
      )}

      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        buttonText="OK"
        onPress={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

export default SupplierListScreen;

const getStyles = (theme: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    header: {
      minHeight: 76,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.headerBorder,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: theme.headerButtonBg,
      alignItems: 'center',
      justifyContent: 'center',
    },

    headerContent: {
      flex: 1,
      marginLeft: 12,
    },

    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    headerSubtitle: {
      marginTop: 3,
      fontSize: 12,
      color: theme.textSecondary,
    },

    headerRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    addButton: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: '#1769E0',
      alignItems: 'center',
      justifyContent: 'center',
    },

    menuButton: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
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
      height: 52,
      marginHorizontal: 16,
      marginTop: 16,
      paddingHorizontal: 15,
      borderRadius: 14,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
    },

    searchInput: {
      flex: 1,
      marginLeft: 10,
      fontSize: 14,
      color: theme.textPrimary,
      paddingVertical: 0,
    },

    clearText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#1769E0',
    },

    countRow: {
      marginHorizontal: 18,
      marginTop: 18,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    countText: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    countSubtext: {
      fontSize: 11,
      color: theme.textSecondary,
    },

    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 30,
    },

    supplierCard: {
      minHeight: 94,
      marginBottom: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: theme.shadowColor,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 6,
      elevation: 2,
    },

    cardPressed: {
      opacity: 0.82,
      transform: [{scale: 0.99}],
    },

    supplierIcon: {
      width: 50,
      height: 50,
      borderRadius: 15,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.2)' : '#EAF2FD',
      alignItems: 'center',
      justifyContent: 'center',
    },

    supplierContent: {
      flex: 1,
      marginLeft: 13,
      marginRight: 8,
    },

    supplierName: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: 7,
    },

    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 3,
    },

    infoText: {
      flex: 1,
      marginLeft: 7,
      fontSize: 12,
      color: theme.textSecondary,
    },

    loaderContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    loadingText: {
      marginTop: 10,
      fontSize: 13,
      color: theme.textSecondary,
    },

    emptyList: {
      flexGrow: 1,
    },

    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 35,
      paddingBottom: 80,
    },

    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 22,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.2)' : '#EAF2FD',
      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyTitle: {
      marginTop: 16,
      fontSize: 19,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    emptyText: {
      marginTop: 7,
      fontSize: 13,
      lineHeight: 19,
      color: theme.textSecondary,
      textAlign: 'center',
    },

    emptyButton: {
      height: 48,
      marginTop: 20,
      paddingHorizontal: 20,
      borderRadius: 13,
      backgroundColor: '#1769E0',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyButtonText: {
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '800',
      color: '#FFFFFF',
    },

    buttonPressed: {
      opacity: 0.78,
    },
  });