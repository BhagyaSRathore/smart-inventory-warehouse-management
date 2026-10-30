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
import {ArrowLeft, MapPin, Menu, Warehouse as WarehouseIcon} from 'lucide-react-native';

import API from '../../services/api';
import CustomAlert from '../../components/CustomAlert';
import {useDrawer} from '../../context/DrawerContext';
import {useAppTheme, ThemeColors} from '../../context/ThemeContext';

type Props = {
  navigation: any;
};

const AddWarehouseScreen = ({navigation}: Props) => {
  const {openDrawer} = useDrawer();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

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

  const resetForm = () => {
    setName('');
    setLocation('');
  };

  const handleCreateWarehouse = async () => {
    const trimmedName = name.trim();
    const trimmedLocation = location.trim();

    if (!trimmedName) {
      showAlert(
        'warning',
        'Required',
        'Please enter warehouse name.',
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: trimmedName,
        location: trimmedLocation || undefined,
      };

      console.log('CREATE WAREHOUSE PAYLOAD:', payload);

      const response = await API.post('/warehouses', payload);

      console.log('CREATE WAREHOUSE RESPONSE:', response?.data);

      showAlert(
        'success',
        'Warehouse Created',
        response?.data?.message ||
          'Warehouse created successfully.',
        () => {
          resetForm();
          navigation.goBack();
        },
      );
    } catch (error: any) {
      console.log(
        'CREATE WAREHOUSE ERROR:',
        error?.response?.data || error,
      );

      const message =
        error?.response?.data?.message ||
        'Unable to create warehouse. Please try again.';

      showAlert(
        'error',
        'Creation Failed',
        message,
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
          style={styles.menuHeaderButton}
          onPress={openDrawer}>
          <Menu size={22} color="#1769E0" />
        </Pressable>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Add Warehouse</Text>
          <Text style={styles.headerSubtitle}>
            Create a new warehouse
          </Text>
        </View>

      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <WarehouseIcon
            size={32}
            color="#1769E0"
            strokeWidth={2}
          />
        </View>

        <Text style={styles.title}>Warehouse Details</Text>

        <Text style={styles.description}>
          Enter the basic information for your warehouse.
        </Text>

        {/* Warehouse Name */}
        <Text style={styles.label}>
          Warehouse Name *
        </Text>

        <View style={styles.inputContainer}>
          <WarehouseIcon
            size={18}
            color={theme.placeholderText}
          />

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Main Warehouse"
            placeholderTextColor={theme.placeholderText}
            style={styles.inputWithIcon}
            maxLength={100}
          />
        </View>

        {/* Location */}
        <Text style={styles.label}>
          Location
        </Text>

        <View style={styles.inputContainer}>
          <MapPin
            size={18}
            color={theme.placeholderText}
          />

          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Jaipur, Rajasthan"
            placeholderTextColor={theme.placeholderText}
            style={styles.inputWithIcon}
            maxLength={150}
          />
        </View>

        {/* Submit */}
        <Pressable
          disabled={submitting}
          style={[
            styles.submitButton,
            submitting && styles.disabledButton,
          ]}
          onPress={handleCreateWarehouse}>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>
              Create Warehouse
            </Text>
          )}
        </Pressable>
      </ScrollView>

      {/* Custom Alert */}
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

export default AddWarehouseScreen;

const getStyles = (theme: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 14,
      backgroundColor: theme.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.headerBorder,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: theme.headerButtonBg,
      alignItems: 'center',
      justifyContent: 'center',
    },

    headerTextContainer: {
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

    menuHeaderButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 10,
    },

    content: {
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 40,
    },

    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.2)' : '#EAF2FD',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },

    title: {
      marginTop: 18,
      fontSize: 22,
      fontWeight: '800',
      color: theme.textPrimary,
      textAlign: 'center',
    },

    description: {
      marginTop: 7,
      marginBottom: 28,
      fontSize: 13,
      lineHeight: 20,
      color: theme.textSecondary,
      textAlign: 'center',
    },

    label: {
      marginBottom: 8,
      marginTop: 16,
      fontSize: 13,
      fontWeight: '700',
      color: theme.textSecondary,
    },

    inputContainer: {
      minHeight: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      backgroundColor: theme.inputBg,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
    },

    inputWithIcon: {
      flex: 1,
      marginLeft: 10,
      paddingVertical: 0,
      fontSize: 14,
      color: theme.textPrimary,
    },

    submitButton: {
      height: 53,
      borderRadius: 13,
      backgroundColor: '#1769E0',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 30,

      shadowColor: '#1769E0',
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },

    disabledButton: {
      opacity: 0.7,
    },

    submitText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },
  });