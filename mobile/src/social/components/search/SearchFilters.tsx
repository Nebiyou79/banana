// src/social/components/search/SearchFilters.tsx
/**
 * SearchFilters — horizontal type chips + sort bottom-sheet
 *
 * Theme migration:
 * - theme.border   → theme.colors.border   (authoritative)
 * - theme.cardAlt  → theme.colors.cardAlt  (authoritative)
 * - theme.text     → theme.colors.text     (authoritative)
 * - theme.muted    → theme.colors.muted    (authoritative)
 * - theme.overlay  → theme.colors.overlay  (authoritative)
 * - theme.card     → theme.colors.card     (authoritative)
 * - theme.primary  → theme.colors.primary  (authoritative)
 */
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
  type:          SearchType;
  sortBy:        SearchSortBy;
  onTypeChange:  (t: SearchType) => void;
  onSortChange:  (s: SearchSortBy) => void;
}

const TYPES: { key: SearchType; label: string }[] = [
  { key: 'all',          label: 'All' },
  { key: 'candidate',    label: 'Candidates' },
  { key: 'freelancer',   label: 'Freelancers' },
  { key: 'company',      label: 'Companies' },
  { key: 'organization', label: 'Organizations' },
];

const SORTS: { key: SearchSortBy; label: string }[] = [
  { key: 'relevance',    label: 'Relevance' },
  { key: 'followers',    label: 'Most followers' },
  { key: 'recent',       label: 'Recently active' },
  { key: 'alphabetical', label: 'A–Z' },
];

const SearchFilters: React.FC<Props> = memo(
  ({ type, sortBy, onTypeChange, onSortChange }) => {
    const theme     = useSocialTheme();
    const [sortOpen, setSortOpen] = useState(false);
    const sortLabel = SORTS.find((s) => s.key === sortBy)?.label ?? 'Relevance';

    return (
      <View style={[styles.wrap, { borderBottomColor: theme.colors.border }]}>
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
              backgroundColor: theme.colors.cardAlt,
              borderColor:     theme.colors.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Sort by ${sortLabel}`}
        >
          <Ionicons name="swap-vertical" size={14} color={theme.colors.text} />
          <Text style={[styles.sortBtnText, { color: theme.colors.text }]}>
            {sortLabel}
          </Text>
          <Ionicons name="chevron-down" size={14} color={theme.colors.muted} />
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
            style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.sheet, { backgroundColor: theme.colors.card }]}
            >
              <View style={[styles.handle, { backgroundColor: theme.colors.muted }]} />
              <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
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
                      { borderBottomColor: theme.colors.border },
                    ]}
                  >
                    <Text style={[styles.sortRowText, { color: theme.colors.text }]}>
                      {s.label}
                    </Text>
                    {active && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={theme.colors.primary}
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
  },
);

SearchFilters.displayName = 'SearchFilters';

const styles = StyleSheet.create({
  wrap: {
    flexDirection:  'row',
    alignItems:     'center',
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
    flexDirection:  'row',
    alignItems:     'center',
    gap:            6,
    paddingHorizontal: 12,
    paddingVertical:   8,
    borderRadius:   18,
    borderWidth:    1,
    minHeight:      36,
    marginRight:    12,
  },
  sortBtnText: { fontSize: 13, fontWeight: '600' },
  backdrop:    { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius:  16,
    borderTopRightRadius: 16,
    paddingBottom:        24,
    paddingHorizontal:    16,
  },
  handle: {
    width:     40,
    height:    4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
    opacity:   0.5,
  },
  sheetTitle: {
    fontSize:      14,
    fontWeight:    '700',
    paddingVertical: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sortRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight:      48,
  },
  sortRowText: { fontSize: 15 },
});

export default SearchFilters;
// ✅ theme-migrated
