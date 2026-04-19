import type { TextStyle, ViewStyle } from 'react-native';
import type { UserRole } from '../types';
import { ROLE_COLORS } from './socialTheme';

/**
 * Role badge style — a small uppercase pill that sits next to a user's name
 * to advertise their role (Candidate / Freelancer / Company / Organization).
 */
export const getRoleBadgeStyle = (
  role: UserRole,
  dark: boolean
): { container: ViewStyle; text: TextStyle } => {
  const colors = ROLE_COLORS[role];
  return {
    container: {
      backgroundColor: dark ? `${colors.primary}22` : colors.lighter,
      borderColor: dark ? colors.light : colors.adBorder,
      borderWidth: 1,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    text: {
      color: dark ? colors.light : colors.dark,
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  };
};

/**
 * Follow button — filled when not following, outlined when following.
 * Consumers typically swap the label between "Follow" and "Following".
 */
export const getFollowButtonStyle = (
  isFollowing: boolean,
  primary: string,
  _dark: boolean
): { container: ViewStyle; text: TextStyle } => ({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: primary,
    backgroundColor: isFollowing ? 'transparent' : primary,
    minWidth: 80,
    alignItems: 'center',
  },
  text: {
    color: isFollowing ? primary : '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
