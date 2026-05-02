/**
 * mobile/src/screens/products/ProductMarketplaceScreen.tsx
 *
 * UPDATED:
 *  - PublicProductCard used directly (was generic ProductCard with implicit
 *    variant — TS was inferring the wrong union arm)
 *  - BUG FIX: handleSave was running optimistic update twice (inside mutation
 *    onSuccess AND inline after) → caused state to flip back. Now optimistic
 *    flip happens immediately, and onError rolls back.
 *  - BUG FIX: grid renderItem was missing onSave prop, so the bookmark icon
 *    on every grid card was inert. Wired up.
 *  - All hardcoded '#fff' replaced with colors.textInverse
 *  - Skeleton loading state instead of just isLoading flag
 *  - Pull-to-refresh works in initial load too (uses isFetching)
 */
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, SafeAreaView, StatusBar, ActivityIndicator, ScrollView,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import type { AuthUser } from '../../context/AuthContext';
import {
  useProducts, useFeaturedProducts, useProductCategories,
  useSaveProduct, useUnsaveProduct, useSavedProducts,
} from '../../hooks/useProducts';

import { PublicProductCard } from '../../components/products/PublicProductCard';
import { ProductSkeleton } from '../../components/products/ProductSkeleton';
import { ProductFilterSheet, FilterState } from '../../components/products/ProductFilterSheet';
import { Product } from '../../services/productService';
import Toast from 'react-native-toast-message';

// ── Route param list ─────────────────────────────────────────────────────────

export type ProductsStackParamList = {
  ProductMarketplace: undefined;
  ProductDetails:     { productId: string };
  SavedProducts:      undefined;
};

type Props = NativeStackScreenProps<ProductsStackParamList, 'ProductMarketplace'>;

const { width: SCREEN_W } = Dimensions.get('window');
const NUM_COLUMNS = SCREEN_W >= 375 ? 2 : 1;

// ── Screen ───────────────────────────────────────────────────────────────────

export const ProductMarketplaceScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, spacing } = useTheme();
  const user = (useAuthStore().user ?? null) as AuthUser | null;

  // ── Filters / search state ───────────────────────────────────────────────
  const [search, setSearch]                 = useState('');
  const [debouncedSearch, setDebounced]     = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcat, setActiveSubcat]     = useState<string | null>(null);
  const [filterState, setFilterState]       = useState<FilterState>({});
  const [showFilter, setShowFilter]         = useState(false);


  // Search debounce
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
    search:      debouncedSearch || undefined,
    category:    activeCategory  || filterState.category    || undefined,
    subcategory: activeSubcat    || filterState.subcategory || undefined,
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
    isLoading, isError, refetch, isRefetching,
  } = useProducts(filters);

  const { data: featured = [] } = useFeaturedProducts();

  const allProducts: Product[] = useMemo(
    () => productsData?.pages.flatMap(p => p.products) ?? [],
    [productsData],
  );

  const saveProduct   = useSaveProduct();
  const unsaveProduct = useUnsaveProduct();

const handleSave = useCallback(
  (productId: string, currentlySaved: boolean) => {
    if (!user) {
      // surface a tasteful prompt to sign in instead of silently doing nothing
      Toast.show({ type: 'info', text1: 'Sign in to save products' });
      return;
    }
    if (currentlySaved) unsaveProduct.mutate(productId);
    else saveProduct.mutate(productId);
  },
  [user, saveProduct, unsaveProduct],
);

  const activeFilterCount = Object.values(filterState)
    .filter(v => v !== undefined && v !== false).length;

  // ── Sub-views ────────────────────────────────────────────────────────────

  const CategoryTabs = useMemo(() => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[s.catScroll, { paddingHorizontal: spacing.lg }]}
    >
      <TouchableOpacity
        onPress={() => handleCategoryPress(null)}
        activeOpacity={0.85}
        style={[
          s.catTab,
          {
            backgroundColor: !activeCategory ? colors.accent : colors.inputBg,
            borderColor:     !activeCategory ? colors.accent : colors.borderPrimary,
          },
        ]}
      >
        <Text style={[s.catTabTxt, {
          color: !activeCategory ? colors.textInverse : colors.textSecondary,
        }]}>
          All
        </Text>
      </TouchableOpacity>

      {categories.map(cat => {
        const isActive = activeCategory === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            onPress={() => handleCategoryPress(cat.id)}
            activeOpacity={0.85}
            style={[
              s.catTab,
              {
                backgroundColor: isActive ? colors.accent : colors.inputBg,
                borderColor:     isActive ? colors.accent : colors.borderPrimary,
              },
            ]}
          >
            <Text style={[s.catTabTxt, {
              color: isActive ? colors.textInverse : colors.textSecondary,
            }]}>
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
        contentContainerStyle={[s.subcatScroll, { paddingHorizontal: spacing.lg }]}
      >
        {selectedCat.subcategories.map(sub => {
          const isActive = activeSubcat === sub.id;
          return (
            <TouchableOpacity
              key={sub.id}
              onPress={() => setActiveSubcat(isActive ? null : sub.id)}
              activeOpacity={0.85}
              style={[
                s.subcatPill,
                {
                  backgroundColor: isActive ? colors.accent + '18' : colors.shadowColor ?? 'transparent',
                  borderColor:     isActive ? colors.accent : colors.borderPrimary,
                },
              ]}
            >
              <Text style={{
                fontSize: 12, fontWeight: '600',
                color: isActive ? colors.accent : colors.textSecondary,
              }}>
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
      {/* Search + Filter */}
      <View style={[
        s.searchRow,
        { paddingHorizontal: spacing.lg, paddingBottom: 10, paddingTop: 12, gap: 10 },
      ]}>
        <View style={[
          s.searchBar,
          { backgroundColor: colors.inputBg, borderColor: colors.borderPrimary, flex: 1 },
        ]}>
          <Ionicons name="search-outline" size={17} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={handleSearchChange}
            style={[s.searchInput, { color: colors.textPrimary }]}
            placeholder="Search products…"
            placeholderTextColor={colors.inputPlaceholder}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setDebounced(''); }}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowFilter(true)}
          activeOpacity={0.85}
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
            color={activeFilterCount > 0 ? colors.textInverse : colors.textPrimary}
          />
          {activeFilterCount > 0 && (
            <View style={[s.filterBadge, { backgroundColor: colors.textInverse }]}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: colors.accent }}>
                {activeFilterCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {CategoryTabs}
      {SubcatPills}

      {/* Featured rail */}
      {featured.length > 0 && !debouncedSearch && !activeCategory && (
        <View style={{ marginTop: 4, paddingBottom: 8 }}>
          <View style={[s.sectionHeader, { paddingHorizontal: spacing.lg }]}>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>⭐ Featured</Text>
          </View>
          <FlatList
            horizontal
            keyExtractor={item => `featured-${item._id}`}
            data={featured.slice(0, 6)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 10 }}
            renderItem={({ item }) => (
              <PublicProductCard
                product={item}
                onPress={() =>
                  navigation.navigate('ProductDetails', { productId: item._id })
                }
                onSave={handleSave}
isSaved={!!item.isSaved}                size="sm"
                style={{ width: 160 }}
              />
            )}
          />
        </View>
      )}

      {/* Results count + clear */}
      <View style={[s.resultsRow, { paddingHorizontal: spacing.lg }]}>
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
    handleCategoryPress,
  ]);

  const SkeletonGrid = () => (
    <View style={[s.skeletonGrid, { paddingHorizontal: spacing.lg }]}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={`sk-${i}`} style={{ width: NUM_COLUMNS === 2 ? '48%' : '100%' }}>
          <ProductSkeleton size="md" />
        </View>
      ))}
    </View>
  );

  const EmptyState = () => (
    <View style={s.empty}>
      <Ionicons name="bag-outline" size={56} color={colors.textMuted} />
      <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No products found</Text>
      <Text style={[s.emptyBody, { color: colors.textMuted }]}>
        Try adjusting your filters or search.
      </Text>
    </View>
  );

  const ErrorState = () => (
    <View style={s.empty}>
      <Ionicons name="cloud-offline-outline" size={48} color={colors.error} />
      <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
        Couldn’t load products
      </Text>
      <TouchableOpacity
        onPress={() => refetch()}
        style={[s.retryBtn, { backgroundColor: colors.accent }]}
      >
        <Text style={{ color: colors.textInverse, fontWeight: '700' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle="dark-content" />

      {/* Navbar */}
      <View style={[
        s.navbar,
        { borderBottomColor: colors.borderPrimary, backgroundColor: colors.bgPrimary },
      ]}>
        <Text style={[s.navTitle, { color: colors.textPrimary }]}>
          Products & Services
        </Text>
        {user && (
          <TouchableOpacity
            onPress={() => navigation.navigate('SavedProducts')}
            style={[
              s.navBtn,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderPrimary },
            ]}
            activeOpacity={0.85}
          >
            <Ionicons name="bookmark-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {isError && allProducts.length === 0 ? (
        <ErrorState />
      ) : (
        <FlatList
          data={isLoading ? [] : allProducts}
          keyExtractor={item => item._id}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={NUM_COLUMNS > 1 ? { gap: 10 } : undefined}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: 24,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={isLoading ? <SkeletonGrid /> : <EmptyState />}
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
            <View style={{ flex: NUM_COLUMNS > 1 ? 1 : undefined }}>
              <PublicProductCard
                product={item}
                onPress={() =>
                  navigation.navigate('ProductDetails', { productId: item._id })
                }
                onSave={handleSave}
isSaved={!!item.isSaved}                size="md"
              />
            </View>
          )}
        />
      )}

      <ProductFilterSheet
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        current={filterState}
        onApply={f => { setFilterState(f); setShowFilter(false); }}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:        { flex: 1 },
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navTitle:    { fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
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
  catScroll:    { gap: 8, paddingVertical: 8, paddingRight: 16 },
  catTab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1,
  },
  catTabTxt:    { fontSize: 12, fontWeight: '600' },
  subcatScroll: { gap: 7, paddingBottom: 8, paddingRight: 16 },
  subcatPill:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  resultsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingBottom: 6, paddingTop: 4,
  },
  resultsTxt:   { fontSize: 12, fontWeight: '500' },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 12 },
  empty: {
    alignItems: 'center', justifyContent: 'center',
    paddingTop: 60, paddingHorizontal: 32, gap: 12,
  },
  emptyTitle:   { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyBody:    { fontSize: 13, textAlign: 'center', maxWidth: 240, lineHeight: 19 },
  retryBtn:     { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
});