export {
  ROLE_COLORS,
  DARK_SOCIAL,
  LIGHT_SOCIAL,
  ROLE_SPLASH_LABELS,
  REACTION_EMOJI,
  SPACING,
  RADIUS,
  TYPE,
  withAlpha,
  useSocialTheme,
} from '../../theme/socialTheme';
export type { SocialTheme } from '../../theme/socialTheme';

export {
  useFadeIn,
  useSlideUp,
  usePressScale,
  useLikeBurst,
  useSkeletonPulse,
  useTabIndicator,
  useHeaderCollapse,
} from '../../theme/animations';

export {
  ADS_CONFIG,
  getAdForPlacement,
  injectAdsIntoFeed,
} from '../../theme/adsConfig';

export {
  getRoleBadgeStyle,
  getFollowButtonStyle,
  type FollowState,
} from '../../theme/styleHelpers';
import React, { memo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import type { UserRole } from '../../types';

const ROLE_LABELS: Record<UserRole, string> = {
  candidate: 'Candidate',
  freelancer: 'Freelancer',
  company: 'Company',
  organization: 'Org',
};

interface Props {
  role?: UserRole;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

/**
 * Small uppercase pill that displays the owner's role. The role's own palette
 * is used (not the viewer's), so a candidate sees a freelancer's purple badge
 * on a freelancer's post. Background uses `withAlpha(roleColor, 0.12)`.
 */
const RoleBadge: React.FC<Props> = memo(({ role, size = 'sm', style }) => {
  const { roleColors, withAlpha, colors } = useSocialTheme();
  if (!role) return null;

  const palette = roleColors[role] ?? roleColors.candidate;
  const label = ROLE_LABELS[role] ?? role;
  const md = size === 'md';

  const height = md ? 22 : 18;
  const paddingHorizontal = md ? 8 : 6;
  const fontSize = md ? 11 : 10;

  return (
    <View
      style={[
        styles.badge,
        {
          height,
          paddingHorizontal,
          backgroundColor: withAlpha(palette.primary, 0.12),
          borderColor: withAlpha(palette.primary, 0.28),
        },
        style,
      ]}
      accessibilityLabel={`${label} role`}
    >
      <Text
        style={[
          styles.text,
          {
            color: palette.primary,
            fontSize,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
});

RoleBadge.displayName = 'RoleBadge';

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    marginLeft: 5,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default RoleBadge;