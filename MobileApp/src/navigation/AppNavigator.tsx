import React, {useMemo} from 'react';
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {navigationRef, flushPendingNotification} from './navigationRef';
import SplashScreen from '../app/splash/SplashScreen';
import OnboardingScreen from '../app/onboarding/OnboardingScreen';
import LoginScreen from '../app/auth/LoginScreen';
import DrawerNavigator from './DrawerNavigator';
import RegisterScreen from '../app/auth/RegisterScreen';
import ForgotPasswordScreen from '../app/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../app/auth/ResetPasswordScreen';
import {useAppTheme} from '../context/ThemeContext';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const {isDark, theme} = useAppTheme();

  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = useMemo(
    () => ({
      ...baseTheme,
      dark: isDark,
      colors: {
        ...baseTheme.colors,
        primary: theme.primary,
        background: theme.bg,
        card: theme.cardBg,
        text: theme.textPrimary,
        border: theme.border,
      },
    }),
    [baseTheme, isDark, theme],
  );

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      onReady={() => {
        flushPendingNotification();
      }}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}>
        
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
        />

        <Stack.Screen
          name="Onboarding1"
          component={OnboardingScreen}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

       <Stack.Screen
  name="Dashboard"
  component={DrawerNavigator}
/>

        <Stack.Screen
          name="Register"
          component={RegisterScreen}
        />

        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
        />

        <Stack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;