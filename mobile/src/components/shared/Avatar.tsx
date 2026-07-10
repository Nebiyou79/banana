// src/components/shared/Avatar.tsx
// ─────────────────────────────────────────────────────────────────────────────
// FIXED: jobOwnerToEntity now uses resolveLogoUrl() which checks every field
// name the backend might use (avatarUrl, logoUrl, logo, profileImage, avatar,
// avatar.secure_url) — same priority chain as ProductController.buildOwnerSnapshot.
// 
// DEBUG MODE ADDED — logs image loading state
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, memo, useEffect, useRef } from 'react';
import {
  View, Text, Image, StyleSheet, ViewStyle,
  ActivityIndicator, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { resolveLogoUrl } from '../../models/companyPreview';

// ═══════════════════════════════════════════════════════════════════════════════
// DEBUG CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════
const DEBUG_AVATAR = __DEV__ && true; // ← SET TO false TO DISABLE

const debugLog = (message: string, data?: any) => {
  if (!DEBUG_AVATAR) return;
  console.log(`🖼️ [Avatar] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

// ─── Types ──────────────────────────────────────────────────────────────────

export type AvatarEntity =
  | { type: 'company';      name?: string; logoUrl?: string; logo?: string; verified?: boolean }
  | { type: 'organization'; name?: string; logoUrl?: string; logo?: string; verified?: boolean }
  | { type: 'candidate';    name?: string; avatar?: string; profileImage?: string }
  | { type: 'freelancer';   name?: string; avatar?: string; profileImage?: string }
  | { type: 'generic';      name?: string; imageUrl?: string };

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getEntityAvatarUrl(entity: AvatarEntity): string | null {
  if (!entity) {
    debugLog('getEntityAvatarUrl: entity is null/undefined');
    return null;
  }
  
  switch (entity.type) {
    case 'company':
    case 'organization': {
      const url = resolveLogoUrl(entity as Record<string, any>);
      debugLog(`getEntityAvatarUrl [${entity.type}]:`, {
        hasLogoUrl: !!entity.logoUrl,
        hasLogo: !!entity.logo,
        resolvedUrl: url ? `${url.substring(0, 60)}...` : 'NULL',
      });
      return url ?? null;
    }
    case 'candidate':
    case 'freelancer': {
      const url = entity.avatar || entity.profileImage || null;
      debugLog(`getEntityAvatarUrl [${entity.type}]:`, {
        hasAvatar: !!entity.avatar,
        hasProfileImage: !!entity.profileImage,
        resolvedUrl: url ? `${url.substring(0, 60)}...` : 'NULL',
      });
      return url;
    }
    case 'generic': {
      debugLog('getEntityAvatarUrl [generic]:', { imageUrl: entity.imageUrl });
      return entity.imageUrl || null;
    }
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

// ─── Component Props ────────────────────────────────────────────────────────

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

// ─── Component ──────────────────────────────────────────────────────────────

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
  const { colors: c } = useTheme();
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading]   = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 200, useNativeDriver: true,
    }).start();
  }, []);

  const resolvedUri = (() => {
    if (uriOverride !== undefined) return uriOverride;
    if (entity) return getEntityAvatarUrl(entity);
    return null;
  })();

  // Reset error state when URI changes
  useEffect(() => {
    setImgError(false);
    setLoading(true);
  }, [resolvedUri]);

  const resolvedName  = nameOverride ?? entity?.name ?? null;
  const showVerified  = verified ?? (entity && 'verified' in entity ? (entity as any).verified : false);
  const radius        = borderRadius ?? size * 0.22;
  const badgeSize     = Math.max(12, size * 0.3);
  const showImage     = !!resolvedUri && !imgError;
  const initials      = getInitials(resolvedName);
  const fontSize      = size <= 32 ? 11 : size <= 48 ? 14 : size <= 64 ? 18 : 22;

  // Debug log
  useEffect(() => {
    debugLog(`Rendering [${entity?.type ?? 'unknown'}]:`, {
      size,
      resolvedUri: resolvedUri ? `${resolvedUri.substring(0, 80)}...` : 'NONE',
      showImage,
      imgError,
      loading,
      resolvedName,
      initials,
    });
  }, [resolvedUri, showImage, imgError, loading, resolvedName, initials, entity?.type, size]);

  return (
    <Animated.View style={[{ width: size, height: size, opacity: fadeAnim }, style]}>
      {showImage ? (
        <React.Fragment>
          <Image
            source={{ uri: resolvedUri! }}
            style={[
              styles.image,
              { width: size, height: size, borderRadius: radius, borderColor: c.borderPrimary },
            ]}
            resizeMode="cover"
            onError={() => { 
              debugLog('❌ Image load ERROR', { uri: resolvedUri?.substring(0, 80) });
              setImgError(true); 
              setLoading(false); 
            }}
            onLoadStart={() => {
              debugLog('⏳ Image load STARTED');
              setLoading(true);
            }}
            onLoadEnd={() => {
              debugLog('✅ Image load ENDED');
              setLoading(false);
            }}
          />
          {showLoader && loading && (
            <View style={[styles.loaderOverlay, { borderRadius: radius, backgroundColor: 'rgba(0,0,0,0.25)' }]}>
              <ActivityIndicator size="small" color={c.accent} />
            </View>
          )}
        </React.Fragment>
      ) : (
        <View style={[
          styles.fallback,
          { width: size, height: size, borderRadius: radius, backgroundColor: c.accentBg || c.primary + '15' },
        ]}>
          <Text style={[styles.initials, { fontSize, color: c.accent || c.primary }]}>
            {initials}
          </Text>
        </View>
      )}

      {showVerified && (
        <View style={[
          styles.verifiedBadge,
          { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2, bottom: -2, right: -2, backgroundColor: c.success, borderColor: c.bgCard },
        ]}>
          <Ionicons name="checkmark" size={badgeSize * 0.65} color={c.textInverse || '#FFFFFF'} />
        </View>
      )}
    </Animated.View>
  );
});

Avatar.displayName = 'Avatar';

// ─── Entity converters ──────────────────────────────────────────────────────

/**
 * FIXED: Now uses resolveLogoUrl() which covers every field name the backend
 * might use — mirrors the same priority chain as ProductController.
 *
 * Also accepts the new `ownerPreview` field added by the fixed jobController.
 */
export function jobOwnerToEntity(job: {
  jobType?: 'company' | 'organization';
  company?: {
    name?: string; logoUrl?: string; logo?: string; avatar?: string;
    avatarUrl?: string; profileImage?: string; avatarPublicId?: string;
    verified?: boolean;
  } | null;
  organization?: {
    name?: string; logoUrl?: string; logo?: string; avatar?: string;
    avatarUrl?: string; profileImage?: string; avatarPublicId?: string;
    verified?: boolean;
  } | null;
  /** New field added by fixed jobController — preferred when present */
  ownerPreview?: {
    name?: string; logoUrl?: string; avatarUrl?: string;
    verified?: boolean; type?: string;
  } | null;
}): AvatarEntity {
  const isOrg = job.jobType === 'organization';
  const type  = isOrg ? 'organization' : 'company';

  // Prefer the backend-synthesised ownerPreview (Profile-backed, always correct)
  if (job.ownerPreview) {
    debugLog('jobOwnerToEntity: Using ownerPreview', {
      type,
      name: job.ownerPreview.name,
      logoUrl: resolveLogoUrl(job.ownerPreview as Record<string, any>),
      verified: job.ownerPreview.verified,
    });
    return {
      type:     type as 'company' | 'organization',
      name:     job.ownerPreview.name,
      logoUrl:  resolveLogoUrl(job.ownerPreview as Record<string, any>),
      verified: job.ownerPreview.verified,
    };
  }

  const owner = isOrg ? job.organization : job.company;
  const resolvedUrl = resolveLogoUrl(owner as Record<string, any>);
  
  debugLog('jobOwnerToEntity: Using populated doc', {
    type,
    name: owner?.name,
    ownerFields: owner ? Object.keys(owner) : [],
    resolvedUrl: resolvedUrl ? `${resolvedUrl.substring(0, 60)}...` : 'NONE',
    verified: owner?.verified,
  });
  
  return {
    type:     type as 'company' | 'organization',
    name:     owner?.name,
    logoUrl:  resolvedUrl,
    verified: owner?.verified,
  };
}

export function candidateToEntity(
  candidate?: { name?: string; avatar?: string; profileImage?: string } | null,
  userInfo?: { name?: string } | null,
): AvatarEntity {
  return {
    type:         'candidate',
    name:         userInfo?.name ?? candidate?.name,
    avatar:       candidate?.avatar,
    profileImage: candidate?.profileImage,
  };
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  image: {
    borderWidth: 1.5,
  },
  fallback: {
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1.5,
    borderColor:    'transparent',
  },
  initials: {
    fontWeight:    '800',
    letterSpacing: 0.5,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position:       'absolute',
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1.5,
  },
});

export default Avatar;