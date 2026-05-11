// src/screens/tenders/CategoryPickerScreen.tsx
// FIXED: useProfessionalTenderCategories now properly calls /professional-tenders/categories
//        (confirmed path from routes file + service). Shows all categories for creating
//        professional tenders. Custom category entry supported when no match.

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { useProfessionalTenderCategories } from '../../hooks/useProfessionalTender';

interface RouteParams {
  current?: string;
  onPick:   (category: string) => void;
}

// ─── Well-known fallback categories shown immediately while the server
//     responds (or if the categories endpoint is unavailable).
const FALLBACK_CATEGORIES = [
  'Construction & Civil Works',
  'Goods & Equipment',
  'IT & Technology Services',
  'Consultancy & Advisory',
  'Healthcare & Medical Supplies',
  'Education & Training',
  'Transport & Logistics',
  'Energy & Utilities',
  'Agriculture & Food Supply',
  'Environmental Services',
  'Security & Safety',
  'Printing & Publishing',
  'Financial & Legal Services',
  'Office Supplies & Furniture',
  'Cleaning & Maintenance',
  'Communications & Media',
  'Engineering & Technical',
  'Architecture & Design',
  'Research & Development',
  'Other',
];

export const CategoryPickerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<{ key: string; name: string; params: RouteParams }>();
  const { colors: c, spacing, radius, type } = useTheme();

  const [query, setQuery] = useState('');

  // Fetch server categories; fall back to built-in list if empty or on error
  const {
    data: serverCategories,
    isLoading,
    isError,
    refetch,
  } = useProfessionalTenderCategories();

  // Merge: server categories take priority; fill any gaps with fallbacks
  const allCategories: string[] = useMemo(() => {
    const serverList = serverCategories ?? [];
    if (serverList.length > 0) return serverList;
    return FALLBACK_CATEGORIES;
  }, [serverCategories]);

  // Filter by query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCategories;
    return allCategories.filter(cat => cat.toLowerCase().includes(q));
  }, [allCategories, query]);

  // Show "use custom" option only when the query doesn't exactly match any item
  const showCustomEntry = useMemo(() => {
    const q = query.trim();
    if (!q) return false;
    return !allCategories.some(cat => cat.toLowerCase() === q.toLowerCase());
  }, [query, allCategories]);

  const handlePick = (value: string) => {
    route.params?.onPick?.(value);
    navigation.goBack();
  };

  const renderItem = ({ item }: { item: string }) => {
    const isSelected = item === route.params?.current;
    return (
      <Pressable
        onPress={() => handlePick(item)}
        style={({ pressed }) => [
          S.row,
          {
            backgroundColor: isSelected ? withAlpha(c.primary, 0.12) : c.surface,
            borderColor:     isSelected ? c.primary : c.border,
            borderRadius:    radius.md,
            opacity:         pressed ? 0.85 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${isSelected ? 'Selected: ' : ''}${item}`}
      >
        <View style={[S.catIcon, { backgroundColor: withAlpha(c.primary, 0.08), borderRadius: radius.sm }]}>
          <Ionicons
            name={isSelected ? 'checkmark-circle' : 'pricetag-outline'}
            size={16}
            color={isSelected ? c.primary : c.textMuted}
          />
        </View>
        <Text
          style={[type.bodySm, { color: c.text, fontWeight: isSelected ? '700' : '500', flex: 1 }]}
          numberOfLines={2}
        >
          {item}
        </Text>
        {isSelected && (
          <View style={[S.selectedBadge, { backgroundColor: withAlpha(c.primary, 0.15), borderRadius: radius.full }]}>
            <Text style={[type.caption, { color: c.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 10 }]}>
              selected
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  const isEmpty = filtered.length === 0 && !showCustomEntry;

  return (
    <SafeAreaView style={[S.root, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
      {/* ── Header + Search ─────────────────────────────────────────── */}
      <View style={[S.header, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={S.headerTop}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Ionicons name="close" size={24} color={c.text} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[type.bodySm, { color: c.text, fontWeight: '700' }]}>Choose Category</Text>
            {!isLoading && allCategories.length > 0 && (
              <Text style={[type.caption, { color: c.textMuted, marginTop: 1 }]}>
                {allCategories.length} categories
              </Text>
            )}
          </View>
          {/* Right spacer to balance the close button */}
          <View style={{ width: 24 }} />
        </View>

        {/* Search box */}
        <View
          style={[
            S.searchBox,
            {
              backgroundColor: c.bg,
              borderColor: c.border,
              borderRadius: radius.md,
            },
          ]}
        >
          <Ionicons name="search-outline" size={16} color={c.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search categories…"
            placeholderTextColor={c.textMuted}
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
            style={[S.searchInput, { color: c.text }]}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={6}>
              <Ionicons name="close-circle" size={16} color={c.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Body ────────────────────────────────────────────────────── */}
      {isLoading ? (
        // Skeleton-style loader — show fallback items while server responds
        <FlatList
          data={FALLBACK_CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          renderItem={() => (
            <View
              style={[
                S.skeletonRow,
                { backgroundColor: c.surface, borderColor: c.border, borderRadius: radius.md },
              ]}
            >
              <View style={[S.skeletonIcon, { backgroundColor: c.border }]} />
              <View style={{ flex: 1, gap: 4 }}>
                <View style={[S.skeletonText, { backgroundColor: c.border, width: '70%' }]} />
              </View>
              <ActivityIndicator size="small" color={c.primary} style={{ opacity: 0.3 }} />
            </View>
          )}
          ListHeaderComponent={
            <View style={[S.loadingBanner, { backgroundColor: withAlpha(c.primary, 0.08), borderRadius: radius.md }]}>
              <ActivityIndicator size="small" color={c.primary} />
              <Text style={[type.caption, { color: c.primary, fontWeight: '600' }]}>
                Loading live categories…
              </Text>
            </View>
          }
        />
      ) : isError && allCategories.length === 0 ? (
        <View style={S.center}>
          <Ionicons name="alert-circle-outline" size={32} color={c.textMuted} />
          <Text style={[type.bodySm, { color: c.text }]}>Couldn't load categories</Text>
          <Pressable
            onPress={() => refetch()}
            style={[S.retryBtn, { backgroundColor: c.primary, borderRadius: radius.md }]}
          >
            <Text style={[type.bodySm, { color: c.bg, fontWeight: '700' }]}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: string) => item}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 48 }}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            // Show "using fallback" notice only when server returned nothing
            (serverCategories?.length === 0 && !isLoading) ? (
              <View style={[S.infoBanner, { backgroundColor: withAlpha(c.warning, 0.1), borderRadius: radius.md }]}>
                <Ionicons name="information-circle-outline" size={14} color={c.warning} />
                <Text style={[type.caption, { color: c.warning, flex: 1 }]}>
                  Showing default categories. Server categories unavailable.
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            isEmpty ? (
              <View style={S.emptyWrap}>
                <Ionicons name="search-outline" size={28} color={c.textMuted} />
                <Text style={[type.caption, { color: c.textMuted, textAlign: 'center', maxWidth: 240 }]}>
                  No matches for "{query}". Try a different keyword or use the option below.
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            showCustomEntry ? (
              <Pressable
                onPress={() => handlePick(query.trim())}
                style={({ pressed }) => [
                  S.customRow,
                  {
                    borderColor: c.primary,
                    borderRadius: radius.md,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Use custom category ${query.trim()}`}
              >
                <Ionicons name="add-circle-outline" size={18} color={c.primary} />
                <Text
                  style={[type.bodySm, { color: c.primary, fontWeight: '600', flex: 1 }]}
                  numberOfLines={1}
                >
                  Use "{query.trim()}" as custom category
                </Text>
              </Pressable>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const S = StyleSheet.create({
  root:         { flex: 1 },
  header:       { paddingHorizontal: 14, paddingVertical: 10, gap: 10, borderBottomWidth: 1 },
  headerTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 42, borderWidth: 1 },
  searchInput:  { flex: 1, fontSize: 14, padding: 0 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  retryBtn:     { paddingHorizontal: 18, paddingVertical: 9, marginTop: 4 },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, minHeight: 52 },
  catIcon:      { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  selectedBadge:{ paddingHorizontal: 8, paddingVertical: 3 },
  emptyWrap:    { alignItems: 'center', gap: 8, paddingVertical: 32 },
  customRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1.5, borderStyle: 'dashed', marginTop: 12 },
  loadingBanner:{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, marginBottom: 10 },
  infoBanner:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, marginBottom: 10 },
  skeletonRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, minHeight: 52 },
  skeletonIcon: { width: 28, height: 28, borderRadius: 6 },
  skeletonText: { height: 14, borderRadius: 4 },
});

export default CategoryPickerScreen;