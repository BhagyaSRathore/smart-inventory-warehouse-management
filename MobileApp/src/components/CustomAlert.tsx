import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {Check, X, AlertTriangle, Info} from 'lucide-react-native';

type AlertType = 'success' | 'error' | 'warning' | 'info';

type Props = {
  visible: boolean;
  type?: AlertType;
  title: string;
  message: string;
  buttonText?: string;
  onPress: () => void;
};

const CustomAlert = ({
  visible,
  type = 'info',
  title,
  message,
  buttonText = 'OK',
  onPress,
}: Props) => {
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onPress}>
      <View style={styles.overlay}>
        <View style={styles.alertBox}>

          <View style={styles.iconCircle}>
            {renderIcon()}
          </View>

          <Text style={styles.title}>{title}</Text>

          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onPress}
            activeOpacity={0.85}>
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>

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
});