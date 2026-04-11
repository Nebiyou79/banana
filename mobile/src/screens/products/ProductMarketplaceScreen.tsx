import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import {
  useProducts,
  useFeaturedProducts,
  useProductCategories,
} from '../../hooks/useProducts';
import { ProductCard } from '../../components/products/ProductCard';
import { Product } from '../../services/productService';

// ── Navigator type (shared across roles) ─────────────────────────────────────

export type ProductsStackParamList = {
  ProductMarketplace: undefined;
  ProductDetails: { productId: string };
};

type Props = NativeStackScreenProps<ProductsStackParamList, 'ProductMarketplace'>;

// ── Screen ─────────────────────────────────────────────────────────────────────

export const ProductMarketplaceScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const { colors, spacing, borderRadius } = theme;

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  const searchTimeout = React.useRef<ReturnType<typeof setTimeout>>();
  const handleSearch = (text: string) => {
    setSearch(text);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(text), 400);
  };

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category: activeCategory || undefined,
      status: 'active',
    }),
    [debouncedSearch, activeCategory]
  );

  const {
    data: productsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useProducts(filters);

  const { data: featuredProducts } = useFeaturedProducts();
  const { data: categories } = useProductCategories();

  const allProducts: Product[] = useMemo(
    () => productsData?.pages.flatMap((p) => p.products) ?? [],
    [productsData]
  );

  const navigateToDetail = (productId: string) => {
    navigation.navigate('ProductDetails', { productId });
  };

  // ── Header ────────────────────────────────────────────────────────────────────

  const ListHeader = () => (
    <View>
      {/* Search */}
      <View style={[styles.searchRow, { borderColor: colors.border, backgroundColor: colors.inputBg, borderRadius: borderRadius.xl }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={handleSearch}
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search products…"
          placeholderTextColor={colors.placeholder}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); setDebouncedSearch(''); }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Featured */}
      {featuredProducts && featuredProducts.length > 0 && !debouncedSearch && !activeCategory && (
        <View style={{ marginTop: spacing[4] }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>⭐ Featured</Text>
          <FlatList
            horizontal
            data={featuredProducts}
            keyExtractor={(item) => item._id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 2, gap: 10 }}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                onPress={() => navigateToDetail(item._id)}
                size="md"
                style={{ width: 160 }}
              />
            )}
          />
        </View>
      )}

      {/* Category chips */}
      <View style={{ marginTop: spacing[4] }}>
        <FlatList
          horizontal
          data={['All', ...(categories ?? [])]}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
          renderItem={({ item }) => {
            const isAll = item === 'All';
            const isActive = isAll ? !activeCategory : activeCategory === item;
            return (
              <TouchableOpacity
                onPress={() => setActiveCategory(isAll ? null : item)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.inputBg,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: isActive ? '#fff' : colors.textSecondary }}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
        {isLoading ? 'Loading…' : `${allProducts.length} products`}
      </Text>
    </View>
  );

  // ── Empty state ───────────────────────────────────────────────────────────────

  const EmptyState = () => (
    <View style={styles.empty}>
      <Ionicons name="bag-outline" size={56} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Products Found</Text>
      <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
        {debouncedSearch || activeCategory
          ? 'Try adjusting your search or category.'
          : 'No products available right now.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Page header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Marketplace</Text>
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="options-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={allProducts}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ padding: spacing[4], gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={isLoading ? null : <EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={{ paddingVertical: 20 }} />
          ) : null
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigateToDetail(item._id)}
            size="md"
            style={{ flex: 1 }}
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  resultsCount: { fontSize: 12, marginTop: 14, marginBottom: 4 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyBody: { fontSize: 13, textAlign: 'center', maxWidth: 240 },
});
