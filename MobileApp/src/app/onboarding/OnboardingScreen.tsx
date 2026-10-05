import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export interface OnboardingSlide {
  id: string;
  theme: 'light' | 'dark';
  titlePrefix: string;
  titleHighlight: string;
  subtitle: string;
  image: any;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'insights',
    theme: 'light',
    titlePrefix: 'Grow with',
    titleHighlight: 'Smart Insights',
    subtitle: 'Get AI-powered demand prediction and restock recommendations.',
    image: require('../../assets/images/onboarding-insights.png'),
  },
  {
    id: 'locations',
    theme: 'light',
    titlePrefix: 'Track Across',
    titleHighlight: 'Multiple Locations',
    subtitle: 'Manage inventory across warehouses and keep everything in sync.',
    image: require('../../assets/images/onboarding-locations.png'),
  },
  {
    id: 'scan',
    theme: 'dark',
    titlePrefix: 'Scan Anything',
    titleHighlight: 'Instantly',
    subtitle: 'Use barcode or QR code to quickly perform stock operations with zero re-scans.',
    image: require('../../assets/images/onboarding-scan.png'),
  },
];

type Props = {
  navigation?: any;
  onFinish?: () => void;
};

const OnboardingScreen: React.FC<Props> = ({ navigation, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isDarkMode = ONBOARDING_SLIDES[currentIndex]?.theme === 'dark';

  const handleFinishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (e) {
      console.log('Error saving hasSeenOnboarding:', e);
    }
    if (onFinish) {
      onFinish();
    } else if (navigation?.replace) {
      navigation.replace('Login');
    } else if (navigation?.navigate) {
      navigation.navigate('Login');
    }
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleFinishOnboarding();
    }
  };

  const handleSkip = () => {
    handleFinishOnboarding();
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: any) => {
      if (viewableItems && viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const renderSlide = ({ item }: { item: OnboardingSlide }) => {
    const isDark = item.theme === 'dark';

    return (
      <View style={[styles.slideContainer, isDark && styles.darkSlideContainer]}>
        {/* Top Header / Skip Button */}
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSkip}
            style={styles.skipButton}
          >
            <Text style={[styles.skipText, isDark && styles.darkSkipText]}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Hero 3D Illustration */}
        <View style={styles.illustrationWrapper}>
          <Image
            source={item.image}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, isDark && styles.darkTitle]}>
            {item.titlePrefix}{'\n'}
            <Text style={[styles.titleHighlight, isDark && styles.darkTitleHighlight]}>
              {item.titleHighlight}
            </Text>
          </Text>

          <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
            {item.subtitle}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        isDarkMode ? styles.darkSafeArea : styles.lightSafeArea,
      ]}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      {/* Swipeable Slides */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfigRef.current}
      />

      {/* Persistent Bottom Bar with 4 Pagination Dots and Next Button */}
      <View style={[styles.footerContainer, isDarkMode && styles.darkFooterContainer]}>
        {/* Pagination Dots (4 dots as in the UI design) */}
        <View style={styles.paginationRow}>
          {[0, 1, 2, 3].map((dotIndex) => {
            const isActive = dotIndex === currentIndex;
            return (
              <View
                key={dotIndex}
                style={[
                  styles.dot,
                  isActive
                    ? isDarkMode
                      ? styles.darkActiveDot
                      : styles.activeDot
                    : isDarkMode
                    ? styles.darkInactiveDot
                    : styles.inactiveDot,
                ]}
              />
            );
          })}
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.nextButton, isDarkMode && styles.darkNextButton]}
          activeOpacity={0.85}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <Text style={styles.nextArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  lightSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  darkSafeArea: {
    backgroundColor: '#050E24',
  },

  slideContainer: {
    width: width,
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  darkSlideContainer: {
    backgroundColor: '#050E24',
  },

  // Header / Skip Button
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 4,
  },
  headerSpacer: {
    width: 40,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  darkSkipText: {
    color: '#94A3B8',
  },

  // Hero Illustration
  illustrationWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: height * 0.46,
    marginVertical: 10,
  },
  heroImage: {
    width: width * 0.88,
    height: '100%',
  },

  // Headings & Text Content
  textContainer: {
    width: '100%',
    paddingBottom: 16,
  },
  title: {
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '800',
    color: '#0F1E36',
    letterSpacing: -0.5,
  },
  darkTitle: {
    color: '#FFFFFF',
  },
  titleHighlight: {
    color: '#136DEC',
  },
  darkTitleHighlight: {
    color: '#2563EB',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14.5,
    lineHeight: 22,
    fontWeight: '400',
    color: '#64748B',
  },
  darkSubtitle: {
    color: '#94A3B8',
  },

  // Bottom Navigation Footer
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 24 : 32,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
  },
  darkFooterContainer: {
    backgroundColor: '#050E24',
  },

  // Pagination Dots
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 22,
    backgroundColor: '#136DEC',
  },
  inactiveDot: {
    width: 8,
    backgroundColor: '#BFDBFE',
  },
  darkActiveDot: {
    width: 22,
    backgroundColor: '#2563EB',
  },
  darkInactiveDot: {
    width: 8,
    backgroundColor: '#1E293B',
  },

  // Next Button
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#136DEC',
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 24,
    shadowColor: '#136DEC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  darkNextButton: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
  },
  nextButtonText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 6,
  },
  nextArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
