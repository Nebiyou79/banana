// src/screens/auth/OnboardingScreen.tsx
// No Reanimated, no core Animated — pure FlatList + state-driven dots.

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
  ViewToken,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../hooks/useTheme';
import { setOnboardingSeen } from '../../lib/storage';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

const { width } = Dimensions.get('window');

interface Slide {
  id:             string;
  emoji:          string;
  title:          string;
  subtitle:       string;
  gradients:      [string, string];
  accentColor:    string;
  cardBg:         string;
}

const SLIDES: Slide[] = [
  {
    id:          '1',
    emoji:       '🎯',
    title:       'Find Your\nDream Job',
    subtitle:    'Browse thousands of opportunities from top companies and organizations.',
    gradients:   ['#EFF6FF', '#DBEAFE'],
    accentColor: '#3B82F6',
    cardBg:      '#FFFFFF',
  },
  {
    id:          '2',
    emoji:       '💼',
    title:       'Showcase Your\nPortfolio',
    subtitle:    'Build a standout freelancer profile and attract premium clients.',
    gradients:   ['#ECFDF5', '#D1FAE5'],
    accentColor: '#10B981',
    cardBg:      '#FFFFFF',
  },
  {
    id:          '3',
    emoji:       '🚀',
    title:       'Grow Your\nBusiness',
    subtitle:    'Post tenders, discover talent, and manage projects all in one place.',
    gradients:   ['#F5F3FF', '#EDE9FE'],
    accentColor: '#8B5CF6',
    cardBg:      '#FFFFFF',
  },
];

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

export const OnboardingScreen: React.FC = () => {
  const navigation    = useNavigation<Nav>();
  const { type, spacing, radius, shadows } = useTheme();

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleFinish = async () => {
    await setOnboardingSeen();
    navigation.replace('Login');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleFinish();
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const idx = viewableItems[0]?.index;
      if (idx !== null && idx !== undefined) setCurrentIndex(idx);
    },
  ).current;

  const currentSlide = SLIDES[currentIndex];

  const renderSlide = ({ item }: { item: Slide }) => (
    <LinearGradient
      colors={item.gradients}
      style={[styles.slide, { width }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Big emoji card */}
      <View
        style={[
          styles.emojiCard,
          { backgroundColor: item.cardBg, borderRadius: 40 },
          shadows.lg,
        ]}
      >
        <Text style={styles.slideEmoji}>{item.emoji}</Text>
      </View>

      {/* Text block */}
      <View style={styles.textBlock}>
        <Text
          style={[
            type.display,
            { color: '#0F172A', textAlign: 'center', marginBottom: spacing.md },
          ]}
        >
          {item.title}
        </Text>
        <Text
          style={[
            type.bodyLg,
            { color: '#475569', textAlign: 'center', lineHeight: 26 },
          ]}
        >
          {item.subtitle}
        </Text>
      </View>
    </LinearGradient>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* Skip */}
      <SafeAreaView style={styles.skipWrapper} edges={['top']}>
        <Pressable
          onPress={handleFinish}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          accessibilityLabel="Skip onboarding"
        >
          <Text style={[type.body, { color: '#64748B', fontWeight: '600' }]}>Skip</Text>
        </Pressable>
      </SafeAreaView>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      />

      {/* Bottom bar */}
      <SafeAreaView
        style={[styles.bottomBar, { backgroundColor: '#FFFFFF' }]}
        edges={['bottom']}
      >
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? currentSlide.accentColor : '#CBD5E1',
                  width:           i === currentIndex ? 24 : 8,
                  borderRadius:    4,
                },
              ]}
            />
          ))}
        </View>

        {/* Next / Get Started */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextBtn,
            {
              backgroundColor: currentSlide.accentColor,
              borderRadius:    radius.xl,
              opacity:         pressed ? 0.88 : 1,
            },
          ]}
          accessibilityLabel={
            currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next slide'
          }
        >
          <Text style={[type.button, { color: '#FFFFFF' }]}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started 🍌' : 'Next →'}
          </Text>
        </Pressable>

        {/* Login link */}
        <View style={styles.loginRow}>
          <Text style={[type.bodySm, { color: '#94A3B8' }]}>
            Already have an account?{' '}
          </Text>
          <Pressable
            onPress={() => {
              setOnboardingSeen();
              navigation.replace('Login');
            }}
          >
            <Text
              style={[
                type.bodySm,
                { color: currentSlide.accentColor, fontWeight: '700' },
              ]}
            >
              Sign In
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#FFFFFF' },

  skipWrapper: {
    position: 'absolute',
    top:      0,
    right:    20,
    zIndex:   10,
    paddingTop: 12,
  },

  slide: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 32,
    paddingTop:      80,
    paddingBottom:   32,
  },
  emojiCard: {
    width:          180,
    height:         180,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   44,
  },
  slideEmoji: { fontSize: 90 },
  textBlock:  { alignItems: 'center', paddingHorizontal: 8 },

  bottomBar: {
    paddingHorizontal: 28,
    paddingTop:        24,
    paddingBottom:     8,
    alignItems:        'center',
    gap:               20,
    borderTopWidth:    1,
    borderTopColor:    'rgba(0,0,0,0.06)',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  dot: {
    height:       8,
    borderRadius: 4,
  },
  nextBtn: {
    width:          '100%',
    paddingVertical: 16,
    alignItems:     'center',
  },
  loginRow: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingBottom: 4,
  },
});

export default OnboardingScreen;
