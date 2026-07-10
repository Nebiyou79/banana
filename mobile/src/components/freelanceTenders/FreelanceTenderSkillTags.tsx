import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

interface FreelanceTenderSkillTagsProps {
  skills:          string[];
  variant?:        'wrap' | 'scroll' | 'compact';
  containerStyle?: ViewStyle;
  maxVisible?:     number;
}

const FreelanceTenderSkillTags: React.FC<FreelanceTenderSkillTagsProps> = memo(({
  skills, variant = 'wrap', containerStyle, maxVisible = 4,
}) => {
  const { colors, radius, type } = useTheme();

  if (!skills?.length) return null;

  const renderTag = (skill: string, index: number) => (
    <View
      key={`${skill}-${index}`}
      style={[
        tagS.tag,
        {
          backgroundColor: withAlpha(colors.text, 0.06),
          borderColor:     colors.border,
          borderRadius:    radius.full,
        },
      ]}
    >
      <Text style={[tagS.text, { color: colors.textSecondary }]}>{skill}</Text>
    </View>
  );

  if (variant === 'compact') {
    const visible   = skills.slice(0, maxVisible);
    const remaining = skills.length - maxVisible;
    return (
      <View style={[tagS.wrap, containerStyle]}>
        {visible.map(renderTag)}
        {remaining > 0 && (
          <View
            style={[
              tagS.tag,
              tagS.moreTag,
              {
                backgroundColor: withAlpha(colors.primary, 0.08),
                borderColor:     withAlpha(colors.primary, 0.22),
                borderRadius:    radius.full,
              },
            ]}
          >
            <Text style={[tagS.text, { color: colors.primary, fontWeight: '700' }]}>
              +{remaining}
            </Text>
          </View>
        )}
      </View>
    );
  }

  if (variant === 'scroll') {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[tagS.scrollContent, containerStyle]}
      >
        {skills.map(renderTag)}
      </ScrollView>
    );
  }

  return (
    <View style={[tagS.wrap, containerStyle]}>
      {skills.map(renderTag)}
    </View>
  );
});

FreelanceTenderSkillTags.displayName = 'FreelanceTenderSkillTags';

const tagS = StyleSheet.create({
  scrollContent: { gap: 6 },
  wrap:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:           { paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1 },
  text:          { fontSize: 11, fontWeight: '500' },
  moreTag:       {},
});

export default FreelanceTenderSkillTags;
