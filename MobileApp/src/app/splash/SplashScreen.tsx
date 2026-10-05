import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import API from '../../services/api';
import apis from '../../services/endpoint';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation?: any;
};

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  // Animation values
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  const titleFade = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;

  const featuresFade = useRef(new Animated.Value(0)).current;
  const featuresTranslateY = useRef(new Animated.Value(20)).current;

  const warehouseFade = useRef(new Animated.Value(0)).current;
  const warehouseTranslateY = useRef(new Animated.Value(30)).current;

  const bottomFade = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  const handleSplashComplete = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');

      // If token and authenticated flag exist, validate with backend /api/auth/me
      if (isAuthenticated && token) {
        try {
          await API.get(apis.me);
          navigation?.replace('Dashboard');
          return;
        } catch (error: any) {
          if (error.response?.status === 401) {
            dispatch(logout());
          }
        }
      }

      if (hasSeenOnboarding === 'true') {
        navigation?.replace('Login');
        return;
      }

      navigation?.replace('Onboarding1');
    } catch (error) {
      console.log('Splash session check error:', error);
      navigation?.replace('Login');
    }
  };



  useEffect(() => {
    // 1. Logo animation (Fade & Spring scale)
    Animated.parallel([
      Animated.timing(logoFade, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Title & tagline animation
    Animated.parallel([
      Animated.timing(titleFade, {
        toValue: 1,
        duration: 550,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 550,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Feature cards animation
    Animated.parallel([
      Animated.timing(featuresFade, {
        toValue: 1,
        duration: 600,
        delay: 350,
        useNativeDriver: true,
      }),
      Animated.timing(featuresTranslateY, {
        toValue: 0,
        duration: 600,
        delay: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 4. Warehouse illustration animation
    Animated.parallel([
      Animated.timing(warehouseFade, {
        toValue: 1,
        duration: 700,
        delay: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(warehouseTranslateY, {
        toValue: 0,
        duration: 700,
        delay: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progress, {
  toValue: 1,
  duration: 5000,
  easing: Easing.linear,
  useNativeDriver: false,
}).start(({finished}) => {
  if (finished) {
    handleSplashComplete();
  }
});

    // 5. Bottom text & indicator animation
    Animated.timing(bottomFade, {
      toValue: 1,
      duration: 600,
      delay: 700,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Background Soft Glow Effect */}
      <View style={styles.bgCircleTopLeft} />
      <View style={styles.bgCircleTopRight} />

      <View style={styles.container}>
        {/* TOP SECTION: BRAND LOGO & TITLE */}
        <View style={styles.topSection}>
          {/* Logo with Speed Cart */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoFade,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Image
              source={require('../../assets/images/inventory-cart-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Title & Subtitle */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: titleFade,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            <Text style={styles.title}>
              Smart <Text style={styles.titleHighlight}>Inventory</Text>
            </Text>
            <Text style={styles.subtitle}>Track • Manage • Grow</Text>
          </Animated.View>

          {/* THREE QUICK ACTION / FEATURE CARDS */}
          <Animated.View
            style={[
              styles.featuresRow,
              {
                opacity: featuresFade,
                transform: [{ translateY: featuresTranslateY }],
              },
            ]}
          >
            {/* Feature 1: Track */}
            <View style={styles.featureItem}>
              <View style={styles.featureCard}>
                <Image
                  source={require('../../assets/images/icon-track-hd.png')}
                  style={styles.featureIconImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.featureLabel}>Track</Text>
            </View>

            {/* Feature 2: Manage */}
            <View style={styles.featureItem}>
              <View style={styles.featureCard}>
                <Image
                  source={require('../../assets/images/icon-manage-hd.png')}
                  style={styles.featureIconImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.featureLabel}>Manage</Text>
            </View>

            {/* Feature 3: Grow */}
            <View style={styles.featureItem}>
              <View style={styles.featureCard}>
                <Image
                  source={require('../../assets/images/icon-grow-hd.png')}
                  style={styles.featureIconImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.featureLabel}>Grow</Text>
            </View>
          </Animated.View>
        </View>

        {/* MIDDLE SECTION: WAREHOUSE & FORKLIFT ILLUSTRATION */}
        <Animated.View
          style={[
            styles.illustrationContainer,
            {
              opacity: warehouseFade,
              transform: [{ translateY: warehouseTranslateY }],
            },
          ]}
        >
          <Image
            source={require('../../assets/images/warehouse-illustration.png')}
            style={styles.warehouseImage}
            resizeMode="cover"
          />
        </Animated.View>

        {/* BOTTOM SECTION: MOTTO & SLIDER INDICATOR */}
        <Animated.View
          style={[
            styles.bottomSection,
            {
              opacity: bottomFade,
            },
          ]}
        >
          <Text style={styles.mottoText}>Inventory today,</Text>
          <Text style={styles.mottoHighlight}>a stronger tomorrow.</Text>

          {/* Slider Pagination Indicator */}
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FBFF',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 12 : 20,
    backgroundColor: '#FFFFFF',
  },

  // Soft Ambient Background Shapes
  bgCircleTopLeft: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#E8F2FF',
    opacity: 0.6,
  },
  bgCircleTopRight: {
    position: 'absolute',
    top: -40,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#EDF5FF',
    opacity: 0.5,
  },

  // Top Section
  topSection: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 10,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoImage: {
    width: 140,
    height: 95,
  },

  // Title
  titleContainer: {
    alignItems: 'center',
    marginTop: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F1E36',
    letterSpacing: -0.4,
  },
  titleHighlight: {
    color: '#136DEC',
  },
  subtitle: {
    marginTop: 5,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#6A7D93',
    letterSpacing: 1.4,
  },

  // Feature Cards Row
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '85%',
    marginTop: 22,
    gap: 28,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureCard: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: '#EBF3FE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#136DEC',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  featureIconImage: {
    width: 28,
    height: 28,
  },
  featureLabel: {
    marginTop: 7,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E293B',
  },

  // Middle Section (Warehouse Image)
  illustrationContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    overflow: 'hidden',
  },
  warehouseImage: {
    width: width,
    height: height * 0.32,
    maxHeight: 250,
  },

  // Bottom Section
  bottomSection: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 14 : 22,
  },
  mottoText: {
    fontSize: 16.5,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  mottoHighlight: {
    marginTop: 3,
    fontSize: 17.5,
    fontWeight: '700',
    color: '#136DEC',
    textAlign: 'center',
  },

  // Pagination Indicator
  progressBar: {
    width: '72%',
    height: 5,
    borderRadius: 10,
    backgroundColor: '#DCE9FA',
    overflow: 'hidden',
    marginTop: 18,
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#136DEC',
    borderRadius: 10,
  },
});
