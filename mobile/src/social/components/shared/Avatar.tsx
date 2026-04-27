/**
 * Avatar — a consistent identity element with optional presence dot.
 * -----------------------------------------------------------------------------
 * Falls back to an initial on a tinted background when no avatar is provided,
 * so we never render a blank placeholder.
 */

import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { useSocialTheme } from '../../theme/socialTheme';
import OnlineStatusDot from '../chat/OnlineStatusDot';

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  /** Show presence dot at bottom-right. */
  lastSeen?: string | Date | null;
  isOnline?: boolean;
  showPresence?: boolean;
  /** White ring around avatar (e.g. when presence dot is shown). */
  ring?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 48,
  lastSeen,
  isOnline,
  showPresence,
  ring,
}) => {
  const theme = useSocialTheme();
  const dotSize = Math.max(10, Math.round(size * 0.24));
  const initial = (name ?? '?').charAt(0).toUpperCase();

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.img,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: ring ? 2 : 0,
              borderColor: theme.card,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: theme.primaryLighter,
              borderWidth: ring ? 2 : 0,
              borderColor: theme.card,
            },
          ]}
        >
          <Text
            style={{
              color: theme.primary,
              fontSize: Math.round(size * 0.42),
              fontWeight: '700',
            }}
          >
            {initial}
          </Text>
        </View>
      )}

      {showPresence && (
        <View style={styles.dot}>
          <OnlineStatusDot
            lastSeen={lastSeen}
            isOnline={isOnline}
            size={dotSize}
            showBorder
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  img: { backgroundColor: '#E5E7EB' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', right: 0, bottom: 0 },
});

export default Avatar;