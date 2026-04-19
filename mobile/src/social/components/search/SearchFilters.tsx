import React, { memo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import type { SearchSortBy, SearchType } from '../../types';
import Chip from '../shared/Chip';

interface TypeOption {
  key: SearchType;
  label: string;
}

interface SortOption {
  key: SearchSortBy;
  label: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  { key: 'all', label: 'All' },
  { key: 'candidate', label: 'Candidates' },
  { key: 'freelancer', label: 'Freelancers' },
  { key: 'company', label: 'Companies' },
  { key: 'organization', label: 'Organizations' },
];

const SORT_OPTIONS: SortOption[] = [
  { key: 'relevance', label: 'Relevant' },
  { key: 'followers', label: 'Most followed' },
  { key: 'recent', label: 'Recent' },
  { key: 'alphabetical', label: 'A–Z' },
];

interface Props {
  type: SearchType;
  sortBy: SearchSortBy;
  onTypeChange: (t: SearchType) => void;
  onSortChange: (s: SearchSortBy) => void;
}

/**
 * Two horizontally scrollable chip rows: role filter and sort order.
 * Each row is independently scrollable so long labels never truncate.
 */
const SearchFilters: React.FC<Props> = memo(
  ({ type, sortBy, onTypeChange, onSortChange }) => {
    const theme = useSocialTheme();
    return (
      <View
        style={[
          styles.wrap,
          { backgroundColor: theme.bg, borderBottomColor: theme.border },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {TYPE_OPTIONS.map((o) => (
            <Chip
              key={o.key}
              label={o.label}
              selected={type === o.key}
              onPress={() => onTypeChange(o.key)}
            />
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {SORT_OPTIONS.map((o) => (
            <Chip
              key={o.key}
              label={o.label}
              selected={sortBy === o.key}
              onPress={() => onSortChange(o.key)}
              compact
            />
          ))}
        </ScrollView>
      </View>
    );
  }
);

SearchFilters.displayName = 'SearchFilters';

const styles = StyleSheet.create({
  wrap: { borderBottomWidth: 0.5, paddingVertical: 4 },
  row: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    alignItems: 'center',
  },
});

export default SearchFilters;
