// ─────────────────────────────────────────────────────────────────────────────
//  src/components/shared/TenderOwnerAvatar.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Single source of truth for rendering a tender-owner avatar.
//
//  Resolution priority (mirrors Product/Profile avatar architecture):
//    1. entity.avatarUrl          — Cloudinary secure_url from profileController
//    2. entity.userProfile?.avatar?.secure_url — direct nested profile avatar
//    3. entity.logo               — Company.logo virtual (legacy fallback)
//    4. entity.logoUrl            — raw legacy field
//    5. Initials placeholder      — derived from entity.name
//
//  Usage:
//    <TenderOwnerAvatar entity={tender.ownerEntity} size={40} />
//    <TenderOwnerAvatar name="Acme Corp" avatarUrl={url} size={32} role="company" />
// ─────────────────────────────────────────────────────────────────────────────

import React, { memo } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TenderOwnerAvatarEntity {
  name?:        string;
  avatarUrl?:   string | null;
  logo?:        string | null;
  logoUrl?:     string | null;
  verified?:    boolean;
  userProfile?: {
    avatar?: {
      secure_url?: string | null;
      url?:        string | null;
    };
  };
  /** 'company' | 'organization' — controls fallback icon */
  ownerRole?: 'company' | 'organization';
}

export interface TenderOwnerAvatarProps {
  /** Pre-shaped entity object from the tender. */
  entity?: TenderOwnerAvatarEntity | null;
  /** Convenience override — used when entity is not available. */
  name?:      string;
  avatarUrl?: string | null;
  verified?:  boolean;
  role?:      'company' | 'organization';
  /** px — default 40 */
  size?: number;
  /** When true, show a verification badge on the avatar */
  showBadge?: boolean;
  style?: ViewStyle;
}

// ─── URL resolver ─────────────────────────────────────────────────────────────

/**
 * Resolves the best available avatar URL for a tender owner entity.
 * Follows the same priority chain as the Product/Profile avatar resolver.
 */
export function resolveTenderOwnerAvatarUrl(
  entity?: TenderOwnerAvatarEntity | null,
  fallbackUrl?: string | null,
): string | null {
  // Priority 1 — pre-flattened avatarUrl (set by controller after population)
  const a = entity?.avatarUrl ?? fallbackUrl;
  if (a) return a;

  // Priority 2 — nested profile avatar secure_url
  const profileAvatar = entity?.userProfile?.avatar;
  if (profileAvatar?.secure_url) return profileAvatar.secure_url;
  if (profileAvatar?.url)        return profileAvatar.url;

  // Priority 3 — Company.logo virtual (computed from userProfile or legacy logoUrl)
  if (entity?.logo)    return entity.logo;
  if (entity?.logoUrl) return entity.logoUrl;

  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TenderOwnerAvatar: React.FC<TenderOwnerAvatarProps> = memo(({
  entity,
  name,
  avatarUrl: avatarUrlProp,
  verified: verifiedProp,
  role,
  size = 40,
  showBadge = true,
  style,
}) => {
  const { colors, radius } = useTheme();

  // Resolve display values — prop overrides entity fields
  const displayName   = name  ?? entity?.name   ?? '';
  const isVerified    = verifiedProp ?? entity?.verified ?? false;
  const ownerRole     = role  ?? entity?.ownerRole ?? 'company';
  const resolvedUrl   = resolveTenderOwnerAvatarUrl(entity, avatarUrlProp);

  const borderRadius  = size * 0.28;           // slightly rounded square (product-style)
  const badgeSize     = Math.max(12, size * 0.32);
  const initial       = displayName?.[0]?.toUpperCase() ?? '?';

  // Color derived from ownerRole for placeholder
  const accentColor = ownerRole === 'organization'
    ? (colors.organization ?? colors.secondary)
    : colors.primary;

  const placeholderBg = withAlpha(accentColor, 0.13);
  const placeholderFg = accentColor;

  return (
    <View style={[av.wrap, { width: size, height: size }, style]}>
      {resolvedUrl ? (
        <Image
          source={{ uri: resolvedUrl }}
          style={[
            av.image,
            {
              width:        size,
              height:       size,
              borderRadius,
              borderColor:  colors.border,
            },
          ]}
          resizeMode="cover"
          accessibilityLabel={`${displayName} logo`}
        />
      ) : (
        <View
          style={[
            av.placeholder,
            {
              width:           size,
              height:          size,
              borderRadius,
              backgroundColor: placeholderBg,
              borderColor:     withAlpha(accentColor, 0.30),
            },
          ]}
        >
          {displayName ? (
            <Text
              style={[
                av.initial,
                {
                  color:    placeholderFg,
                  fontSize: Math.max(11, size * 0.40),
                },
              ]}
            >
              {initial}
            </Text>
          ) : (
            <Ionicons
              name={ownerRole === 'organization' ? 'people' : 'business'}
              size={Math.max(14, size * 0.48)}
              color={placeholderFg}
            />
          )}
        </View>
      )}

      {/* Verification badge */}
      {showBadge && isVerified && (
        <View
          style={[
            av.badge,
            {
              width:           badgeSize,
              height:          badgeSize,
              borderRadius:    badgeSize / 2,
              backgroundColor: colors.success,
              borderColor:     colors.bg,
              bottom:          -2,
              right:           -2,
            },
          ]}
        >
          <Ionicons
            name="checkmark"
            size={badgeSize * 0.58}
            color="#fff"
          />
        </View>
      )}
    </View>
  );
});

TenderOwnerAvatar.displayName = 'TenderOwnerAvatar';

// ─── Styles ───────────────────────────────────────────────────────────────────

const av = StyleSheet.create({
  wrap: {
    position: 'relative',
    flexShrink: 0,
  },
  image: {
    borderWidth: 1,
  },
  placeholder: {
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
  },
  initial: {
    fontWeight: '800',
  },
  badge: {
    position:       'absolute',
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1.5,
  },
});

export default TenderOwnerAvatar;