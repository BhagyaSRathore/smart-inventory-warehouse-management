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
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';
import API from '../../services/api';
import apis from '../../services/endpoint';
import { syncFCMTokenWithBackend } from '../../services/pushNotificationService';
import CustomAlert from '../../components/CustomAlert';
import { Eye, EyeOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, ThemeColors } from '../../context/ThemeContext';

type Props = {
  navigation: any;
};

const LoginScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const dispatch = useDispatch();

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

  const handleLogin = async () => {
    const trimmedIdentifier = email.trim();

    if (!trimmedIdentifier || !password) {
      showAlert(
        'error',
        'Missing Details',
        'Please enter your email and password.',
      );
      return;
    }

    try {
      setLoading(true);

      const response = await API.post(apis.login, {
        email: trimmedIdentifier,
        identifier: trimmedIdentifier,
        password,
      });

      const { token, user } = response.data;

      // Save credentials into Redux (redux-persist will persist state)
      dispatch(
        setCredentials({
          token,
          user,
        }),
      );

      // Register FCM device token with backend for authenticated user
      syncFCMTokenWithBackend().catch(err => {
        console.warn('Failed to sync FCM token upon login:', err);
      });

      setLoading(false);
      navigation.replace('Dashboard');
    } catch (error: any) {
      setLoading(false);
      const serverMessage =
        error.response?.data?.message ||
        error.message ||
        'Unable to login. Please check your credentials and try again.';

      showAlert('error', 'Login Failed', serverMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS === 'ios'}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
  style={styles.scrollView}
  contentContainerStyle={[
    styles.scrollContent,
    {
      paddingTop: insets.top > 0 ? insets.top + 16 : 38,
      paddingBottom: Math.max(insets.bottom, 16) + 80,
    },
  ]}
  keyboardShouldPersistTaps="handled"
  keyboardDismissMode="on-drag"
  showsVerticalScrollIndicator={true}
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
            Welcome <Text style={styles.titleBlue}>Back</Text>
          </Text>

          <Text style={styles.subtitle}>Login to manage your inventory</Text>

          <Text style={styles.subtitle}>and warehouse</Text>
        </View>

        {/* FORM */}
        <View style={styles.form}>
          {/* EMAIL */}
          <Text style={styles.label}>Email</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={theme.placeholderText}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* PASSWORD */}
          <Text style={styles.label}>Password</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor={theme.placeholderText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />

            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(prev => !prev)}
              activeOpacity={0.7}
            >
              {showPassword ? (
                <EyeOff size={21} color={theme.textSecondary} />
              ) : (
                <Eye size={21} color={theme.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          {/* FORGOT PASSWORD */}
          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.7}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* LOGIN BUTTON */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.loginText}>Login</Text>
                <Text style={styles.arrow}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* REGISTER */}
        <View style={styles.registerRow}>
          <Text style={styles.registerLabel}>Don't have an account?</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}
          >
            <Text style={styles.registerButton}>Register</Text>
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
          setAlertConfig(prev => ({
            ...prev,
            visible: false,
          }))
        }
      />
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

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
      paddingHorizontal: 24,
    },

    /* HEADER */

    header: {
      alignItems: 'center',
      marginBottom: 38,
    },

    logoBox: {
      width: 64,
      height: 64,
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

    /* FORGOT */

    forgotButton: {
      alignSelf: 'flex-end',
      marginTop: -8,
      marginBottom: 24,
    },

    forgotText: {
      color: '#1769E0',
      fontSize: 14,
      fontWeight: '600',
    },

    /* LOGIN */

    loginButton: {
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

    loginText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
    },

    arrow: {
      color: '#FFFFFF',
      fontSize: 23,
      marginLeft: 10,
    },

    /* REGISTER */

    registerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 35,
    },

    registerLabel: {
      color: theme.textSecondary,
      fontSize: 14,
    },

    registerButton: {
      color: '#1769E0',
      fontSize: 14,
      fontWeight: '700',
      marginLeft: 5,
    },

    passwordContainer: {
      position: 'relative',
      marginBottom: 20,
    },

    passwordInput: {
      height: 54,
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingRight: 50,
      fontSize: 15,
      color: theme.textPrimary,

      shadowColor: theme.shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.04,
      shadowRadius: 5,
      elevation: 1,
    },

    eyeButton: {
      position: 'absolute',
      right: 14,
      top: 0,
      height: 54,
      width: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
