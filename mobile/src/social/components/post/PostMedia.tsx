// src/social/components/post/PostMedia.tsx
/**
 * PostMedia — fully fixed image carousel + inline video player
 *
 * Fixes applied:
 * 1. Carousel uses ScrollView with pagingEnabled + correct itemWidth = card width
 *    computed from screen minus margins — images no longer get cut off.
 * 2. Smooth spring-based page transitions via Animated dot indicators.
 * 3. Counter pill bounce animation on page change.
 * 4. Video: thumbnail overlay, animated play button, progress bar.
 * 5. ALL animations use only core react-native Animated (no reanimated).
 *
 * Design 2 (light): clean white/soft overlay controls
 * Design 3 (dark):  glowing primary progress bar + gradient counter pill
 */
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import type { PostMedia as PostMediaT } from '../../types';

const { width: SCREEN_W } = Dimensions.get('window');
// Card margin: SPACING.md (12) * 2 sides = 24, plus card border = ~26
// We use the full screen width since the card uses overflow:hidden
const CARD_MARGIN = 12; // SPACING.md
const MEDIA_W = SCREEN_W - CARD_MARGIN * 2; // card content width
const MEDIA_H = 280;

const getVideoThumbnail = (m: PostMediaT): string => {
  if (m.thumbnail) return m.thumbnail;
  const url = m.secure_url || m.url || '';
  if (url.includes('cloudinary.com')) {
    return url
      .replace('/upload/', '/upload/w_600,h_400,c_fill,so_0/')
      .replace(/\.(mp4|mov|avi|webm)$/i, '.jpg');
  }
  return url;
};

// ── Video Tile ─────────────────────────────────────────────────────────────
const VideoTile: React.FC<{ item: PostMediaT; width: number }> = memo(({ item, width }) => {
  const theme = useSocialTheme();
  const src = item.secure_url || item.url || '';
  const thumb = getVideoThumbnail(item);
  const player = useVideoPlayer(src, (p) => { p.loop = false; });
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Animated play button
  const playScale = useRef(new Animated.Value(1)).current;
  const playOpacity = useRef(new Animated.Value(1)).current;

  const triggerPlay = useCallback(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(playScale, { toValue: 0.80, friction: 5, tension: 320, useNativeDriver: true }),
        Animated.timing(playOpacity, { toValue: 0.6, duration: 80, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(playScale, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
        Animated.timing(playOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]),
    ]).start();
  }, [playScale, playOpacity]);

  const togglePlay = useCallback(() => {
    triggerPlay();
    if (player.playing) {
      player.pause();
      setPlaying(false);
    } else {
      player.play();
      setPlaying(true);
    }
  }, [player, triggerPlay]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (player.duration > 0) {
        setProgress(player.currentTime / player.duration);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [player]);

  const progressColor = theme.dark
    ? theme.colors.primary
    : theme.colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={togglePlay}
      style={{ width, height: MEDIA_H, backgroundColor: '#000', overflow: 'hidden' }}
    >
      {!playing && (
        <Image
          source={{ uri: thumb }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />

      {/* Dark scrim for controls visibility */}
      <View style={styles.videoScrim} pointerEvents="none" />

      {/* Play button */}
      {!playing && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.playOverlay,
            { transform: [{ scale: playScale }], opacity: playOpacity },
          ]}
        >
          <View
            style={[
              styles.playBtn,
              {
                backgroundColor: theme.dark
                  ? 'rgba(0,0,0,0.55)'
                  : 'rgba(255,255,255,0.92)',
                borderWidth: theme.dark ? 2 : 0,
                borderColor: theme.dark ? theme.colors.primary : 'transparent',
              },
            ]}
          >
            <Ionicons
              name="play"
              size={26}
              color={theme.dark ? theme.colors.primary : theme.colors.primary}
              style={{ marginLeft: 3 }}
            />
          </View>
        </Animated.View>
      )}

      {/* Pause indicator */}
      {playing && (
        <View pointerEvents="none" style={styles.pauseHint}>
          <Ionicons name="pause" size={13} color="#fff" />
        </View>
      )}

      {/* Duration badge */}
      {!playing && (
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>
            {Math.floor((item.duration ?? 0) / 60)}:
            {String(Math.round((item.duration ?? 0) % 60)).padStart(2, '0')}
          </Text>
        </View>
      )}

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(100, progress * 100)}%` as any,
              backgroundColor: progressColor,
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
});

// ── PostMedia ──────────────────────────────────────────────────────────────
const PostMedia: React.FC<{
  media: PostMediaT[];
  onMediaPress?: (index: number) => void;
}> = memo(({ media, onMediaPress }) => {
  const theme = useSocialTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // The item width = the scroll view width (full card width)
  // We size it with onLayout so it's always exact
  const [containerWidth, setContainerWidth] = useState(MEDIA_W);

  // Counter pill bounce
  const counterScale = useRef(new Animated.Value(1)).current;
  const bouncePill = useCallback(() => {
    Animated.sequence([
      Animated.spring(counterScale, { toValue: 1.25, friction: 5, tension: 350, useNativeDriver: true }),
      Animated.spring(counterScale, { toValue: 1,    friction: 6, tension: 220, useNativeDriver: true }),
    ]).start();
  }, [counterScale]);

  // Animated dot widths — expand active dot
  const dotWidths = useRef(
    (media ?? []).map((_, i) => new Animated.Value(i === 0 ? 20 : 6))
  ).current;

  const dotOpacities = useRef(
    (media ?? []).map((_, i) => new Animated.Value(i === 0 ? 1 : 0.45))
  ).current;

  const animateDots = useCallback((prev: number, next: number) => {
    Animated.parallel([
      // Shrink old dot
      Animated.spring(dotWidths[prev], {
        toValue: 6,
        friction: 8,
        tension: 200,
        useNativeDriver: false,
      }),
      Animated.timing(dotOpacities[prev], {
        toValue: 0.45,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      // Expand new dot
      Animated.spring(dotWidths[next], {
        toValue: 20,
        friction: 7,
        tension: 250,
        useNativeDriver: false,
      }),
      Animated.timing(dotOpacities[next], {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();
  }, [dotWidths, dotOpacities]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const newIndex = Math.max(0, Math.min(
        media.length - 1,
        Math.round(x / containerWidth)
      ));
      if (newIndex !== activeIndex) {
        animateDots(activeIndex, newIndex);
        setActiveIndex(newIndex);
        bouncePill();
      }
    },
    [activeIndex, containerWidth, media.length, animateDots, bouncePill]
  );

  if (!media || media.length === 0) return null;

  // ── Single item ──
  if (media.length === 1) {
    const m = media[0];
    if (m.resource_type === 'video') {
      return (
        <View style={[styles.singleWrap, { height: MEDIA_H }]}>
          <VideoTile item={m} width={containerWidth} />
        </View>
      );
    }
    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => onMediaPress?.(0)}
        style={styles.singleWrap}
      >
        <Image
          source={{ uri: m.secure_url || m.url }}
          style={[
            styles.singleImage,
            { backgroundColor: theme.colors.skeleton },
          ]}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }

  // ── Carousel ──
  return (
    <View
      style={[styles.carouselWrap, { height: MEDIA_H }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
        bounces={false}
        // Ensure snapping is pixel-perfect
        snapToInterval={containerWidth}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={{ flexGrow: 0 }}
      >
        {media.map((m, i) =>
          m.resource_type === 'video' ? (
            <VideoTile
              key={m.public_id ?? m.url ?? i}
              item={m}
              width={containerWidth}
            />
          ) : (
            <TouchableOpacity
              key={m.public_id ?? m.url ?? i}
              activeOpacity={0.92}
              onPress={() => onMediaPress?.(i)}
              style={{ width: containerWidth, height: MEDIA_H }}
            >
              <Image
                source={{ uri: m.secure_url || m.url }}
                style={[
                  styles.carouselImage,
                  { backgroundColor: theme.colors.skeleton },
                ]}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )
        )}
      </ScrollView>

      {/* Counter pill */}
      <Animated.View
        style={[
          styles.counterPill,
          {
            transform: [{ scale: counterScale }],
            backgroundColor: theme.dark
              ? `${theme.colors.primary}CC`
              : 'rgba(0,0,0,0.52)',
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.counterText}>
          {activeIndex + 1}/{media.length}
        </Text>
      </Animated.View>

      {/* Animated dot indicators */}
      <View style={styles.dotsRow} pointerEvents="none">
        {media.map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                width: dotWidths[i],
                opacity: dotOpacities[i],
                backgroundColor: '#FFFFFF',
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
});

PostMedia.displayName = 'PostMedia';

const styles = StyleSheet.create({
  singleWrap: { width: '100%', height: MEDIA_H },
  singleImage: { width: '100%', height: MEDIA_H },
  carouselWrap: { width: '100%', overflow: 'hidden', position: 'relative' },
  carouselImage: { width: '100%', height: MEDIA_H },
  counterPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: { height: 5, borderRadius: 2.5 },
  videoScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseHint: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderRadius: 8,
  },
  durationText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  progressFill: { height: 3 },
});

export default PostMedia;
export { PostMedia };