// src/social/components/post/PostMedia.tsx
/**
 * PostMedia — image carousel + in-line video player
 *
 * Theme migration:
 * - theme.skeleton → theme.colors.skeleton (authoritative)
 * - theme.primary  → theme.colors.primary  (authoritative, for progress bar)
 * All other refs already use flat aliases that are backwards-compatible.
 */
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
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

// ── Video tile ────────────────────────────────────────────────
const VideoTile: React.FC<{ item: PostMediaT; width: number }> = memo(
  ({ item, width }) => {
    const theme = useSocialTheme();
    const src   = item.secure_url || item.url || '';
    const thumb = getVideoThumbnail(item);
    const player = useVideoPlayer(src, (p) => { p.loop = false; });
    const [playing,  setPlaying]  = useState(false);
    const [progress, setProgress] = useState(0);

    const playScale = useRef(new Animated.Value(1)).current;
    const triggerPlay = () => {
      Animated.sequence([
        Animated.spring(playScale, { toValue: 0.85, friction: 6, tension: 300, useNativeDriver: true }),
        Animated.spring(playScale, { toValue: 1,    friction: 5, tension: 200, useNativeDriver: true }),
      ]).start();
    };

    const togglePlay = useCallback(() => {
      triggerPlay();
      if (player.playing) {
        player.pause();
        setPlaying(false);
      } else {
        player.play();
        setPlaying(true);
      }
    }, [player]);

    useEffect(() => {
      const interval = setInterval(() => {
        if (player.duration > 0) {
          setProgress(player.currentTime / player.duration);
        }
      }, 300);
      return () => clearInterval(interval);
    }, [player]);

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={togglePlay}
        style={{ width, height: MEDIA_H, backgroundColor: '#000' }}
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

        {!playing && (
          <Animated.View
            pointerEvents="none"
            style={[styles.playOverlay, { transform: [{ scale: playScale }] }]}
          >
            <View style={styles.playBtn}>
              <Ionicons name="play" size={28} color="#fff" style={{ marginLeft: 3 }} />
            </View>
          </Animated.View>
        )}

        {playing && (
          <View pointerEvents="none" style={styles.pauseHint}>
            <Ionicons name="pause" size={14} color="#fff" />
          </View>
        )}

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, progress * 100)}%` as any,
                backgroundColor: theme.colors.primary,
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  }
);

// ── PostMedia ─────────────────────────────────────────────────
const PostMedia: React.FC<{
  media: PostMediaT[];
  onMediaPress?: (index: number) => void;
}> = memo(({ media, onMediaPress }) => {
  const theme     = useSocialTheme();
  const [index, setIndex] = useState(0);
  const itemWidth = SCREEN_W;

  // Counter pill bounce on page change
  const counterScale = useRef(new Animated.Value(1)).current;
  const bouncePill   = () => {
    Animated.sequence([
      Animated.spring(counterScale, { toValue: 1.2, friction: 5, tension: 300, useNativeDriver: true }),
      Animated.spring(counterScale, { toValue: 1,   friction: 6, tension: 200, useNativeDriver: true }),
    ]).start();
  };

  // Dot width animations for active indicator
  const dotWidths = useRef(
    (media ?? []).map((_, i) => new Animated.Value(i === 0 ? 18 : 6))
  ).current;

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x        = e.nativeEvent.contentOffset.x;
      const newIndex = Math.round(x / itemWidth);
      if (newIndex !== index) {
        Animated.parallel([
          Animated.timing(dotWidths[index], {
            toValue: 6,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(dotWidths[newIndex], {
            toValue: 18,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }),
        ]).start();
        setIndex(newIndex);
        bouncePill();
      }
    },
    [index, itemWidth, dotWidths]
  );

  if (!media || media.length === 0) return null;

  // Single item
  if (media.length === 1) {
    const m = media[0];
    if (m.resource_type === 'video') {
      return (
        <View style={styles.singleWrap}>
          <VideoTile item={m} width={itemWidth} />
        </View>
      );
    }
    return (
      <TouchableOpacity
        activeOpacity={0.94}
        onPress={() => onMediaPress?.(0)}
        style={styles.singleWrap}
      >
        <Image
          source={{ uri: m.secure_url || m.url }}
          style={[styles.singleImage, { width: itemWidth, backgroundColor: theme.colors.skeleton }]}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }

  // Carousel
  return (
    <View style={[styles.carouselWrap, { height: MEDIA_H }]}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {media.map((m, i) =>
          m.resource_type === 'video' ? (
            <VideoTile key={m.public_id ?? m.url ?? i} item={m} width={itemWidth} />
          ) : (
            <TouchableOpacity
              key={m.public_id ?? m.url ?? i}
              activeOpacity={0.94}
              onPress={() => onMediaPress?.(i)}
              style={{ width: itemWidth, height: MEDIA_H }}
            >
              <Image
                source={{ uri: m.secure_url || m.url }}
                style={[styles.carouselImage, { backgroundColor: theme.colors.skeleton }]}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )
        )}
      </ScrollView>

      {/* Counter pill */}
      <Animated.View
        style={[styles.counterPill, { transform: [{ scale: counterScale }] }]}
      >
        <Text style={styles.counterText}>
          {index + 1}/{media.length}
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
                backgroundColor:
                  i === index ? '#fff' : 'rgba(255,255,255,0.40)',
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
  singleWrap:   { width: '100%', height: MEDIA_H },
  singleImage:  { height: MEDIA_H },
  carouselWrap: { width: '100%', position: 'relative' },
  carouselImage: { width: '100%', height: MEDIA_H },
  counterPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.52)',
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
  dot: { height: 6, borderRadius: 3 },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.52)',
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
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  progressFill: { height: 3 },
});

export default PostMedia;
export { PostMedia };
// ✅ theme-migrated
