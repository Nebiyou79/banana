/**
 * Banana Social — Animation Hooks v2.0
 *
 * Philosophy: Animations communicate state, not decoration.
 * - Enter transitions: fast (200–350ms), eased out
 * - Press feedback: instant (<100ms), spring return
 * - Looping animations: kept subtle, never distracting
 * - All hooks use ONLY react-native Animated (no reanimated dependency)
 *
 * Motion principles:
 *   1. Spring > timing for interactive feedback
 *   2. Parallax depth only where meaningful
 *   3. Skeleton shimmer replaces spinners wherever possible
 *   4. Never animate layout (width/height) — only transform/opacity
 */

import { Animated, Easing } from 'react-native';
import { useRef, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// A. Fade In on Mount
// Use: any screen or card entering the viewport
// ─────────────────────────────────────────────────────────────────────────────

export const useFadeIn = (delay = 0, duration = 280) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return opacity;
};

// ─────────────────────────────────────────────────────────────────────────────
// B. Slide Up on Mount
// Use: bottom sheets, modals, cards loading into feed
// ─────────────────────────────────────────────────────────────────────────────

export const useSlideUp = (fromY = 24, delay = 0) => {
  const translateY = useRef(new Animated.Value(fromY)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { translateY, opacity };
};

// ─────────────────────────────────────────────────────────────────────────────
// C. Staggered List Entry
// Use: feed loading, search results, notification lists
// Each item gets an index-based delay for a cascade effect
// ─────────────────────────────────────────────────────────────────────────────

export const useStaggeredEntry = (index: number, stagger = 50) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const delay = index * stagger;
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { opacity, translateY };
};

// ─────────────────────────────────────────────────────────────────────────────
// D. Press Scale
// Use: buttons, cards, interactive list items
// ─────────────────────────────────────────────────────────────────────────────

export const usePressScale = (scaleTo = 0.96) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.timing(scale, {
      toValue: scaleTo,
      duration: 70,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [scale, scaleTo]);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      tension: 280,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return { scale, onPressIn, onPressOut };
};

// ─────────────────────────────────────────────────────────────────────────────
// E. Like / Reaction Burst
// Use: reaction buttons (heart, like, celebrate, etc.)
// A quick pop-to-1.5x then spring back
// ─────────────────────────────────────────────────────────────────────────────

export const useLikeBurst = () => {
  const scale = useRef(new Animated.Value(1)).current;

  const trigger = useCallback(() => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.45,
        duration: 90,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 320,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale]);

  return { scale, trigger };
};

// ─────────────────────────────────────────────────────────────────────────────
// F. Skeleton Pulse (shimmer base)
// Use: all loading placeholder states
// Pair with a LinearGradient overlay for a full shimmer effect
// ─────────────────────────────────────────────────────────────────────────────

export const useSkeletonPulse = () => {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return opacity;
};

// ─────────────────────────────────────────────────────────────────────────────
// G. Skeleton Shimmer (translateX sweep)
// Use: wide skeleton bars for post text, cover images
// Apply to an absolutely-positioned overlay with a gradient
// ─────────────────────────────────────────────────────────────────────────────

export const useSkeletonShimmer = (width: number) => {
  const translateX = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: width,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  return translateX;
};

// ─────────────────────────────────────────────────────────────────────────────
// H. Tab Indicator Slide
// Use: top tab bars (PostsTabs, ProfileTabs, etc.)
// ─────────────────────────────────────────────────────────────────────────────

export const useTabIndicator = (
  activeIndex: number,
  tabCount: number,
  screenWidth: number
) => {
  const tabWidth   = screenWidth / tabCount;
  const indicatorX = useRef(new Animated.Value(activeIndex * tabWidth)).current;

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue: activeIndex * tabWidth,
      friction: 7,
      tension: 180,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, tabWidth]);

  return { indicatorX, tabWidth };
};

// ─────────────────────────────────────────────────────────────────────────────
// I. Header Collapse on Scroll
// Use: profile page headers, post detail pages
// ─────────────────────────────────────────────────────────────────────────────

export const useHeaderCollapse = (
  collapseStart = 60,
  collapseEnd = 110
) => {
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, collapseStart, collapseEnd],
    outputRange: [1, 0.4, 0],
    extrapolate: 'clamp',
  });

  const compactHeaderOpacity = scrollY.interpolate({
    inputRange: [collapseStart, collapseEnd],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const coverScale = scrollY.interpolate({
    inputRange: [-80, 0],
    outputRange: [1.25, 1],
    extrapolate: 'clamp',
  });

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  return { scrollY, headerOpacity, compactHeaderOpacity, coverScale, onScroll };
};

// ─────────────────────────────────────────────────────────────────────────────
// J. Notification Badge Bounce
// Use: tab bar notification icons, unread counters
// ─────────────────────────────────────────────────────────────────────────────

export const useNotificationBounce = (active: boolean) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) return;
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.3,
        friction: 3,
        tension: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [active, scale]);

  return scale;
};

// ─────────────────────────────────────────────────────────────────────────────
// K. Role Splash Entrance (onboarding / splash screen)
// Layered sequence: bg fade → logo slide up → tagline fade → CTA scale in
// ─────────────────────────────────────────────────────────────────────────────

export const useSplashEntrance = () => {
  const bgOpacity     = useRef(new Animated.Value(0)).current;
  const logoTranslate = useRef(new Animated.Value(40)).current;
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity    = useRef(new Animated.Value(0)).current;
  const ctaTranslate  = useRef(new Animated.Value(20)).current;

  const play = useCallback(() => {
    Animated.sequence([
      // 1. Background fades in
      Animated.timing(bgOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      // 2. Logo slides up
      Animated.parallel([
        Animated.timing(logoTranslate, {
          toValue: 0,
          duration: 480,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
      ]),
      // 3. Tagline fades in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 340,
        delay: 80,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      // 4. CTA slides up and fades in
      Animated.parallel([
        Animated.timing(ctaOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(ctaTranslate, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [bgOpacity, logoTranslate, logoOpacity, taglineOpacity, ctaOpacity, ctaTranslate]);

  return {
    play,
    bgOpacity,
    logoTranslate,
    logoOpacity,
    taglineOpacity,
    ctaOpacity,
    ctaTranslate,
  };
};