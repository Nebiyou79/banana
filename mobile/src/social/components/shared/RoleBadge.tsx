import React, { memo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ROLE_COLORS, useSocialTheme } from '../../theme/socialTheme';
import type { UserRole } from '../../types';

const ROLE_LABELS: Record<UserRole, string> = {
  candidate: 'Candidate',
  freelancer: 'Freelancer',
  company: 'Company',
  organization: 'Org',
};

interface Props {
  role?: UserRole;
  size?: 'xs' | 'sm';
  style?: ViewStyle;
}

/**
 * Small uppercase pill that displays the owner's role. Color follows the
 * role's own palette (not the viewer's), so a candidate sees a freelancer's
 * purple badge on a freelancer's post.
 */
const RoleBadge: React.FC<Props> = memo(({ role, size = 'xs', style }) => {
  const theme = useSocialTheme();
  if (!role) return null;

  const colors = ROLE_COLORS[role] ?? ROLE_COLORS.candidate;
  const label = ROLE_LABELS[role] ?? role;
  const sm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.dark ? `${colors.primary}22` : colors.lighter,
          borderColor: theme.dark ? colors.light : colors.adBorder,
          paddingHorizontal: sm ? 7 : 5,
          paddingVertical: sm ? 2 : 1,
        },
        style,
      ]}
      accessibilityLabel={`${label} role`}
    >
      <Text
        style={[
          styles.text,
          {
            color: theme.dark ? colors.light : colors.dark,
            fontSize: sm ? 10 : 9,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
});

RoleBadge.displayName = 'RoleBadge';

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
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