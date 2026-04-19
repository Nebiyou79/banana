/**
 * mobile/src/components/products/OwnerAvatar.tsx
 *
 * Resolves the best avatar to show for a company / product owner.
 * Priority: Cloudinary secure_url (via avatarUrl) → plain HTTPS → gold initials
 *
 * Replaces the fragmented avatar logic scattered across ProductCard,
 * CompanyProductCard, and ProductDetailsScreen.
 */
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  name: string;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;   // kept for future direct Cloudinary transforms
  verified?: boolean;
  size?: number;                     // width & height in px (default 40)
  style?: ViewStyle;
}

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

export const OwnerAvatar: React.FC<Props> = ({
  name,
  avatarUrl,
  verified,
  size = 40,
  style,
}) => {
  const [imgError, setImgError] = useState(false);

  const resolvedUrl = avatarUrl
    ? avatarUrl.startsWith('http')
      ? avatarUrl
      : null
    : null;

  const showImage = !imgError && !!resolvedUrl;
  const initials  = getInitials(name || '?');
  const fontSize  = size <= 30 ? 11 : size <= 50 ? 14 : 18;

  return (
    <View style={[styles.wrapper, { width: size, height: size, borderRadius: size / 2 }, style]}>
      {showImage ? (
        <Image
          source={{ uri: resolvedUrl! }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <View style={[
          styles.fallback,
          { width: size, height: size, borderRadius: size / 2 },
        ]}>
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
      )}

      {verified && (
        <View style={[styles.badge, { bottom: -1, right: -1 }]}>
          <Ionicons name="checkmark-circle" size={size * 0.35} color="#22C55E" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper:  { position: 'relative', overflow: 'visible' },
  fallback: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F1BB03',
  },
  initials: { color: '#0A2540', fontWeight: '800' },
  badge:    { position: 'absolute', backgroundColor: '#fff', borderRadius: 999 },
});
