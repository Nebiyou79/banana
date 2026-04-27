/**
 * mobile/src/screens/company/CompanyProductListScreen.tsx
 * Uses useTheme()
 *
 * FIX:
 *  - explicitly resolve companyId from auth store and pass into
 *    useCompanyProducts (belt-and-suspenders with the hook fix)
 *  - navigate to the new CompanyProductDetails route name
 */
import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl, ActivityIndicator, StatusBar, ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { useCompanyProducts, useDeleteProduct, useUpdateProductStatus } from '../../hooks/useProducts';
import { CompanyProductCard } from '../../components/products/CompanyProductCard';
import { Product, ProductStatus } from '../../services/productService';
import { CompanyStackParamList } from '../../navigation/CompanyNavigator';
import { ProductCard } from '../../components/products/ProductCard';
import { useCompanyId } from '../../hooks/useCompanyId';
import { useIsCompanyOwner } from '../../hooks/useIsCompanyOwner';
type Props = NativeStackScreenProps<CompanyStackParamList, 'CompanyProductList'>;

type StatusFilter = 'all' | ProductStatus;

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all',          label: 'All'          },
  { key: 'active',       label: 'Active'       },
  { key: 'draft',        label: 'Draft'        },
  { key: 'out_of_stock', label: 'Out of Stock' },
  { key: 'inactive',     label: 'Inactive'     },
];

export const CompanyProductListScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, spacing } = useTheme();
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

const companyId = useCompanyId();
const isOwner = useIsCompanyOwner();

  const {
    data: companyProductsData, isLoading, refetch, isRefetching,
    fetchNextPage, hasNextPage, isFetchingNextPage,
  } = useCompanyProducts(companyId, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 20,
  });

  const deleteProduct = useDeleteProduct();
  const updateStatus  = useUpdateProductStatus();

  const allProducts: Product[] = React.useMemo(
    () => companyProductsData?.pages.flatMap(p => p.products) ?? [],
    [companyProductsData]
  );

  const totalCount = companyProductsData?.pages[0]?.pagination.total ?? 0;

  const handleToggleStatus = (product: Product) => {
    const nextStatus: ProductStatus = product.status === 'active' ? 'draft' : 'active';
    updateStatus.mutate({ id: product._id, status: nextStatus });
  };

  const EmptyState = () => (
    <View style={s.empty}>
      <Ionicons name="cube-outline" size={60} color={colors.textMuted} />
      <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No Products Yet</Text>
      <Text style={[s.emptyBody, { color: colors.textMuted }]}>Create your first product to start selling.</Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('CreateProduct')}
        style={[s.emptyBtn, { backgroundColor: colors.accent }]}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Create Product</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle="dark-content" />

      <View style={[s.header, { borderBottomColor: colors.borderPrimary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[s.headerTitle, { color: colors.textPrimary }]}>My Products</Text>
          {totalCount > 0 && <Text style={[s.headerSub, { color: colors.textMuted }]}>{totalCount} total</Text>}
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateProduct')}
          style={[s.addBtn, { backgroundColor: colors.accent }]}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Status tabs */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={[s.tabsScroll, { paddingHorizontal: spacing.xs }]}
      >
        {STATUS_TABS.map(tab => {
          const isActive = statusFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setStatusFilter(tab.key)}
              style={[s.tab, { backgroundColor: isActive ? colors.accent : colors.bgSurface, borderColor: isActive ? colors.accent : colors.borderPrimary }]}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#fff' : colors.textSecondary }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={allProducts}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: spacing.xs }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<EmptyState />}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.accent} style={{ paddingVertical: 20 }} /> : null}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('CompanyProductDetails', { productId: item._id, fromOwner: true })}
              onEdit={() => navigation.navigate('EditProduct', { productId: item._id })}
              onDelete={() => deleteProduct.mutate(item._id)}
              onToggleStatus={() => handleToggleStatus(item)}
              onMarkOutOfStock={() => updateStatus.mutate({ id: item._id, status: 'out_of_stock' })}
            />
          )}
        />
      )}

      <TouchableOpacity
        onPress={() => navigation.navigate('CreateProduct')}
        style={[s.fab, { backgroundColor: colors.accent }]}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  headerSub:   { fontSize: 11, marginTop: 1 },
  addBtn:      { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabsScroll:  { gap: 8, paddingVertical: 12 },
  tab:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  fab:         { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  empty:       { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle:  { fontSize: 18, fontWeight: '700' },
  emptyBody:   { fontSize: 13, textAlign: 'center', maxWidth: 240 },
  emptyBtn:    { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
});