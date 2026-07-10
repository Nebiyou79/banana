// src/social/components/shared/Avatar.tsx
import React, { memo } from 'react';
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

const Avatar: React.FC<AvatarProps> = memo(({
  uri, name, size = 48, lastSeen, isOnline, showPresence, ring,
}) => {
  const theme = useSocialTheme();
  const { colors, withAlpha } = theme;
  
  const dotSize = Math.max(10, Math.round(size * 0.24));
  const initial = (name ?? '?').charAt(0).toUpperCase();

  // Dark mode: glowing ring, soft background
  // Light mode: clean ring, subtle background
  const ringColor = ring ? colors.primary : 'transparent';
  const ringWidth = ring ? 2 : 0;
  
  // Fallback background: role-primary with opacity
  const fallbackBg = withAlpha(colors.primary, theme.dark ? 0.2 : 0.12);

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: ringWidth,
            borderColor: ringColor,
            backgroundColor: colors.skeleton,
          }}
        />
      ) : (
        <View style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: fallbackBg,
          borderWidth: ringWidth,
          borderColor: ringColor,
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
});

const styles = StyleSheet.create({
  dot: { position: 'absolute', right: 0, bottom: 0 },
});

export default Avatar;