import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import type { PortfolioItem } from '../../types';
import Chip from '../shared/Chip';

interface Props {
  item: PortfolioItem;
  onPress?: () => void;
}

/**
 * Portfolio tile: hero image, title, description, tech stack chips.
 * Used by Freelancer / Company / Organization roles.
 */
const PortfolioTile: React.FC<Props> = memo(({ item, onPress }) => {
  const theme = useSocialTheme();
  const cover = item.images?.[0];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.85 : 1}
      disabled={!onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      {cover ? (
        <Image
          source={{ uri: cover }}
          style={[styles.image, { backgroundColor: theme.skeleton }]}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.image,
            styles.imageFallback,
            { backgroundColor: theme.cardAlt },
          ]}
        >
          <Ionicons
            name="image-outline"
            size={32}
            color={theme.muted}
          />
        </View>
      )}
      <View style={styles.body}>
        <Text
          style={[styles.title, { color: theme.text }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {item.description ? (
          <Text
            style={[styles.desc, { color: theme.subtext }]}
            numberOfLines={3}
          >
            {item.description}
          </Text>
        ) : null}
        {item.technologies && item.technologies.length > 0 ? (
          <View style={styles.tech}>
            {item.technologies.slice(0, 4).map((t, i) => (
              <Chip key={`${t}_${i}`} label={t} compact />
            ))}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

PortfolioTile.displayName = 'PortfolioTile';

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  image: { width: '100%', height: 160 },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: 12, gap: 6 },
  title: { fontSize: 14, fontWeight: '700' },
  desc: { fontSize: 12, lineHeight: 17 },
  tech: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
});

export default PortfolioTile;
