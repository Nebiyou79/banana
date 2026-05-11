import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

interface Props {
  skills: string[];
  variant?: 'wrap' | 'scroll' | 'compact';
  containerStyle?: ViewStyle;
  maxVisible?: number;
}

const FreelanceTenderSkillTags: React.FC<Props> = memo(({
  skills, variant = 'wrap', containerStyle, maxVisible = 4,
}) => {
  const { colors: c, radius, type } = useTheme();
  const styles = useMemo(() => makeStyles(c, radius), [c, radius]);

  if (!skills?.length) return null;

  const renderTag = (skill: string, index: number) => (
    <View key={`${skill}-${index}`} style={styles.tag}>
      <Text style={[type.caption, styles.tagText]}>{skill}</Text>
    </View>
  );

  if (variant === 'compact') {
    const visible = skills.slice(0, maxVisible);
    const remaining = skills.length - maxVisible;
    return (
      <View style={[styles.wrap, containerStyle]}>
        {visible.map(renderTag)}
        {remaining > 0 && (
          <View style={[styles.tag, styles.moreTag]}>
            <Text style={[type.caption, styles.moreText]}>+{remaining}</Text>
          </View>
        )}
      </View>
    );
  }

  if (variant === 'scroll') {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.container, containerStyle]}>
        {skills.map(renderTag)}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.wrap, containerStyle]}>
      {skills.map(renderTag)}
    </View>
  );
});

FreelanceTenderSkillTags.displayName = 'FreelanceTenderSkillTags';

const makeStyles = (c: any, radius: any) =>
  StyleSheet.create({
    container: { gap: 8 },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: {
      backgroundColor: withAlpha(c.text, 0.07),
      paddingHorizontal: 10, paddingVertical: 5,
      borderRadius: radius.full,
      borderWidth: 1, borderColor: c.border,
    },
    tagText: { color: c.textSecondary, fontWeight: '500' },
    moreTag: { backgroundColor: withAlpha(c.textMuted, 0.14) },
    moreText: { color: c.text, fontWeight: '700' },
  });

export default FreelanceTenderSkillTags;