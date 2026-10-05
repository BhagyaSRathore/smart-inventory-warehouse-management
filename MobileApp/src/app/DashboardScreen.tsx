import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../store/store';
import {logout} from '../store/slices/authSlice';

type Props = {
  navigation?: any;
};

const DashboardScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    if (navigation?.replace) {
      navigation.replace('Login');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <Text style={styles.title}>Dashboard</Text>

        <Text style={styles.message}>
          Smart inventory management starts here.
        </Text>

        <Text style={styles.subMessage}>
          Track stock, manage warehouses and stay in control.
        </Text>

        {user && (
          <View style={styles.userCard}>
            <Text style={styles.userLabel}>Logged in as:</Text>
            <Text style={styles.userName}>{user.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            {user.role && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user.role}</Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.85}
          onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#172554',
  },

  message: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: '600',
    color: '#1769E0',
    textAlign: 'center',
  },

  subMessage: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
  },

  userCard: {
    marginTop: 28,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    width: '100%',
    alignItems: 'center',
    shadowColor: '#1769E0',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  userLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },

  userEmail: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },

  roleBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#EAF3FF',
  },

  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1769E0',
  },

  logoutButton: {
    marginTop: 32,
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },

  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});