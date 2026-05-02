import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ViewStyle,
} from 'react-native';

type Props = {
  skills: string[];
  variant?: 'wrap' | 'scroll' | 'compact';
  containerStyle?: ViewStyle;
  maxVisible?: number; // used for compact mode
};

const FreelanceTenderSkillTags: React.FC<Props> = ({
  skills,
  variant = 'wrap',
  containerStyle,
  maxVisible = 4,
}) => {
  if (!skills || skills.length === 0) return null;

  const renderTag = (skill: string, index: number) => (
    <View key={`${skill}-${index}`} style={styles.tag}>
      <Text style={styles.tagText}>{skill}</Text>
    </View>
  );

  // ─── COMPACT MODE (e.g. cards) ─────────────────────────────
  if (variant === 'compact') {
    const visibleSkills = skills.slice(0, maxVisible);
    const remaining = skills.length - maxVisible;

    return (
      <View style={[styles.container, styles.wrap, containerStyle]}>
        {visibleSkills.map(renderTag)}

        {remaining > 0 && (
          <View style={[styles.tag, styles.moreTag]}>
            <Text style={styles.moreText}>+{remaining}</Text>
          </View>
        )}
      </View>
    );
  }

  // ─── SCROLL MODE (horizontal) ──────────────────────────────
  if (variant === 'scroll') {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.container, containerStyle]}
      >
        {skills.map(renderTag)}
      </ScrollView>
    );
  }

  // ─── WRAP MODE (default) ───────────────────────────────────
  return (
    <View style={[styles.container, styles.wrap, containerStyle]}>
      {skills.map(renderTag)}
    </View>
  );
};

export default FreelanceTenderSkillTags;

// ─── STYLES ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },

  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  tagText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },

  moreTag: {
    backgroundColor: '#E5E7EB',
  },

  moreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
});