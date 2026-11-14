import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {Check, X, AlertTriangle, Info} from 'lucide-react-native';

import {useAppTheme} from '../context/ThemeContext';

type AlertType = 'success' | 'error' | 'warning' | 'info';

type Props = {
  visible: boolean;
  type?: AlertType;
  title: string;
  message: string;
  buttonText?: string;
  onPress: () => void;
  secondaryButtonText?: string;
  onSecondaryPress?: () => void;
};

const CustomAlert = ({
  visible,
  type = 'info',
  title,
  message,
  buttonText = 'OK',
  onPress,
  secondaryButtonText,
  onSecondaryPress,
}: Props) => {
  const {theme, isDark} = useAppTheme();

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <Check size={28} color="#1769E0" strokeWidth={3} />;

      case 'error':
        return <X size={28} color="#1769E0" strokeWidth={3} />;

      case 'warning':
        return (
          <AlertTriangle
            size={28}
            color="#1769E0"
            strokeWidth={2.5}
          />
        );

      default:
        return <Info size={28} color="#1769E0" strokeWidth={2.5} />;
    }
  };

  const hasSecondary = Boolean(secondaryButtonText && onSecondaryPress);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onSecondaryPress || onPress}>
      <View style={[styles.overlay, {backgroundColor: theme.modalOverlay}]}>
        <View
          style={[
            styles.alertBox,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.border,
              borderWidth: isDark ? 1 : 0,
            },
          ]}>

          <View
            style={[
              styles.iconCircle,
              {backgroundColor: isDark ? theme.surfaceMuted : '#EAF3FF'},
            ]}>
            {renderIcon()}
          </View>

          <Text style={[styles.title, {color: theme.textPrimary}]}>{title}</Text>

          <Text style={[styles.message, {color: theme.textSecondary}]}>{message}</Text>

          {hasSecondary ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: isDark ? theme.surfaceMuted : '#F1F5F9',
                    borderColor: theme.border,
                  },
                ]}
                onPress={onSecondaryPress}
                activeOpacity={0.85}>
                <Text
                  style={[
                    styles.secondaryButtonText,
                    {color: isDark ? theme.textSecondary : '#64748B'},
                  ]}>
                  {secondaryButtonText}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryRowButton}
                onPress={onPress}
                activeOpacity={0.85}>
                <Text style={styles.buttonText}>{buttonText}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={onPress}
              activeOpacity={0.85}>
              <Text style={styles.buttonText}>{buttonText}</Text>
            </TouchableOpacity>
          )}

        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },

  alertBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',

    shadowColor: '#1769E0',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10265A',
    textAlign: 'center',
  },

  message: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
    textAlign: 'center',
  },

  button: {
    width: '100%',
    height: 50,
    marginTop: 22,
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

  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  buttonRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },

  secondaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  secondaryButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '700',
  },

  primaryRowButton: {
    flex: 1,
    height: 50,
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
});