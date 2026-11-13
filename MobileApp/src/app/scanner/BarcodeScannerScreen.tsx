import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useCameraDevice,
  useCameraPermission,
  Camera,
} from 'react-native-vision-camera';

import {
  useBarcodeScannerOutput,
  Barcode,
} from 'react-native-vision-camera-barcode-scanner';
import {useIsFocused} from '@react-navigation/native';
import {
  AlertCircle,
  ArrowRight,
  CameraOff,
  CheckCircle2,
  ChevronRight,
  Flashlight,
  FlashlightOff,
  Keyboard,
  Layers,
  MapPin,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react-native';

import API from '../../services/api';
import apis from '../../services/endpoint';
import {useAppTheme, ThemeColors} from '../../context/ThemeContext';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const SCAN_BOX_SIZE = Math.min(SCREEN_WIDTH * 0.75, 280);

interface ProductLocation {
  inventoryId: number;
  quantity: number;
  warehouse: {
    id: number;
    name: string;
    location?: string;
  } | null;
  rack: {
    id: number;
    name: string;
  } | null;
}

interface ProductResult {
  id: number;
  name: string;
  sku: string;
  barcode?: string | null;
  price: number;
  costPrice?: number | null;
  reorderLevel?: number;
  category?: {id: number; name: string} | null;
  supplier?: {id: number; name: string} | null;
  totalStock?: number;
}

interface InventoryResult {
  totalStock: number;
  locations: ProductLocation[];
}

const BarcodeScannerScreen = ({navigation}: any) => {
  const isFocused = useIsFocused();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();

  // State
  const [torchOn, setTorchOn] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [productResult, setProductResult] = useState<ProductResult | null>(null);
  const [inventoryResult, setInventoryResult] = useState<InventoryResult | null>(null);
  const [notFoundError, setNotFoundError] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Manual input modal
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');

  // Scanning throttle lock
  const isProcessingRef = useRef(false);

  // Animated scan line
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Request camera permission on mount if needed
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Scan line animation loop
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (isFocused && !showResultModal && !manualModalVisible) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2200,
            useNativeDriver: true,
          }),
        ]),
      );
      animLoop.start();
    } else {
      scanLineAnim.setValue(0);
    }

    return () => {
      animLoop?.stop();
    };
  }, [isFocused, showResultModal, manualModalVisible, scanLineAnim]);

  // Turn off torch when leaving screen
 useEffect(() => {
  if (!isFocused) {
    setTorchOn(false);
  }
}, [isFocused]);
  // Lookup product by code
  const lookupProduct = useCallback(async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    setScannedCode(cleanCode);
    setLoading(true);
    setNotFoundError(null);
    setShowResultModal(true);

    try {
      const response = await API.get(apis.productByBarcode(encodeURIComponent(cleanCode)));
      const data = response?.data;

      if (data?.product) {
        setProductResult(data.product);
        setInventoryResult(data.inventory || null);
        setNotFoundError(null);
      } else {
        setProductResult(null);
        setInventoryResult(null);
        setNotFoundError(`No product found with barcode or SKU: "${cleanCode}"`);
      }
    } catch (err: any) {
      console.log('Barcode lookup failed:', err);
      setProductResult(null);
      setInventoryResult(null);

      const status = err?.response?.status;
      if (status === 401) {
        setNotFoundError('Authentication error. Please log in again.');
      } else if (status === 403) {
        setNotFoundError('You do not have permission to look up products.');
      } else if (status === 404) {
        setNotFoundError(
          `No product found matching barcode or SKU: "${cleanCode}". Check that this item is registered in the system.`,
        );
      } else if (!err?.response) {
        setNotFoundError(
          'Network error. Check your connection and try again.',
        );
      } else {
        setNotFoundError(
          err?.response?.data?.message ||
            `Unable to look up code "${cleanCode}". Please try again.`,
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle scanned code from camera output
  const handleCodeScanned = useCallback(
    (code: string) => {
      if (isProcessingRef.current || showResultModal || manualModalVisible) {
        return;
      }
      isProcessingRef.current = true;
      lookupProduct(code);
    },
    [lookupProduct, showResultModal, manualModalVisible],
  );

  // Vision camera barcode scanner output hook
  const barcodeScanner = useBarcodeScannerOutput({
    barcodeFormats: ['all-formats'],
    onBarcodeScanned: (barcodes: Barcode[]) => {
      if (isProcessingRef.current || !barcodes?.length) {
        return;
      }
      for (const obj of barcodes) {
        // Prefer rawValue (raw byte string) over displayValue to preserve
        // leading zeros that some scanner implementations drop in displayValue
        // when the barcode value is interpreted as a number (e.g. EAN/UPC).
        const rawStr =
          obj.rawValue != null && String(obj.rawValue).length > 0
            ? String(obj.rawValue)
            : null;
        const displayStr =
          obj.displayValue != null && String(obj.displayValue).length > 0
            ? String(obj.displayValue)
            : null;
        const val = rawStr ?? displayStr;
        if (val && val.trim().length > 0) {
          handleCodeScanned(val.trim());
          break;
        }
      }
    },
    onError: (error: Error) => {
      console.warn('Barcode scan error:', error);
    },
  });

  // Reset scanner state to scan again
  const handleScanAgain = () => {
    setShowResultModal(false);
    setProductResult(null);
    setInventoryResult(null);
    setNotFoundError(null);
    setScannedCode(null);
    // Short cooldown before scanning next frame
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 600);
  };

  // Submit manual code
  const handleManualSearch = () => {
    if (!manualCodeInput.trim()) return;
    setManualModalVisible(false);
    isProcessingRef.current = true;
    lookupProduct(manualCodeInput.trim());
    setManualCodeInput('');
  };

  // Action navigation
  const handleStockIn = () => {
    setShowResultModal(false);
    isProcessingRef.current = false;
    if (productResult) {
      navigation.navigate('StockIn', {
        productId: productResult.id,
        product: productResult,
      });
    }
  };

  const handleStockOut = () => {
    setShowResultModal(false);
    isProcessingRef.current = false;
    if (productResult) {
      navigation.navigate('StockOut', {
        productId: productResult.id,
        product: productResult,
      });
    }
  };

  const handleViewProduct = () => {
    setShowResultModal(false);
    isProcessingRef.current = false;
    if (productResult) {
      navigation.navigate('Products', {
        screen: 'ProductDetails',
        params: {
          productId: productResult.id,
          product: productResult,
        },
      });
    }
  };

  // Permission denied view
  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <View style={styles.iconCircle}>
            <CameraOff size={42} color="#D64545" />
          </View>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionDescription}>
            Camera access is needed to scan barcodes and QR codes on inventory packages.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={requestPermission}
            activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Allow Camera Access</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setManualModalVisible(true)}
            activeOpacity={0.8}>
            <Keyboard size={18} color="#1769E0" style={{marginRight: 8}} />
            <Text style={styles.secondaryButtonText}>Enter Code Manually</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}>
            <Text style={styles.ghostButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>

        {renderManualInputModal()}
      </SafeAreaView>
    );
  }

  // Device missing view
  if (!device) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <View style={styles.iconCircle}>
            <CameraOff size={42} color="#D97706" />
          </View>
          <Text style={styles.permissionTitle}>No Camera Detected</Text>
          <Text style={styles.permissionDescription}>
            Unable to detect a back camera on this device. You can still look up products by typing their barcode or SKU manually.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setManualModalVisible(true)}
            activeOpacity={0.8}>
            <Keyboard size={18} color="#FFFFFF" style={{marginRight: 8}} />
            <Text style={styles.primaryButtonText}>Enter Code Manually</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}>
            <Text style={styles.ghostButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>

        {renderManualInputModal()}
      </SafeAreaView>
    );
  }

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_BOX_SIZE - 4],
  });

  function renderManualInputModal() {
    return (
      <Modal
        visible={manualModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setManualModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}>
          <View style={styles.manualCard}>
            <View style={styles.manualHeader}>
              <View style={styles.manualIconWrap}>
                <Keyboard size={20} color="#1769E0" />
              </View>
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={styles.manualTitle}>Manual Barcode / SKU</Text>
                <Text style={styles.manualSubtitle}>
                  Type product barcode or SKU code
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setManualModalVisible(false)}
                style={styles.manualCloseButton}>
                <X size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Search size={18} color={theme.placeholderText} style={{marginLeft: 12}} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. LAP-XPS-15 or 890123456789"
                placeholderTextColor={theme.placeholderText}
                value={manualCodeInput}
                onChangeText={setManualCodeInput}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleManualSearch}
                autoFocus
              />
              {manualCodeInput.length > 0 && (
                <TouchableOpacity
                  onPress={() => setManualCodeInput('')}
                  style={{padding: 8, marginRight: 4}}>
                  <X size={16} color={theme.placeholderText} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.manualActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setManualModalVisible(false);
                  setManualCodeInput('');
                }}
                activeOpacity={0.8}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !manualCodeInput.trim() && styles.disabledButton,
                ]}
                disabled={!manualCodeInput.trim()}
                onPress={handleManualSearch}
                activeOpacity={0.8}>
                <Text style={styles.submitButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  const totalStockCount =
    inventoryResult?.totalStock ?? productResult?.totalStock ?? 0;
  const isOutOfStock = totalStockCount <= 0;
  const isLowStock =
    !isOutOfStock &&
    productResult?.reorderLevel !== undefined &&
    totalStockCount <= productResult.reorderLevel;

  return (
    <View style={styles.container}>
      {/* Vision Camera Preview */}
    <Camera
  style={StyleSheet.absoluteFill}
  device={device}
  isActive={isFocused && !showResultModal && !manualModalVisible}
  outputs={[barcodeScanner]}
  torchMode={
    isFocused && !showResultModal && !manualModalVisible
      ? torchOn
        ? 'on'
        : undefined
      : undefined
  }
/>

      {/* Screen Overlay */}
      <SafeAreaView style={styles.overlay}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}>
            <X size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Scan Barcode</Text>

          <View style={styles.topRightActions}>
            {device.hasTorch && (
              <TouchableOpacity
                style={[styles.iconButton, torchOn && styles.iconButtonActive]}
                onPress={() => setTorchOn(prev => !prev)}
                activeOpacity={0.75}>
                {torchOn ? (
                  <Flashlight size={20} color="#FBBF24" />
                ) : (
                  <FlashlightOff size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.iconButton, {marginLeft: 10}]}
              onPress={() => setManualModalVisible(true)}
              activeOpacity={0.75}>
              <Keyboard size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Viewfinder Center Area */}
        <View style={styles.centerArea}>
          <View style={[styles.scanBox, {width: SCAN_BOX_SIZE, height: SCAN_BOX_SIZE}]}>
            {/* Viewfinder 4 Corners */}
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />

            {/* Laser scanning line */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [{translateY: scanLineTranslateY}],
                },
              ]}
            />
          </View>

          <View style={styles.instructionBadge}>
            <Text style={styles.instructionText}>
              Align barcode or QR code inside the frame
            </Text>
          </View>
        </View>

        {/* Bottom Bar: Manual Input Pill */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.manualPill}
            onPress={() => setManualModalVisible(true)}
            activeOpacity={0.85}>
            <Keyboard size={18} color="#FFFFFF" style={{marginRight: 8}} />
            <Text style={styles.manualPillText}>Enter Barcode / SKU Manually</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Manual Input Modal */}
      {renderManualInputModal()}

      {/* Result Bottom Sheet Modal */}
      <Modal
        visible={showResultModal}
        transparent
        animationType="slide"
        onRequestClose={handleScanAgain}>
        <View style={styles.resultModalBackdrop}>
          <View style={styles.resultSheet}>
            {/* Handle Drag Bar */}
            <View style={styles.sheetHandle} />

            {loading ? (
              <View style={styles.resultLoadingState}>
                <ActivityIndicator size="large" color="#1769E0" />
                <Text style={styles.resultLoadingTitle}>Looking up product...</Text>
                {scannedCode && (
                  <Text style={styles.resultLoadingCode}>Code: {scannedCode}</Text>
                )}
              </View>
            ) : productResult ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.resultSheetScroll}>
                {/* Result Status Header */}
                <View style={styles.resultHeader}>
                  <View style={styles.badgeSuccess}>
                    <CheckCircle2 size={16} color="#059669" />
                    <Text style={styles.badgeSuccessText}>Product Identified</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.sheetCloseBtn}
                    onPress={handleScanAgain}>
                    <X size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Product Core Info */}
                <Text style={styles.productName}>{productResult.name}</Text>
                <View style={styles.codeRow}>
                  <View style={styles.codePill}>
                    <Text style={styles.codeLabel}>SKU:</Text>
                    <Text style={styles.codeValue}>{productResult.sku}</Text>
                  </View>
                  {productResult.barcode ? (
                    <View style={[styles.codePill, {marginLeft: 8}]}>
                      <Text style={styles.codeLabel}>Barcode:</Text>
                      <Text style={styles.codeValue}>{productResult.barcode}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Stock & Price Highlights */}
                <View style={styles.metaCard}>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Current Stock</Text>
                    <View style={styles.stockStatusRow}>
                      <Text style={styles.stockCount}>{totalStockCount}</Text>
                      <View
                        style={[
                          styles.stockBadge,
                          isOutOfStock
                            ? styles.badgeOut
                            : isLowStock
                            ? styles.badgeLow
                            : styles.badgeNormal,
                        ]}>
                        <Text
                          style={[
                            styles.stockBadgeText,
                            isOutOfStock
                              ? styles.badgeOutText
                              : isLowStock
                              ? styles.badgeLowText
                              : styles.badgeNormalText,
                          ]}>
                          {isOutOfStock
                            ? 'Out of Stock'
                            : isLowStock
                            ? 'Low Stock'
                            : 'In Stock'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.metaDivider} />

                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Unit Price</Text>
                    <Text style={styles.priceValue}>
                      ${Number(productResult.price || 0).toFixed(2)}
                    </Text>
                    {productResult.category && (
                      <Text style={styles.categorySubtext}>
                        {productResult.category.name}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Warehouse breakdown if available */}
                {inventoryResult?.locations &&
                  inventoryResult.locations.length > 0 && (
                    <View style={styles.locationsContainer}>
                      <Text style={styles.locationsTitle}>Warehouse Locations</Text>
                      {inventoryResult.locations.map((loc, idx) => (
                        <View key={loc.inventoryId || idx} style={styles.locationItem}>
                          <View style={styles.locationLeft}>
                            <MapPin size={16} color="#1769E0" />
                            <Text style={styles.locationWarehouseName}>
                              {loc.warehouse?.name || 'Warehouse'}
                            </Text>
                            {loc.rack && (
                              <View style={styles.rackPill}>
                                <Layers size={12} color={theme.textSecondary} />
                                <Text style={styles.rackPillText}>
                                  {loc.rack.name}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.locationQty}>
                            {loc.quantity} units
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                {/* Operational Quick Actions */}
                <Text style={styles.actionsSectionTitle}>Inventory Actions</Text>
                <View style={styles.buttonGrid}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.stockInBtn]}
                    onPress={handleStockIn}
                    activeOpacity={0.85}>
                    <View style={styles.actionBtnIconCircle}>
                      <Plus size={18} color="#059669" strokeWidth={2.5} />
                    </View>
                    <View style={styles.actionBtnTextWrap}>
                      <Text style={styles.actionBtnPrimaryText}>Stock In</Text>
                      <Text style={styles.actionBtnSubtext}>Add inventory</Text>
                    </View>
                    <ChevronRight size={18} color="#059669" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.stockOutBtn]}
                    onPress={handleStockOut}
                    activeOpacity={0.85}>
                    <View
                      style={[
                        styles.actionBtnIconCircle,
                        {backgroundColor: '#FEF3C7'},
                      ]}>
                      <Minus size={18} color="#D97706" strokeWidth={2.5} />
                    </View>
                    <View style={styles.actionBtnTextWrap}>
                      <Text
                        style={[
                          styles.actionBtnPrimaryText,
                          {color: '#B45309'},
                        ]}>
                        Stock Out
                      </Text>
                      <Text style={styles.actionBtnSubtext}>Issue inventory</Text>
                    </View>
                    <ChevronRight size={18} color="#D97706" />
                  </TouchableOpacity>
                </View>

                {/* Secondary Actions */}
                <View style={styles.secondaryActionsRow}>
                  <TouchableOpacity
                    style={styles.detailsOutlineBtn}
                    onPress={handleViewProduct}
                    activeOpacity={0.8}>
                    <Package size={16} color="#1769E0" style={{marginRight: 6}} />
                    <Text style={styles.detailsOutlineText}>View Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.scanAgainGhostBtn}
                    onPress={handleScanAgain}
                    activeOpacity={0.8}>
                    <RotateCcw size={16} color={theme.textSecondary} style={{marginRight: 6}} />
                    <Text style={styles.scanAgainGhostText}>Scan Again</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              /* Not Found Error Card */
              <View style={styles.notFoundCard}>
                <View style={styles.notFoundIconCircle}>
                  <AlertCircle size={36} color="#D64545" />
                </View>
                <Text style={styles.notFoundTitle}>Product Not Found</Text>
                <Text style={styles.notFoundDesc}>
                  {notFoundError ||
                    `No product in the database matches code: "${scannedCode}"`}
                </Text>

                {scannedCode && (
                  <View style={styles.scannedCodePill}>
                    <Text style={styles.scannedCodeLabel}>Scanned Code:</Text>
                    <Text style={styles.scannedCodeVal}>{scannedCode}</Text>
                  </View>
                )}

                <View style={styles.notFoundActions}>
                  <TouchableOpacity
                    style={styles.scanAgainMainBtn}
                    onPress={handleScanAgain}
                    activeOpacity={0.85}>
                    <RotateCcw size={18} color="#FFFFFF" style={{marginRight: 8}} />
                    <Text style={styles.scanAgainMainBtnText}>Scan Again</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.manualFallbackBtn}
                    onPress={() => {
                      setShowResultModal(false);
                      setManualModalVisible(true);
                    }}
                    activeOpacity={0.85}>
                    <Keyboard size={18} color="#1769E0" style={{marginRight: 8}} />
                    <Text style={styles.manualFallbackBtnText}>
                      Enter SKU Manually
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'space-between',
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'android' ? 12 : 6,
      zIndex: 10,
    },
    headerTitle: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
    },
    topRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    iconButtonActive: {
      backgroundColor: 'rgba(245, 158, 11, 0.25)',
      borderColor: '#FBBF24',
    },
    centerArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scanBox: {
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: 'transparent',
    },
    cornerTL: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 32,
      height: 32,
      borderTopWidth: 4,
      borderLeftWidth: 4,
      borderColor: '#38BDF8',
      borderTopLeftRadius: 10,
    },
    cornerTR: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 32,
      height: 32,
      borderTopWidth: 4,
      borderRightWidth: 4,
      borderColor: '#38BDF8',
      borderTopRightRadius: 10,
    },
    cornerBL: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: 32,
      height: 32,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
      borderColor: '#38BDF8',
      borderBottomLeftRadius: 10,
    },
    cornerBR: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderBottomWidth: 4,
      borderRightWidth: 4,
      borderColor: '#38BDF8',
      borderBottomRightRadius: 10,
    },
    scanLine: {
      width: '100%',
      height: 3,
      backgroundColor: '#38BDF8',
      shadowColor: '#38BDF8',
      shadowOffset: {width: 0, height: 0},
      shadowOpacity: 0.9,
      shadowRadius: 8,
      elevation: 6,
    },
    instructionBadge: {
      marginTop: 24,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    instructionText: {
      color: '#E2E8F0',
      fontSize: 13,
      fontWeight: '500',
    },
    bottomBar: {
      paddingHorizontal: 24,
      paddingBottom: Platform.OS === 'android' ? 24 : 16,
      alignItems: 'center',
    },
    manualPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(23, 105, 224, 0.85)',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    manualPillText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    permissionContainer: {
      flex: 1,
      backgroundColor: theme.bg,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    permissionContent: {
      width: '100%',
      maxWidth: 360,
      alignItems: 'center',
      backgroundColor: theme.cardBg,
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.border,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: 'rgba(214, 69, 69, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    permissionTitle: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 10,
    },
    permissionDescription: {
      color: theme.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    primaryButton: {
      width: '100%',
      backgroundColor: '#1769E0',
      paddingVertical: 13,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 10,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },
    secondaryButton: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EFF6FF',
      paddingVertical: 13,
      borderRadius: 12,
      marginBottom: 10,
    },
    secondaryButtonText: {
      color: '#1769E0',
      fontSize: 15,
      fontWeight: '600',
    },
    ghostButton: {
      paddingVertical: 10,
    },
    ghostButtonText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: '500',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    manualCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: theme.cardBg,
      borderRadius: 18,
      padding: 20,
      shadowColor: theme.shadowColor,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 8,
    },
    manualHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    manualIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EAF1FF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    manualTitle: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    manualSubtitle: {
      color: theme.textSecondary,
      fontSize: 12,
    },
    manualCloseButton: {
      padding: 4,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 12,
      marginBottom: 20,
    },
    textInput: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 10,
      fontSize: 14,
      color: theme.textPrimary,
    },
    manualActions: {
      flexDirection: 'row',
      gap: 10,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      backgroundColor: isDark ? theme.surfaceMuted : '#F1F5F9',
    },
    cancelButtonText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
    submitButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      backgroundColor: '#1769E0',
    },
    disabledButton: {
      opacity: 0.5,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    resultModalBackdrop: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      justifyContent: 'flex-end',
    },
    resultSheet: {
      backgroundColor: theme.cardBg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '85%',
      paddingBottom: Platform.OS === 'android' ? 24 : 32,
    },
    sheetHandle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.borderLight,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 8,
    },
    resultLoadingState: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resultLoadingTitle: {
      marginTop: 16,
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    resultLoadingCode: {
      marginTop: 6,
      color: theme.textSecondary,
      fontSize: 13,
    },
    resultSheetScroll: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
    },
    resultHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    badgeSuccess: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ECFDF5',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#A7F3D0',
      gap: 6,
    },
    badgeSuccessText: {
      color: '#065F46',
      fontSize: 12,
      fontWeight: '600',
    },
    sheetCloseBtn: {
      padding: 6,
      borderRadius: 16,
      backgroundColor: theme.headerButtonBg,
    },
    productName: {
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 8,
    },
    codeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 16,
      gap: 6,
    },
    codePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? theme.surfaceMuted : '#F1F5F9',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    codeLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: '500',
      marginRight: 4,
    },
    codeValue: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: '700',
    },
    metaCard: {
      flexDirection: 'row',
      backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC',
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 16,
    },
    metaCol: {
      flex: 1,
    },
    metaDivider: {
      width: 1,
      backgroundColor: theme.borderLight,
      marginHorizontal: 14,
    },
    metaLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 4,
    },
    stockStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    stockCount: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: '800',
    },
    stockBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    badgeNormal: {
      backgroundColor: '#DCFCE7',
    },
    badgeNormalText: {
      color: '#15803D',
      fontSize: 11,
      fontWeight: '700',
    },
    badgeLow: {
      backgroundColor: '#FEF3C7',
    },
    badgeLowText: {
      color: '#B45309',
      fontSize: 11,
      fontWeight: '700',
    },
    badgeOut: {
      backgroundColor: '#FEE2E2',
    },
    badgeOutText: {
      color: '#B91C1C',
      fontSize: 11,
      fontWeight: '700',
    },
    stockBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    priceValue: {
      color: '#1769E0',
      fontSize: 20,
      fontWeight: '800',
    },
    categorySubtext: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    locationsContainer: {
      marginBottom: 18,
      backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC',
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    locationsTitle: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    locationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    locationLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 6,
    },
    locationWarehouseName: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '600',
    },
    rackPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBg,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      gap: 4,
    },
    rackPillText: {
      color: theme.textSecondary,
      fontSize: 11,
      fontWeight: '600',
    },
    locationQty: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '700',
    },
    actionsSectionTitle: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    buttonGrid: {
      gap: 10,
      marginBottom: 16,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
    },
    stockInBtn: {
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#F0FDF4',
      borderColor: isDark ? 'rgba(5, 150, 105, 0.3)' : '#BBF7D0',
    },
    stockOutBtn: {
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FFFBEB',
      borderColor: isDark ? 'rgba(217, 119, 6, 0.3)' : '#FDE68A',
    },
    actionBtnIconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.25)' : '#DCFCE7',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    actionBtnTextWrap: {
      flex: 1,
    },
    actionBtnPrimaryText: {
      color: isDark ? '#34D399' : '#047857',
      fontSize: 15,
      fontWeight: '700',
    },
    actionBtnSubtext: {
      color: theme.textSecondary,
      fontSize: 12,
    },
    secondaryActionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    detailsOutlineBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EFF6FF',
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(23, 105, 224, 0.3)' : '#BFDBFE',
    },
    detailsOutlineText: {
      color: '#1769E0',
      fontSize: 14,
      fontWeight: '600',
    },
    scanAgainGhostBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? theme.surfaceMuted : '#F8FAFC',
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    scanAgainGhostText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
    notFoundCard: {
      padding: 24,
      alignItems: 'center',
    },
    notFoundIconCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    notFoundTitle: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 8,
    },
    notFoundDesc: {
      color: theme.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 16,
    },
    scannedCodePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? theme.surfaceMuted : '#F1F5F9',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      marginBottom: 24,
    },
    scannedCodeLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      marginRight: 6,
    },
    scannedCodeVal: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '700',
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    notFoundActions: {
      width: '100%',
      gap: 10,
    },
    scanAgainMainBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1769E0',
      paddingVertical: 13,
      borderRadius: 12,
    },
    scanAgainMainBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },
    manualFallbackBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? theme.surfaceMuted : '#F1F5F9',
      paddingVertical: 13,
      borderRadius: 12,
    },
    manualFallbackBtnText: {
      color: '#1769E0',
      fontSize: 15,
      fontWeight: '600',
    },
  });

export default BarcodeScannerScreen;