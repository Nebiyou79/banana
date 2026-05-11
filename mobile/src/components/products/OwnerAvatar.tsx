// src/components/products/OwnerAvatar.tsx
// ─── Company/owner avatar resolver ────────────────────────────────────────────
// Priority: Cloudinary secure_url → plain HTTPS → themed initials fallback.
// All brand colors from useTheme(). No hardcoded hex.

import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  name: string;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;  // reserved for direct Cloudinary transforms
  verified?: boolean;
  size?: number;
  style?: ViewStyle;
}

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

export const OwnerAvatar: React.FC<Props> = ({
  name, avatarUrl, verified, size = 40, style,
}) => {
  const { colors: c, radius } = useTheme();
  const [imgError, setImgError] = useState(false);

  const resolvedUrl = avatarUrl?.startsWith('http') ? avatarUrl : null;
  const showImage = !imgError && !!resolvedUrl;
  const initials = getInitials(name || '?');
  const fontSize = size <= 30 ? 11 : size <= 50 ? 14 : 18;
  const avatarRadius = size / 2;
  const badgeSize = Math.max(12, size * 0.35);

  return (
    <View style={[{ width: size, height: size, borderRadius: avatarRadius }, style]}>
      {showImage ? (
        <Image
          source={{ uri: resolvedUrl! }}
          style={{ width: size, height: size, borderRadius: avatarRadius }}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <View style={[
          styles.fallback,
          {
            width: size, height: size,
            borderRadius: avatarRadius,
            backgroundColor: c.primary,
          },
        ]}>
          <Text style={[styles.initials, { fontSize, color: c.textInverse }]}>
            {initials}
          </Text>
        </View>
      )}

      {verified && (
        <View style={[
          styles.badge,
          {
            bottom: -1, right: -1,
            backgroundColor: c.bgCard,
            borderRadius: badgeSize / 2,
          },
        ]}>
          <Ionicons name="checkmark-circle" size={badgeSize} color={c.success} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '800' },
  badge:    { position: 'absolute' },
});

export default OwnerAvatar;