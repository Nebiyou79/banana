// src/screens/products/SavedProductsScreen.tsx
// MIGRATED: useTheme() only, AppHeader, FlashList, spacing/radius tokens, Ionicons only

import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, RefreshControl,
  ActivityIndicator, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '../../hooks/useTheme';
import { useSavedProducts, useUnsaveProduct } from '../../hooks/useProducts';
import { PublicProductCard } from '../../components/products/PublicProductCard';
import { ProductSkeleton }   from '../../components/products/ProductSkeleton';
import { AppHeader }         from '../../components/ui/AppHeader';
import { Product }           from '../../services/productService';
import type { ProductsStackParamList } from './ProductMarketplaceScreen';

type Props = NativeStackScreenProps<ProductsStackParamList, 'SavedProducts'>;

const { width: SCREEN_W } = Dimensions.get('window');
const NUM_COLUMNS = 2;
const ITEM_WIDTH  = (SCREEN_W - 16 * 2 - 10) / 2;

export const SavedProductsScreen: React.FC<Props> = ({ navigation }) => {
  const { colors: c, spacing, radius, type, shadows } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage,
    isLoading, isError, refetch, isRefetching,
  } = useSavedProducts();

  const unsave = useUnsaveProduct();
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const products: Product[] = useMemo(() => {
    const all = data?.pages.flatMap(p => p.products) ?? [];
    return all.filter(p => !removedIds.has(p._id));
  }, [data, removedIds]);

  const handleUnsave = useCallback((productId: string) => {
    setRemovedIds(prev => new Set([...prev, productId]));
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

  const renderItem = useCallback(({ item }: { item: Product }) => (
    <View style={{ flex: 1, maxWidth: ITEM_WIDTH }}>
      <PublicProductCard
        product={item}
        onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
        onSave={(id) => handleUnsave(id)}
        isSaved
        size="md"
      />
    </View>
  ), [navigation, handleUnsave]);

  const keyExtractor = useCallback((item: Product) => item._id, []);

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
      <View style={[S.emptyIcon, { backgroundColor: c.primaryBg, borderColor: withAlpha(c.primary, 0.3), borderRadius: radius.full }]}>
        <Ionicons name="bookmark-outline" size={36} color={c.primary} />
      </View>
      <Text style={[type.bodySm, { color: c.text, fontWeight: '700', textAlign: 'center' }]}>No saved products</Text>
      <Text style={[type.caption, { color: c.textMuted, textAlign: 'center', maxWidth: 280, lineHeight: 19 }]}>
        Tap the bookmark icon on any product to save it here for later.
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('ProductMarketplace')}
        style={[S.browseBtn, { backgroundColor: c.primary, borderRadius: radius.md }]}
        activeOpacity={0.85}
      >
        <Ionicons name="bag-outline" size={18} color={c.bg} />
        <Text style={[type.body, { color: c.bg, fontWeight: '700' }]}>Browse Marketplace</Text>
      </TouchableOpacity>
    </View>
  );

  const ErrorState = () => (
    <View style={S.empty}>
      <Ionicons name="cloud-offline-outline" size={48} color={c.danger} />
      <Text style={[type.bodySm, { color: c.text, fontWeight: '700', textAlign: 'center' }]}>
        Couldn't load saved products
      </Text>
      <TouchableOpacity
        onPress={() => refetch()}
        style={[S.browseBtn, { backgroundColor: c.primary, borderRadius: radius.md }]}
      >
        <Text style={[type.body, { color: c.bg, fontWeight: '700' }]}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: c.bg }]} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Saved Products" showBack onBack={() => navigation.goBack()} />

      {isError && products.length === 0 ? (
        <ErrorState />
      ) : (
        <FlashList
          data={isLoading ? [] : products}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + 24 }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => { setRemovedIds(new Set()); refetch(); }}
              tintColor={c.primary}
            />
          }
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={isLoading ? <SkeletonGrid /> : <EmptyState />}
          ListFooterComponent={
            isFetchingNextPage
              ? <ActivityIndicator color={c.primary} style={{ paddingVertical: 20 }} />
              : null
          }
        />
      )}
    </SafeAreaView>
  );
};

// Need withAlpha locally since it's used in EmptyState
const withAlpha = (hex: string, alpha: number): string => {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0');
  return `#${hex.replace('#', '').slice(0, 6)}${a}`.toUpperCase();
};

const S = StyleSheet.create({
  safe:        { flex: 1 },
  skeletonGrid:{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, gap: 14, paddingHorizontal: 32,
  },
  emptyIcon: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  browseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 4,
  },
});

export default SavedProductsScreen;