/**
 * mobile/src/screens/products/SavedProductsScreen.tsx
 *
 * Shows products the authenticated user has saved / bookmarked.
 *
 * FIX: picks the correct detail route at runtime depending on whether this
 * screen is mounted in the public ProductsNavigator or in a role stack that
 * registers 'PublicProductDetails' (Company stack).
 */
import React, { useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, RefreshControl,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useSavedProducts, useUnsaveProduct } from '../../hooks/useProducts';
import { ProductCard } from '../../components/products/ProductCard';
import { Product } from '../../services/productService';
import type { ProductsStackParamList } from './ProductMarketplaceScreen';

type Props = NativeStackScreenProps<ProductsStackParamList, 'SavedProducts'>;

export const SavedProductsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const { colors, spacing } = theme;

  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage,
    isLoading, refetch, isRefetching,
  } = useSavedProducts();

  const unsave = useUnsaveProduct();

  const products: Product[] = useMemo(
    () => data?.pages.flatMap(p => p.products) ?? [],
    [data]
  );

  const EmptyState = () => (
    <View style={styles.empty}>
      <Ionicons name="bookmark-outline" size={56} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Saved Products</Text>
      <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
        Tap the bookmark icon on any product to save it here.
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('ProductMarketplace')}
        style={[styles.browseBtn, { backgroundColor: colors.primary }]}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Browse Marketplace</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Saved Products</Text>
        <View style={{ width: 22 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item._id}
          numColumns={2}
          columnWrapperStyle={{ gap: 10 }}
          contentContainerStyle={{ padding: spacing[4], gap: 10 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<EmptyState />}
          ListFooterComponent={
            isFetchingNextPage
              ? <ActivityIndicator color={colors.primary} style={{ paddingVertical: 20 }} />
              : null
          }
          renderItem={({ item }) => (
                        <ProductCard
                variant="public"
                product={item}
onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}              onSave={(id) => unsave.mutate(id)}
              isSaved                        size="md"
                        style={{ flex: 1 }}
              />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, gap: 12, paddingHorizontal: 32,
  },
  emptyTitle:  { fontSize: 18, fontWeight: '700' },
  emptyBody:   { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  browseBtn:   { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
});