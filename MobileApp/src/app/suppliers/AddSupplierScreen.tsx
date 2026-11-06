import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Phone,
  Truck,
  Menu,
} from 'lucide-react-native';

import API from '../../services/api';
import CustomAlert from '../../components/CustomAlert';
import {useDrawer} from '../../context/DrawerContext';
import {useAppTheme, ThemeColors} from '../../context/ThemeContext';

type Props = {
  navigation: any;
};

const AddSupplierScreen = ({navigation}: Props) => {
  const {openDrawer} = useDrawer();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('info');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertAction, setAlertAction] = useState<(() => void) | null>(null);

  const showAlert = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    action?: () => void,
  ) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertAction(() => action || null);
    setAlertVisible(true);
  };

  const closeAlert = () => {
    setAlertVisible(false);

    if (alertAction) {
      const action = alertAction;
      setAlertAction(null);
      action();
    }
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();

    if (!trimmedName) {
      showAlert(
        'warning',
        'Supplier Name Required',
        'Please enter a supplier name.',
      );
      return;
    }

    if (
      trimmedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
    ) {
      showAlert(
        'warning',
        'Invalid Email',
        'Please enter a valid email address.',
      );
      return;
    }

    try {
      setSubmitting(true);

      await API.post('/suppliers', {
        name: trimmedName,
        email: trimmedEmail || undefined,
        phone: trimmedPhone || undefined,
        address: trimmedAddress || undefined,
      });

      showAlert(
        'success',
        'Supplier Added',
        'Supplier has been added successfully.',
        () => navigation.goBack(),
      );
    } catch (error: any) {
      console.log(
        'CREATE SUPPLIER ERROR:',
        error?.response?.data || error,
      );

      showAlert(
        'error',
        'Failed to Add Supplier',
        error?.response?.data?.message ||
          'Unable to create supplier. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({pressed}) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          onPress={() => navigation.goBack()}>
          <ArrowLeft
            size={22}
            color="#102A43"
            strokeWidth={2}
          />
        </Pressable>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            Add Supplier
          </Text>

          <Text style={styles.headerSubtitle}>
            Add a new supplier
          </Text>
        </View>

        <Pressable
          style={({pressed}) => [
            styles.menuButton,
            pressed && styles.pressed,
          ]}
          onPress={openDrawer}>
          <Menu
            size={22}
            color="#1769E0"
            strokeWidth={2}
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>

        {/* Top Icon */}
        <View style={styles.iconContainer}>
          <Truck
            size={34}
            color="#1769E0"
            strokeWidth={1.8}
          />
        </View>

        <Text style={styles.pageTitle}>
          Supplier Information
        </Text>

        <Text style={styles.pageDescription}>
          Enter the supplier details below to add them to your inventory system.
        </Text>

        {/* Supplier Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Supplier Name *
          </Text>

          <View style={styles.inputCard}>
            <Building2
              size={20}
              color="#1769E0"
              strokeWidth={2}
            />

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter supplier name"
              placeholderTextColor={theme.placeholderText}
              style={styles.input}
              editable={!submitting}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Email */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Email
          </Text>

          <View style={styles.inputCard}>
            <Mail
              size={20}
              color="#1769E0"
              strokeWidth={2}
            />

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter supplier email"
              placeholderTextColor={theme.placeholderText}
              style={styles.input}
              editable={!submitting}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Phone */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Phone
          </Text>

          <View style={styles.inputCard}>
            <Phone
              size={20}
              color="#1769E0"
              strokeWidth={2}
            />

            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              placeholderTextColor={theme.placeholderText}
              style={styles.input}
              editable={!submitting}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Address */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Address
          </Text>

          <View style={[styles.inputCard, styles.addressCard]}>
            <MapPin
              size={20}
              color="#1769E0"
              strokeWidth={2}
            />

            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Enter supplier address"
              placeholderTextColor={theme.placeholderText}
              style={[styles.input, styles.addressInput]}
              editable={!submitting}
              autoCapitalize="sentences"
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Save */}
        <Pressable
          disabled={submitting}
          style={({pressed}) => [
            styles.saveButton,
            submitting && styles.disabledButton,
            pressed && !submitting && styles.pressedButton,
          ]}
          onPress={handleCreate}>
          {submitting ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.saveButtonText}>
              Add Supplier
            </Text>
          )}
        </Pressable>

        {/* Cancel */}
        <Pressable
          disabled={submitting}
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>
            Cancel
          </Text>
        </Pressable>
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        buttonText="OK"
        onPress={closeAlert}
      />
    </KeyboardAvoidingView>
  );
};

export default AddSupplierScreen;

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

    menuButton: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    headerContent: {
      flex: 1,
      marginLeft: 12,
    },

    headerTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    headerSubtitle: {
      marginTop: 3,
      fontSize: 12,
      color: theme.textSecondary,
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 24,
      paddingBottom: 40,
    },

    iconContainer: {
      width: 68,
      height: 68,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.2)' : '#EAF2FD',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },

    pageTitle: {
      marginTop: 16,
      fontSize: 22,
      fontWeight: '800',
      color: theme.textPrimary,
      textAlign: 'center',
    },

    pageDescription: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 19,
      color: theme.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 18,
    },

    fieldContainer: {
      marginTop: 22,
    },

    label: {
      marginBottom: 8,
      fontSize: 13,
      fontWeight: '700',
      color: theme.textSecondary,
    },

    inputCard: {
      minHeight: 54,
      borderRadius: 14,
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      paddingHorizontal: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },

    addressCard: {
      minHeight: 100,
      alignItems: 'flex-start',
      paddingTop: 16,
    },

    input: {
      flex: 1,
      marginLeft: 11,
      paddingVertical: 0,
      fontSize: 14,
      color: theme.textPrimary,
      fontWeight: '600',
    },

    addressInput: {
      minHeight: 70,
      paddingTop: 0,
    },

    saveButton: {
      height: 53,
      marginTop: 28,
      borderRadius: 14,
      backgroundColor: '#1769E0',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#1769E0',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.18,
      shadowRadius: 7,
      elevation: 3,
    },

    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },

    disabledButton: {
      opacity: 0.65,
    },

    cancelButton: {
      height: 48,
      marginTop: 10,
      borderRadius: 14,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    cancelText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textSecondary,
    },

    pressed: {
      opacity: 0.75,
    },

    pressedButton: {
      opacity: 0.85,
      transform: [{scale: 0.99}],
    },
  });