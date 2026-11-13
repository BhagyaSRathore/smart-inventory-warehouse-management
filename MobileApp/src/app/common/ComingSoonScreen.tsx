import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {Menu, ArrowLeft, Clock, Sparkles} from 'lucide-react-native';
import {useDrawer} from '../../context/DrawerContext';
import {useAppTheme} from '../../context/ThemeContext';

type Props = {
  route?: any;
  navigation: any;
};

const ComingSoonScreen = ({route, navigation}: Props) => {
  const insets = useSafeAreaInsets();
  const {theme, isDark} = useAppTheme();
  const {openDrawer} = useDrawer();
  const title = route?.params?.title || route?.name || 'Coming Soon';
  const description =
    route?.params?.description ||
    'This module is part of Phase 2 and is currently under active development.';

  const handleOpenDrawer = () => {
    openDrawer();
  };

  const handleGoDashboard = () => {
    navigation.navigate('DashboardHome');
  };

  return (
    <SafeAreaView style={[styles.safeArea, {backgroundColor: theme.bg}]} edges={['top']}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.headerBg,
            borderBottomColor: theme.headerBorder,
          },
        ]}>
        <TouchableOpacity
          style={[styles.headerButton, {backgroundColor: theme.headerButtonBg}]}
          onPress={handleOpenDrawer}
          activeOpacity={0.7}>
          <Menu size={22} color="#1769E0" />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, {color: theme.textPrimary}]}>{title}</Text>

        <TouchableOpacity
          style={[styles.headerButton, {backgroundColor: theme.headerButtonBg}]}
          onPress={() => navigation.goBack?.()}
          activeOpacity={0.7}>
          <ArrowLeft size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={[styles.content, {paddingBottom: insets.bottom + 20}]}>
        <View
          style={[
            styles.iconCircle,
            {backgroundColor: isDark ? theme.surfaceMuted : '#EAF2FD'},
          ]}>
          <Clock size={48} color="#1769E0" strokeWidth={2.2} />
        </View>

        <View
          style={[
            styles.badge,
            {backgroundColor: isDark ? theme.surfaceMuted : '#EAF2FD'},
          ]}>
          <Sparkles size={14} color="#1769E0" />
          <Text style={styles.badgeText}>Phase 2 Module</Text>
        </View>

        <Text style={[styles.title, {color: theme.textPrimary}]}>{title}</Text>
        <Text style={[styles.description, {color: theme.textSecondary}]}>{description}</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleGoDashboard}
          activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FBFF',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#102A43',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EAF2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#1769E0',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1769E0',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#102A43',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#627D98',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#1769E0',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#1769E0',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ComingSoonScreen;
