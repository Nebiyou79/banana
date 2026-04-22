// src/social/components/search/SearchFilters.tsx
import React, { memo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import type { SearchSortBy, SearchType } from '../../types';
import Chip from '../shared/Chip';

interface Props {
  type: SearchType;
  sortBy: SearchSortBy;
  onTypeChange: (t: SearchType) => void;
  onSortChange: (s: SearchSortBy) => void;
}

const TYPES: { key: SearchType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'candidate', label: 'Candidates' },
  { key: 'freelancer', label: 'Freelancers' },
  { key: 'company', label: 'Companies' },
  { key: 'organization', label: 'Organizations' },
];

const SORTS: { key: SearchSortBy; label: string }[] = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'followers', label: 'Most followers' },
  { key: 'recent', label: 'Recently active' },
  { key: 'alphabetical', label: 'A–Z' },
];

const SearchFilters: React.FC<Props> = memo(
  ({ type, sortBy, onTypeChange, onSortChange }) => {
    const theme = useSocialTheme();
    return (
      <View
        style={[
          styles.wrap,
          { borderBottomColor: theme.border },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          keyboardShouldPersistTaps="handled"
        >
          {TYPES.map((t) => (
            <Chip
              key={t.key}
              label={t.label}
              selected={type === t.key}
              onPress={() => onTypeChange(t.key)}
            />
          ))}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.row, { paddingTop: 6 }]}
          keyboardShouldPersistTaps="handled"
        >
          {SORTS.map((s) => (
            <Chip
              key={s.key}
              label={s.label}
              selected={sortBy === s.key}
              onPress={() => onSortChange(s.key)}
            />
          ))}
        </ScrollView>
      </View>
    );
  }
);

SearchFilters.displayName = 'SearchFilters';

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  row: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
});

export default SearchFilters;