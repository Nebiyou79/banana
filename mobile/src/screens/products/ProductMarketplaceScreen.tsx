/**
 * mobile/src/screens/products/ProductMarketplaceScreen.tsx
 *
 * FIXES IN THIS VERSION
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. useAuthStore().user cast to AuthUser | null so `user?._id` etc. are typed.
 * 2. `savedIds` Set tracks which products are saved locally so ProductCard
 *    receives the correct `isSaved` prop.
 * 3. handleSave toggles the saved set optimistically.
 * 4. FlatList featured rail key uses compound `featured-${item._id}` to avoid
 *    duplicate-key warnings when the same product appears in both rails.
 * 5. Removed `fromOwner` from ProductsStackParamList.ProductDetails params —
 *    the public details screen does not need it.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import type { AuthUser } from '../../context/AuthContext';
import {
  useProducts,
  useFeaturedProducts,
  useProductCategories,
  useSaveProduct,
  useUnsaveProduct,
} from '../../hooks/useProducts';
import { ProductCard } from '../../components/products/ProductCard';
import { ProductFilterSheet, FilterState } from '../../components/products/ProductFilterSheet';
import { Product } from '../../services/productService';

// ── Route param list ───────────────────────────────────────────────────────────

export type ProductsStackParamList = {
  ProductMarketplace: undefined;
  ProductDetails:     { productId: string };
  SavedProducts:      undefined;
};

type Props = NativeStackScreenProps<ProductsStackParamList, 'ProductMarketplace'>;

// ── Screen ─────────────────────────────────────────────────────────────────────

export const ProductMarketplaceScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, spacing } = useTheme();
  // Cast once — useAuthStore returns unknown for user in this codebase
  const user = (useAuthStore().user ?? null) as AuthUser | null;

  const [search, setSearch]                 = useState('');
  const [debouncedSearch, setDebounced]     = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcat, setActiveSubcat]     = useState<string | null>(null);
  const [filterState, setFilterState]       = useState<FilterState>({});
  const [showFilter, setShowFilter]         = useState(false);

  // Local set of saved product ids (optimistic — synced on mutation callbacks)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebounced(text), 400);
  }, []);

  const handleCategoryPress = useCallback((catId: string | null) => {
    setActiveCategory(catId);
    setActiveSubcat(null);
  }, []);

  const { data: categories = [] } = useProductCategories();
  const selectedCat = useMemo(
    () => categories.find(c => c.id === activeCategory),
    [categories, activeCategory],
  );

  const filters = useMemo(() => ({
    search:      debouncedSearch  || undefined,
    category:    activeCategory   || filterState.category   || undefined,
    subcategory: activeSubcat     || filterState.subcategory || undefined,
    minPrice:    filterState.minPrice,
    maxPrice:    filterState.maxPrice,
    featured:    filterState.featured,
    sortBy:      filterState.sortBy,
    sortOrder:   filterState.sortOrder,
    status:      'active' as const,
  }), [debouncedSearch, activeCategory, activeSubcat, filterState]);

  const {
    data: productsData,
    fetchNextPage, hasNextPage, isFetchingNextPage,
    isLoading, refetch, isRefetching,
  } = useProducts(filters);

  const { data: featured = [] } = useFeaturedProducts();

  const allProducts: Product[] = useMemo(
    () => productsData?.pages.flatMap(p => p.products) ?? [],
    [productsData],
  );

  const saveProduct   = useSaveProduct();
  const unsaveProduct = useUnsaveProduct();

  /**
   * Toggle save state optimistically.
   * ProductCard calls this as: onSave(productId, currentlySaved)
   */
  const handleSave = useCallback((productId: string, isSaved: boolean) => {
    if (!user) return;
    if (isSaved) {
      unsaveProduct.mutate(productId, {
        onSuccess: () => setSavedIds(prev => { const s = new Set(prev); s.delete(productId); return s; }),
      });
    } else {
      saveProduct.mutate(productId, {
        onSuccess: () => setSavedIds(prev => new Set([...prev, productId])),
      });
    }
    // Optimistic local update
    setSavedIds(prev => {
      const s = new Set(prev);
      isSaved ? s.delete(productId) : s.add(productId);
      return s;
    });
  }, [user, saveProduct, unsaveProduct]);

  const activeFilterCount = Object.values(filterState)
    .filter(v => v !== undefined && v !== false).length;

  // ── Sub-components ─────────────────────────────────────────────────────────

  const CategoryTabs = useMemo(() => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[s.catScroll, { paddingHorizontal: spacing.xs }]}
    >
      <TouchableOpacity
        onPress={() => handleCategoryPress(null)}
        style={[
          s.catTab,
          {
            backgroundColor: !activeCategory ? colors.accent : colors.inputBg,
            borderColor:     !activeCategory ? colors.accent : colors.borderPrimary,
          },
        ]}
      >
        <Text style={[s.catTabTxt, { color: !activeCategory ? '#fff' : colors.textSecondary }]}>
          All
        </Text>
      </TouchableOpacity>

      {categories.map(cat => {
        const isActive = activeCategory === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            onPress={() => handleCategoryPress(cat.id)}
            style={[
              s.catTab,
              {
                backgroundColor: isActive ? colors.accent : colors.inputBg,
                borderColor:     isActive ? colors.accent : colors.borderPrimary,
              },
            ]}
          >
            <Text style={[s.catTabTxt, { color: isActive ? '#fff' : colors.textSecondary }]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  ), [categories, activeCategory, colors, spacing, handleCategoryPress]);

  const SubcatPills = useMemo(() => {
    if (!selectedCat?.subcategories?.length) return null;
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[s.subcatScroll, { paddingHorizontal: spacing.xs }]}
      >
        {selectedCat.subcategories.map(sub => {
          const isActive = activeSubcat === sub.id;
          return (
            <TouchableOpacity
              key={sub.id}
              onPress={() => setActiveSubcat(isActive ? null : sub.id)}
              style={[
                s.subcatPill,
                {
                  backgroundColor: isActive ? `${colors.accent}18` : 'transparent',
                  borderColor:     isActive ? colors.accent : colors.borderPrimary,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 12, fontWeight: '600',
                  color: isActive ? colors.accent : colors.textSecondary,
                }}
              >
                {sub.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }, [selectedCat, activeSubcat, colors, spacing]);

  const ListHeader = useCallback(() => (
    <View>
      {/* Search + Filter row */}
      <View
        style={[
          s.searchRow,
          { paddingHorizontal: spacing.xs, paddingBottom: 10, paddingTop: 12, gap: 10 },
        ]}
      >
        <View
          style={[
            s.searchBar,
            { backgroundColor: colors.inputBg, borderColor: colors.borderPrimary, flex: 1 },
          ]}
        >
          <Ionicons name="search-outline" size={17} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={handleSearchChange}
            style={[s.searchInput, { color: colors.textPrimary }]}
            placeholder="Search products…"
            placeholderTextColor={colors.inputPlaceholder}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => { setSearch(''); setDebounced(''); }}
            >
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowFilter(true)}
          style={[
            s.filterBtn,
            {
              backgroundColor: activeFilterCount > 0 ? colors.accent : colors.inputBg,
              borderColor:     activeFilterCount > 0 ? colors.accent : colors.borderPrimary,
            },
          ]}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFilterCount > 0 ? '#fff' : colors.textPrimary}
          />
          {activeFilterCount > 0 && (
            <View style={[s.filterBadge, { backgroundColor: '#fff' }]}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: colors.accent }}>
                {activeFilterCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {CategoryTabs}
      {SubcatPills}

      {/* Featured rail — only shown when no search/category filter active */}
      {featured.length > 0 && !debouncedSearch && !activeCategory && (
        <View style={{ marginTop: 4, paddingBottom: 8 }}>
          <View style={[s.sectionHeader, { paddingHorizontal: spacing.xs }]}>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>⭐ Featured</Text>
          </View>
          <FlatList
            horizontal
            // compound key avoids collision with the main grid list
            keyExtractor={item => `featured-${item._id}`}
            data={featured.slice(0, 6)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.xs, gap: 10 }}
renderItem={({ item }) => (
  <ProductCard
    variant="public"
    product={item}
onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}    onSave={handleSave}
    isSaved={savedIds.has(item._id)}
    size="sm"
    style={{ width: 148 }}
  />
)}
          />
        </View>
      )}

      {/* Results count + Clear all */}
      <View style={[s.resultsRow, { paddingHorizontal: spacing.xs }]}>
        <Text style={[s.resultsTxt, { color: colors.textMuted }]}>
          {isLoading
            ? 'Loading…'
            : `${allProducts.length.toLocaleString()} product${allProducts.length !== 1 ? 's' : ''}`}
        </Text>
        {(activeCategory || debouncedSearch || activeFilterCount > 0) && (
          <TouchableOpacity
            onPress={() => {
              handleCategoryPress(null);
              setSearch('');
              setDebounced('');
              setFilterState({});
            }}
          >
            <Text style={{ fontSize: 12, color: colors.accent, fontWeight: '600' }}>
              Clear all
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  ), [
    search, handleSearchChange, CategoryTabs, SubcatPills, featured,
    debouncedSearch, activeCategory, allProducts.length, isLoading,
    colors, spacing, activeFilterCount, navigation, handleSave,
    handleCategoryPress, savedIds,
  ]);

  const EmptyState = () => (
    <View style={s.empty}>
      <Ionicons name="bag-outline" size={56} color={colors.textMuted} />
      <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No Products Found</Text>
      <Text style={[s.emptyBody, { color: colors.textMuted }]}>
        Try adjusting your filters.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle="dark-content" />

      {/* Navbar */}
      <View
        style={[
          s.navbar,
          {
            borderBottomColor: colors.borderPrimary,
            backgroundColor:   colors.bgPrimary,
          },
        ]}
      >
        <Text style={[s.navTitle, { color: colors.textPrimary }]}>Marketplace</Text>
        {user && (
          <TouchableOpacity
            onPress={() => navigation.navigate('SavedProducts')}
            style={[
              s.navBtn,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderPrimary },
            ]}
          >
            <Ionicons name="bookmark-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Main grid */}
      <FlatList
        data={allProducts}
        keyExtractor={item => item._id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.xs,
          paddingBottom: 24,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={isLoading ? null : <EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.accent}
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingNextPage
            ? <ActivityIndicator color={colors.accent} style={{ paddingVertical: 20 }} />
            : null
        }
        renderItem={({ item }) => (
            <ProductCard
    variant="public"
    product={item}
onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
    isSaved={savedIds.has(item._id)}
            size="md"
            style={{ flex: 1 }}
  />
        )}
      />

      <ProductFilterSheet
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        current={filterState}
        onApply={f => { setFilterState(f); setShowFilter(false); }}
      />
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:        { flex: 1 },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  navTitle:    { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  searchRow:   { flexDirection: 'row', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, height: 44, borderWidth: 1, borderRadius: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterBtn: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  filterBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 14, height: 14, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  catScroll:   { gap: 8, paddingVertical: 8 },
  catTab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1,
  },
  catTabTxt:   { fontSize: 12, fontWeight: '600' },
  subcatScroll:{ gap: 7, paddingBottom: 8 },
  subcatPill:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  sectionTitle:{ fontSize: 16, fontWeight: '700' },
  resultsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingBottom: 6,
  },
  resultsTxt:  { fontSize: 12 },
  empty: {
    alignItems: 'center', justifyContent: 'center',
    paddingTop: 60, gap: 10,
  },
  emptyTitle:  { fontSize: 17, fontWeight: '700' },
  emptyBody:   { fontSize: 13, textAlign: 'center', maxWidth: 240 },
});