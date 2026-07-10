// src/social/components/search/SearchFilters.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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

const SearchFilters: React.FC<Props> = memo(({ type, sortBy, onTypeChange, onSortChange }) => {
  const theme = useSocialTheme();
  const { colors, radius, dark } = theme;
  const [sortOpen, setSortOpen] = useState(false);
  
  const sortLabel = SORTS.find((s) => s.key === sortBy)?.label ?? 'Relevance';

  return (
    <View style={[styles.wrap, { borderBottomColor: colors.border }]}>
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

      <TouchableOpacity
        onPress={() => setSortOpen(true)}
        activeOpacity={0.7}
        style={[
          styles.sortBtn,
          {
            backgroundColor: colors.cardAlt,
            borderColor: colors.border,
            borderRadius: radius.pill,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Sort by ${sortLabel}`}
      >
        <Ionicons name="swap-vertical" size={14} color={colors.text} />
        <Text style={[styles.sortBtnText, { color: colors.text }]}>
          {sortLabel}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.muted} />
      </TouchableOpacity>

      <Modal
        visible={sortOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSortOpen(false)}
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.sheet,
              { 
                backgroundColor: colors.card,
                borderTopLeftRadius: radius.xl,
                borderTopRightRadius: radius.xl,
              }
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.muted }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              Sort by
            </Text>
            {SORTS.map((s) => {
              const active = s.key === sortBy;
              return (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => {
                    onSortChange(s.key);
                    setSortOpen(false);
                  }}
                  style={[
                    styles.sortRow,
                    { 
                      borderBottomColor: colors.border,
                      minHeight: 48,
                    }
                  ]}
                >
                  <Text style={[styles.sortRowText, { color: colors.text }]}>
                    {s.label}
                  </Text>
                  {active && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
});

SearchFilters.displayName = 'SearchFilters';

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  row: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
    flexGrow: 1,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    minHeight: 36,
    marginRight: 12,
  },
  sortBtnText: { fontSize: 13, fontWeight: '600' },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
    opacity: 0.5,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sortRowText: { fontSize: 15 },
});

export default SearchFilters;