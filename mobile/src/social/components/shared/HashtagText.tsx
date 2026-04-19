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

/**
 * Renders text with hashtags and @mentions highlighted. Taps surface via
 * `onHashtagPress` / `onMentionPress`.
 */
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
    const theme = useSocialTheme();
    const base = textColor ?? theme.text;
    const accent = primaryColor ?? theme.primary;

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