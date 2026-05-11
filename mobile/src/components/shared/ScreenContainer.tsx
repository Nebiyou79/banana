// NEW FILE
// src/components/shared/ScreenContainer.tsx
// ─── Screen container ─────────────────────────────────────────────────────────
// Wraps SafeAreaView (from react-native-safe-area-context — NEVER from react-native)
// with consistent background and optional padding.

import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { SPACING } from '../../theme/tokens';

interface ScreenContainerProps {
  children: React.ReactNode;
  edges?: Edge[];
  noPadding?: boolean;
  style?: ViewStyle;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  edges = ['top', 'bottom', 'left', 'right'],
  noPadding = false,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.root,
        { backgroundColor: colors.bg },
        !noPadding && styles.padding,
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: SPACING.lg,
  },
});

export default ScreenContainer;