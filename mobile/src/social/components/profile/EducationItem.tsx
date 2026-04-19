import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import type { Education } from '../../types';

interface Props {
  education: Education;
}

const formatYear = (d?: string): string => {
  if (!d) return '';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? '' : String(date.getFullYear());
};

const EducationItem: React.FC<Props> = memo(({ education }) => {
  const theme = useSocialTheme();
  const start = formatYear(education.startDate);
  const end = education.current ? 'Present' : formatYear(education.endDate);
  const range = [start, end].filter(Boolean).join(' — ');

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: `${theme.primary}1F` },
        ]}
      >
        <Ionicons name="school-outline" size={18} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.institution, { color: theme.text }]}>
          {education.institution}
        </Text>
        <Text style={[styles.degree, { color: theme.subtext }]}>
          {education.degree}
          {education.field ? ` · ${education.field}` : ''}
        </Text>
        {range ? (
          <Text style={[styles.meta, { color: theme.muted }]}>
            {range}
            {education.grade ? ` · ${education.grade}` : ''}
          </Text>
        ) : null}
        {education.description ? (
          <Text
            style={[styles.desc, { color: theme.text }]}
            numberOfLines={4}
          >
            {education.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

EducationItem.displayName = 'EducationItem';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  institution: { fontSize: 14, fontWeight: '700' },
  degree: { fontSize: 13, marginTop: 2 },
  meta: { fontSize: 11, marginTop: 2 },
  desc: { fontSize: 13, lineHeight: 19, marginTop: 6 },
});

export default EducationItem;
