import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {
  Mail,
  MapPin,
  Menu,
  Phone,
  Trash2,
  User,
  Users,
  Edit3,
} from 'lucide-react-native';

import API from '../../services/api';
import CustomAlert from '../../components/CustomAlert';
import {useDrawer} from '../../context/DrawerContext';
import {useAppTheme, ThemeColors} from '../../context/ThemeContext';

type Supplier = {
  id: number;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

type Props = {
  navigation: any;
  route: {
    params: {
      supplierId: number;
    };
  };
};

const SupplierDetailsScreen = ({navigation, route}: Props) => {
  const {openDrawer} = useDrawer();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const supplierId = route?.params?.supplierId;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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

  const loadSupplier = async () => {
    try {
      setLoading(true);

      const response = await API.get(`/suppliers/${supplierId}`);
      const data = response?.data;

      if (data?.supplier) {
        setSupplier(data.supplier);
      } else if (data?.data) {
        setSupplier(data.data);
      } else if (data?.id) {
        setSupplier(data);
      } else {
        setSupplier(null);
      }
    } catch (error: any) {
      console.log(
        'SUPPLIER DETAILS ERROR:',
        error?.response?.data || error,
      );

      showAlert(
        'error',
        'Unable to Load',
        error?.response?.data?.message ||
          'Unable to load supplier details.',
        () => navigation.goBack(),
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSupplier();
    }, [supplierId]),
  );

  const handleDelete = () => {
    if (!supplier || deleting) {
      return;
    }

    showAlert(
      'warning',
      'Delete Supplier?',
      `Are you sure you want to delete "${supplier.name}"? This action cannot be undone.`,
      async () => {
        try {
          setDeleting(true);

          await API.delete(`/suppliers/${supplier.id}`);

          showAlert(
            'success',
            'Supplier Deleted',
            'Supplier deleted successfully.',
            () => navigation.goBack(),
          );
        } catch (error: any) {
          console.log(
            'DELETE SUPPLIER ERROR:',
            error?.response?.data || error,
          );

          showAlert(
            'error',
            'Delete Failed',
            error?.response?.data?.message ||
              'Unable to delete supplier.',
          );
        } finally {
          setDeleting(false);
        }
      },
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingIcon}>
          <Users
            size={30}
            color="#1769E0"
            strokeWidth={1.8}
          />
        </View>

        <ActivityIndicator
          size="small"
          color="#1769E0"
          style={styles.loader}
        />

        <Text style={styles.loadingText}>
          Loading supplier...
        </Text>
      </View>
    );
  }

  if (!supplier) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIcon}>
          <Users
            size={44}
            color="#94A3B8"
            strokeWidth={1.5}
          />
        </View>

        <Text style={styles.emptyTitle}>
          Supplier not found
        </Text>

        <Text style={styles.emptyText}>
          The supplier information could not be loaded.
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={[]}>
      
      {/* Header */}
      <View style={styles.header}>
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

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            Supplier Details
          </Text>

          <Text style={styles.headerSubtitle}>
            Manage supplier information
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>

        {/* Supplier Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Users
                size={34}
                color="#1769E0"
                strokeWidth={1.8}
              />
            </View>

            <View style={styles.idBadge}>
              <Text style={styles.idBadgeText}>
                ID #{supplier.id}
              </Text>
            </View>
          </View>

          <Text
            style={styles.supplierName}
            numberOfLines={2}>
            {supplier.name}
          </Text>

          {supplier.contactPerson ? (
            <View style={styles.contactRow}>
              <User
                size={16}
                color="#64748B"
                strokeWidth={2}
              />

              <Text
                style={styles.contactText}
                numberOfLines={2}>
                {supplier.contactPerson}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Information */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Supplier Information
          </Text>

          <Text style={styles.sectionSubtitle}>
            Contact and address details
          </Text>
        </View>

        <View style={styles.infoCard}>
          {/* ID */}
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <View style={styles.iconBlue}>
                <Text style={styles.hashIcon}>#</Text>
              </View>

              <Text style={styles.infoLabel}>
                Supplier ID
              </Text>
            </View>

            <Text style={styles.infoValue}>
              #{supplier.id}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Name */}
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <View style={styles.iconBlue}>
                <Users
                  size={16}
                  color="#1769E0"
                  strokeWidth={2}
                />
              </View>

              <Text style={styles.infoLabel}>
                Name
              </Text>
            </View>

            <Text
              style={styles.infoValue}
              numberOfLines={2}>
              {supplier.name}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Contact */}
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <View style={styles.iconBlue}>
                <User
                  size={16}
                  color="#1769E0"
                  strokeWidth={2}
                />
              </View>

              <Text style={styles.infoLabel}>
                Contact Person
              </Text>
            </View>

            <Text
              style={styles.infoValue}
              numberOfLines={2}>
              {supplier.contactPerson || 'Not specified'}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Phone */}
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <View style={styles.iconBlue}>
                <Phone
                  size={16}
                  color="#1769E0"
                  strokeWidth={2}
                />
              </View>

              <Text style={styles.infoLabel}>
                Phone
              </Text>
            </View>

            <Text
              style={styles.infoValue}
              numberOfLines={2}>
              {supplier.phone || 'Not specified'}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Email */}
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <View style={styles.iconBlue}>
                <Mail
                  size={16}
                  color="#1769E0"
                  strokeWidth={2}
                />
              </View>

              <Text style={styles.infoLabel}>
                Email
              </Text>
            </View>

            <Text
              style={styles.infoValue}
              numberOfLines={2}>
              {supplier.email || 'Not specified'}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Address */}
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <View style={styles.iconBlue}>
                <MapPin
                  size={16}
                  color="#1769E0"
                  strokeWidth={2}
                />
              </View>

              <Text style={styles.infoLabel}>
                Address
              </Text>
            </View>

            <Text
              style={styles.infoValue}
              numberOfLines={3}>
              {supplier.address || 'Not specified'}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Actions
          </Text>

          <Text style={styles.sectionSubtitle}>
            Manage this supplier
          </Text>
        </View>

        {/* Edit */}
        <Pressable
          style={({pressed}) => [
            styles.actionCard,
            pressed && styles.pressedCard,
          ]}
          onPress={() =>
            navigation.navigate('EditSupplier', {
              supplierId: supplier.id,
              supplier,
            })
          }>

          <View style={styles.actionIconBlue}>
            <Edit3
              size={21}
              color="#1769E0"
              strokeWidth={2}
            />
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
              Edit Supplier
            </Text>

            <Text style={styles.actionSubtitle}>
              Update supplier information
            </Text>
          </View>
        </Pressable>

        {/* Delete */}
        <Pressable
          disabled={deleting}
          style={({pressed}) => [
            styles.actionCard,
            styles.deleteCard,
            deleting && styles.disabledCard,
            pressed && !deleting && styles.pressedCard,
          ]}
          onPress={handleDelete}>

          <View style={styles.actionIconRed}>
            {deleting ? (
              <ActivityIndicator
                size="small"
                color="#D64545"
              />
            ) : (
              <Trash2
                size={21}
                color="#D64545"
                strokeWidth={2}
              />
            )}
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.deleteTitle}>
              {deleting
                ? 'Deleting Supplier...'
                : 'Delete Supplier'}
            </Text>

            <Text style={styles.deleteSubtitle}>
              Permanently remove this supplier
            </Text>
          </View>
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
    </SafeAreaView>
  );
};

const getStyles = (theme: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.bg,
      paddingHorizontal: 30,
    },

    loadingIcon: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.2)' : '#EAF2FD',
      alignItems: 'center',
      justifyContent: 'center',
    },

    loader: {
      marginTop: 18,
    },

    loadingText: {
      marginTop: 10,
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: '500',
    },

    emptyIcon: {
      width: 84,
      height: 84,
      borderRadius: 26,
      backgroundColor: theme.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyTitle: {
      marginTop: 18,
      fontSize: 20,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    emptyText: {
      marginTop: 7,
      fontSize: 13,
      lineHeight: 20,
      color: theme.textSecondary,
      textAlign: 'center',
    },

    backButton: {
      marginTop: 22,
      paddingHorizontal: 28,
      height: 46,
      borderRadius: 13,
      backgroundColor: '#1769E0',
      alignItems: 'center',
      justifyContent: 'center',
    },

    backButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
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

    content: {
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 40,
    },

    heroCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadowColor,
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: isDark ? 0.3 : 0.06,
      shadowRadius: 8,
      elevation: 2,
    },

    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    heroIcon: {
      width: 64,
      height: 64,
      borderRadius: 19,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.2)' : '#EAF2FD',
      alignItems: 'center',
      justifyContent: 'center',
    },

    idBadge: {
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: theme.surfaceMuted,
    },

    idBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textSecondary,
    },

    supplierName: {
      marginTop: 17,
      fontSize: 23,
      lineHeight: 29,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 9,
    },

    contactText: {
      flex: 1,
      marginLeft: 6,
      fontSize: 13,
      color: theme.textSecondary,
    },

    sectionHeader: {
      marginTop: 23,
      marginBottom: 10,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    sectionSubtitle: {
      marginTop: 3,
      fontSize: 12,
      color: theme.textSecondary,
    },

    infoCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 17,
      paddingHorizontal: 15,
      borderWidth: 1,
      borderColor: theme.border,
    },

    infoRow: {
      minHeight: 68,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    infoLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
    },

    iconBlue: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.2)' : '#EAF2FD',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },

    hashIcon: {
      fontSize: 17,
      fontWeight: '800',
      color: '#1769E0',
    },

    infoLabel: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: '600',
    },

    infoValue: {
      maxWidth: '52%',
      marginLeft: 12,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: '700',
      color: theme.textPrimary,
      textAlign: 'right',
      flexShrink: 1,
    },

    divider: {
      height: 1,
      backgroundColor: theme.borderLight,
    },

    actionCard: {
      minHeight: 76,
      borderRadius: 17,
      backgroundColor: theme.cardBg,
      paddingHorizontal: 14,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },

    deleteCard: {
      borderColor: theme.errorBorder,
      backgroundColor: isDark ? 'rgba(220, 38, 38, 0.1)' : '#FFFDFD',
    },

    disabledCard: {
      opacity: 0.65,
    },

    actionIconBlue: {
      width: 46,
      height: 46,
      borderRadius: 13,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.2)' : '#EAF2FD',
      alignItems: 'center',
      justifyContent: 'center',
    },

    actionIconRed: {
      width: 46,
      height: 46,
      borderRadius: 13,
      backgroundColor: isDark ? 'rgba(220, 38, 38, 0.2)' : '#FFF0F0',
      alignItems: 'center',
      justifyContent: 'center',
    },

    actionContent: {
      flex: 1,
      marginLeft: 12,
      minWidth: 0,
    },

    actionTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    actionSubtitle: {
      marginTop: 4,
      fontSize: 12,
      lineHeight: 17,
      color: theme.textSecondary,
    },

    deleteTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.errorText,
    },

    deleteSubtitle: {
      marginTop: 4,
      fontSize: 12,
      lineHeight: 17,
      color: theme.textSecondary,
    },

    pressed: {
      opacity: 0.75,
    },

    pressedCard: {
      opacity: 0.75,
      transform: [{scale: 0.99}],
    },
  });

export default SupplierDetailsScreen;