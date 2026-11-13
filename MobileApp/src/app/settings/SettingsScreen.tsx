import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Keyboard,
  Platform,
  Switch,
  Modal,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Menu,
  ShieldCheck,
  Building2,
  Package,
  Palette,
  KeyRound,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronDown,
  Sun,
  Moon,
  Smartphone,
  Check,
  RefreshCw,
  X,
} from 'lucide-react-native';

import API from '../../services/api';
import apis from '../../services/endpoint';
import {useDrawer} from '../../context/DrawerContext';
import {useAppTheme, ThemePreference} from '../../context/ThemeContext';

// Storage keys
const WAREHOUSE_PREFS_KEY = '@app_warehouse_preferences';
const INVENTORY_PREFS_KEY = '@app_inventory_preferences';

interface Warehouse {
  id: number;
  name: string;
  location?: string;
}

interface Rack {
  id: number;
  name: string;
  warehouseId?: number;
}

const SettingsScreen = ({navigation: _navigation}: any) => {
  const {openDrawer} = useDrawer();
  const {theme, isDark, themePreference, setThemePreference, resolvedTheme} =
    useAppTheme();

  const scrollViewRef = useRef<any>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // =========================
  // SECTION 1: PASSWORD STATE
  // =========================
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // =========================
  // SECTION 2: WAREHOUSE STATE
  // =========================
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);

  const [warehouseSettings, setWarehouseSettings] = useState({
    defaultWarehouse: '',
    defaultRack: '',
  });

  const [warehouseMessage, setWarehouseMessage] = useState('');
  const [warehouseError, setWarehouseError] = useState('');
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [rackModalOpen, setRackModalOpen] = useState(false);

  // =========================
  // SECTION 3: INVENTORY STATE
  // =========================
  const [inventorySettings, setInventorySettings] = useState({
    lowStockThreshold: '10',
    defaultSafetyStock: '5',
    lowStockWarning: true,
  });

  const [inventoryMessage, setInventoryMessage] = useState('');
  const [inventoryError, setInventoryError] = useState('');

  // =========================
  // GENERAL REFRESHING STATE
  // =========================
  const [refreshing, setRefreshing] = useState(false);

  // Keyboard height handling
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => {
        setKeyboardHeight(e.endCoordinates.height);
      },
    );

    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      },
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // =========================
  // LOAD DATA & SETTINGS
  // =========================
  const loadPreferencesAndWarehouses = useCallback(async () => {
    setLoadingWarehouses(true);
    try {
      // 1. Load warehouses
      try {
        const whRes = await API.get(apis.warehouses);
        const whList: Warehouse[] =
          whRes?.data?.warehouses || whRes?.data || [];
        setWarehouses(Array.isArray(whList) ? whList : []);
      } catch (whErr) {
        console.warn('Failed to fetch warehouses:', whErr);
      }

      // 2. Load racks
      try {
        const rackRes = await API.get(apis.racks);
        const rackList: Rack[] =
          rackRes?.data?.racks || rackRes?.data || [];
        setRacks(Array.isArray(rackList) ? rackList : []);
      } catch (rackErr) {
        console.warn('Failed to fetch racks:', rackErr);
      }

      // 3. Load saved warehouse preferences
      const savedWh = await AsyncStorage.getItem(WAREHOUSE_PREFS_KEY);
      if (savedWh) {
        const parsed = JSON.parse(savedWh);
        setWarehouseSettings({
          defaultWarehouse: parsed?.defaultWarehouse || '',
          defaultRack: parsed?.defaultRack || '',
        });
      }

      // 4. Load saved inventory preferences
      const savedInv = await AsyncStorage.getItem(INVENTORY_PREFS_KEY);
      if (savedInv) {
        const parsed = JSON.parse(savedInv);
        setInventorySettings({
          lowStockThreshold: parsed?.lowStockThreshold?.toString() || '10',
          defaultSafetyStock: parsed?.defaultSafetyStock?.toString() || '5',
          lowStockWarning:
            typeof parsed?.lowStockWarning === 'boolean'
              ? parsed.lowStockWarning
              : true,
        });
      }
    } catch (err) {
      console.error('Failed to load settings from storage/APIs:', err);
    } finally {
      setLoadingWarehouses(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPreferencesAndWarehouses();
  }, [loadPreferencesAndWarehouses]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPasswordMessage('');
    setPasswordError('');
    setWarehouseMessage('');
    setWarehouseError('');
    setInventoryMessage('');
    setInventoryError('');
    loadPreferencesAndWarehouses();
  };

  // =========================
  // PASSWORD STRENGTH LOGIC
  // =========================
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) {
      return {label: '', score: 0, color: '#94a3b8'};
    }
    let score = 0;
    if (pwd.length >= 6) {score += 1;}
    if (pwd.length >= 10) {score += 1;}
    if (/[A-Z]/.test(pwd)) {score += 1;}
    if (/[0-9]/.test(pwd)) {score += 1;}
    if (/[^A-Za-z0-9]/.test(pwd)) {score += 1;}

    if (score <= 2) {
      return {label: 'Weak', score, color: '#EF4444'};
    }
    if (score <= 3) {
      return {label: 'Medium', score, color: '#F59E0B'};
    }
    return {label: 'Strong', score, color: '#10B981'};
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  // =========================
  // PASSWORD SUBMIT
  // =========================
  const handlePasswordSubmit = async () => {
    setPasswordMessage('');
    setPasswordError('');

    if (
      !passwordData.currentPassword.trim() ||
      !passwordData.newPassword.trim() ||
      !passwordData.confirmPassword.trim()
    ) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    Keyboard.dismiss();

    try {
      setPasswordLoading(true);
      const response = await API.patch(apis.changePassword, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      setPasswordMessage(
        response?.data?.message ||
          'Password updated successfully! Please use your new password next time you sign in.',
      );

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      console.log('Password update error:', err?.response?.data || err?.message);
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Current password is incorrect or unable to update password.';
      setPasswordError(serverMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  // =========================
  // WAREHOUSE PREFERENCES
  // =========================
  // Filter racks belonging to currently selected warehouse
  const filteredRacks = useMemo(() => {
    if (!warehouseSettings.defaultWarehouse) {
      return [];
    }
    return racks.filter(
      r => Number(r.warehouseId) === Number(warehouseSettings.defaultWarehouse),
    );
  }, [racks, warehouseSettings.defaultWarehouse]);

  const selectedWarehouseObj = useMemo(() => {
    return warehouses.find(
      w => String(w.id) === String(warehouseSettings.defaultWarehouse),
    );
  }, [warehouses, warehouseSettings.defaultWarehouse]);

  const selectedRackObj = useMemo(() => {
    return filteredRacks.find(
      r => String(r.id) === String(warehouseSettings.defaultRack),
    );
  }, [filteredRacks, warehouseSettings.defaultRack]);

  const handleSelectWarehouse = (whId: string) => {
    setWarehouseSettings(prev => ({
      ...prev,
      defaultWarehouse: whId,
      // Reset rack if warehouse changes
      defaultRack: '',
    }));
    setWarehouseModalOpen(false);
    setWarehouseMessage('');
    setWarehouseError('');
  };

  const handleSelectRack = (rackId: string) => {
    setWarehouseSettings(prev => ({
      ...prev,
      defaultRack: rackId,
    }));
    setRackModalOpen(false);
    setWarehouseMessage('');
    setWarehouseError('');
  };

  const handleWarehouseSubmit = async () => {
    setWarehouseMessage('');
    setWarehouseError('');

    try {
      await AsyncStorage.setItem(
        WAREHOUSE_PREFS_KEY,
        JSON.stringify(warehouseSettings),
      );
      setWarehouseMessage('Warehouse preferences saved successfully.');
    } catch (err) {
      console.error('Failed to save warehouse preferences:', err);
      setWarehouseError('Failed to save warehouse preferences.');
    }
  };

  // =========================
  // INVENTORY PREFERENCES
  // =========================
  const handleInventorySubmit = async () => {
    setInventoryMessage('');
    setInventoryError('');

    const thresholdNum = Number(inventorySettings.lowStockThreshold);
    const safetyStockNum = Number(inventorySettings.defaultSafetyStock);

    if (
      isNaN(thresholdNum) ||
      thresholdNum < 0 ||
      inventorySettings.lowStockThreshold.trim() === ''
    ) {
      setInventoryError('Low stock threshold must be a non-negative number.');
      return;
    }

    if (
      isNaN(safetyStockNum) ||
      safetyStockNum < 0 ||
      inventorySettings.defaultSafetyStock.trim() === ''
    ) {
      setInventoryError('Safety stock buffer must be a non-negative number.');
      return;
    }

    Keyboard.dismiss();

    try {
      await AsyncStorage.setItem(
        INVENTORY_PREFS_KEY,
        JSON.stringify({
          lowStockThreshold: thresholdNum,
          defaultSafetyStock: safetyStockNum,
          lowStockWarning: inventorySettings.lowStockWarning,
        }),
      );
      setInventoryMessage('Inventory preferences saved successfully.');
    } catch (err) {
      console.error('Failed to save inventory preferences:', err);
      setInventoryError('Failed to save inventory preferences.');
    }
  };

  // =========================
  // THEME SELECTION
  // =========================
  const handleThemeSelect = async (pref: ThemePreference) => {
    await setThemePreference(pref);
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.bg}]}
      edges={[]}>
      {/* =========================
          TOP HEADER BAR
      ========================= */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.cardBg,
            borderBottomColor: theme.border,
          },
        ]}>
        <TouchableOpacity
          onPress={openDrawer}
          style={styles.headerIconButton}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Menu size={22} color={theme.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, {color: theme.textPrimary}]}>
            System Settings
          </Text>
          <Text
            style={[styles.headerSubtitle, {color: theme.textSecondary}]}
            numberOfLines={1}>
            Credentials, warehouse routing, thresholds & theme
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleRefresh}
          style={styles.headerIconButton}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <RefreshCw
            size={20}
            color={refreshing ? theme.primary : theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: Math.max(keyboardHeight + 30, 60)},
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }>
        {/* =========================
            SECTION 1: SECURITY & PASSWORD
        ========================= */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.border,
            },
          ]}>
          {/* Card Header */}
          <View
            style={[
              styles.cardHeader,
              {
                backgroundColor: theme.cardTopBg,
                borderBottomColor: theme.border,
              },
            ]}>
            <View
              style={[
                styles.iconBadge,
                isDark
                  ? styles.securityIconBadgeDark
                  : styles.securityIconBadgeLight,
              ]}>
              <ShieldCheck size={20} color="#4F46E5" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, {color: theme.textPrimary}]}>
                Security & Password
              </Text>
              <Text style={[styles.cardSubtitle, {color: theme.textSecondary}]}>
                Update your account password to keep your warehouse account secure
              </Text>
            </View>
          </View>

          {/* Card Body */}
          <View style={styles.cardBody}>
            {/* Current Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, {color: theme.textPrimary}]}>
                Current Password <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                  },
                ]}>
                <TextInput
                  secureTextEntry={!showCurrentPassword}
                  value={passwordData.currentPassword}
                  onChangeText={val => {
                    setPasswordData(prev => ({...prev, currentPassword: val}));
                    setPasswordMessage('');
                    setPasswordError('');
                  }}
                  placeholder="Enter existing password"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.textInput, {color: theme.textPrimary}]}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={styles.eyeButton}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  {showCurrentPassword ? (
                    <EyeOff size={18} color={theme.textSecondary} />
                  ) : (
                    <Eye size={18} color={theme.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, {color: theme.textPrimary}]}>
                New Password <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                  },
                ]}>
                <TextInput
                  secureTextEntry={!showNewPassword}
                  value={passwordData.newPassword}
                  onChangeText={val => {
                    setPasswordData(prev => ({...prev, newPassword: val}));
                    setPasswordMessage('');
                    setPasswordError('');
                  }}
                  placeholder="Enter new strong password"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.textInput, {color: theme.textPrimary}]}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeButton}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  {showNewPassword ? (
                    <EyeOff size={18} color={theme.textSecondary} />
                  ) : (
                    <Eye size={18} color={theme.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Password Strength Indicator */}
              {passwordData.newPassword ? (
                <View style={styles.strengthContainer}>
                  <Text style={[styles.strengthLabel, {color: theme.textMuted}]}>
                    Strength:
                  </Text>
                  <Text
                    style={[
                      styles.strengthValue,
                      {color: passwordStrength.color},
                    ]}>
                    {passwordStrength.label}
                  </Text>
                  <View
                    style={[
                      styles.strengthTrack,
                      isDark
                        ? styles.strengthTrackDark
                        : styles.strengthTrackLight,
                    ]}>
                    <View
                      style={[
                        styles.strengthBar,
                        {
                          width: `${(passwordStrength.score / 5) * 100}%`,
                          backgroundColor: passwordStrength.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              ) : (
                <Text style={[styles.fieldHint, {color: theme.textMuted}]}>
                  Minimum 6 characters
                </Text>
              )}
            </View>

            {/* Confirm New Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, {color: theme.textPrimary}]}>
                Confirm New Password <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                  },
                ]}>
                <TextInput
                  secureTextEntry={!showConfirmPassword}
                  value={passwordData.confirmPassword}
                  onChangeText={val => {
                    setPasswordData(prev => ({...prev, confirmPassword: val}));
                    setPasswordMessage('');
                    setPasswordError('');
                  }}
                  placeholder="Repeat new password"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.textInput, {color: theme.textPrimary}]}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  {showConfirmPassword ? (
                    <EyeOff size={18} color={theme.textSecondary} />
                  ) : (
                    <Eye size={18} color={theme.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Success Banner */}
            {passwordMessage ? (
              <View
                style={[
                  styles.alertBox,
                  {
                    backgroundColor: theme.successBg,
                    borderColor: theme.successBorder,
                  },
                ]}>
                <CheckCircle2 size={18} color={theme.successText} />
                <Text style={[styles.alertText, {color: theme.successText}]}>
                  {passwordMessage}
                </Text>
              </View>
            ) : null}

            {/* Error Banner */}
            {passwordError ? (
              <View
                style={[
                  styles.alertBox,
                  {
                    backgroundColor: theme.errorBg,
                    borderColor: theme.errorBorder,
                  },
                ]}>
                <AlertCircle size={18} color={theme.errorText} />
                <Text style={[styles.alertText, {color: theme.errorText}]}>
                  {passwordError}
                </Text>
              </View>
            ) : null}

            {/* Update Password Button */}
            <TouchableOpacity
              onPress={handlePasswordSubmit}
              disabled={passwordLoading}
              style={[
                styles.primaryBtn,
                styles.btnSecurity,
                passwordLoading && styles.btnDisabled,
              ]}
              activeOpacity={0.8}>
              {passwordLoading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Updating Password...</Text>
                </>
              ) : (
                <>
                  <KeyRound size={16} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Update Password</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* =========================
            SECTION 2: WAREHOUSE PREFERENCES
        ========================= */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.border,
            },
          ]}>
          {/* Card Header */}
          <View
            style={[
              styles.cardHeader,
              {
                backgroundColor: theme.cardTopBg,
                borderBottomColor: theme.border,
              },
            ]}>
            <View
              style={[
                styles.iconBadge,
                isDark
                  ? styles.warehouseIconBadgeDark
                  : styles.warehouseIconBadgeLight,
              ]}>
              <Building2 size={20} color="#0284C7" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, {color: theme.textPrimary}]}>
                Warehouse Preferences
              </Text>
              <Text style={[styles.cardSubtitle, {color: theme.textSecondary}]}>
                Configure default fulfillment warehouse and placement racks
              </Text>
            </View>
          </View>

          {/* Card Body */}
          <View style={styles.cardBody}>
            {/* Default Warehouse Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, {color: theme.textPrimary}]}>
                Default Warehouse
              </Text>
              <TouchableOpacity
                onPress={() => setWarehouseModalOpen(true)}
                disabled={loadingWarehouses}
                style={[
                  styles.dropdownSelectBox,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                  },
                ]}
                activeOpacity={0.75}>
                <Text
                  style={[
                    styles.dropdownValueText,
                    {
                      color: selectedWarehouseObj
                        ? theme.textPrimary
                        : theme.textMuted,
                    },
                  ]}>
                  {loadingWarehouses
                    ? 'Loading warehouses...'
                    : selectedWarehouseObj
                    ? `${selectedWarehouseObj.name}${
                        selectedWarehouseObj.location
                          ? ` (${selectedWarehouseObj.location})`
                          : ''
                      }`
                    : 'Select warehouse'}
                </Text>
                <ChevronDown size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Default Rack Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, {color: theme.textPrimary}]}>
                Default Rack
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (warehouseSettings.defaultWarehouse) {
                    setRackModalOpen(true);
                  }
                }}
                disabled={
                  !warehouseSettings.defaultWarehouse ||
                  filteredRacks.length === 0
                }
                style={[
                  styles.dropdownSelectBox,
                  {
                    backgroundColor: !warehouseSettings.defaultWarehouse
                      ? theme.inputDisabledBg
                      : theme.inputBg,
                    borderColor: theme.inputBorder,
                  },
                ]}
                activeOpacity={0.75}>
                <Text
                  style={[
                    styles.dropdownValueText,
                    {
                      color: !warehouseSettings.defaultWarehouse
                        ? theme.inputDisabledText
                        : selectedRackObj
                        ? theme.textPrimary
                        : theme.textMuted,
                    },
                  ]}>
                  {!warehouseSettings.defaultWarehouse
                    ? 'Select warehouse first'
                    : filteredRacks.length === 0
                    ? 'No racks available in this warehouse'
                    : selectedRackObj
                    ? selectedRackObj.name
                    : 'Select rack'}
                </Text>
                <ChevronDown size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Info Box */}
            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor: theme.infoBg,
                  borderColor: theme.infoBorder,
                },
              ]}>
              <Info size={16} color={theme.infoText} style={styles.infoIcon} />
              <Text style={[styles.infoText, {color: theme.infoText}]}>
                Your default warehouse and rack will automatically prefill when
                receiving or transferring inventory.
              </Text>
            </View>

            {/* Success Banner */}
            {warehouseMessage ? (
              <View
                style={[
                  styles.alertBox,
                  {
                    backgroundColor: theme.successBg,
                    borderColor: theme.successBorder,
                  },
                ]}>
                <CheckCircle2 size={18} color={theme.successText} />
                <Text style={[styles.alertText, {color: theme.successText}]}>
                  {warehouseMessage}
                </Text>
              </View>
            ) : null}

            {/* Error Banner */}
            {warehouseError ? (
              <View
                style={[
                  styles.alertBox,
                  {
                    backgroundColor: theme.errorBg,
                    borderColor: theme.errorBorder,
                  },
                ]}>
                <AlertCircle size={18} color={theme.errorText} />
                <Text style={[styles.alertText, {color: theme.errorText}]}>
                  {warehouseError}
                </Text>
              </View>
            ) : null}

            {/* Save Preferences Button */}
            <TouchableOpacity
              onPress={handleWarehouseSubmit}
              style={[styles.primaryBtn, styles.btnWarehouse]}
              activeOpacity={0.8}>
              <Save size={16} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Save Preferences</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =========================
            SECTION 3: INVENTORY & STOCK ALERTS
        ========================= */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.border,
            },
          ]}>
          {/* Card Header */}
          <View
            style={[
              styles.cardHeader,
              {
                backgroundColor: theme.cardTopBg,
                borderBottomColor: theme.border,
              },
            ]}>
            <View
              style={[
                styles.iconBadge,
                isDark
                  ? styles.inventoryIconBadgeDark
                  : styles.inventoryIconBadgeLight,
              ]}>
              <Package size={20} color="#059669" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, {color: theme.textPrimary}]}>
                Inventory & Stock Alerts
              </Text>
              <Text style={[styles.cardSubtitle, {color: theme.textSecondary}]}>
                Configure low stock thresholds and automatic restock triggers
              </Text>
            </View>
          </View>

          {/* Card Body */}
          <View style={styles.cardBody}>
            {/* Low Stock Threshold */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, {color: theme.textPrimary}]}>
                Low Stock Threshold (Units)
              </Text>
              <TextInput
                keyboardType="numeric"
                value={inventorySettings.lowStockThreshold}
                onChangeText={val => {
                  setInventorySettings(prev => ({
                    ...prev,
                    lowStockThreshold: val,
                  }));
                  setInventoryMessage('');
                  setInventoryError('');
                }}
                placeholder="e.g. 10"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.simpleInput,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
              />
              <Text style={[styles.fieldHint, {color: theme.textMuted}]}>
                Triggers visual alerts when product stock drops below this count.
              </Text>
            </View>

            {/* Default Safety Stock Buffer */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, {color: theme.textPrimary}]}>
                Default Safety Stock Buffer
              </Text>
              <TextInput
                keyboardType="numeric"
                value={inventorySettings.defaultSafetyStock}
                onChangeText={val => {
                  setInventorySettings(prev => ({
                    ...prev,
                    defaultSafetyStock: val,
                  }));
                  setInventoryMessage('');
                  setInventoryError('');
                }}
                placeholder="e.g. 5"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.simpleInput,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
              />
              <Text style={[styles.fieldHint, {color: theme.textMuted}]}>
                Reserved units maintained to prevent unexpected stockouts.
              </Text>
            </View>

            {/* Toggle Row */}
            <View
              style={[
                styles.toggleContainer,
                {
                  backgroundColor: theme.cardTopBg,
                  borderColor: theme.border,
                },
              ]}>
              <View style={styles.toggleTextCol}>
                <Text
                  style={[styles.toggleTitle, {color: theme.textPrimary}]}>
                  Low Stock Notification Warnings
                </Text>
                <Text
                  style={[styles.toggleSubtitle, {color: theme.textSecondary}]}>
                  Display real-time alerts in dashboard topbar and notifications tab.
                </Text>
              </View>

              <Switch
                value={inventorySettings.lowStockWarning}
                onValueChange={val => {
                  setInventorySettings(prev => ({
                    ...prev,
                    lowStockWarning: val,
                  }));
                  setInventoryMessage('');
                  setInventoryError('');
                }}
                trackColor={{false: '#CBD5E1', true: '#4F46E5'}}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Success Banner */}
            {inventoryMessage ? (
              <View
                style={[
                  styles.alertBox,
                  {
                    backgroundColor: theme.successBg,
                    borderColor: theme.successBorder,
                  },
                ]}>
                <CheckCircle2 size={18} color={theme.successText} />
                <Text style={[styles.alertText, {color: theme.successText}]}>
                  {inventoryMessage}
                </Text>
              </View>
            ) : null}

            {/* Error Banner */}
            {inventoryError ? (
              <View
                style={[
                  styles.alertBox,
                  {
                    backgroundColor: theme.errorBg,
                    borderColor: theme.errorBorder,
                  },
                ]}>
                <AlertCircle size={18} color={theme.errorText} />
                <Text style={[styles.alertText, {color: theme.errorText}]}>
                  {inventoryError}
                </Text>
              </View>
            ) : null}

            {/* Save Settings Button */}
            <TouchableOpacity
              onPress={handleInventorySubmit}
              style={[styles.primaryBtn, styles.btnInventory]}
              activeOpacity={0.8}>
              <Save size={16} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =========================
            SECTION 4: APPEARANCE & THEME
        ========================= */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.border,
            },
          ]}>
          {/* Card Header */}
          <View
            style={[
              styles.cardHeader,
              {
                backgroundColor: theme.cardTopBg,
                borderBottomColor: theme.border,
              },
            ]}>
            <View
              style={[
                styles.iconBadge,
                isDark
                  ? styles.themeIconBadgeDark
                  : styles.themeIconBadgeLight,
              ]}>
              <Palette size={20} color="#9333EA" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, {color: theme.textPrimary}]}>
                Appearance & Theme
              </Text>
              <Text style={[styles.cardSubtitle, {color: theme.textSecondary}]}>
                Choose your preferred app appearance mode
              </Text>
            </View>
          </View>

          {/* Card Body */}
          <View style={styles.cardBody}>
            <Text
              style={[
                styles.fieldLabel,
                styles.fieldLabelSpaced,
                {color: theme.textPrimary},
              ]}>
              Theme Preference
            </Text>

            {/* 1. Light Option */}
            <TouchableOpacity
              onPress={() => handleThemeSelect('light')}
              style={[
                styles.themeOptionRow,
                {
                  backgroundColor:
                    themePreference === 'light'
                      ? theme.primaryLight
                      : theme.inputBg,
                  borderColor:
                    themePreference === 'light'
                      ? theme.primary
                      : theme.border,
                },
              ]}
              activeOpacity={0.8}>
              <View style={styles.themeOptionLeft}>
                <View
                  style={[
                    styles.themeIconBox,
                    themePreference === 'light'
                      ? styles.lightIconBoxActive
                      : styles.iconBoxInactive,
                  ]}>
                  <Sun size={20} color="#D97706" />
                </View>
                <View>
                  <Text
                    style={[styles.themeOptionTitle, {color: theme.textPrimary}]}>
                    Light Mode
                  </Text>
                  <Text
                    style={[
                      styles.themeOptionSubtitle,
                      {color: theme.textSecondary},
                    ]}>
                    Always use clean light appearance
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.radioCircle,
                  {
                    borderColor:
                      themePreference === 'light'
                        ? theme.primary
                        : theme.border,
                  },
                  themePreference === 'light'
                    ? {backgroundColor: theme.primary}
                    : styles.radioCircleTransparent,
                ]}>
                {themePreference === 'light' && (
                  <Check size={12} color="#FFFFFF" strokeWidth={3} />
                )}
              </View>
            </TouchableOpacity>

            {/* 2. Dark Option */}
            <TouchableOpacity
              onPress={() => handleThemeSelect('dark')}
              style={[
                styles.themeOptionRow,
                {
                  backgroundColor:
                    themePreference === 'dark'
                      ? theme.primaryLight
                      : theme.inputBg,
                  borderColor:
                    themePreference === 'dark'
                      ? theme.primary
                      : theme.border,
                },
              ]}
              activeOpacity={0.8}>
              <View style={styles.themeOptionLeft}>
                <View
                  style={[
                    styles.themeIconBox,
                    themePreference === 'dark'
                      ? styles.darkIconBoxActive
                      : styles.iconBoxInactive,
                  ]}>
                  <Moon
                    size={20}
                    color={themePreference === 'dark' ? '#818CF8' : '#64748B'}
                  />
                </View>
                <View>
                  <Text
                    style={[styles.themeOptionTitle, {color: theme.textPrimary}]}>
                    Dark Mode
                  </Text>
                  <Text
                    style={[
                      styles.themeOptionSubtitle,
                      {color: theme.textSecondary},
                    ]}>
                    Always use sleek dark appearance
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.radioCircle,
                  {
                    borderColor:
                      themePreference === 'dark'
                        ? theme.primary
                        : theme.border,
                  },
                  themePreference === 'dark'
                    ? {backgroundColor: theme.primary}
                    : styles.radioCircleTransparent,
                ]}>
                {themePreference === 'dark' && (
                  <Check size={12} color="#FFFFFF" strokeWidth={3} />
                )}
              </View>
            </TouchableOpacity>

            {/* 3. System Default Option */}
            <TouchableOpacity
              onPress={() => handleThemeSelect('system')}
              style={[
                styles.themeOptionRow,
                {
                  backgroundColor:
                    themePreference === 'system'
                      ? theme.primaryLight
                      : theme.inputBg,
                  borderColor:
                    themePreference === 'system'
                      ? theme.primary
                      : theme.border,
                },
              ]}
              activeOpacity={0.8}>
              <View style={styles.themeOptionLeft}>
                <View
                  style={[
                    styles.themeIconBox,
                    themePreference === 'system'
                      ? styles.systemIconBoxActive
                      : styles.iconBoxInactive,
                  ]}>
                  <Smartphone
                    size={20}
                    color={
                      themePreference === 'system' ? '#4F46E5' : '#64748B'
                    }
                  />
                </View>
                <View>
                  <Text
                    style={[styles.themeOptionTitle, {color: theme.textPrimary}]}>
                    System Default
                  </Text>
                  <Text
                    style={[
                      styles.themeOptionSubtitle,
                      {color: theme.textSecondary},
                    ]}>
                    Follows device appearance (Currently:{' '}
                    {resolvedTheme === 'dark' ? 'Dark' : 'Light'})
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.radioCircle,
                  {
                    borderColor:
                      themePreference === 'system'
                        ? theme.primary
                        : theme.border,
                  },
                  themePreference === 'system'
                    ? {backgroundColor: theme.primary}
                    : styles.radioCircleTransparent,
                ]}>
                {themePreference === 'system' && (
                  <Check size={12} color="#FFFFFF" strokeWidth={3} />
                )}
              </View>
            </TouchableOpacity>

            {/* Active theme notification note */}
            <View
              style={[
                styles.themeStatusBadge,
                {
                  backgroundColor: theme.cardTopBg,
                  borderColor: theme.border,
                },
              ]}>
              <Text
                style={[styles.themeStatusText, {color: theme.textSecondary}]}>
                Active Appearance:{' '}
                <Text
                  style={isDark ? styles.activeThemeDark : styles.activeThemeLight}>
                  {resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </Text>
                {themePreference === 'system' ? ' (System Auto-Sync)' : ''}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* =========================
          WAREHOUSE PICKER MODAL
      ========================= */}
      <Modal
        visible={warehouseModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setWarehouseModalOpen(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setWarehouseModalOpen(false)}>
          <Pressable
            style={[
              styles.modalDialog,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
              },
            ]}>
            <View
              style={[
                styles.modalHeader,
                {borderBottomColor: theme.border},
              ]}>
              <Text
                style={[styles.modalTitle, {color: theme.textPrimary}]}>
                Select Default Warehouse
              </Text>
              <TouchableOpacity
                onPress={() => setWarehouseModalOpen(false)}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <X size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList}>
              {/* Option to clear */}
              <TouchableOpacity
                onPress={() => handleSelectWarehouse('')}
                style={[
                  styles.modalItem,
                  {borderBottomColor: theme.border},
                  !warehouseSettings.defaultWarehouse && {
                    backgroundColor: theme.primaryLight,
                  },
                ]}>
                <Text
                  style={[
                    styles.modalItemText,
                    styles.italicText,
                    {color: theme.textSecondary},
                  ]}>
                  None (Select Warehouse)
                </Text>
                {!warehouseSettings.defaultWarehouse && (
                  <Check size={18} color={theme.primary} />
                )}
              </TouchableOpacity>

              {warehouses.map(wh => {
                const isSelected =
                  String(wh.id) === String(warehouseSettings.defaultWarehouse);
                return (
                  <TouchableOpacity
                    key={wh.id}
                    onPress={() => handleSelectWarehouse(String(wh.id))}
                    style={[
                      styles.modalItem,
                      {borderBottomColor: theme.border},
                      isSelected && {backgroundColor: theme.primaryLight},
                    ]}>
                    <View style={styles.modalItemContent}>
                      <Text
                        style={[
                          styles.modalItemText,
                          isSelected
                            ? styles.selectedItemText
                            : styles.unselectedItemText,
                          {
                            color: isSelected
                              ? theme.primary
                              : theme.textPrimary,
                          },
                        ]}>
                        {wh.name}
                      </Text>
                      {wh.location ? (
                        <Text
                          style={[
                            styles.modalItemSubtext,
                            {color: theme.textMuted},
                          ]}>
                          {wh.location}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected && <Check size={18} color={theme.primary} />}
                  </TouchableOpacity>
                );
              })}

              {warehouses.length === 0 && (
                <View style={styles.modalEmpty}>
                  <Text
                    style={[styles.modalEmptyText, {color: theme.textMuted}]}>
                    No warehouses found on server.
                  </Text>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* =========================
          RACK PICKER MODAL
      ========================= */}
      <Modal
        visible={rackModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRackModalOpen(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRackModalOpen(false)}>
          <Pressable
            style={[
              styles.modalDialog,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
              },
            ]}>
            <View
              style={[
                styles.modalHeader,
                {borderBottomColor: theme.border},
              ]}>
              <Text
                style={[styles.modalTitle, {color: theme.textPrimary}]}>
                Select Default Rack
              </Text>
              <TouchableOpacity
                onPress={() => setRackModalOpen(false)}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <X size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList}>
              {/* Option to clear */}
              <TouchableOpacity
                onPress={() => handleSelectRack('')}
                style={[
                  styles.modalItem,
                  {borderBottomColor: theme.border},
                  !warehouseSettings.defaultRack && {
                    backgroundColor: theme.primaryLight,
                  },
                ]}>
                <Text
                  style={[
                    styles.modalItemText,
                    styles.italicText,
                    {color: theme.textSecondary},
                  ]}>
                  None (Select Rack)
                </Text>
                {!warehouseSettings.defaultRack && (
                  <Check size={18} color={theme.primary} />
                )}
              </TouchableOpacity>

              {filteredRacks.map(rack => {
                const isSelected =
                  String(rack.id) === String(warehouseSettings.defaultRack);
                return (
                  <TouchableOpacity
                    key={rack.id}
                    onPress={() => handleSelectRack(String(rack.id))}
                    style={[
                      styles.modalItem,
                      {borderBottomColor: theme.border},
                      isSelected && {backgroundColor: theme.primaryLight},
                    ]}>
                    <Text
                      style={[
                        styles.modalItemText,
                        isSelected
                          ? styles.selectedItemText
                          : styles.unselectedItemText,
                        {
                          color: isSelected
                            ? theme.primary
                            : theme.textPrimary,
                        },
                      ]}>
                      {rack.name}
                    </Text>
                    {isSelected && <Check size={18} color={theme.primary} />}
                  </TouchableOpacity>
                );
              })}

              {filteredRacks.length === 0 && (
                <View style={styles.modalEmpty}>
                  <Text
                    style={[styles.modalEmptyText, {color: theme.textMuted}]}>
                    No racks assigned to this warehouse.
                  </Text>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
  },

  // Cards
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
    lineHeight: 16,
  },
  cardBody: {
    padding: 16,
  },

  // Form Fields
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 7,
  },
  requiredAsterisk: {
    color: '#EF4444',
  },
  fieldHint: {
    fontSize: 11,
    marginTop: 5,
    lineHeight: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 12,
    height: 46,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  simpleInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  eyeButton: {
    padding: 4,
  },

  // Strength Indicator
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginRight: 6,
  },
  strengthValue: {
    fontSize: 11,
    fontWeight: '700',
    marginRight: 10,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2,
  },

  // Buttons
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 9,
    marginTop: 6,
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Alerts
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 9,
    borderWidth: 1,
    marginBottom: 14,
    gap: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },

  // Dropdown Box
  dropdownSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 14,
  },
  dropdownValueText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 9,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 8,
    flexShrink: 0,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },

  // Inventory Toggle
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  toggleTextCol: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  toggleSubtitle: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },

  // Appearance & Theme Options
  themeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  themeOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  themeOptionSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  themeStatusBadge: {
    marginTop: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  themeStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalDialog: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalList: {
    maxHeight: 380,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalItemContent: {
    flex: 1,
    marginRight: 12,
  },
  modalItemText: {
    fontSize: 14,
  },
  modalItemSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  modalEmpty: {
    padding: 24,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 13,
  },
  securityIconBadgeLight: {
    backgroundColor: '#EEF2FF',
  },
  securityIconBadgeDark: {
    backgroundColor: '#312E81',
  },
  warehouseIconBadgeLight: {
    backgroundColor: '#E0F2FE',
  },
  warehouseIconBadgeDark: {
    backgroundColor: '#075985',
  },
  inventoryIconBadgeLight: {
    backgroundColor: '#ECFDF5',
  },
  inventoryIconBadgeDark: {
    backgroundColor: '#065F46',
  },
  themeIconBadgeLight: {
    backgroundColor: '#F3E8FF',
  },
  themeIconBadgeDark: {
    backgroundColor: '#581C87',
  },
  strengthTrackLight: {
    backgroundColor: '#E2E8F0',
  },
  strengthTrackDark: {
    backgroundColor: '#334155',
  },
  btnSecurity: {
    backgroundColor: '#4F46E5',
  },
  btnWarehouse: {
    backgroundColor: '#0284C7',
  },
  btnInventory: {
    backgroundColor: '#059669',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  fieldLabelSpaced: {
    marginBottom: 12,
  },
  lightIconBoxActive: {
    backgroundColor: '#FEF3C7',
  },
  darkIconBoxActive: {
    backgroundColor: '#312E81',
  },
  systemIconBoxActive: {
    backgroundColor: '#E0E7FF',
  },
  iconBoxInactive: {
    backgroundColor: '#F1F5F9',
  },
  radioCircleTransparent: {
    backgroundColor: 'transparent',
  },
  activeThemeDark: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  activeThemeLight: {
    color: '#1769E0',
    fontWeight: '700',
  },
  italicText: {
    fontStyle: 'italic',
  },
  selectedItemText: {
    fontWeight: '700',
  },
  unselectedItemText: {
    fontWeight: '500',
  },
});

export default SettingsScreen;
