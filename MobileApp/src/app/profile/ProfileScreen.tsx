import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {
  Menu,
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native';

import API from '../../services/api';
import apis from '../../services/endpoint';
import {useDrawer} from '../../context/DrawerContext';
import {RootState} from '../../store/store';
import {updateUser, User} from '../../store/slices/authSlice';
import {normalizeRole} from '../../utils/roles';
import {useAppTheme} from '../../context/ThemeContext';

type FormData = {
  name: string;
  email: string;
  phone: string;
  role: string;
};

type FieldErrors = {
  name?: string;
  email?: string;
  phone?: string;
};

const ProfileScreen = ({navigation: _navigation}: any) => {
  const {openDrawer} = useDrawer();
  const dispatch = useDispatch();
  const {theme, isDark} = useAppTheme();

  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [formData, setFormData] = useState<FormData>({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    role: currentUser?.role ? normalizeRole(currentUser.role) : 'STAFF',
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<any>(null);

  // Keyboard height listener for seamless Android IME handling
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

  // Fetch current user profile from server
  const loadProfile = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) {
          setRefreshing(true);
        }
        setErrorMessage('');

        const response = await API.get(apis.me);
        const userData: User | undefined = response?.data?.user;

        if (userData) {
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            role: userData.role ? normalizeRole(userData.role) : 'STAFF',
          });
          dispatch(updateUser(userData));
        }
      } catch (err: any) {
        console.log('Profile fetch error:', err?.response?.data || err?.message);
        if (isManualRefresh) {
          const msg =
            err?.response?.data?.message ||
            'Unable to load profile from server. Showing cached information.';
          setErrorMessage(msg);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    loadProfile(false);
  }, [loadProfile]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setSuccessMessage('');
    setErrorMessage('');
    if (fieldErrors[field as keyof FieldErrors]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();

    if (!trimmedName) {
      errors.name = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (trimmedPhone) {
      const phoneRegex = /^[+0-9\s().-]{7,20}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        errors.phone = 'Please enter a valid phone number (e.g. +91 9876543210).';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (!validateForm()) {
      setErrorMessage('Please correct the highlighted fields before saving.');
      return;
    }

    Keyboard.dismiss();

    try {
      setIsSubmitting(true);
      setSuccessMessage('');
      setErrorMessage('');

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
      };

      const response = await API.put(apis.updateProfile, payload);
      const updatedUser: User | undefined = response?.data?.user;

      if (!updatedUser) {
        throw new Error(
          response?.data?.message || 'Updated user data was not returned by server.',
        );
      }

      // Update local form state with confirmed server data
      setFormData({
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || '',
        role: updatedUser.role ? normalizeRole(updatedUser.role) : 'STAFF',
      });

      // Synchronize Redux & persisted state across the entire app
      dispatch(updateUser(updatedUser));

      setSuccessMessage(
        response?.data?.message || 'Profile updated successfully.',
      );
    } catch (err: any) {
      console.log('Profile update error:', err?.response?.data || err?.message);
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Unable to update profile. Please check your connection and try again.';
      setErrorMessage(serverMessage);
      // Keep unsaved changes in formData intact for user retry
    } finally {
      setIsSubmitting(false);
    }
  };

  // Avatar initial
  const avatarLetter = (formData.name.trim() || currentUser?.name || 'A')
    .charAt(0)
    .toUpperCase();

  const roleText = formData.role ? normalizeRole(formData.role) : 'STAFF';



  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.bg}]}
      edges={[]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Screen Top Header */}
      <View
        style={[
          styles.headerBar,
          {backgroundColor: theme.cardBg, borderBottomColor: theme.border},
        ]}>
        <TouchableOpacity
          style={[
            styles.headerButton,
            isDark ? styles.headerButtonDark : styles.headerButtonLight,
          ]}
          onPress={openDrawer}
          activeOpacity={0.7}
          accessibilityLabel="Open navigation menu">
          <Menu size={22} color={theme.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, {color: theme.textPrimary}]}>
            My Profile
          </Text>
          <Text style={[styles.headerSubtitle, {color: theme.textSecondary}]}>
            Personal Account
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.headerButton,
            isDark ? styles.headerButtonDark : styles.headerButtonLight,
          ]}
          onPress={() => loadProfile(true)}
          disabled={loading || refreshing || isSubmitting}
          activeOpacity={0.7}
          accessibilityLabel="Refresh profile">
          <RefreshCw
            size={18}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={[
          styles.flexOne,
          Platform.OS === 'android' && {paddingBottom: keyboardHeight},
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadProfile(true)}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }>
          {/* Page Title & Subtitle Banner */}
          <View style={styles.pageTitleContainer}>
            <View style={styles.titleWithIcon}>
              <Sparkles size={20} color={theme.primary} strokeWidth={2.2} />
              <Text style={[styles.pageTitle, {color: theme.textPrimary}]}>
                My Profile
              </Text>
            </View>
            <Text style={[styles.pageSubtitle, {color: theme.textSecondary}]}>
              Manage your personal information and account details.
            </Text>
          </View>

          {/* MAIN PROFILE CARD */}
          <View
            style={[
              styles.profileCard,
              {backgroundColor: theme.cardBg, borderColor: theme.border},
            ]}>
            {/* SECTION 1: PROFILE HEADER */}
            <View
              style={[
                styles.profileCardTop,
                {backgroundColor: theme.cardTopBg, borderBottomColor: theme.border},
              ]}>
              <View style={styles.avatarWrapper}>
                <View style={[styles.avatarCircle, {backgroundColor: theme.primary}]}>
                  <Text style={styles.avatarText}>{avatarLetter}</Text>
                </View>
              </View>

              <View style={styles.profileMeta}>
                <Text
                  style={[styles.profileName, {color: theme.textPrimary}]}
                  numberOfLines={1}>
                  {formData.name.trim() || 'Admin User'}
                </Text>
                <View style={styles.roleBadgeRow}>
                  <View
                    style={[
                      styles.roleBadge,
                      {backgroundColor: theme.primaryLight},
                    ]}>
                    <Shield size={12} color={theme.primary} strokeWidth={2.4} />
                    <Text style={[styles.roleBadgeText, {color: theme.primary}]}>
                      {roleText}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* SECTION 2: ACCOUNT INFORMATION */}
            <View style={styles.cardBody}>
              <View style={styles.sectionHeaderBox}>
                <Text style={[styles.sectionTitle, {color: theme.textPrimary}]}>
                  Account Information
                </Text>
                <Text style={[styles.sectionSubtitle, {color: theme.textSecondary}]}>
                  Update your account details below.
                </Text>
              </View>

              {/* FIELD 1: Full Name */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, {color: theme.textPrimary}]}>
                  <UserIcon size={15} color={theme.primary} strokeWidth={2.2} />{' '}
                  Full Name
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.textPrimary,
                    },
                    fieldErrors.name ? styles.inputErrorBorder : null,
                  ]}
                  value={formData.name}
                  onChangeText={txt => handleChange('name', txt)}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  editable={!isSubmitting}
                />
                {fieldErrors.name ? (
                  <View style={styles.fieldErrorRow}>
                    <AlertCircle size={13} color="#EF4444" />
                    <Text style={styles.fieldErrorText}>{fieldErrors.name}</Text>
                  </View>
                ) : null}
              </View>

              {/* FIELD 2: Email Address */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, {color: theme.textPrimary}]}>
                  <Mail size={15} color={theme.primary} strokeWidth={2.2} />{' '}
                  Email Address
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.textPrimary,
                    },
                    fieldErrors.email ? styles.inputErrorBorder : null,
                  ]}
                  value={formData.email}
                  onChangeText={txt => handleChange('email', txt)}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  editable={!isSubmitting}
                />
                {fieldErrors.email ? (
                  <View style={styles.fieldErrorRow}>
                    <AlertCircle size={13} color="#EF4444" />
                    <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>
                  </View>
                ) : null}
              </View>

              {/* FIELD 3: Phone Number */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, {color: theme.textPrimary}]}>
                  <Phone size={15} color={theme.primary} strokeWidth={2.2} />{' '}
                  Phone Number
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.textPrimary,
                    },
                    fieldErrors.phone ? styles.inputErrorBorder : null,
                  ]}
                  value={formData.phone}
                  onChangeText={txt => handleChange('phone', txt)}
                  placeholder="Enter your phone number"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                  editable={!isSubmitting}
                />
                {fieldErrors.phone ? (
                  <View style={styles.fieldErrorRow}>
                    <AlertCircle size={13} color="#EF4444" />
                    <Text style={styles.fieldErrorText}>{fieldErrors.phone}</Text>
                  </View>
                ) : null}
              </View>

              {/* FIELD 4: Role (Strictly Read-Only) */}
              <View style={styles.fieldContainer}>
                <View style={styles.roleLabelRow}>
                  <Text style={[styles.fieldLabel, {color: theme.textPrimary}]}>
                    <Shield size={15} color={theme.primary} strokeWidth={2.2} />{' '}
                    Role
                  </Text>
                  <View style={styles.readOnlyPill}>
                    <Lock size={11} color={theme.textMuted} />
                    <Text style={[styles.readOnlyPillText, {color: theme.textMuted}]}>
                      Read-only
                    </Text>
                  </View>
                </View>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.textInputDisabled,
                    {
                      backgroundColor: theme.inputDisabledBg,
                      borderColor: theme.inputBorder,
                      color: theme.inputDisabledText,
                    },
                  ]}
                  value={roleText}
                  editable={false}
                  selectTextOnFocus={false}
                />
                <Text style={[styles.helperText, {color: theme.textMuted}]}>
                  Your account role cannot be changed here.
                </Text>
              </View>

              {/* Success Notification Banner */}
              {successMessage ? (
                <View
                  style={[
                    styles.messageBanner,
                    {
                      backgroundColor: theme.successBg,
                      borderColor: theme.successBorder,
                    },
                  ]}>
                  <CheckCircle2
                    size={18}
                    color={theme.successBorder}
                    strokeWidth={2.4}
                  />
                  <Text
                    style={[styles.messageBannerText, {color: theme.successText}]}>
                    {successMessage}
                  </Text>
                </View>
              ) : null}

              {/* Error Notification Banner */}
              {errorMessage ? (
                <View
                  style={[
                    styles.messageBanner,
                    {
                      backgroundColor: theme.errorBg,
                      borderColor: theme.errorBorder,
                    },
                  ]}>
                  <AlertCircle
                    size={18}
                    color={theme.errorBorder}
                    strokeWidth={2.4}
                  />
                  <Text
                    style={[styles.messageBannerText, {color: theme.errorText}]}>
                    {errorMessage}
                  </Text>
                </View>
              ) : null}

              {/* SECTION 3: SAVE CHANGES */}
              <View style={[styles.actionsContainer, {borderTopColor: theme.border}]}>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    {backgroundColor: theme.primary},
                    isSubmitting && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={isSubmitting || loading}
                  activeOpacity={0.8}
                  accessibilityLabel="Save Changes">
                  {isSubmitting ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Saving Changes...</Text>
                    </>
                  ) : (
                    <>
                      <Save size={18} color="#FFFFFF" strokeWidth={2.2} />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonLight: {
    backgroundColor: '#F1F5F9',
  },
  headerButtonDark: {
    backgroundColor: '#334155',
  },
  inputErrorBorder: {
    borderColor: '#EF4444',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  pageTitleContainer: {
    marginBottom: 16,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  profileCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#1769E0',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  profileCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 16,
    borderBottomWidth: 1,
  },
  avatarWrapper: {
    shadowColor: '#1769E0',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  profileMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 6,
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 5,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: 18,
  },
  sectionHeaderBox: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  roleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  readOnlyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readOnlyPillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    minHeight: 46,
  },
  textInputDisabled: {
    opacity: 0.85,
  },
  helperText: {
    fontSize: 11,
    marginTop: 5,
    fontStyle: 'italic',
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  fieldErrorText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '500',
  },
  messageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  messageBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  actionsContainer: {
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#1769E0',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ProfileScreen;
