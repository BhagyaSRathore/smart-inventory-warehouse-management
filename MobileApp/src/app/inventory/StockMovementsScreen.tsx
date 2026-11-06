import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Calendar,
  ChevronRight,
  Clock,
  Filter,
  FileText,
  Layers,
  MapPin,
  Menu,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  User,
  Warehouse as WarehouseIcon,
  X,
} from 'lucide-react-native';

import API from '../../services/api';
import apis from '../../services/endpoint';
import CustomAlert from '../../components/CustomAlert';
import {useDrawer} from '../../context/DrawerContext';
import {useAppTheme, ThemeColors} from '../../context/ThemeContext';

export interface StockMovementItem {
  id: number;
  productId: number;
  warehouseId: number;
  rackId?: number | null;
  quantity: number;
  type: string;
  referenceNumber?: string | null;
  notes?: string | null;
  performedBy?: number | null;
  createdAt: string;
  product?: {
    id: number;
    name: string;
    sku?: string | null;
    barcode?: string | null;
    price?: number | null;
  } | null;
  warehouse?: {
    id: number;
    name: string;
    location?: string | null;
  } | null;
  rack?: {
    id: number;
    name: string;
  } | null;
  user?: {
    id: number;
    name: string;
    email?: string | null;
  } | null;
}

type FilterTab = 'ALL' | 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';

type Props = {
  navigation: any;
  route?: any;
};

const StockMovementsScreen = ({navigation}: Props) => {
  const {openDrawer} = useDrawer();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  // State
  const [movements, setMovements] = useState<StockMovementItem[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovementItem[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected movement for detail sheet
  const [selectedMovement, setSelectedMovement] = useState<StockMovementItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

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

  const loadMovements = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setErrorMessage(null);

      const endpoint = apis.stockMovements || '/stock-movements';
      const response = await API.get(endpoint);
      const data = response?.data;

      let list: StockMovementItem[] = [];
      if (Array.isArray(data?.movements)) {
        list = data.movements;
      } else if (Array.isArray(data?.data)) {
        list = data.data;
      } else if (Array.isArray(data)) {
        list = data;
      }

      setMovements(list);
      applyFilters(activeTab, searchQuery, list);
    } catch (error: any) {
      console.log('GET STOCK MOVEMENTS ERROR:', error?.response?.data || error);
      const msg =
        error?.response?.data?.message ||
        'Unable to load stock movements. Please try again.';
      setErrorMessage(msg);
      if (!isRefreshing) {
        showAlert('error', 'Error Loading Movements', msg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMovements(true);
  };

  useFocusEffect(
    useCallback(() => {
      loadMovements();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const applyFilters = (
    tab: FilterTab,
    search: string,
    data: StockMovementItem[] = movements,
  ) => {
    let result = [...data];

    // Filter by type
    if (tab !== 'ALL') {
      if (tab === 'TRANSFER') {
        result = result.filter(
          m =>
            m.type === 'TRANSFER_IN' ||
            m.type === 'TRANSFER_OUT' ||
            m.type === 'TRANSFER',
        );
      } else if (tab === 'IN') {
        result = result.filter(m => m.type === 'IN');
      } else if (tab === 'OUT') {
        result = result.filter(m => m.type === 'OUT');
      } else if (tab === 'ADJUSTMENT') {
        result = result.filter(m => m.type === 'ADJUSTMENT');
      }
    }

    // Filter by search query
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(m => {
        const prodName = m.product?.name?.toLowerCase() || '';
        const prodSku = m.product?.sku?.toLowerCase() || '';
        const prodBarcode = m.product?.barcode?.toLowerCase() || '';
        const ref = m.referenceNumber?.toLowerCase() || '';
        const notes = m.notes?.toLowerCase() || '';
        const warehouse = m.warehouse?.name?.toLowerCase() || '';
        return (
          prodName.includes(q) ||
          prodSku.includes(q) ||
          prodBarcode.includes(q) ||
          ref.includes(q) ||
          notes.includes(q) ||
          warehouse.includes(q)
        );
      });
    }

    setFilteredMovements(result);
  };

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    applyFilters(tab, searchQuery, movements);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    applyFilters(activeTab, text, movements);
  };

  const handleCardPress = (item: StockMovementItem) => {
    setSelectedMovement(item);
    setDetailModalVisible(true);
  };

  // Helper formatting
  const getMovementMeta = (type: string) => {
    const upper = type?.toUpperCase() || 'UNKNOWN';
    switch (upper) {
      case 'IN':
        return {
          label: 'Stock In',
          sign: '+',
          color: '#059669',
          bg: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5',
          border: isDark ? 'rgba(5, 150, 105, 0.4)' : '#A7F3D0',
          icon: ArrowDownLeft,
        };
      case 'OUT':
        return {
          label: 'Stock Out',
          sign: '-',
          color: '#DC2626',
          bg: isDark ? 'rgba(220, 38, 38, 0.2)' : '#FEF2F2',
          border: isDark ? 'rgba(220, 38, 38, 0.4)' : '#FECACA',
          icon: ArrowUpRight,
        };
      case 'TRANSFER_IN':
        return {
          label: 'Transfer In',
          sign: '+',
          color: '#2563EB',
          bg: isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF',
          border: isDark ? 'rgba(37, 99, 235, 0.4)' : '#BFDBFE',
          icon: ArrowLeftRight,
        };
      case 'TRANSFER_OUT':
        return {
          label: 'Transfer Out',
          sign: '-',
          color: '#7C3AED',
          bg: isDark ? 'rgba(124, 58, 237, 0.2)' : '#F5F3FF',
          border: isDark ? 'rgba(124, 58, 237, 0.4)' : '#DDD6FE',
          icon: ArrowLeftRight,
        };
      case 'TRANSFER':
        return {
          label: 'Transfer',
          sign: '±',
          color: '#7C3AED',
          bg: isDark ? 'rgba(124, 58, 237, 0.2)' : '#F5F3FF',
          border: isDark ? 'rgba(124, 58, 237, 0.4)' : '#DDD6FE',
          icon: ArrowLeftRight,
        };
      case 'ADJUSTMENT':
        return {
          label: 'Adjustment',
          sign: '',
          color: '#0D9488',
          bg: isDark ? 'rgba(13, 148, 136, 0.2)' : '#F0FDFA',
          border: isDark ? 'rgba(13, 148, 136, 0.4)' : '#99F6E4',
          icon: Sliders,
        };
      default:
        return {
          label: type,
          sign: '',
          color: theme.textSecondary,
          bg: theme.surfaceMuted,
          border: theme.border,
          icon: Layers,
        };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  // Metrics for top cards
  const totalCount = movements.length;
  const inCount = movements.filter(m => m.type === 'IN' || m.type === 'TRANSFER_IN').length;
  const outCount = movements.filter(m => m.type === 'OUT' || m.type === 'TRANSFER_OUT').length;
  const transferCount = movements.filter(m => m.type.startsWith('TRANSFER')).length;

  const renderMovementCard = ({item}: {item: StockMovementItem}) => {
    const meta = getMovementMeta(item.type);
    const IconComponent = meta.icon;
    const productName = item.product?.name || `Product #${item.productId}`;
    const productSku = item.product?.sku || 'N/A';
    const warehouseName = item.warehouse?.name || `Warehouse #${item.warehouseId}`;
    const rackName = item.rack?.name;

    return (
      <Pressable
        style={({pressed}) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => handleCardPress(item)}>
        {/* Header: Movement Badge & Date/Time */}
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.typeBadge,
              {backgroundColor: meta.bg, borderColor: meta.border},
            ]}>
            <IconComponent size={14} color={meta.color} strokeWidth={2.5} />
            <Text style={[styles.typeBadgeText, {color: meta.color}]}>
              {meta.label}
            </Text>
          </View>

          <View style={styles.dateTimeWrap}>
            <Calendar size={13} color="#64748B" />
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            <Text style={styles.timeDot}>•</Text>
            <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>

        {/* Center: Product info and Quantity */}
        <View style={styles.cardBody}>
          <View style={styles.productLeft}>
            <View style={styles.productIconWrap}>
              <Package size={20} color="#1769E0" />
            </View>
            <View style={{flex: 1, marginLeft: 12}}>
              <Text style={styles.productName} numberOfLines={1}>
                {productName}
              </Text>
              <Text style={styles.productSku} numberOfLines={1}>
                SKU: {productSku}
              </Text>
            </View>
          </View>

          {/* Quantity Callout */}
          <View style={styles.quantityWrap}>
            <Text style={[styles.quantityText, {color: meta.color}]}>
              {meta.sign}
              {Math.abs(item.quantity)}
            </Text>
            <Text style={styles.quantityUnit}>units</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* Footer: Warehouse, Reference, User */}
        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <WarehouseIcon size={14} color="#64748B" />
            <Text style={styles.warehouseText} numberOfLines={1}>
              {warehouseName}
              {rackName ? ` (Rack: ${rackName})` : ''}
            </Text>
          </View>

          {item.referenceNumber ? (
            <View style={styles.referencePill}>
              <Text style={styles.referenceText} numberOfLines={1}>
                #{item.referenceNumber}
              </Text>
            </View>
          ) : (
            <ChevronRight size={16} color="#94A3B8" />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={openDrawer}
          activeOpacity={0.75}>
          <Menu size={22} color="#1769E0" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Stock Movements</Text>
          <Text style={styles.headerSubtitle}>
            {totalCount} total inventory {totalCount === 1 ? 'event' : 'events'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleRefresh}
          activeOpacity={0.75}>
          <RefreshCw size={20} color="#1769E0" />
        </TouchableOpacity>
      </View>

      {/* ================= METRIC SUMMARY BAR ================= */}
      <View style={styles.summaryBar}>
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: isDark
                ? 'rgba(5, 150, 105, 0.15)'
                : '#ECFDF5',
            },
          ]}>
          <View style={styles.summaryTop}>
            <ArrowDownLeft size={16} color="#059669" />
            <Text style={[styles.summaryCount, {color: '#059669'}]}>
              {inCount}
            </Text>
          </View>
          <Text style={styles.summaryLabel}>Stock In</Text>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: isDark
                ? 'rgba(220, 38, 38, 0.15)'
                : '#FEF2F2',
            },
          ]}>
          <View style={styles.summaryTop}>
            <ArrowUpRight size={16} color="#DC2626" />
            <Text style={[styles.summaryCount, {color: '#DC2626'}]}>
              {outCount}
            </Text>
          </View>
          <Text style={styles.summaryLabel}>Stock Out</Text>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: isDark
                ? 'rgba(124, 58, 237, 0.15)'
                : '#F5F3FF',
            },
          ]}>
          <View style={styles.summaryTop}>
            <ArrowLeftRight size={16} color="#7C3AED" />
            <Text style={[styles.summaryCount, {color: '#7C3AED'}]}>
              {transferCount}
            </Text>
          </View>
          <Text style={styles.summaryLabel}>Transfers</Text>
        </View>
      </View>

      {/* ================= SEARCH INPUT ================= */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={18} color={theme.placeholderText} style={{marginLeft: 12}} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by product, SKU, reference..."
            placeholderTextColor={theme.placeholderText}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => handleSearchChange('')}
              style={{padding: 8, marginRight: 4}}>
              <X size={16} color={theme.placeholderText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ================= HORIZONTAL FILTER TABS ================= */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'ALL' && styles.tabPillActive]}
            onPress={() => handleTabChange('ALL')}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'ALL' && styles.tabPillTextActive,
              ]}>
              All ({movements.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'IN' && styles.tabPillActive]}
            onPress={() => handleTabChange('IN')}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'IN' && styles.tabPillTextActive,
              ]}>
              Stock In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'OUT' && styles.tabPillActive]}
            onPress={() => handleTabChange('OUT')}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'OUT' && styles.tabPillTextActive,
              ]}>
              Stock Out
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabPill,
              activeTab === 'TRANSFER' && styles.tabPillActive,
            ]}
            onPress={() => handleTabChange('TRANSFER')}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'TRANSFER' && styles.tabPillTextActive,
              ]}>
              Transfer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabPill,
              activeTab === 'ADJUSTMENT' && styles.tabPillActive,
            ]}
            onPress={() => handleTabChange('ADJUSTMENT')}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'ADJUSTMENT' && styles.tabPillTextActive,
              ]}>
              Adjustment
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ================= MOVEMENTS LIST ================= */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1769E0" />
          <Text style={styles.loadingText}>Loading stock movements...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={44} color="#D64545" />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadMovements()}
            activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredMovements}
          keyExtractor={item => String(item.id)}
          renderItem={renderMovementCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#1769E0']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Layers size={36} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Movements Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No movements matching "${searchQuery}"`
                  : activeTab !== 'ALL'
                  ? `No ${activeTab.toLowerCase()} movements recorded yet.`
                  : 'No inventory stock movements logged yet. Operations such as Stock In, Stock Out, Transfer, and Adjustment will appear here.'}
              </Text>
            </View>
          }
        />
      )}

      {/* ================= MOVEMENT DETAILS MODAL ================= */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {selectedMovement && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalContent}>
                {/* Header with Type Badge */}
                <View style={styles.modalHeaderRow}>
                  {(() => {
                    const meta = getMovementMeta(selectedMovement.type);
                    const IconComponent = meta.icon;
                    return (
                      <View
                        style={[
                          styles.typeBadge,
                          {
                            backgroundColor: meta.bg,
                            borderColor: meta.border,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                          },
                        ]}>
                        <IconComponent
                          size={16}
                          color={meta.color}
                          strokeWidth={2.5}
                        />
                        <Text
                          style={[
                            styles.typeBadgeText,
                            {color: meta.color, fontSize: 13},
                          ]}>
                          {meta.label}
                        </Text>
                      </View>
                    );
                  })()}

                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setDetailModalVisible(false)}>
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Product Section */}
                <View style={styles.modalProductCard}>
                  <View style={styles.modalProductIconBox}>
                    <Package size={24} color="#1769E0" />
                  </View>
                  <View style={{flex: 1, marginLeft: 14}}>
                    <Text style={styles.modalProductName}>
                      {selectedMovement.product?.name ||
                        `Product #${selectedMovement.productId}`}
                    </Text>
                    <Text style={styles.modalProductSku}>
                      SKU: {selectedMovement.product?.sku || 'N/A'}
                    </Text>
                    {selectedMovement.product?.barcode && (
                      <Text style={styles.modalProductBarcode}>
                        Barcode: {selectedMovement.product.barcode}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Quantity & Impact Card */}
                {(() => {
                  const meta = getMovementMeta(selectedMovement.type);
                  return (
                    <View style={styles.quantityHighlightCard}>
                      <Text style={styles.quantityHighlightLabel}>
                        Quantity Moved
                      </Text>
                      <Text
                        style={[
                          styles.quantityHighlightValue,
                          {color: meta.color},
                        ]}>
                        {meta.sign}
                        {Math.abs(selectedMovement.quantity)} units
                      </Text>
                    </View>
                  );
                })()}

                {/* Info Breakdown Grid */}
                <View style={styles.detailsGrid}>
                  {/* Warehouse */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconBox}>
                      <WarehouseIcon size={16} color="#64748B" />
                    </View>
                    <View style={styles.detailTextWrap}>
                      <Text style={styles.detailLabel}>Warehouse</Text>
                      <Text style={styles.detailValue}>
                        {selectedMovement.warehouse?.name ||
                          `Warehouse #${selectedMovement.warehouseId}`}
                        {selectedMovement.warehouse?.location
                          ? ` (${selectedMovement.warehouse.location})`
                          : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Rack */}
                  {selectedMovement.rack && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconBox}>
                        <Layers size={16} color="#64748B" />
                      </View>
                      <View style={styles.detailTextWrap}>
                        <Text style={styles.detailLabel}>Rack Location</Text>
                        <Text style={styles.detailValue}>
                          {selectedMovement.rack.name}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Reference */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconBox}>
                      <FileText size={16} color="#64748B" />
                    </View>
                    <View style={styles.detailTextWrap}>
                      <Text style={styles.detailLabel}>Reference Number</Text>
                      <Text style={styles.detailValue}>
                        {selectedMovement.referenceNumber || 'None'}
                      </Text>
                    </View>
                  </View>

                  {/* Performed By */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconBox}>
                      <User size={16} color="#64748B" />
                    </View>
                    <View style={styles.detailTextWrap}>
                      <Text style={styles.detailLabel}>Logged By</Text>
                      <Text style={styles.detailValue}>
                        {selectedMovement.user?.name ||
                          (selectedMovement.performedBy
                            ? `User #${selectedMovement.performedBy}`
                            : 'System / Admin')}
                        {selectedMovement.user?.email
                          ? ` (${selectedMovement.user.email})`
                          : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Timestamp */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconBox}>
                      <Clock size={16} color="#64748B" />
                    </View>
                    <View style={styles.detailTextWrap}>
                      <Text style={styles.detailLabel}>Recorded At</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(selectedMovement.createdAt)} at{' '}
                        {formatTime(selectedMovement.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Notes if provided */}
                {selectedMovement.notes && (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Notes / Reason</Text>
                    <Text style={styles.notesContent}>
                      {selectedMovement.notes}
                    </Text>
                  </View>
                )}

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.modalPrimaryBtn}
                  onPress={() => setDetailModalVisible(false)}
                  activeOpacity={0.85}>
                  <Text style={styles.modalPrimaryBtnText}>Close Details</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Alert */}
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

const getStyles = (theme: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.headerBorder,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.headerButtonBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenter: {
      alignItems: 'center',
    },
    headerTitle: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    headerSubtitle: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    summaryBar: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
      gap: 10,
    },
    summaryCard: {
      flex: 1,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    summaryTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    summaryCount: {
      fontSize: 18,
      fontWeight: '800',
    },
    summaryLabel: {
      color: theme.textSecondary,
      fontSize: 11,
      fontWeight: '600',
    },
    searchSection: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 10,
      fontSize: 14,
      color: theme.textPrimary,
    },
    tabsWrapper: {
      marginBottom: 8,
    },
    tabsContent: {
      paddingHorizontal: 16,
      gap: 8,
    },
    tabPill: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    tabPillActive: {
      backgroundColor: '#1769E0',
      borderColor: '#1769E0',
    },
    tabPillText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    tabPillTextActive: {
      color: '#FFFFFF',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 24,
      gap: 12,
    },
    card: {
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadowColor,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: isDark ? 0.3 : 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    cardPressed: {
      opacity: 0.85,
      transform: [{scale: 0.99}],
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    typeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      borderWidth: 1,
      gap: 6,
    },
    typeBadgeText: {
      fontSize: 12,
      fontWeight: '700',
    },
    dateTimeWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    dateText: {
      color: theme.textSecondary,
      fontSize: 12,
    },
    timeDot: {
      color: theme.border,
      fontSize: 12,
    },
    timeText: {
      color: theme.textSecondary,
      fontSize: 12,
    },
    cardBody: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    productLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    productIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.2)' : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    productName: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
    productSku: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    quantityWrap: {
      alignItems: 'flex-end',
    },
    quantityText: {
      fontSize: 18,
      fontWeight: '800',
    },
    quantityUnit: {
      color: theme.textMuted,
      fontSize: 11,
      marginTop: 1,
    },
    cardDivider: {
      height: 1,
      backgroundColor: theme.borderLight,
      marginBottom: 12,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    footerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 6,
    },
    warehouseText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: '500',
    },
    referencePill: {
      backgroundColor: theme.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    referenceText: {
      color: '#1769E0',
      fontSize: 11,
      fontWeight: '700',
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    loadingText: {
      marginTop: 14,
      color: theme.textSecondary,
      fontSize: 14,
    },
    errorText: {
      marginTop: 12,
      color: theme.errorText,
      fontSize: 15,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 18,
      backgroundColor: '#1769E0',
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 10,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    emptyContainer: {
      paddingVertical: 48,
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    emptyIconCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: theme.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: '700',
      marginBottom: 6,
    },
    emptySubtitle: {
      color: theme.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 18,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: theme.cardBg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '85%',
      paddingBottom: Platform.OS === 'android' ? 24 : 32,
    },
    modalHandle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.border,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 8,
    },
    modalContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
    },
    modalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    modalCloseBtn: {
      padding: 6,
      borderRadius: 16,
      backgroundColor: theme.surfaceMuted,
    },
    modalProductCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceMuted,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 14,
    },
    modalProductIconBox: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.2)' : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalProductName: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    modalProductSku: {
      color: theme.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },
    modalProductBarcode: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 1,
    },
    quantityHighlightCard: {
      backgroundColor: theme.surfaceMuted,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      marginBottom: 14,
    },
    quantityHighlightLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    quantityHighlightValue: {
      fontSize: 24,
      fontWeight: '800',
    },
    detailsGrid: {
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      gap: 12,
      marginBottom: 14,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    detailIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: theme.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    detailTextWrap: {
      flex: 1,
    },
    detailLabel: {
      color: theme.textSecondary,
      fontSize: 11,
      fontWeight: '500',
    },
    detailValue: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '600',
      marginTop: 1,
    },
    notesBox: {
      backgroundColor: isDark ? 'rgba(180, 83, 9, 0.15)' : '#FFFBEB',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(180, 83, 9, 0.3)' : '#FEF3C7',
      padding: 12,
      marginBottom: 18,
    },
    notesLabel: {
      color: isDark ? '#FBBF24' : '#B45309',
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    notesContent: {
      color: isDark ? '#FDE68A' : '#78350F',
      fontSize: 13,
      lineHeight: 18,
    },
    modalPrimaryBtn: {
      backgroundColor: '#1769E0',
      paddingVertical: 13,
      borderRadius: 12,
      alignItems: 'center',
    },
    modalPrimaryBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },
  });

export default StockMovementsScreen;
