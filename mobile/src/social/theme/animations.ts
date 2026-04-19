import { Animated, Easing } from 'react-native';
import { useRef, useEffect } from 'react';

/**
 * All animation hooks in this file use ONLY `react-native` Animated.
 * Do NOT import `react-native-reanimated` anywhere in the social module.
 */

// A. Fade In on Mount
export const useFadeIn = (delay = 0, duration = 300) => {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return opacity;
};

// B. Slide Up on Mount
export const useSlideUp = (fromY = 30, delay = 0) => {
  const translateY = useRef(new Animated.Value(fromY)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { translateY, opacity };
};

// C. Press Scale (buttons, cards)
export const usePressScale = (scaleTo = 0.95) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.timing(scale, {
      toValue: scaleTo,
      duration: 80,
      useNativeDriver: true,
    }).start();
  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 200,
      useNativeDriver: true,
    }).start();
  return { scale, onPressIn, onPressOut };
};

// D. Like Burst (reaction button animation)
export const useLikeBurst = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const trigger = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.4,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };
  return { scale, trigger };
};

// E. Skeleton Pulse
export const useSkeletonPulse = () => {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          easing: Easing.linear,
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

// F. Tab Indicator Slide (for PostsTabs top tabs)
export const useTabIndicator = (
  activeIndex: number,
  tabCount: number,
  screenWidth: number
) => {
  const tabWidth = screenWidth / tabCount;
  const indicatorX = useRef(new Animated.Value(activeIndex * tabWidth)).current;
  useEffect(() => {
    Animated.timing(indicatorX, {
      toValue: activeIndex * tabWidth,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, tabWidth]);
  return { indicatorX, tabWidth };
};

// G. Header Collapse on Scroll
export const useHeaderCollapse = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80, 100],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });
  const compactHeaderOpacity = scrollY.interpolate({
    inputRange: [80, 120],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );
  return { scrollY, headerOpacity, compactHeaderOpacity, onScroll };
};
