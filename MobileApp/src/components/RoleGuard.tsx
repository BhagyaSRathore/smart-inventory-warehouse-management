import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {useSelector} from 'react-redux';
import {ShieldAlert, ArrowLeft} from 'lucide-react-native';
import {RootState} from '../store/store';
import {hasRole, normalizeRole, ROLES} from '../utils/roles';

import {useAppTheme} from '../context/ThemeContext';

type RoleGuardProps = {
  allowedRoles: readonly string[] | string[];
  navigation?: any;
  title?: string;
  message?: string;
  children: React.ReactNode;
};

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  navigation,
  title = 'Access Restricted',
  message,
  children,
}) => {
  const {theme, isDark} = useAppTheme();
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = normalizeRole(user?.role);
  const isAllowed = hasRole(userRole, allowedRoles);

  if (isAllowed) {
    return <>{children}</>;
  }

  const roleLabels: Record<string, string> = {
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.WAREHOUSE_MANAGER]: 'Warehouse Manager',
    [ROLES.STAFF]: 'Warehouse Staff',
  };

  const defaultMessage = `Your current account (${
    roleLabels[userRole] || userRole
  }) does not have permission to access this screen. Please contact an Administrator if you believe this is an error.`;

  const handleGoBack = () => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation?.navigate) {
      navigation.navigate('DashboardHome');
    }
  };

  const handleGoDashboard = () => {
    if (navigation?.navigate) {
      navigation.navigate('DashboardHome');
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.bg}]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.headerBg,
            borderBottomColor: theme.headerBorder,
          },
        ]}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={[
            styles.backButton,
            {backgroundColor: theme.headerButtonBg},
          ]}
          activeOpacity={0.7}>
          <ArrowLeft size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.textPrimary}]}>Unauthorized</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark ? theme.errorBg : '#FEE2E2',
              borderColor: isDark ? theme.errorBorder : '#FEF2F2',
            },
          ]}>
          <ShieldAlert size={48} color="#D64545" strokeWidth={2} />
        </View>

        <Text style={[styles.title, {color: theme.textPrimary}]}>{title}</Text>

        <View
          style={[
            styles.roleBadge,
            {backgroundColor: isDark ? theme.surfaceMuted : '#E2E8F0'},
          ]}>
          <Text
            style={[
              styles.roleBadgeText,
              {color: isDark ? theme.textSecondary : '#475569'},
            ]}>
            CURRENT ROLE: {roleLabels[userRole]?.toUpperCase() || userRole}
          </Text>
        </View>

        <Text style={[styles.message, {color: theme.textSecondary}]}>{message || defaultMessage}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGoDashboard}
            activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Return to Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
              },
            ]}
            onPress={handleGoBack}
            activeOpacity={0.85}>
            <Text
              style={[
                styles.secondaryButtonText,
                {color: theme.textPrimary},
              ]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#102A43',
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 6,
    borderColor: '#FEF2F2',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#102A43',
    textAlign: 'center',
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    color: '#627D98',
    textAlign: 'center',
    marginBottom: 28,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#1769E0',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1769E0',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  secondaryButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
});

export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: readonly string[] | string[],
  customMessage?: string,
) {
  return function GuardedScreen(props: P & {navigation?: any}) {
    return (
      <RoleGuard
        allowedRoles={allowedRoles}
        navigation={props.navigation}
        message={customMessage}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}

export default RoleGuard;
