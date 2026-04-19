import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import type { SocialLinks } from '../../types';

type LinkKey = keyof SocialLinks;

const LINK_META: Record<
  LinkKey,
  { icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
  linkedin: { icon: 'logo-linkedin', label: 'LinkedIn' },
  github: { icon: 'logo-github', label: 'GitHub' },
  twitter: { icon: 'logo-twitter', label: 'Twitter' },
  instagram: { icon: 'logo-instagram', label: 'Instagram' },
  facebook: { icon: 'logo-facebook', label: 'Facebook' },
  youtube: { icon: 'logo-youtube', label: 'YouTube' },
  portfolio: { icon: 'globe-outline', label: 'Portfolio' },
};

interface Props {
  links?: SocialLinks;
  onPressLink?: (key: LinkKey, url: string) => void;
}

/**
 * Renders a row of icon buttons for any social-link keys that have values.
 * Default behaviour opens the URL via Linking.openURL.
 */
const SocialLinksRow: React.FC<Props> = memo(({ links, onPressLink }) => {
  const theme = useSocialTheme();
  if (!links) return null;

  const entries = (Object.keys(LINK_META) as LinkKey[])
    .filter((k) => typeof links[k] === 'string' && (links[k] as string).length > 0)
    .map((k) => ({ key: k, url: links[k] as string }));

  if (entries.length === 0) return null;

  return (
    <View style={styles.row}>
      {entries.map(({ key, url }) => {
        const meta = LINK_META[key];
        return (
          <TouchableOpacity
            key={key}
            onPress={() =>
              onPressLink ? onPressLink(key, url) : Linking.openURL(url)
            }
            activeOpacity={0.7}
            style={[
              styles.btn,
              {
                backgroundColor: theme.cardAlt,
                borderColor: theme.border,
              },
            ]}
            accessibilityLabel={`Open ${meta.label}`}
          >
            <Ionicons name={meta.icon} size={18} color={theme.primary} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

SocialLinksRow.displayName = 'SocialLinksRow';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

export default SocialLinksRow;
