import React, {useEffect, useRef} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import {
  AlertTriangle,
  PackageX,
  CheckCircle2,
  ShoppingCart,
  Bell,
  X,
} from 'lucide-react-native';
import {useAppTheme} from '../../context/ThemeContext';

export interface InAppNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

interface Props {
  notification: InAppNotificationData | null;
  onDismiss: () => void;
  onPress: (data?: Record<string, any>) => void;
}

const {width} = Dimensions.get('window');

const InAppNotificationBanner: React.FC<Props> = ({
  notification,
  onDismiss,
  onPress,
}) => {
  const {theme, isDark} = useAppTheme();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (notification) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Animate banner in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
          speed: 12,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 5 seconds
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, 5000);
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [notification]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handlePress = () => {
    const data = notification?.data;
    handleDismiss();
    if (data) {
      onPress(data);
    }
  };

  if (!notification) {
    return null;
  }

  const type = String(notification.data?.type || '').toUpperCase();
  const titleLower = notification.title.toLowerCase();

  let IconComponent = Bell;
  let iconColor = theme.primary;
  let iconBg = isDark ? 'rgba(23, 105, 224, 0.15)' : '#EFF6FF';
  let borderColor = theme.border;

  if (type === 'OUT_OF_STOCK' || titleLower.includes('out of stock')) {
    IconComponent = PackageX;
    iconColor = '#DC2626';
    iconBg = isDark ? 'rgba(220, 38, 38, 0.2)' : '#FEF2F2';
    borderColor = '#DC2626';
  } else if (
    type === 'LOW_STOCK' ||
    notification.data?.severity === 'WARNING' ||
    titleLower.includes('low stock')
  ) {
    IconComponent = AlertTriangle;
    iconColor = '#D97706';
    iconBg = isDark ? 'rgba(217, 119, 6, 0.2)' : '#FFFBEB';
    borderColor = '#D97706';
  } else if (
    titleLower.includes('restocked') ||
    titleLower.includes('replenished') ||
    type === 'INVENTORY_UPDATE'
  ) {
    IconComponent = CheckCircle2;
    iconColor = '#16A34A';
    iconBg = isDark ? 'rgba(22, 163, 74, 0.2)' : '#F0FDF4';
    borderColor = '#16A34A';
  } else if (type.includes('ORDER')) {
    IconComponent = ShoppingCart;
    iconColor = '#0284C7';
    iconBg = isDark ? 'rgba(2, 132, 199, 0.2)' : '#F0F9FF';
    borderColor = '#0284C7';
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{translateY}],
          opacity,
          backgroundColor: theme.cardBg,
          borderColor,
          shadowColor: isDark ? '#000000' : '#64748B',
        },
      ]}>
      <TouchableOpacity
        style={styles.content}
        activeOpacity={0.85}
        onPress={handlePress}>
        <View style={[styles.iconWrapper, {backgroundColor: iconBg}]}>
          <IconComponent size={20} color={iconColor} strokeWidth={2.2} />
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[styles.title, {color: theme.textPrimary}]}
            numberOfLines={1}>
            {notification.title}
          </Text>
          <Text
            style={[styles.body, {color: theme.textSecondary}]}
            numberOfLines={2}>
            {notification.body}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <X size={16} color={theme.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
    marginLeft: 4,
  },
});

export default InAppNotificationBanner;
