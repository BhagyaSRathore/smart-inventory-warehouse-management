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

type Warehouse = {
  id: number;
  name: string;
  location?: string | null;
};

type Props = {
  navigation: any;
  route: {
    params: {
      warehouseId: number;
      warehouse: Warehouse;
    };
  };
};

const EditWarehouseScreen = ({navigation, route}: Props) => {
  const {openDrawer} = useDrawer();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const warehouse = route?.params?.warehouse;

  const [name, setName] = useState(warehouse?.name || '');
  const [location, setLocation] = useState(warehouse?.location || '');
  const [submitting, setSubmitting] = useState(false);

  // Custom Alert
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

  const handleUpdate = async () => {
    const trimmedName = name.trim();
    const trimmedLocation = location.trim();

    if (!trimmedName) {
      showAlert(
        'warning',
        'Warehouse Name Required',
        'Please enter a warehouse name.',
      );
      return;
    }

    try {
      setSubmitting(true);

      await API.put(`/warehouses/${warehouse.id}`, {
        name: trimmedName,
        location: trimmedLocation || undefined,
      });

      showAlert(
        'success',
        'Warehouse Updated',
        'Warehouse information updated successfully.',
        () => navigation.goBack(),
      );
    } catch (error: any) {
      console.log(
        'UPDATE WAREHOUSE ERROR:',
        error?.response?.data || error,
      );

      showAlert(
        'error',
        'Update Failed',
        error?.response?.data?.message ||
          'Unable to update warehouse.',
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
            Edit Warehouse
          </Text>

          <Text style={styles.headerSubtitle}>
            Update warehouse information
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
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>

        {/* Warehouse Icon */}
        <View style={styles.iconContainer}>
          <WarehouseIcon
            size={34}
            color="#1769E0"
            strokeWidth={1.8}
          />
        </View>

        <Text style={styles.pageTitle}>
          Warehouse Details
        </Text>

        <Text style={styles.pageDescription}>
          Update the name and location of this warehouse.
        </Text>

        {/* Warehouse Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Warehouse Name
          </Text>

          <View style={styles.inputCard}>
            <WarehouseIcon
              size={20}
              color="#1769E0"
              strokeWidth={2}
            />

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter warehouse name"
              placeholderTextColor={theme.placeholderText}
              style={styles.input}
              editable={!submitting}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Location */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Location
          </Text>

          <View style={styles.inputCard}>
            <MapPin
              size={20}
              color="#1769E0"
              strokeWidth={2}
            />

            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Enter warehouse location"
              placeholderTextColor={theme.placeholderText}
              style={styles.input}
              editable={!submitting}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Warehouse ID */}
        <View style={styles.idCard}>
          <View style={styles.idIcon}>
            <Text style={styles.hash}>
              #
            </Text>
          </View>

          <View style={styles.idContent}>
            <Text style={styles.idLabel}>
              Warehouse ID
            </Text>

            <Text style={styles.idValue}>
              #{warehouse.id}
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <Pressable
          disabled={submitting}
          style={({pressed}) => [
            styles.saveButton,
            submitting && styles.disabledButton,
            pressed && !submitting && styles.pressedButton,
          ]}
          onPress={handleUpdate}>

          {submitting ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.saveButtonText}>
              Save Changes
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

export default EditWarehouseScreen;

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
      minWidth: 0,
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

    menuButton: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 10,
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
      paddingHorizontal: 20,
    },

    fieldContainer: {
      marginTop: 24,
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

    input: {
      flex: 1,
      marginLeft: 11,
      paddingVertical: 0,
      fontSize: 14,
      color: theme.textPrimary,
      fontWeight: '600',
    },

    idCard: {
      marginTop: 22,
      minHeight: 64,
      borderRadius: 15,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EFF6FF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(23, 105, 224, 0.3)' : '#DBEAFE',
      paddingHorizontal: 13,
      flexDirection: 'row',
      alignItems: 'center',
    },

    idIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: theme.cardBg,
      alignItems: 'center',
      justifyContent: 'center',
    },

    hash: {
      fontSize: 18,
      fontWeight: '800',
      color: '#1769E0',
    },

    idContent: {
      marginLeft: 11,
      flex: 1,
    },

    idLabel: {
      fontSize: 11,
      color: theme.textSecondary,
      fontWeight: '600',
    },

    idValue: {
      marginTop: 2,
      fontSize: 14,
      color: theme.textPrimary,
      fontWeight: '800',
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