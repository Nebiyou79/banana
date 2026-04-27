/**
 * OnlineStatusDot — colored circle showing presence level.
 * -----------------------------------------------------------------------------
 * Green/yellow/gray/transparent mapping follows the blueprint (Appendix A).
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useSocialTheme } from '../../theme/socialTheme';
import { getPresenceColor, getPresenceLevel } from '../../utils/presence';

export interface OnlineStatusDotProps {
  lastSeen?: string | Date | null;
  isOnline?: boolean;
  size?: number;
  showBorder?: boolean;
}

const OnlineStatusDot: React.FC<OnlineStatusDotProps> = ({
  lastSeen,
  isOnline,
  size = 12,
  showBorder,
}) => {
  const theme = useSocialTheme();
  const color = getPresenceColor(getPresenceLevel(lastSeen, isOnline));

  if (color === 'transparent') return null;

  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderWidth: showBorder ? 2 : 0,
          borderColor: theme.card,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({ dot: {} });

export default OnlineStatusDot;