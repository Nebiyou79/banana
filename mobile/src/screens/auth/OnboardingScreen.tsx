// src/screens/auth/OnboardingScreen.tsx
// ─── Premium Onboarding Screen ────────────────────────────────────────────────
// Uses logo.png. FlatList + Animated (no Reanimated). Dark/light mode support.
// 4 role-based slides: Candidate, Freelancer, Company, Organization.
// Constellation background, animated hero cards, spring transitions.

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
  StatusBar,
  Animated,
  Image,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { setOnboardingSeen } from '../../lib/storage';
import { useThemeStore } from '../../store/themeStore';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

const { width, height } = Dimensions.get('window');

// ── Slide data ─────────────────────────────────────────────────────────────────
interface Slide {
  id:          string;
  emoji:       string;
  icon:        string;
  title:       string;
  subtitle:    string;
  accentColor: string;
  tag:         string;
  features:    string[];
}

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '🎯', icon: '💼',
    title: 'Find Your\nDream Job',
    subtitle: 'Browse thousands of curated opportunities from top companies and growing startups.',
    accentColor: '#3B82F6',
    tag: 'FOR CANDIDATES',
    features: ['Smart job matching', 'One-tap apply', 'Interview tracker'],
  },
  {
    id: '2',
    emoji: '🚀', icon: '✨',
    title: 'Showcase Your\nPortfolio',
    subtitle: 'Build a standout freelancer profile and attract premium clients from across the world.',
    accentColor: '#10B981',
    tag: 'FOR FREELANCERS',
    features: ['Portfolio builder', 'Client messaging', 'Earnings dashboard'],
  },
  {
    id: '3',
    emoji: '🏢', icon: '📊',
    title: 'Hire Great\nTalent Fast',
    subtitle: 'Post jobs, discover top talent, and manage your entire hiring pipeline in one place.',
    accentColor: '#F1BB03',
    tag: 'FOR COMPANIES',
    features: ['ATS pipeline', 'Team collaboration', 'Analytics & insights'],
  },
  {
    id: '4',
    emoji: '🏛️', icon: '🤝',
    title: 'Grow Your\nOrganization',
    subtitle: 'Post tenders, find qualified professionals, and scale your projects with confidence.',
    accentColor: '#8B5CF6',
    tag: 'FOR ORGANIZATIONS',
    features: ['Tender management', 'Bid tracking', 'Vendor database'],
  },
];

// Constellation dots
const STAR_DOTS = [
  [40, 60], [160, 30], [310, 90], [80, 180], [270, 200],
  [50, 320], [330, 350], [120, 480], [300, 520],
  [200, 140], [380, 260], [30, 440], [350, 620],
];

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

export const OnboardingScreen: React.FC = () => {
  const navigation    = useNavigation<Nav>();
  const isDark        = useThemeStore((s) => s.theme.isDark);
  const [idx, setIdx] = useState(0);
  const flatListRef   = useRef<FlatList>(null);

  // Slide transition animations
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideY    = useRef(new Animated.Value(0)).current;

  // Feature pills stagger animation
  const pillAnim1 = useRef(new Animated.Value(0)).current;
  const pillAnim2 = useRef(new Animated.Value(0)).current;
  const pillAnim3 = useRef(new Animated.Value(0)).current;
  const pillAnims = [pillAnim1, pillAnim2, pillAnim3];

  // Theme colors
  const bg      = isDark ? '#050D1A' : '#F8FAFC';
  const bgCard  = isDark ? '#0A1628' : '#FFFFFF';
  const text    = isDark ? '#F8FAFC' : '#0A1628';
  const muted   = isDark ? '#64748B' : '#94A3B8';
  const border  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  const currentSlide = SLIDES[idx];

  const animatePillsIn = () => {
    pillAnims.forEach((a) => a.setValue(0));
    pillAnims.forEach((a, i) => {
      setTimeout(() => {
        Animated.spring(a, { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }).start();
      }, i * 80);
    });
  };

  const handleFinish = async () => {
    await setOnboardingSeen();
    navigation.replace('Login');
  };

  const handleNext = () => {
    if (idx < SLIDES.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0.25, duration: 140, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.94, duration: 140, useNativeDriver: true }),
        Animated.timing(slideY,    { toValue: -8, duration: 140, useNativeDriver: true }),
      ]).start(() => {
        flatListRef.current?.scrollToIndex({ index: idx + 1, animated: true });
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 1, duration: 260, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
          Animated.spring(slideY,    { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
        ]).start(animatePillsIn);
      });
    } else {
      handleFinish();
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const newIdx = viewableItems[0]?.index;
      if (newIdx !== null && newIdx !== undefined) {
        setIdx(newIdx);
        animatePillsIn();
      }
    },
  ).current;

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[S.slide, { width }]}>
      {/* Hero card */}
      <Animated.View style={[S.heroCard, {
        backgroundColor: bgCard,
        borderColor: `${item.accentColor}28`,
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }, { translateY: slideY }],
      }]}>
        {/* Glow orb */}
        <View style={[S.emojiGlow, { backgroundColor: item.accentColor, opacity: isDark ? 0.13 : 0.08 }]} />

        {/* Tag badge */}
        <View style={[S.tagBadge, { backgroundColor: `${item.accentColor}18`, borderColor: `${item.accentColor}30` }]}>
          <View style={[S.tagDot, { backgroundColor: item.accentColor }]} />
          <Text style={[S.tagText, { color: item.accentColor }]}>{item.tag}</Text>
        </View>

        {/* Big emoji */}
        <Text style={S.slideEmoji}>{item.emoji}</Text>

        {/* Corner icon */}
        <View style={[S.cornerIcon, {
          backgroundColor: `${item.accentColor}18`,
          borderColor: `${item.accentColor}35`,
        }]}>
          <Text style={{ fontSize: 20 }}>{item.icon}</Text>
        </View>

        {/* Accent stripe at bottom */}
        <View style={[S.cardStripe, { backgroundColor: `${item.accentColor}20` }]} />
      </Animated.View>

      {/* Text block */}
      <View style={S.textBlock}>
        <Text style={[S.slideTitle, { color: text }]}>{item.title}</Text>
        <Text style={[S.slideSub, { color: muted }]}>{item.subtitle}</Text>

        {/* Feature pills */}
        <View style={S.pillsRow}>
          {item.features.map((f, i) => (
            <Animated.View
              key={f}
              style={[S.pill, {
                backgroundColor: `${item.accentColor}14`,
                borderColor: `${item.accentColor}28`,
                opacity: pillAnims[i],
                transform: [{
                  translateY: pillAnims[i].interpolate({
                    inputRange: [0, 1], outputRange: [10, 0],
                  }),
                }],
              }]}
            >
              <Text style={[S.pillText, { color: item.accentColor }]}>{f}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={[S.root, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />

      {/* Constellation background */}
      {STAR_DOTS.map(([x, y], i) => (
        <View key={i} style={[S.starDot, {
          left: x, top: y,
          backgroundColor: currentSlide.accentColor,
          opacity: isDark ? 0.14 + (i % 3) * 0.05 : 0.06 + (i % 3) * 0.03,
        }]} />
      ))}

      {/* Atmosphere blobs */}
      <View style={[S.blob, {
        top: -80, right: -70,
        backgroundColor: `${currentSlide.accentColor}${isDark ? '10' : '08'}`,
      }]} />
      <View style={[S.blob, {
        bottom: -100, left: -80,
        backgroundColor: `${currentSlide.accentColor}${isDark ? '08' : '06'}`,
        width: 340, height: 340,
      }]} />

      {/* Skip button */}
      <SafeAreaView style={S.skipWrapper} edges={['top']}>
        <Pressable onPress={handleFinish} style={S.skipBtn}>
          <Text style={[S.skipText, { color: muted }]}>Skip</Text>
        </Pressable>
      </SafeAreaView>

      {/* Logo top-left */}
      <SafeAreaView style={S.logoWrapper} edges={['top']}>
        <Image
          source={require('../../../assets/logo.png')}
          style={S.logoThumb}
          resizeMode="contain"
        />
      </SafeAreaView>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(i) => i.id}
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
        style={[S.bottomBar, {
          backgroundColor: bg,
          borderTopColor: border,
        }]}
        edges={['bottom']}
      >
        {/* Progress dots */}
        <View style={S.dotsRow}>
          {SLIDES.map((s, i) => (
            <Animated.View
              key={i}
              style={[S.dotIndicator, {
                backgroundColor: i === idx ? currentSlide.accentColor : (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)'),
                width: i === idx ? 28 : 8,
              }]}
            />
          ))}
        </View>

        {/* Progress counter */}
        <Text style={[S.progressText, { color: muted }]}>
          {idx + 1} / {SLIDES.length}
        </Text>

        {/* Next / Get Started */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [S.nextBtn, {
            backgroundColor: currentSlide.accentColor,
            opacity: pressed ? 0.86 : 1,
          }]}
        >
          <Text style={[S.nextBtnText, {
            color: idx === 2 ? '#050D1A' : '#FFFFFF',
          }]}>
            {idx === SLIDES.length - 1 ? 'Get Started →' : 'Next →'}
          </Text>
        </Pressable>

        {/* Sign in row */}
        <View style={S.signInRow}>
          <Text style={[S.signInLabel, { color: muted }]}>Already have an account? </Text>
          <Pressable onPress={() => { setOnboardingSeen(); navigation.replace('Login'); }}>
            <Text style={[S.signInLink, { color: currentSlide.accentColor }]}>Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
};

const S = StyleSheet.create({
  root: { flex: 1 },

  starDot: { position: 'absolute', width: 3, height: 3, borderRadius: 2 },
  blob:    { position: 'absolute', width: 280, height: 280, borderRadius: 999 },

  skipWrapper: { position: 'absolute', top: 0, right: 20, zIndex: 10, paddingTop: 12 },
  skipBtn:     { paddingVertical: 8, paddingHorizontal: 4 },
  skipText:    { fontSize: 14, fontWeight: '600' },

  logoWrapper: { position: 'absolute', top: 0, left: 20, zIndex: 10, paddingTop: 8 },
  logoThumb:   { width: 44, height: 44 },

  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 16,
  },

  heroCard: {
    width: width * 0.74,
    height: width * 0.74,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 16,
    overflow: 'hidden',
  },
  emojiGlow: {
    position: 'absolute',
    width: 160, height: 160,
    borderRadius: 80,
  },
  tagBadge: {
    position: 'absolute',
    bottom: 16, left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  tagDot:  { width: 5, height: 5, borderRadius: 3 },
  tagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.9 },

  slideEmoji: { fontSize: 88, zIndex: 1 },

  cornerIcon: {
    position: 'absolute',
    top: 14, right: 14,
    width: 48, height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  cardStripe: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 4,
  },

  textBlock: {
    alignItems: 'center',
    marginTop: 28,
    paddingHorizontal: 8,
  },
  slideTitle: {
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  slideSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
  },

  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    justifyContent: 'center',
  },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  bottomBar: {
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 10,
    alignItems: 'center',
    gap: 14,
    borderTopWidth: 1,
  },
  dotsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dotIndicator: { height: 8, borderRadius: 4 },
  progressText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },

  nextBtn: {
    width: '100%',
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  nextBtnText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  signInRow: { flexDirection: 'row', alignItems: 'center' },
  signInLabel: { fontSize: 13 },
  signInLink:  { fontSize: 13, fontWeight: '700' },
});

export default OnboardingScreen;