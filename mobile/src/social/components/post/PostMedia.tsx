import { Ionicons } from '@expo/vector-icons';
import React, { memo, useState } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SOCIAL_LAYOUT } from '../../theme/layout';
import { useSocialTheme } from '../../theme/socialTheme';
import type { PostMedia as PostMediaT } from '../../types';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  media: PostMediaT[];
  onMediaPress?: (index: number) => void;
}

/**
 * Renders a post's media array:
 *  - 1 item  → single image/video preview
 *  - 2 items → 2-column grid
 *  - 3+ items → first large, then 2 stacked; overlay "+N" on the last
 *
 * Videos show a circular play icon overlay.
 */
const PostMedia: React.FC<Props> = memo(({ media, onMediaPress }) => {
  const theme = useSocialTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  if (!media?.length) return null;

  const count = media.length;

  if (count === 1) {
    const m = media[0];
    const aspect =
      m.width && m.height ? m.width / m.height : 1.5;
    const maxH = SOCIAL_LAYOUT.postMediaMaxHeight;
    const calcH = Math.min(SCREEN_W / aspect, maxH);
    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => onMediaPress?.(0)}
      >
        <Image
          source={{ uri: m.url || m.secure_url }}
          style={{
            width: SCREEN_W,
            height: calcH,
            backgroundColor: theme.skeleton,
          }}
          resizeMode="cover"
        />
        {m.type === 'video' ? <PlayOverlay /> : null}
      </TouchableOpacity>
    );
  }

  if (count === 2) {
    return (
      <View style={styles.row}>
        {media.slice(0, 2).map((m, i) => (
          <TouchableOpacity
            key={m._id ?? i}
            activeOpacity={0.95}
            onPress={() => onMediaPress?.(i)}
            style={{ flex: 1 }}
          >
            <Image
              source={{ uri: m.thumbnail || m.url || m.secure_url }}
              style={[styles.gridItem, { backgroundColor: theme.skeleton }]}
              resizeMode="cover"
            />
            {m.type === 'video' ? <PlayOverlay small /> : null}
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // 3+ items: 1 large + 2 stacked
  return (
    <View style={styles.row}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => onMediaPress?.(0)}
        style={{ flex: 2 }}
      >
        <Image
          source={{ uri: media[0].thumbnail || media[0].url || media[0].secure_url }}
          style={[styles.gridItemTall, { backgroundColor: theme.skeleton }]}
          resizeMode="cover"
        />
        {media[0].type === 'video' ? <PlayOverlay /> : null}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        {media.slice(1, 3).map((m, i) => {
          const isLast = i === 1 && count > 3;
          return (
            <TouchableOpacity
              key={m._id ?? i + 1}
              activeOpacity={0.95}
              onPress={() => onMediaPress?.(i + 1)}
              style={{ flex: 1 }}
            >
              <Image
                source={{ uri: m.thumbnail || m.url || m.secure_url }}
                style={[styles.gridItemSmall, { backgroundColor: theme.skeleton }]}
                resizeMode="cover"
              />
              {isLast ? (
                <View style={styles.moreOverlay}>
                  <Text style={styles.moreText}>+{count - 3}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const PlayOverlay: React.FC<{ small?: boolean }> = ({ small }) => (
  <View style={styles.playWrap} pointerEvents="none">
    <View
      style={[
        styles.playCircle,
        { width: small ? 44 : 56, height: small ? 44 : 56, borderRadius: small ? 22 : 28 },
      ]}
    >
      <Ionicons name="play" size={small ? 18 : 24} color="#fff" />
    </View>
  </View>
);

PostMedia.displayName = 'PostMedia';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
  gridItem: { width: '100%', height: 240 },
  gridItemTall: { width: '100%', height: 320 },
  gridItemSmall: { width: '100%', height: 159, marginBottom: 2 },
  playWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: { color: '#fff', fontSize: 22, fontWeight: '700' },
});

export default PostMedia;