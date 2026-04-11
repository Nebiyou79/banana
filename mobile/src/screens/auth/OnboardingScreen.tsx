import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ViewToken,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { setOnboardingSeen } from '../../lib/storage';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

const { width, height } = Dimensions.get('window');

interface Slide {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  gradientColors: [string, string];
  accentColor: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '🎯',
    title: 'Find Your\nDream Job',
    subtitle:
      'Browse thousands of opportunities from top companies and organizations across Ethiopia.',
    gradientColors: ['#EFF6FF', '#DBEAFE'],
    accentColor: '#2563EB',
  },
  {
    id: '2',
    emoji: '💼',
    title: 'Showcase Your\nPortfolio',
    subtitle:
      'Build a standout freelancer profile, list your services, and attract premium clients.',
    gradientColors: ['#F5F3FF', '#EDE9FE'],
    accentColor: '#7C3AED',
  },
  {
    id: '3',
    emoji: '🚀',
    title: 'Grow Your\nBusiness',
    subtitle:
      'Post jobs, discover talent, and manage your team — all in one powerful platform.',
    gradientColors: ['#F0FDF4', '#DCFCE7'],
    accentColor: '#059669',
  },
];

type OnboardingNavProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingNavProp>();
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography } = theme;

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleFinish = async () => {
    await setOnboardingSeen();
    navigation.replace('Login');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleFinish();
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index !== null && viewableItems[0]?.index !== undefined) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      <LinearGradient
        colors={item.gradientColors}
        style={styles.slideGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative card */}
        <View style={[styles.card, { backgroundColor: colors.surface, ...theme.shadows.lg }]}>
          <Text style={styles.slideEmoji}>{item.emoji}</Text>
        </View>

        {/* Text */}
        <View style={styles.textContainer}>
          <Text style={[styles.slideTitle, { color: colors.text, fontSize: typography['3xl'] }]}>
            {item.title}
          </Text>
          <Text style={[styles.slideSubtitle, { color: colors.textSecondary, fontSize: typography.md }]}>
            {item.subtitle}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );

  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleFinish}>
        <Text style={[styles.skipText, { color: colors.textMuted, fontSize: typography.base }]}>
          Skip
        </Text>
      </TouchableOpacity>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        scrollEventThrottle={16}
      />

      {/* Bottom controls */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background }]}>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor: currentSlide.accentColor,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: currentSlide.accentColor,
              borderRadius: borderRadius.xl,
            },
          ]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextButtonText, { fontSize: typography.md }]}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started 🍌' : 'Next →'}
          </Text>
        </TouchableOpacity>

        {/* Login link */}
        <View style={styles.loginRow}>
          <Text style={[styles.loginPrompt, { color: colors.textMuted, fontSize: typography.sm }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setOnboardingSeen();
              navigation.replace('Login');
            }}
          >
            <Text style={[styles.loginLink, { color: currentSlide.accentColor, fontSize: typography.sm }]}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    fontWeight: '500',
  },
  slide: {
    flex: 1,
  },
  slideGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
  },
  card: {
    width: 180,
    height: 180,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  slideEmoji: {
    fontSize: 90,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  slideTitle: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  bottomContainer: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginPrompt: {
    fontWeight: '400',
  },
  loginLink: {
    fontWeight: '700',
  },
});
