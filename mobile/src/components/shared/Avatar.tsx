// Avatar.tsx
import React, { useState, memo, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ActivityIndicator, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export type AvatarEntity =
  | { type: 'company';      name?: string; logoUrl?: string; logo?: string; verified?: boolean }
  | { type: 'organization'; name?: string; logoUrl?: string; logo?: string; verified?: boolean }
  | { type: 'candidate';    name?: string; avatar?: string; profileImage?: string }
  | { type: 'freelancer';   name?: string; avatar?: string; profileImage?: string }
  | { type: 'generic';      name?: string; imageUrl?: string };

export function getEntityAvatarUrl(entity: AvatarEntity): string | null {
  if (!entity) return null;
  switch (entity.type) {
    case 'company':
    case 'organization':
      return entity.logoUrl || entity.logo || null;
    case 'candidate':
    case 'freelancer':
      return entity.avatar || entity.profileImage || null;
    case 'generic':
      return entity.imageUrl || null;
    default:
      return null;
  }
}

export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export interface AvatarProps {
  entity?: AvatarEntity;
  uri?: string | null;
  name?: string | null;
  size?: number;
  borderRadius?: number;
  verified?: boolean;
  showLoader?: boolean;
  style?: ViewStyle;
}

export const Avatar = memo<AvatarProps>(({
  entity,
  uri: uriOverride,
  name: nameOverride,
  size = 44,
  borderRadius,
  verified,
  showLoader = false,
  style,
}) => {
  const { colors } = useTheme();
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  const resolvedUri = (() => {
    if (uriOverride !== undefined) return uriOverride;
    if (entity) return getEntityAvatarUrl(entity);
    return null;
  })();

  const resolvedName = nameOverride ?? entity?.name ?? null;
  const entityType: AvatarEntity['type'] = entity?.type ?? 'generic';
  const showVerified = verified ?? (entity && ('verified' in entity) ? (entity as any).verified : false);
  const radius = borderRadius ?? size * 0.22;
  const badgeSize = Math.max(12, size * 0.3);
  const showImage = !!resolvedUri && !imgError;
  const initials = getInitials(resolvedName);
  const fontSize = size <= 32 ? 11 : size <= 48 ? 14 : size <= 64 ? 18 : 22;

  return (
    <Animated.View style={[{ width: size, height: size, opacity: fadeAnim }, style]}>
      {showImage ? (
        <>
          <Image
            source={{ uri: resolvedUri! }}
            style={[styles.image, { width: size, height: size, borderRadius: radius, borderColor: colors.borderPrimary }]}
            resizeMode="cover"
            onError={() => setImgError(true)}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
          />
          {showLoader && loading && (
            <View style={[styles.loaderOverlay, { borderRadius: radius, backgroundColor: 'rgba(0,0,0,0.25)' }]}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          )}
        </>
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: radius, backgroundColor: colors.accentBg }]}>
          <Text style={[styles.initials, { fontSize, color: colors.accent }]}>
            {initials}
          </Text>
        </View>
      )}

      {showVerified && (
        <View style={[styles.verifiedBadge, { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2, bottom: -2, right: -2, backgroundColor: colors.success, borderColor: colors.bgCard }]}>
          <Text style={[styles.verifiedIcon, { fontSize: badgeSize * 0.7, color: colors.textInverse }]}>✓</Text>
        </View>
      )}
    </Animated.View>
  );
});

Avatar.displayName = 'Avatar';

export function jobOwnerToEntity(job: {
  jobType?: 'company' | 'organization';
  company?: { name?: string; logoUrl?: string; logo?: string; verified?: boolean } | null;
  organization?: { name?: string; logoUrl?: string; logo?: string; verified?: boolean } | null;
}): AvatarEntity {
  const isOrg = job.jobType === 'organization';
  const owner = isOrg ? job.organization : job.company;
  return {
    type: isOrg ? 'organization' : 'company',
    name: owner?.name,
    logoUrl: owner?.logoUrl,
    logo: owner?.logo,
    verified: owner?.verified,
  };
}

export function candidateToEntity(candidate?: {
  name?: string;
  avatar?: string;
  profileImage?: string;
} | null, userInfo?: { name?: string } | null): AvatarEntity {
  return {
    type: 'candidate',
    name: userInfo?.name ?? candidate?.name,
    avatar: candidate?.avatar,
    profileImage: candidate?.profileImage,
  };
}

const styles = StyleSheet.create({
  image: { borderWidth: 1.5 },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '800', letterSpacing: 0.5 },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  verifiedBadge: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  verifiedIcon: { fontWeight: '900', lineHeight: undefined },
});