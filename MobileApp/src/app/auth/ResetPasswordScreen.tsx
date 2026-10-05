import React, { useState } from 'react';
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
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import API from '../../services/api';
import apis from '../../services/endpoint';
import CustomAlert from '../../components/CustomAlert';

type Props = {
  navigation: any;
  route: any;
};

const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const email = route?.params?.email || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

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

  const validate = (): boolean => {
    let isValid = true;

    if (!newPassword) {
      setPasswordError('Password cannot be empty.');
      isValid = false;
    } else if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      isValid = false;
    } else {
      setPasswordError('');
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.');
      isValid = false;
    } else if (newPassword && confirmPassword !== newPassword) {
      setConfirmPasswordError('Passwords do not match.');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }

    return isValid;
  };

  const handleUpdatePassword = async () => {
    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      await API.post(apis.resetPassword, {
        email: email.trim(),
        newPassword,
      });

      setLoading(false);
      // Switch to success view
      setIsSuccess(true);
    } catch (error: any) {
      setLoading(false);
      const serverMessage =
        error.response?.data?.message ||
        error.message ||
        'Unable to update password. Please try again.';

      showAlert('error', 'Update Failed', serverMessage);
    }
  };

  // Render Success Screen after successful password reset
  if (isSuccess) {
    return (
      <View style={[styles.container, styles.successContainer]}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.successCard}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={46} color="#1769E0" strokeWidth={2.5} />
          </View>

          <Text style={styles.successTitle}>Password Updated!</Text>

          <Text style={styles.successMessage}>
            Your password has been updated successfully.
          </Text>

          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={() => navigation.replace('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isFormValid =
    newPassword.length >= 8 &&
    confirmPassword.length >= 8 &&
    newPassword === confirmPassword;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS === 'ios'}
    >
      <StatusBar barStyle="dark-content" />

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
            Create New <Text style={styles.titleBlue}>Password</Text>
          </Text>

          <Text style={styles.subtitle}>
            Enter your new password below.
          </Text>
        </View>

        {/* FORM */}
        <View style={styles.form}>
          {/* NEW PASSWORD */}
          <Text style={styles.label}>New Password</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.passwordInput,
                passwordError ? styles.inputError : null,
              ]}
              placeholder="Enter at least 8 characters"
              placeholderTextColor="#91A0B8"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (text.length >= 8) {
                  setPasswordError('');
                }
                if (confirmPassword && text !== confirmPassword) {
                  setConfirmPasswordError('Passwords do not match.');
                } else if (confirmPassword && text === confirmPassword) {
                  setConfirmPasswordError('');
                }
              }}
              secureTextEntry={!showNewPassword}
            />

            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowNewPassword((prev) => !prev)}
              activeOpacity={0.7}
            >
              {showNewPassword ? (
                <EyeOff size={21} color="#647899" />
              ) : (
                <Eye size={21} color="#647899" />
              )}
            </TouchableOpacity>
          </View>
          {passwordError ? (
            <Text style={styles.fieldErrorText}>{passwordError}</Text>
          ) : null}

          {/* CONFIRM PASSWORD */}
          <Text style={styles.label}>Confirm Password</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.passwordInput,
                confirmPasswordError ? styles.inputError : null,
              ]}
              placeholder="Re-enter your new password"
              placeholderTextColor="#91A0B8"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (newPassword && text !== newPassword) {
                  setConfirmPasswordError('Passwords do not match.');
                } else {
                  setConfirmPasswordError('');
                }
              }}
              secureTextEntry={!showConfirmPassword}
            />

            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              activeOpacity={0.7}
            >
              {showConfirmPassword ? (
                <EyeOff size={21} color="#647899" />
              ) : (
                <Eye size={21} color="#647899" />
              )}
            </TouchableOpacity>
          </View>
          {confirmPasswordError ? (
            <Text style={styles.fieldErrorText}>{confirmPasswordError}</Text>
          ) : null}

          {/* UPDATE PASSWORD BUTTON */}
          <TouchableOpacity
            style={[
              styles.updateButton,
              (!isFormValid || loading) && styles.disabledButton,
            ]}
            onPress={handleUpdatePassword}
            disabled={!isFormValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.updateText}>Update Password</Text>
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

export default ResetPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FBFF',
  },

  scrollView: {
    flex: 1,
    backgroundColor: '#F8FBFF',
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
    backgroundColor: '#EAF3FF',
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
    fontSize: 28,
    fontWeight: '800',
    color: '#10265A',
    textAlign: 'center',
  },

  titleBlue: {
    color: '#1769E0',
  },

  subtitle: {
    marginTop: 5,
    fontSize: 15,
    color: '#647899',
    textAlign: 'center',
  },

  /* FORM */

  form: {
    width: '100%',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#243B64',
    marginBottom: 8,
    marginLeft: 2,
  },

  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 16,
  },

  passwordInput: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4E3F8',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 15,
    color: '#172554',

    shadowColor: '#1769E0',
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
  },

  fieldErrorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: -10,
    marginBottom: 14,
    marginLeft: 4,
    fontWeight: '500',
  },

  eyeButton: {
    position: 'absolute',
    right: 15,
    padding: 6,
  },

  /* UPDATE BUTTON */

  updateButton: {
    height: 54,
    borderRadius: 15,
    backgroundColor: '#1769E0',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,

    shadowColor: '#1769E0',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },

  disabledButton: {
    backgroundColor: '#8EB4EE',
    shadowOpacity: 0.05,
    elevation: 0,
  },

  updateText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  /* BACK TO LOGIN */

  backRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 35,
  },

  backLabel: {
    color: '#64748B',
    fontSize: 14,
  },

  backButton: {
    color: '#1769E0',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 5,
  },

  /* SUCCESS STATE */

  successContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  successCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',

    shadowColor: '#1769E0',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },

  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10265A',
    textAlign: 'center',
    marginBottom: 8,
  },

  successMessage: {
    fontSize: 15,
    color: '#647899',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },

  backToLoginButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#1769E0',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#1769E0',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  backToLoginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
