// src/screens/products/ProductMarketplaceScreen.tsx
// MIGRATED: useTheme() only, AppHeader, 2-col FlashList, spacing/radius tokens, Ionicons only
// BUG FIX: 2 columns (spec requirement), no inline wrappers

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  RefreshControl, StatusBar, ActivityIndicator, ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { useAuthStore } from '../../store/authStore';
import type { AuthUser } from '../../context/AuthContext';
import {
  useProducts, useFeaturedProducts, useProductCategories,
  useSaveProduct, useUnsaveProduct,
} from '../../hooks/useProducts';
import { PublicProductCard } from '../../components/products/PublicProductCard';
import { ProductSkeleton }   from '../../components/products/ProductSkeleton';
import { ProductFilterSheet, FilterState } from '../../components/products/ProductFilterSheet';
import { Product } from '../../services/productService';
import { AppHeader } from '../../components/ui/AppHeader';
import Toast from 'react-native-toast-message';

export type ProductsStackParamList = {
  ProductMarketplace: undefined;
  ProductDetails:     { productId: string };
  SavedProducts:      undefined;
};

type Props = NativeStackScreenProps<ProductsStackParamList, 'ProductMarketplace'>;

const { width: SCREEN_W } = Dimensions.get('window');
// SPEC: 2 columns (NOT 3)
const NUM_COLUMNS = 2;
const ITEM_WIDTH  = (SCREEN_W - 16 * 2 - 10) / 2; // padding + gap

export const ProductMarketplaceScreen: React.FC<Props> = ({ navigation }) => {
  const { colors: c, spacing, radius, type, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const user   = (useAuthStore().user ?? null) as AuthUser | null;

  const [search, setSearch]                 = useState('');
  const [debouncedSearch, setDebounced]     = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcat, setActiveSubcat]     = useState<string | null>(null);
  const [filterState, setFilterState]       = useState<FilterState>({});
  const [showFilter, setShowFilter]         = useState(false);

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
    () => categories.find(cat => cat.id === activeCategory),
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
      if (!user) { Toast.show({ type: 'info', text1: 'Sign in to save products' }); return; }
      if (currentlySaved) unsaveProduct.mutate(productId);
      else saveProduct.mutate(productId);
    },
    [user, saveProduct, unsaveProduct],
  );

  const activeFilterCount = Object.values(filterState).filter(v => v !== undefined && v !== false).length;

  // ─── Render item (2-col FlashList) ────────────────────────────────────────
  const renderItem = useCallback(({ item }: { item: Product }) => (
    <View style={{ flex: 1, maxWidth: ITEM_WIDTH }}>
      <PublicProductCard
        product={item}
        onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
        onSave={handleSave}
        isSaved={!!item.isSaved}
        size="md"
      />
    </View>
  ), [navigation, handleSave]);

  const keyExtractor = useCallback((item: Product) => item._id, []);

  // ─── Header component ──────────────────────────────────────────────────────
  const ListHeader = useCallback(() => (
    <View>
      {/* Search + Filter */}
      <View style={[S.searchRow, { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, paddingTop: spacing.md, gap: spacing.sm }]}>
        <View style={[S.searchBar, { backgroundColor: c.inputBg, borderColor: c.inputBorder, borderRadius: radius.md, flex: 1 }]}>
          <Ionicons name="search-outline" size={17} color={c.textMuted} />
          <TextInput
            value={search}
            onChangeText={handleSearchChange}
            style={[S.searchInput, { color: c.text }]}
            placeholder="Search products…"
            placeholderTextColor={c.inputPlaceholder}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setDebounced(''); }} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowFilter(true)}
          style={[
            S.filterBtn,
            {
              backgroundColor: activeFilterCount > 0 ? c.primary : c.inputBg,
              borderColor:     activeFilterCount > 0 ? c.primary : c.inputBorder,
              borderRadius:    radius.md,
            },
          ]}
          hitSlop={4}
        >
          <Ionicons name="options-outline" size={20} color={activeFilterCount > 0 ? c.bg : c.text} />
          {activeFilterCount > 0 && (
            <View style={[S.filterBadge, { backgroundColor: c.bg }]}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: c.primary }}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={[S.catScroll, { paddingHorizontal: spacing.lg }]}
      >
        <TouchableOpacity
          onPress={() => handleCategoryPress(null)}
          style={[S.catTab, {
            backgroundColor: !activeCategory ? c.primary : c.inputBg,
            borderColor:     !activeCategory ? c.primary : c.inputBorder,
            borderRadius:    radius.full,
          }]}
        >
          <Text style={[type.caption, { color: !activeCategory ? c.textInverse : c.textMuted, fontWeight: '600' }]}>All</Text>
        </TouchableOpacity>
        {categories.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => handleCategoryPress(cat.id)}
              style={[S.catTab, {
                backgroundColor: isActive ? c.primary : c.inputBg,
                borderColor:     isActive ? c.primary : c.inputBorder,
                borderRadius:    radius.full,
              }]}
            >
              <Text style={[type.caption, { color: isActive ? c.textInverse : c.textMuted, fontWeight: '600' }]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Subcategory pills */}
      {selectedCat && selectedCat.subcategories && selectedCat.subcategories.length > 0 && (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={[S.subcatScroll, { paddingHorizontal: spacing.lg }]}
        >
          {selectedCat.subcategories.map(sub => {
            const isActive = activeSubcat === sub.id;
            return (
              <TouchableOpacity
                key={sub.id}
                onPress={() => setActiveSubcat(isActive ? null : sub.id)}
                style={[S.subcatPill, {
                  backgroundColor: isActive ? withAlpha(c.primary, 0.14) : 'transparent',
                  borderColor:     isActive ? c.primary : c.border,
                  borderRadius:    radius.full,
                }]}
              >
                <Text style={[type.caption, { color: isActive ? c.primary : c.textMuted, fontWeight: '600' }]}>{sub.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Featured rail */}
      {featured.length > 0 && !debouncedSearch && !activeCategory && (
        <View style={{ marginTop: spacing.xs, paddingBottom: spacing.sm }}>
          <Text style={[type.bodySm, { color: c.text, fontWeight: '700', paddingHorizontal: spacing.lg, marginBottom: spacing.sm }]}>
            Featured
          </Text>
          <FlashList
            horizontal
            data={featured.slice(0, 6)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg }}
            ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
            keyExtractor={item => `featured-${item._id}`}
            renderItem={({ item }) => (
              <PublicProductCard
                product={item}
                onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
                onSave={handleSave}
                isSaved={!!item.isSaved}
                size="sm"
                style={{ width: 160 }}
              />
            )}
          />
        </View>
      )}

      {/* Results count */}
      <View style={[S.resultsRow, { paddingHorizontal: spacing.lg }]}>
        <Text style={[type.caption, { color: c.textMuted, fontWeight: '500' }]}>
          {isLoading ? 'Loading…' : `${allProducts.length.toLocaleString()} product${allProducts.length !== 1 ? 's' : ''}`}
        </Text>
        {(activeCategory || debouncedSearch || activeFilterCount > 0) && (
          <TouchableOpacity onPress={() => { handleCategoryPress(null); setSearch(''); setDebounced(''); setFilterState({}); }} hitSlop={8}>
            <Text style={[type.caption, { color: c.primary, fontWeight: '600' }]}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  ), [
    search, handleSearchChange, categories, activeCategory, selectedCat, activeSubcat,
    featured, debouncedSearch, allProducts.length, isLoading, c, spacing, radius, type,
    activeFilterCount, navigation, handleSave, handleCategoryPress,
  ]);

  const SkeletonGrid = () => (
    <View style={[S.skeletonGrid, { paddingHorizontal: spacing.lg }]}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={`sk-${i}`} style={{ width: '48%' }}>
          <ProductSkeleton size="md" />
        </View>
      ))}
    </View>
  );

  const EmptyState = () => (
    <View style={S.empty}>
      <Ionicons name="bag-outline" size={56} color={c.textMuted} />
      <Text style={[type.bodySm, { color: c.text, fontWeight: '700', marginTop: spacing.md }]}>No products found</Text>
      <Text style={[type.caption, { color: c.textMuted, textAlign: 'center', maxWidth: 240 }]}>Try adjusting your filters or search.</Text>
    </View>
  );

  const ErrorState = () => (
    <View style={S.empty}>
      <Ionicons name="cloud-offline-outline" size={48} color={c.danger} />
      <Text style={[type.bodySm, { color: c.text, fontWeight: '700', marginTop: spacing.md }]}>Couldn't load products</Text>
      <TouchableOpacity onPress={() => refetch()} style={[S.retryBtn, { backgroundColor: c.primary, borderRadius: radius.md }]}>
        <Text style={{ color: c.bg, fontWeight: '700' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: c.bg }]} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <AppHeader
        title="Products & Services"
        centerTitle={false}
        rightAction={
          user ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('SavedProducts')}
              style={[S.navBtn, { backgroundColor: c.surface, borderColor: c.border, borderRadius: radius.md }]}
              hitSlop={8}
            >
              <Ionicons name="bookmark-outline" size={18} color={c.text} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {isError && allProducts.length === 0 ? (
        <ErrorState />
      ) : (
        <FlashList
          data={isLoading ? [] : allProducts}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={NUM_COLUMNS}             // SPEC: 2 columns
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + 24 }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={isLoading ? <SkeletonGrid /> : <EmptyState />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.primary} />
          }
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage
              ? <ActivityIndicator color={c.primary} style={{ paddingVertical: 20 }} />
              : null
          }
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

const S = StyleSheet.create({
  safe:    { flex: 1 },
  navBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 44, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  filterBtn: { width: 44, height: 44, borderWidth: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  filterBadge: { position: 'absolute', top: 6, right: 6, width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  catScroll:    { gap: 8, paddingVertical: 8, paddingRight: 16 },
  catTab:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1 },
  subcatScroll: { gap: 7, paddingBottom: 8, paddingRight: 16 },
  subcatPill:   { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  resultsRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, paddingTop: 4 },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 12 },
  empty:        { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 12 },
  retryBtn:     { paddingHorizontal: 24, paddingVertical: 12, marginTop: 4 },
});

export default ProductMarketplaceScreen;