import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import API from '../../services/api';
import apis from '../../services/endpoint';
import CustomAlert from '../../components/CustomAlert';
import { useAppTheme, ThemeColors } from '../../context/ThemeContext';

type Props = {
  navigation: any;
};

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'error',
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

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) {
      setEmailError('Email address is required.');
      return false;
    }
    if (!emailRegex.test(value.trim())) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleContinue = async () => {
    if (!validateEmail(email)) {
      return;
    }

    try {
      setLoading(true);
      const response = await API.post(apis.forgotPassword, {
        email: email.trim(),
      });

      setLoading(false);
      // Navigate to Reset Password screen with the verified email
      navigation.navigate('ResetPassword', {
        email: email.trim(),
      });
    } catch (error: any) {
      setLoading(false);
      const serverMessage =
        error.response?.data?.message ||
        error.message ||
        'Unable to verify email. Please try again.';

      showAlert('error', 'Verification Failed', serverMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS === 'ios'}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top > 0 ? insets.top + 16 : 55,
            paddingBottom: Math.max(insets.bottom, 16) + 16,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* HEADER */}
        <View style={styles.header}>
          {/* LOGO */}
          <View style={styles.logoBox}>
            <Image
              source={require('../../assets/images/inventory-cart-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>
            Forgot <Text style={styles.titleBlue}>Password?</Text>
          </Text>

          <Text style={styles.subtitle}>
            Enter your email to reset your password.
          </Text>
        </View>

        {/* FORM */}
        <View style={styles.form}>
          {/* EMAIL */}
          <Text style={styles.label}>Email</Text>

          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="Enter your registered email"
            placeholderTextColor={theme.placeholderText}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) {
                setEmailError('');
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {emailError ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : null}

          {/* CONTINUE BUTTON */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.continueText}>Continue</Text>
                <Text style={styles.arrow}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* BACK TO LOGIN */}
        <View style={styles.backRow}>
          <Text style={styles.backLabel}>Remember your password?</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.backButton}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* CUSTOM ALERT */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onPress={() =>
          setAlertConfig((prev) => ({
            ...prev,
            visible: false,
          }))
        }
      />
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;

const getStyles = (theme: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    scrollView: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
    },

    /* HEADER */

    header: {
      alignItems: 'center',
      marginBottom: 38,
    },

    logoBox: {
      width: 88,
      height: 88,
      borderRadius: 24,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EAF3FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,

      shadowColor: '#1769E0',
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 4,
    },

    logo: {
      width: 70,
      height: 70,
    },

    title: {
      fontSize: 30,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    titleBlue: {
      color: '#1769E0',
    },

    subtitle: {
      marginTop: 5,
      fontSize: 15,
      color: theme.textSecondary,
      textAlign: 'center',
    },

    /* FORM */

    form: {
      width: '100%',
    },

    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 8,
      marginLeft: 2,
    },

    input: {
      height: 54,
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 14,
      paddingHorizontal: 16,
      fontSize: 15,
      color: theme.textPrimary,
      marginBottom: 20,

      shadowColor: theme.shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.04,
      shadowRadius: 5,
      elevation: 1,
    },

    inputError: {
      borderColor: '#EF4444',
      marginBottom: 6,
    },

    errorText: {
      color: '#EF4444',
      fontSize: 13,
      marginBottom: 16,
      marginLeft: 4,
      fontWeight: '500',
    },

    /* CONTINUE */

    continueButton: {
      height: 54,
      borderRadius: 15,
      backgroundColor: '#1769E0',

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',

      shadowColor: '#1769E0',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.22,
      shadowRadius: 10,
      elevation: 4,
    },

    continueText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
    },

    arrow: {
      color: '#FFFFFF',
      fontSize: 23,
      marginLeft: 10,
    },

    /* BACK TO LOGIN */

    backRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 35,
    },

    backLabel: {
      color: theme.textSecondary,
      fontSize: 14,
    },

    backButton: {
      color: '#1769E0',
      fontSize: 14,
      fontWeight: '700',
      marginLeft: 5,
    },
  });
