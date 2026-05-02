/**
 * mobile/src/screens/products/SavedProductsScreen.tsx
 *
 * UPDATED:
 *  - useTheme() (was useThemeStore with the wrong theme shape)
 *  - Fixed broken JSX in renderItem (variant prop missing, malformed indentation,
 *    isSaved with no value)
 *  - Optimistic unsave with rollback on error
 *  - Skeleton loading state
 *  - Pull-to-refresh works on initial load too
 */
import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, RefreshControl,
  ActivityIndicator, StatusBar, Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { useSavedProducts, useUnsaveProduct } from '../../hooks/useProducts';

import { PublicProductCard } from '../../components/products/PublicProductCard';
import { ProductSkeleton } from '../../components/products/ProductSkeleton';

import { Product } from '../../services/productService';
import type { ProductsStackParamList } from './ProductMarketplaceScreen';

type Props = NativeStackScreenProps<ProductsStackParamList, 'SavedProducts'>;

const { width: SCREEN_W } = Dimensions.get('window');
const NUM_COLUMNS = SCREEN_W >= 375 ? 2 : 1;

export const SavedProductsScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, spacing, isDark } = useTheme();

  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage,
    isLoading, isError, refetch, isRefetching,
  } = useSavedProducts();

  const unsave = useUnsaveProduct();

  // Local "removed" set — gives the user immediate visual feedback when they
  // tap unsave. The card still exists on the next page until refetch, so we
  // hide it eagerly.
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const products: Product[] = useMemo(() => {
    const all = data?.pages.flatMap(p => p.products) ?? [];
    return all.filter(p => !removedIds.has(p._id));
  }, [data, removedIds]);

  const handleUnsave = useCallback((productId: string) => {
    setRemovedIds(prev => new Set([...prev, productId])); // optimistic
    unsave.mutate(productId, {
      onError: () => {
        setRemovedIds(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      },
    });
  }, [unsave]);

  // ── Sub-views ──────────────────────────────────────────────────────────────

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
      <View
        style={[
          s.emptyIcon,
          { backgroundColor: colors.accentBg, borderColor: colors.borderAccent },
        ]}
      >
        <Ionicons name="bookmark-outline" size={36} color={colors.accent} />
      </View>
      <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
        No saved products
      </Text>
      <Text style={[s.emptyBody, { color: colors.textMuted }]}>
        Tap the bookmark icon on any product to save it here for later.
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('ProductMarketplace')}
        style={[s.browseBtn, { backgroundColor: colors.accent }]}
        activeOpacity={0.85}
      >
        <Ionicons name="bag-outline" size={18} color={colors.textInverse} />
        <Text style={{ color: colors.textInverse, fontWeight: '700', fontSize: 14 }}>
          Browse Marketplace
        </Text>
      </TouchableOpacity>
    </View>
  );

  const ErrorState = () => (
    <View style={s.empty}>
      <Ionicons name="cloud-offline-outline" size={48} color={colors.error} />
      <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
        Couldn’t load saved products
      </Text>
      <TouchableOpacity
        onPress={() => refetch()}
        style={[s.browseBtn, { backgroundColor: colors.accent }]}
      >
        <Text style={{ color: colors.textInverse, fontWeight: '700', fontSize: 14 }}>
          Retry
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[s.header, { borderBottomColor: colors.borderPrimary }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>
          Saved Products
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {isError && products.length === 0 ? (
        <ErrorState />
      ) : (
        <FlatList
          data={isLoading ? [] : products}
          keyExtractor={item => item._id}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={NUM_COLUMNS > 1 ? { gap: 10 } : undefined}
          contentContainerStyle={{ padding: spacing.lg, gap: 10 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                setRemovedIds(new Set());
                refetch();
              }}
              tintColor={colors.accent}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={isLoading ? <SkeletonGrid /> : <EmptyState />}
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
                onSave={(id) => handleUnsave(id)}
                isSaved
                size="md"
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle:  { fontSize: 20, fontWeight: '700' },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, gap: 14, paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyBody:  { fontSize: 13, textAlign: 'center', lineHeight: 19, maxWidth: 280 },
  browseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, marginTop: 4,
  },
});