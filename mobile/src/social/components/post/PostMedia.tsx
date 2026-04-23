// src/social/components/post/PostMedia.tsx
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
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
const MEDIA_H = 300;

interface Props {
  media: PostMediaT[];
  onMediaPress?: (index: number) => void;
}

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

const VideoTile: React.FC<{ item: PostMediaT; width: number }> = memo(
  ({ item, width }) => {
    const theme = useSocialTheme();
    const src = item.secure_url || item.url || '';
    const thumb = getVideoThumbnail(item);

    const player = useVideoPlayer(src, player => {
      player.loop = false;
    });

    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    const togglePlay = useCallback(() => {
      if (player.playing) {
        player.pause();
        setPlaying(false);
      } else {
        player.play();
        setPlaying(true);
      }
    }, [player]);

    // Progress tracking
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
          <View pointerEvents="none" style={styles.playOverlay}>
            <View style={styles.playBtn}>
              <Ionicons name="play" size={26} color="#fff" />
            </View>
          </View>
        )}

        {playing && (
          <View pointerEvents="none" style={styles.pauseHint}>
            <Ionicons name="pause" size={16} color="#fff" />
          </View>
        )}

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, progress * 100)}%`,
                backgroundColor: theme.primary,
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  }
);

const PostMedia: React.FC<Props> = memo(({ media, onMediaPress }) => {
  const theme = useSocialTheme();
  const [index, setIndex] = useState(0);
  const itemWidth = SCREEN_W;

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      setIndex(Math.round(x / itemWidth));
    },
    [itemWidth]
  );

  if (!media || media.length === 0) return null;

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
        activeOpacity={0.95}
        onPress={() => onMediaPress?.(0)}
        style={styles.singleWrap}
      >
        <Image
          source={{ uri: m.secure_url || m.url }}
          style={[
            styles.singleImage,
            { width: itemWidth, backgroundColor: theme.skeleton },
          ]}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.carouselWrap}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
      >
        {media.map((m, i) =>
          m.resource_type === 'video' ? (
            <VideoTile key={m.public_id ?? m.url ?? i} item={m} width={itemWidth} />
          ) : (
            <TouchableOpacity
              key={m.public_id ?? m.url ?? i}
              activeOpacity={0.95}
              onPress={() => onMediaPress?.(i)}
              style={{ width: itemWidth, height: MEDIA_H }}
            >
              <Image
                source={{ uri: m.secure_url || m.url }}
                style={[
                  styles.carouselImage,
                  { backgroundColor: theme.skeleton },
                ]}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )
        )}
      </ScrollView>

      <View style={styles.counterPill}>
        <Text style={styles.counterText}>
          {index + 1}/{media.length}
        </Text>
      </View>

      <View style={styles.dotsRow} pointerEvents="none">
        {media.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i === index ? '#fff' : 'rgba(255,255,255,0.45)',
                width: i === index ? 8 : 6,
                height: i === index ? 8 : 6,
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
  singleImage: { height: MEDIA_H },
  carouselWrap: {
    width: '100%',
    height: MEDIA_H,
    position: 'relative',
  },
  carouselImage: { width: '100%', height: MEDIA_H },
  counterPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
  },
  counterText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  dotsRow: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: { borderRadius: 4 },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseHint: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressFill: { height: 3 },
});

export default PostMedia;