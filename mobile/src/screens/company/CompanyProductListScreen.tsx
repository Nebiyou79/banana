import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useCompanyProducts, useDeleteProduct, useUpdateProductStatus } from '../../hooks/useProducts';
import { CompanyProductCard } from '../../components/products/CompanyProductCard';
import { Product } from '../../services/productService';
import type { CompanyProfileTabParamList, CompanyMoreStackParamList } from '../../navigation/types';
import { CompanyStackParamList } from '../../navigation/CompanyNavigator';

type Props = CompositeScreenProps<
  MaterialTopTabScreenProps<CompanyProfileTabParamList, 'Products'>,
  NativeStackScreenProps<CompanyStackParamList, 'CompanyProductList'>
>;

type StatusFilter = 'all' | 'active' | 'draft' | 'out_of_stock' | 'discontinued';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
  { key: 'out_of_stock', label: 'Out of Stock' },
  { key: 'discontinued', label: 'Disc.' },
];

export const CompanyProductListScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const { colors, spacing, borderRadius, shadows } = theme;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const {
    data: companyProductsData,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCompanyProducts(undefined, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 20,
  });

  const deleteProduct = useDeleteProduct();
  const updateStatus = useUpdateProductStatus();

  const allProducts: Product[] = React.useMemo(
    () => companyProductsData?.pages.flatMap((p) => p.products) ?? [],
    [companyProductsData]
  );

  const filteredProducts =
    statusFilter === 'all'
      ? allProducts
      : allProducts.filter((p) => p.status === statusFilter);

  const totalCount = companyProductsData?.pages[0]?.pagination.total ?? 0;

  const handleToggleStatus = (product: Product) => {
    const nextStatus = product.status === 'active' ? 'draft' : 'active';
    updateStatus.mutate({ id: product._id, status: nextStatus });
  };

  const handleMarkOutOfStock = (product: Product) => {
    updateStatus.mutate({ id: product._id, status: 'out_of_stock' });
  };

  const EmptyState = () => (
    <View style={styles.empty}>
      <Ionicons name="cube-outline" size={60} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Products Yet</Text>
      <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
        Create your first product to start selling.
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('CreateProduct')}
        style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Create Product</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Products</Text>
          {totalCount > 0 && (
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>{totalCount} total</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateProduct')}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Status tabs */}
      <FlatList
        horizontal
        data={STATUS_TABS}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing[4], gap: 8, paddingVertical: 12 }}
        renderItem={({ item }) => {
          const isActive = statusFilter === item.key;
          return (
            <TouchableOpacity
              onPress={() => setStatusFilter(item.key)}
              style={[
                styles.tab,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: isActive ? '#fff' : colors.textSecondary,
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Product list */}
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: spacing[4] }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<EmptyState />}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} style={{ paddingVertical: 20 }} />
            ) : null
          }
          renderItem={({ item }) => (
            <CompanyProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
              onEdit={() => navigation.navigate('EditProduct', { productId: item._id })}
              onDelete={() => deleteProduct.mutate(item._id)}
              onToggleStatus={() => handleToggleStatus(item)}
              onMarkOutOfStock={() => handleMarkOutOfStock(item)}
            />
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => navigation.navigate('CreateProduct')}
        style={[styles.fab, { backgroundColor: colors.primary, ...shadows.lg }]}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  headerSub: { fontSize: 11, marginTop: 1 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyBody: { fontSize: 13, textAlign: 'center', maxWidth: 240 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
});
