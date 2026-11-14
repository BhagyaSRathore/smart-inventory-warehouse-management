import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';
import API from '../../services/api';
import apis from '../../services/endpoints';
import CustomAlert from '../../components/CustomAlert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, ThemeColors } from '../../context/ThemeContext';

type Props = {
  navigation: any;
};

const RegisterScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [role, setRole] = useState('');
  const [showRoles, setShowRoles] = useState(false);

  const getRoleDisplay = (r: string) => {
    if (r === 'WAREHOUSE_MANAGER' || r === 'Warehouse Manager') return 'Warehouse Manager';
    if (r === 'ADMIN' || r === 'Admin') return 'Admin';
    if (r === 'STAFF' || r === 'Staff') return 'Staff';
    return r || 'Select your role';
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('info');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
  ) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      showAlert('error', 'Missing Name', 'Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      showAlert('error', 'Missing Email', 'Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showAlert(
        'error',
        'Invalid Email',
        'Please enter a valid email address.',
      );
      return;
    }

    if (!password) {
      showAlert('error', 'Missing Password', 'Please enter a password.');
      return;
    }

    if (password.length < 6) {
      showAlert(
        'error',
        'Invalid Password',
        'Password must be at least 6 characters.',
      );
      return;
    }

    if (password !== confirmPassword) {
      showAlert('error', 'Password Mismatch', 'Passwords do not match.');
      return;
    }

    if (!role) {
      showAlert('error', 'Missing Role', 'Please select your role.');
      return;
    }

    try {
      const response = await API.post(apis.register, {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      console.log('REGISTER RESPONSE:', response.data);

      showAlert('success', 'Registration Successful', 'You can now log in!');
    } catch (error: any) {
      console.log('REGISTER ERROR:', error);
      console.log('STATUS:', error.response?.status);
      console.log('DATA:', error.response?.data);

      showAlert(
        'error',
        'Registration Failed',
        error.response?.data?.message ||
          error.message ||
          'Something went wrong',
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: 16,
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
          <View style={styles.logoBox}>
            <Image
              source={require('../../assets/images/inventory-cart-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>
            Create <Text style={styles.titleBlue}>Account</Text>
          </Text>

          <Text style={styles.subtitle}>
            Create your account to manage inventory
          </Text>
        </View>

        {/* FORM */}
        <View style={styles.form}>
          {/* NAME */}
          <Text style={styles.label}>Full Name</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={theme.placeholderText}
            value={name}
            onChangeText={setName}
          />

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
              placeholder="Create a password"
              placeholderTextColor={theme.placeholderText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              {showPassword ? (
                <EyeOff size={21} color={theme.textSecondary} />
              ) : (
                <Eye size={21} color={theme.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          {/* CONFIRM PASSWORD */}
          <Text style={styles.label}>Confirm Password</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm your password"
              placeholderTextColor={theme.placeholderText}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />

            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              activeOpacity={0.7}
            >
              {showConfirmPassword ? (
                <EyeOff size={21} color={theme.textSecondary} />
              ) : (
                <Eye size={21} color={theme.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          {/* ROLE */}
          <Text style={styles.label}>Select Role</Text>

          <TouchableOpacity
            style={styles.roleInput}
            onPress={() => setShowRoles(!showRoles)}
            activeOpacity={0.8}
          >
            <Text
              style={role ? styles.selectedRoleText : styles.placeholderText}
            >
              {getRoleDisplay(role)}
            </Text>

            <Text style={styles.dropdownArrow}>{showRoles ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {/* DROPDOWN */}
          {showRoles && (
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => {
                  setRole('ADMIN');
                  setShowRoles(false);
                }}
              >
                <Text style={styles.dropdownText}>Admin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => {
                  setRole('WAREHOUSE_MANAGER');
                  setShowRoles(false);
                }}
              >
                <Text style={styles.dropdownText}>Warehouse Manager</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => {
                  setRole('STAFF');
                  setShowRoles(false);
                }}
              >
                <Text style={styles.dropdownText}>Staff</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* REGISTER BUTTON */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            activeOpacity={0.85}
          >
            <Text style={styles.registerButtonText}>Create Account</Text>

            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* LOGIN */}
        <View style={styles.loginRow}>
          <Text style={styles.loginLabel}>Already have an account?</Text>

          <TouchableOpacity
            onPress={() => {
              setAlertVisible(false);
              navigation.replace('Login');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        buttonText="OK"
        onPress={() => {
          setAlertVisible(false);

          if (alertType === 'success') {
            navigation.replace('Login');
          }
        }}
      />
    </SafeAreaView>
  );
};

export default RegisterScreen;

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

    header: {
      alignItems: 'center',
      marginBottom: 28,
    },

    logoBox: {
      width: 64,
      height: 64,
      borderRadius: 22,
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.15)' : '#EAF3FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 15,

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
      width: 58,
      height: 58,
    },

    title: {
      fontSize: 29,
      fontWeight: '800',
      color: theme.textPrimary,
    },

    titleBlue: {
      color: '#1769E0',
    },

    subtitle: {
      marginTop: 6,
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
    },

    form: {
      width: '100%',
    },

    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 7,
      marginLeft: 2,
    },

    input: {
      height: 52,
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 14,
      paddingHorizontal: 15,
      fontSize: 15,
      color: theme.textPrimary,
      marginBottom: 15,

      shadowColor: theme.shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.04,
      shadowRadius: 5,
      elevation: 1,
    },

    /* PASSWORD */
    passwordContainer: {
      height: 52,
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 15,
      paddingRight: 8,
      marginBottom: 15,

      shadowColor: theme.shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.04,
      shadowRadius: 5,
      elevation: 1,
    },

    passwordInput: {
      flex: 1,
      height: 52,
      fontSize: 15,
      color: theme.textPrimary,
    },

    eyeButton: {
      width: 42,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },

    eyeIcon: {
      fontSize: 21,
      color: theme.textSecondary,
    },

    /* ROLE */
    roleInput: {
      height: 52,
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 14,
      paddingHorizontal: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 15,
    },

    placeholderText: {
      fontSize: 15,
      color: theme.placeholderText,
    },

    selectedRoleText: {
      fontSize: 15,
      color: theme.textPrimary,
      fontWeight: '500',
    },

    dropdownArrow: {
      fontSize: 13,
      color: theme.textSecondary,
    },

    dropdown: {
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 14,
      marginTop: -8,
      marginBottom: 15,
      overflow: 'hidden',
    },

    dropdownOption: {
      height: 50,
      justifyContent: 'center',
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },

    dropdownText: {
      fontSize: 14,
      color: theme.textPrimary,
    },

    /* BUTTON */
    registerButton: {
      height: 55,
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

    registerButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },

    arrow: {
      color: '#FFFFFF',
      fontSize: 23,
      marginLeft: 10,
    },

    /* LOGIN */
    loginRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 25,
    },

    loginLabel: {
      color: theme.textSecondary,
      fontSize: 14,
    },

    loginLink: {
      color: '#1769E0',
      fontSize: 14,
      fontWeight: '700',
      marginLeft: 5,
    },
  });
