// src/screens/auth/OnboardingScreen.tsx
// Premium dark-navy onboarding with FlatList + Animated (no Reanimated)

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
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { setOnboardingSeen } from '../../lib/storage';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

const { width, height } = Dimensions.get('window');

const NAVY      = '#050D1A';
const NAVY2     = '#0A1628';
const NAVY3     = '#0F2040';
const GOLD      = '#F1BB03';
const TEXT_PRI  = '#F8FAFC';
const TEXT_MUT  = '#94A3B8';

interface Slide {
  id:          string;
  emoji:       string;
  icon:        string;
  title:       string;
  subtitle:    string;
  accentColor: string;
  tag:         string;
}

const SLIDES: Slide[] = [
  {
    id: '1', emoji: '🎯', icon: '💼',
    title: 'Find Your\nDream Job',
    subtitle: 'Browse thousands of opportunities from top companies and organizations.',
    accentColor: '#3B82F6', tag: 'FOR CANDIDATES',
  },
  {
    id: '2', emoji: '💼', icon: '🚀',
    title: 'Showcase Your\nPortfolio',
    subtitle: 'Build a standout freelancer profile and attract premium clients worldwide.',
    accentColor: '#10B981', tag: 'FOR FREELANCERS',
  },
  {
    id: '3', emoji: '🏢', icon: '📊',
    title: 'Hire Great\nTalent',
    subtitle: 'Post jobs, discover talent, and manage your entire hiring pipeline.',
    accentColor: GOLD, tag: 'FOR COMPANIES',
  },
  {
    id: '4', emoji: '🏛️', icon: '🤝',
    title: 'Grow Your\nNetwork',
    subtitle: 'Post tenders, find professionals, and scale your organization.',
    accentColor: '#8B5CF6', tag: 'FOR ORGANIZATIONS',
  },
];

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

export const OnboardingScreen: React.FC = () => {
  const navigation    = useNavigation<Nav>();
  const [currentIdx, setCurrentIdx] = useState(0);
  const flatListRef   = useRef<FlatList>(null);
  const fadeAnim      = useRef(new Animated.Value(1)).current;
  const scaleAnim     = useRef(new Animated.Value(1)).current;

  const handleFinish = async () => {
    await setOnboardingSeen();
    navigation.replace('Login');
  };

  const handleNext = () => {
    if (currentIdx < SLIDES.length - 1) {
      // Animate out → scroll → animate in
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0.3, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 150, useNativeDriver: true }),
      ]).start(() => {
        flatListRef.current?.scrollToIndex({ index: currentIdx + 1, animated: true });
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
        ]).start();
      });
    } else {
      handleFinish();
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const idx = viewableItems[0]?.index;
      if (idx !== null && idx !== undefined) setCurrentIdx(idx);
    },
  ).current;

  const currentSlide = SLIDES[currentIdx];

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      {/* Big emoji hero card */}
      <Animated.View style={[styles.heroCard, { borderColor: `${item.accentColor}30`, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Glow behind emoji */}
        <View style={[styles.emojiGlow, { backgroundColor: item.accentColor }]} />
        <Text style={styles.slideEmoji}>{item.emoji}</Text>

        {/* Corner icon */}
        <View style={[styles.cornerIcon, { backgroundColor: `${item.accentColor}20`, borderColor: `${item.accentColor}40` }]}>
          <Text style={{ fontSize: 22 }}>{item.icon}</Text>
        </View>

        {/* Tag badge */}
        <View style={[styles.tagBadge, { backgroundColor: `${item.accentColor}18` }]}>
          <Text style={[styles.tagText, { color: item.accentColor }]}>{item.tag}</Text>
        </View>
      </Animated.View>

      {/* Text */}
      <View style={styles.textBlock}>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSub}>{item.subtitle}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      {/* Constellation bg dots */}
      {[
        [40, 60], [160, 30], [310, 90], [80, 180], [270, 200],
        [50, 320], [330, 350], [120, 480], [300, 520],
      ].map(([x, y], i) => (
        <View key={i} style={[styles.dot, { left: x, top: y, opacity: 0.15 + (i % 3) * 0.05 }]} />
      ))}

      {/* Skip */}
      <SafeAreaView style={styles.skipWrapper} edges={['top']}>
        <Pressable onPress={handleFinish}>
          <Text style={{ color: TEXT_MUT, fontSize: 14, fontWeight: '600' }}>Skip</Text>
        </Pressable>
      </SafeAreaView>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={i => i.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      />

      {/* Bottom */}
      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((s, i) => (
            <View
              key={i}
              style={[
                styles.dotIndicator,
                {
                  backgroundColor: i === currentIdx ? currentSlide.accentColor : 'rgba(255,255,255,0.15)',
                  width: i === currentIdx ? 24 : 8,
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
            { backgroundColor: currentSlide.accentColor, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Text style={[styles.nextBtnText, { color: currentIdx === 2 ? NAVY : '#fff' }]}>
            {currentIdx === SLIDES.length - 1 ? 'Get Started 🍌' : 'Next  →'}
          </Text>
        </Pressable>

        {/* Login row */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: TEXT_MUT, fontSize: 13 }}>Already have an account? </Text>
          <Pressable onPress={() => { setOnboardingSeen(); navigation.replace('Login'); }}>
            <Text style={{ color: currentSlide.accentColor, fontSize: 13, fontWeight: '700' }}>Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },

  dot: { position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: GOLD },

  skipWrapper: { position: 'absolute', top: 0, right: 20, zIndex: 10, paddingTop: 12 },

  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 20,
  },

  heroCard: {
    width: width * 0.72,
    height: width * 0.72,
    borderRadius: 32,
    backgroundColor: '#0A1628',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 15,
    overflow: 'hidden',
  },
  emojiGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.12,
  },
  slideEmoji:  { fontSize: 90, zIndex: 1 },
  cornerIcon: {
    position: 'absolute',
    top: 14, right: 14,
    width: 48, height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  tagBadge: {
    position: 'absolute',
    bottom: 16, left: 16,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8,
  },
  tagText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  textBlock: { alignItems: 'center', marginTop: 32, paddingHorizontal: 8 },
  slideTitle: { fontSize: 30, fontWeight: '900', color: TEXT_PRI, textAlign: 'center', letterSpacing: -0.5, lineHeight: 36 },
  slideSub:   { fontSize: 15, color: TEXT_MUT, textAlign: 'center', lineHeight: 24, marginTop: 12 },

  bottomBar: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#050D1A',
  },
  dotsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dotIndicator: { height: 8, borderRadius: 4 },
  nextBtn:     { width: '100%', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});

export default OnboardingScreen;