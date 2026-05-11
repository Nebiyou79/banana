// src/social/components/shared/HashtagText.tsx
/**
 * HashtagText — renders text with coloured #hashtags and @mentions
 *
 * Theme migration:
 * - `theme.text`    → flat alias, still valid ✅
 * - `theme.primary` → flat alias, still valid ✅
 *
 * This component is clean — no broken tokens. Migrated to use
 * `theme.colors.*` for the internal defaults to align with the new
 * authoritative pattern, while keeping prop overrides intact.
 */
import React, { memo } from 'react';
import { Text, TextStyle } from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';

interface Props {
  text: string;
  textColor?: string;
  primaryColor?: string;
  onHashtagPress?: (tag: string) => void;
  onMentionPress?: (username: string) => void;
  style?: TextStyle;
  numberOfLines?: number;
}

const HASHTAG_MENTION_RE = /(#\w+|@\w+)/g;

const HashtagText: React.FC<Props> = memo(
  ({
    text,
    textColor,
    primaryColor,
    onHashtagPress,
    onMentionPress,
    style,
    numberOfLines,
  }) => {
    const theme  = useSocialTheme();
    // Use theme.colors.* as authoritative default; prop overrides still respected
    const base   = textColor    ?? theme.colors.text;
    const accent = primaryColor ?? theme.colors.primary;

    const parts = (text ?? '').split(HASHTAG_MENTION_RE);

    return (
      <Text style={[{ color: base }, style]} numberOfLines={numberOfLines}>
        {parts.map((part, i) => {
          if (!part) return null;
          if (part.startsWith('#')) {
            return (
              <Text
                key={i}
                style={{ color: accent, fontWeight: '600' }}
                onPress={() => onHashtagPress?.(part.slice(1))}
              >
                {part}
              </Text>
            );
          }
          if (part.startsWith('@')) {
            return (
              <Text
                key={i}
                style={{ color: accent, fontWeight: '600' }}
                onPress={() => onMentionPress?.(part.slice(1))}
              >
                {part}
              </Text>
            );
          }
          return (
            <Text key={i} style={{ color: base }}>
              {part}
            </Text>
          );
        })}
      </Text>
    );
  }
);

HashtagText.displayName = 'HashtagText';

export default HashtagText;
// ✅ theme-migrated
