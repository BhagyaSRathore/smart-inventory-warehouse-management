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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import API from '../../services/api';
import apis from '../../services/endpoint';
import CustomAlert from '../../components/CustomAlert';

type Props = {
  navigation: any;
};

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
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
            placeholderTextColor="#91A0B8"
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
    fontSize: 30,
    fontWeight: '800',
    color: '#10265A',
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

  input: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4E3F8',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#172554',
    marginBottom: 20,

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
    color: '#64748B',
    fontSize: 14,
  },

  backButton: {
    color: '#1769E0',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 5,
  },
});
