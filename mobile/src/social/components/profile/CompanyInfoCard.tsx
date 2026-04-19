import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import type { CompanyInfo } from '../../types';

interface Props {
  info?: CompanyInfo;
}

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | number;
  onPress?: () => void;
}

const Row: React.FC<RowProps> = ({ icon, label, value, onPress }) => {
  const theme = useSocialTheme();
  if (value === undefined || value === null || value === '') return null;
  const content = (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color={theme.primary} />
      <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
      <Text
        style={[
          styles.value,
          { color: onPress ? theme.primary : theme.text },
        ]}
        numberOfLines={1}
      >
        {String(value)}
      </Text>
    </View>
  );
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
};

/**
 * Block of key/value rows for a Company or Organization profile:
 * industry, size, founded year, type, website, tagline.
 */
const CompanyInfoCard: React.FC<Props> = memo(({ info }) => {
  const theme = useSocialTheme();
  if (!info) return null;

  const hasAny =
    info.industry ||
    info.size ||
    info.foundedYear ||
    info.companyType ||
    info.website ||
    info.tagline ||
    info.mission;

  if (!hasAny) return null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      {info.tagline ? (
        <Text
          style={[styles.tagline, { color: theme.text }]}
          numberOfLines={2}
        >
          “{info.tagline}”
        </Text>
      ) : null}

      <Row icon="business-outline" label="Industry" value={info.industry} />
      <Row icon="people-outline" label="Size" value={info.size} />
      <Row
        icon="calendar-outline"
        label="Founded"
        value={info.foundedYear}
      />
      <Row
        icon="pricetag-outline"
        label="Type"
        value={info.companyType}
      />
      <Row
        icon="globe-outline"
        label="Website"
        value={info.website}
        onPress={
          info.website ? () => Linking.openURL(info.website as string) : undefined
        }
      />

      {info.mission ? (
        <View style={styles.missionWrap}>
          <Text style={[styles.missionLabel, { color: theme.muted }]}>
            Mission
          </Text>
          <Text style={[styles.mission, { color: theme.text }]}>
            {info.mission}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

CompanyInfoCard.displayName = 'CompanyInfoCard';

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  tagline: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 24,
  },
  label: { fontSize: 12, width: 72 },
  value: { fontSize: 13, flex: 1, fontWeight: '600' },
  missionWrap: { marginTop: 8 },
  missionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  mission: { fontSize: 13, lineHeight: 19 },
});

export default CompanyInfoCard;
