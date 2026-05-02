// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/ProfessionalTenderWorkflowBadge.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  P-01: workflowType is 'open' | 'closed' — never 'sealed'.  We display
//        the closed workflow as "SEALED" but the prop and underlying value
//        is always 'closed'.
//
//  Always visible on cards and detail screens (per § 3.2 component table).
//  Prominent: OPEN = teal, SEALED = purple.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lock, Globe } from 'lucide-react-native';
import { useThemeStore } from '../../store/themeStore';
import type { ProfessionalTenderWorkflowType } from '../../types/professionalTender';

interface BadgeStyle {
  bg: string;
  fg: string;
  border: string;
}

const resolveStyle = (
  workflowType: ProfessionalTenderWorkflowType,
  isDark: boolean,
): BadgeStyle => {
  // Teal for open
  if (workflowType === 'open') {
    return isDark
      ? { bg: 'rgba(20,184,166,0.18)', fg: '#5EEAD4', border: 'rgba(20,184,166,0.40)' }
      : { bg: '#CCFBF1',               fg: '#0F766E', border: '#99F6E4' };
  }
  // Purple for closed (= sealed)
  return isDark
    ? { bg: 'rgba(168,85,247,0.18)', fg: '#D8B4FE', border: 'rgba(168,85,247,0.40)' }
    : { bg: '#EDE9FE',               fg: '#6D28D9', border: '#DDD6FE' };
};

export interface ProfessionalTenderWorkflowBadgeProps {
  workflowType: ProfessionalTenderWorkflowType;
  /** 'sm' for cards, 'md' for headers, 'lg' for hero contexts. */
  size?: 'sm' | 'md' | 'lg';
  /** Hide the icon to save horizontal space in dense lists. */
  iconOnly?: boolean;
  /** Hide the icon and just show the label. */
  hideIcon?: boolean;
}

const SIZE_TOKENS: Record<
  NonNullable<ProfessionalTenderWorkflowBadgeProps['size']>,
  { padH: number; padV: number; fontSize: number; iconSize: number; lineHeight: number }
> = {
  sm: { padH: 8,  padV: 2, fontSize: 10, iconSize: 11, lineHeight: 14 },
  md: { padH: 10, padV: 4, fontSize: 11, iconSize: 13, lineHeight: 15 },
  lg: { padH: 14, padV: 6, fontSize: 13, iconSize: 15, lineHeight: 18 },
};

const ProfessionalTenderWorkflowBadge: React.FC<ProfessionalTenderWorkflowBadgeProps> = ({
  workflowType,
  size = 'sm',
  iconOnly = false,
  hideIcon = false,
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = resolveStyle(workflowType, !!isDark);
  const tokens = SIZE_TOKENS[size];

  const isOpen = workflowType === 'open';
  const Icon = isOpen ? Globe : Lock;
  const label = isOpen ? 'OPEN' : 'SEALED';

  return (
    <View
      style={[
        styles.base,
        {
          paddingHorizontal: iconOnly ? tokens.padV + 2 : tokens.padH,
          paddingVertical: tokens.padV,
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Workflow: ${label}`}
    >
      {!hideIcon && (
        <Icon size={tokens.iconSize} color={palette.fg} strokeWidth={2.5} />
      )}
      {!iconOnly && (
        <Text
          style={[
            styles.text,
            {
              fontSize: tokens.fontSize,
              lineHeight: tokens.lineHeight,
              color: palette.fg,
              marginLeft: hideIcon ? 0 : 4,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});

export default ProfessionalTenderWorkflowBadge;
