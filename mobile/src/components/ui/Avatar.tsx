// src/components/ui/Avatar.tsx
// Usage: <Avatar uri={user.avatar} name={user.name} size={44} showOnlineDot online />

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { initials as getInitials } from '../../theme/text';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  borderColor?: string;
  showOnlineDot?: boolean;
  online?: boolean;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 44,
  borderColor,
  showOnlineDot = false,
  online = false,
  style,
}) => {
  const { colors: c } = useTheme();
  const [imgError, setImgError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showImage = !!uri && !imgError;

  useEffect(() => {
    // Reset error state when URI changes
    setImgError(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [uri]);

  const avatarInitials = getInitials(name);
  const fontSize = Math.round(size * 0.36);
  const borderRadius = size / 2;
  const dotSize = 12;

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          opacity: fadeAnim,
        },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={{
            width: size,
            height: size,
            borderRadius,
            borderWidth: borderColor ? 2 : 0,
            borderColor: borderColor ?? 'transparent',
          }}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius,
            borderWidth: borderColor ? 2 : 0,
            borderColor: borderColor ?? 'transparent',
            backgroundColor: withAlpha(c.primary, 0.2),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: c.primary,
              fontWeight: '700',
              fontSize,
              lineHeight: fontSize * 1.2,
            }}
          >
            {avatarInitials}
          </Text>
        </View>
      )}

      {showOnlineDot && (
        <View
          style={[
            styles.onlineDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: online ? c.success : c.textMuted,
              borderColor: c.bg,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  onlineDot: {
    position: 'absolute',
    borderWidth: 2,
  },
});

export default Avatar;