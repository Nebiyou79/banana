import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import OnlineStatusDot from '../chat/OnlineStatusDot';

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  lastSeen?: string | Date | null;
  isOnline?: boolean;
  showPresence?: boolean;
  ring?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  uri, name, size = 48, lastSeen, isOnline, showPresence, ring,
}) => {
  const { colors, withAlpha } = useSocialTheme();
  const dotSize = Math.max(10, Math.round(size * 0.24));
  const initial = (name ?? '?').charAt(0).toUpperCase();

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: size, height: size,
            borderRadius: size / 2,
            borderWidth: ring ? 2 : 0,
            borderColor: colors.card,
            backgroundColor: colors.skeleton,
          }}
        />
      ) : (
        <View style={{
          width: size, height: size,
          borderRadius: size / 2,
          backgroundColor: withAlpha(colors.primary, 0.14),
          borderWidth: ring ? 2 : 0,
          borderColor: colors.card,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{
            color: colors.primary,
            fontSize: Math.round(size * 0.42),
            fontWeight: '700',
          }}>
            {initial}
          </Text>
        </View>
      )}
      {showPresence && (
        <View style={styles.dot}>
          <OnlineStatusDot lastSeen={lastSeen} isOnline={isOnline} size={dotSize} showBorder />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dot: { position: 'absolute', right: 0, bottom: 0 },
});

export default Avatar;
// ✅ theme-migrated
