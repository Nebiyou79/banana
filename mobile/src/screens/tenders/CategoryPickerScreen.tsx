// ─────────────────────────────────────────────────────────────────────────────
//  src/screens/tenders/pickers/CategoryPickerScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Searchable category picker (1.1). Pushed onto the navigation stack from
//  Step1_BasicInfo. On pick, pops back with the result delivered via the
//  `onPick` callback passed in route.params.
//
//  Why a callback over event params: callbacks survive serialization issues
//  with screens that need to re-render the form context. The form stays
//  mounted underneath; we just push this picker on top.
// ─────────────────────────────────────────────────────────────────────────────

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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeStore } from '../../store/themeStore';
import { useProfessionalTenderCategories } from '../../hooks/useProfessionalTender';

// ═════════════════════════════════════════════════════════════════════════════
//  ROUTE PARAMS
// ═════════════════════════════════════════════════════════════════════════════

interface RouteParams {
  /** Currently-selected category — gets a checkmark in the list. */
  current?: string;
  /** Called with the selected category. Picker pops itself after invoking. */
  onPick: (category: string) => void;
}

// ═════════════════════════════════════════════════════════════════════════════
//  SCREEN
// ═════════════════════════════════════════════════════════════════════════════

export const CategoryPickerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<{ key: string; name: string; params: RouteParams }>();
  const isDark = useThemeStore((s) => s.theme.isDark);

  const palette = useMemo(
    () => isDark
      ? { bg: '#0F172A', surface: '#1E293B', border: '#334155', text: '#F1F5F9', muted: '#94A3B8', primary: '#60A5FA', primaryFg: '#0F172A', inputBg: '#1E293B' }
      : { bg: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', primary: '#2563EB', primaryFg: '#FFFFFF', inputBg: '#FFFFFF' },
    [isDark],
  );

  const [query, setQuery] = useState('');
  const { data: categories = [], isLoading, isError, refetch } = useProfessionalTenderCategories();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.toLowerCase().includes(q));
  }, [categories, query]);

  // Allow custom value when search has no matches but the user typed something
  const showCustomEntry = useMemo(() => {
    const q = query.trim();
    if (!q) return false;
    return !categories.some((c) => c.toLowerCase() === q.toLowerCase());
  }, [query, categories]);

  const handlePick = (value: string) => {
    route.params?.onPick?.(value);
    navigation.goBack();
  };

  const renderItem = ({ item }: { item: string }) => {
    const isSelected = item === route.params?.current;
    return (
      <Pressable
        onPress={() => handlePick(item)}
        style={({ pressed }: { pressed: boolean }) => [
          styles.row,
          {
            backgroundColor: isSelected ? (isDark ? '#1E3A5F' : '#DBEAFE') : palette.surface,
            borderColor: palette.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons
          name={isSelected ? 'checkmark-circle' : 'pricetag-outline'}
          size={18}
          color={isSelected ? palette.primary : palette.muted}
        />
        <Text
          style={[styles.rowText, { color: palette.text, fontWeight: isSelected ? '700' : '500' }]}
          numberOfLines={1}
        >
          {item}
        </Text>
        {isSelected && <Text style={[styles.selectedHint, { color: palette.primary }]}>selected</Text>}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
      {/* Header with search */}
      <View style={[styles.header, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Ionicons name="close" size={24} color={palette.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: palette.text }]}>Choose Category</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={[styles.searchBox, { backgroundColor: palette.inputBg, borderColor: palette.border }]}>
          <Ionicons name="search-outline" size={16} color={palette.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search categories…"
            placeholderTextColor={palette.muted}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.searchInput, { color: palette.text }]}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={6}>
              <Ionicons name="close-circle" size={16} color={palette.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={32} color={palette.muted} />
          <Text style={[styles.errorText, { color: palette.text }]}>Couldn't load categories</Text>
          <Pressable onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: palette.primary }]}>
            <Text style={[styles.retryLabel, { color: palette.primaryFg }]}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: string) => item}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          ListEmptyComponent={
            !showCustomEntry ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="search-outline" size={28} color={palette.muted} />
                <Text style={[styles.emptyText, { color: palette.muted }]}>
                  No matches. Try a different keyword.
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            showCustomEntry ? (
              <Pressable
                onPress={() => handlePick(query.trim())}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.customRow,
                  { borderColor: palette.primary, opacity: pressed ? 0.85 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Use custom category ${query.trim()}`}
              >
                <Ionicons name="add-circle-outline" size={18} color={palette.primary} />
                <Text style={[styles.customText, { color: palette.primary }]} numberOfLines={1}>
                  Use “{query.trim()}” as custom category
                </Text>
              </Pressable>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24,
  },
  errorText: { fontSize: 14 },
  retryBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 },
  retryLabel: { fontSize: 13, fontWeight: '700' },

  list: { padding: 12, paddingBottom: 32 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 48,
  },
  rowText:      { flex: 1, fontSize: 14 },
  selectedHint: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },

  emptyWrap:    { alignItems: 'center', gap: 6, paddingVertical: 32 },
  emptyText:    { fontSize: 13, textAlign: 'center', maxWidth: 240 },

  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 12,
  },
  customText: { flex: 1, fontSize: 13, fontWeight: '600' },
});

export default CategoryPickerScreen;