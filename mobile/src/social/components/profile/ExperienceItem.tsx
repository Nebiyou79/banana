import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import type { Experience } from '../../types';

interface Props {
  experience: Experience;
}

const formatDateRange = (
  startDate?: string,
  endDate?: string,
  current?: boolean
): string => {
  const fmt = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
        })
      : '';
  const s = fmt(startDate);
  const e = current ? 'Present' : fmt(endDate);
  return [s, e].filter(Boolean).join(' — ');
};

const ExperienceItem: React.FC<Props> = memo(({ experience }) => {
  const theme = useSocialTheme();
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: `${theme.primary}1F` },
        ]}
      >
        <Ionicons name="briefcase-outline" size={18} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.position, { color: theme.text }]}>
          {experience.position}
        </Text>
        <Text style={[styles.company, { color: theme.subtext }]}>
          {experience.company}
          {experience.employmentType ? ` · ${experience.employmentType}` : ''}
        </Text>
        <Text style={[styles.meta, { color: theme.muted }]}>
          {formatDateRange(
            experience.startDate,
            experience.endDate,
            experience.current
          )}
          {experience.location ? ` · ${experience.location}` : ''}
        </Text>
        {experience.description ? (
          <Text
            style={[styles.desc, { color: theme.text }]}
            numberOfLines={4}
          >
            {experience.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

ExperienceItem.displayName = 'ExperienceItem';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  position: { fontSize: 14, fontWeight: '700' },
  company: { fontSize: 13, marginTop: 2 },
  meta: { fontSize: 11, marginTop: 2 },
  desc: { fontSize: 13, lineHeight: 19, marginTop: 6 },
});

export default ExperienceItem;
