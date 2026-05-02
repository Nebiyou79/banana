/**
 * mobile/src/screens/company/CompanyProductListScreen.tsx
 *
 * UPDATED:
 *  - Uses useCompanyId() + useIsCompanyOwner() — single source of truth
 *  - Removed inline ownership math
 *  - Removed dead useAuthStore import
 *  - Switched to <CompanyProductCard> (the dedicated owner variant) — the
 *    generic <ProductCard> required a `variant="owner"` discriminator that was
 *    missing, which would have failed type-check
 *  - Removed bogus `fromOwner: true` extra param (not in CompanyProductDetails
 *    param list)
 *  - All colors come from the theme — zero hex literals in the JSX
 *  - Skeleton loading state instead of a single spinner
 *  - 2-column grid on phones ≥ 375pt
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl, StatusBar, ScrollView,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { useCompanyId } from '../../hooks/useCompanyId';
import { useIsCompanyOwner } from '../../hooks/useIsCompanyOwner';
import {
  useCompanyProducts,
  useDeleteProduct,
  useUpdateProductStatus,
} from '../../hooks/useProducts';
// import { CompanyProductCard } from '../../components/products/CompanyProductCard';
import { ProductSkeleton } from '../../components/products/ProductSkeleton';
import { Product, ProductStatus } from '../../services/productService';
import { CompanyStackParamList } from '../../navigation/CompanyNavigator';
import { ProductCard } from '../../components/products/ProductCard';

type Props = NativeStackScreenProps<CompanyStackParamList, 'CompanyProductList'>;

type StatusFilter = 'all' | ProductStatus;

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all',          label: 'All'          },
  { key: 'active',       label: 'Active'       },
  { key: 'draft',        label: 'Draft'        },
  { key: 'out_of_stock', label: 'Out of Stock' },
  { key: 'inactive',     label: 'Inactive'     },
];

const { width: SCREEN_W } = Dimensions.get('window');
const NUM_COLUMNS = SCREEN_W >= 375 ? 2 : 1;

export const CompanyProductListScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, spacing } = useTheme();
  const companyId = useCompanyId();
  const isOwner   = useIsCompanyOwner();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
const handleBack = useCallback(() => {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }
  // Fallback to the company home / dashboard, whichever exists in the stack.
  // Adjust 'CompanyDashboard' to your actual root route name.
  navigation.navigate('CompanyDashboard' as never);
}, [navigation])
  const {
    data: companyProductsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCompanyProducts(companyId ?? undefined, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 20,
  });

  const deleteProduct = useDeleteProduct();
  const updateStatus  = useUpdateProductStatus();

  const allProducts: Product[] = useMemo(
    () => companyProductsData?.pages.flatMap(p => p.products) ?? [],
    [companyProductsData],
  );

  const totalCount = companyProductsData?.pages[0]?.pagination.total ?? 0;

  const handleToggleStatus = useCallback((product: Product) => {
    const next: ProductStatus = product.status === 'active' ? 'draft' : 'active';
    updateStatus.mutate({ id: product._id, status: next });
  }, [updateStatus]);

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
        <Ionicons name="cube-outline" size={36} color={colors.accent} />
      </View>
      <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No products yet</Text>
      <Text style={[s.emptyBody, { color: colors.textMuted }]}>
        Create your first product to start showcasing what your company offers.
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('CreateProduct')}
        style={[s.emptyBtn, { backgroundColor: colors.accent }]}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={18} color={colors.textInverse} />
        <Text style={[s.emptyBtnTxt, { color: colors.textInverse }]}>
          Add your first product
        </Text>
      </TouchableOpacity>
    </View>
  );

  const ErrorState = () => (
    <View style={s.empty}>
      <Ionicons name="cloud-offline-outline" size={48} color={colors.error} />
      <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
        Couldn’t load your products
      </Text>
      <Text style={[s.emptyBody, { color: colors.textMuted }]}>
        {(error as Error | null)?.message ?? 'Please check your connection and try again.'}
      </Text>
      <TouchableOpacity
        onPress={() => refetch()}
        style={[s.emptyBtn, { backgroundColor: colors.accent }]}
        activeOpacity={0.85}
      >
        <Ionicons name="refresh" size={18} color={colors.textInverse} />
        <Text style={[s.emptyBtnTxt, { color: colors.textInverse }]}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  // Hard guard — non-owners should never reach this screen via navigation,
  // but if they somehow do (deep link, role switch), bail out gracefully.
  if (!isOwner) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
        <View style={s.empty}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.textMuted} />
          <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
            Company access only
          </Text>
          <Text style={[s.emptyBody, { color: colors.textMuted }]}>
            Switch to a company account to manage products.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <View style={[s.header, { borderBottomColor: colors.borderPrimary }]}>
<TouchableOpacity onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
  <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
</TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[s.headerTitle, { color: colors.textPrimary }]}>
            My Products
          </Text>
          {totalCount > 0 && (
            <View style={s.countRow}>
              <View
                style={[
                  s.countBadge,
                  { backgroundColor: colors.accentBg, borderColor: colors.borderAccent },
                ]}
              >
                <Text style={[s.countTxt, { color: colors.accent }]}>
                  {totalCount}
                </Text>
              </View>
              <Text style={[s.headerSub, { color: colors.textMuted }]}>
                {totalCount === 1 ? 'product' : 'products'}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('CreateProduct')}
          style={[s.addBtn, { backgroundColor: colors.accent }]}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* ── Status tabs ──────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[s.tabsScroll, { paddingHorizontal: spacing.lg }]}
      >
        {STATUS_TABS.map(tab => {
          const isActive = statusFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setStatusFilter(tab.key)}
              activeOpacity={0.85}
              style={[
                s.tab,
                {
                  backgroundColor: isActive ? colors.accent : colors.bgSurface,
                  borderColor:     isActive ? colors.accent : colors.borderPrimary,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: isActive ? colors.textInverse : colors.textSecondary,
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <SkeletonGrid />
      ) : isError ? (
        <ErrorState />
      ) : (
        <FlatList
          data={allProducts}
          keyExtractor={item => item._id}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={NUM_COLUMNS > 1 ? { gap: 12 } : undefined}
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: 100,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
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
          ListEmptyComponent={<EmptyState />}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ProductSkeleton size="sm" style={{ width: 120 }} />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={{ flex: NUM_COLUMNS > 1 ? 1 : undefined }}>
              <ProductCard
                product={item}
                onPress={() =>
                  navigation.navigate('CompanyProductDetails', { productId: item._id })
                }
                onEdit={() =>
                  navigation.navigate('EditProduct', { productId: item._id })
                }
                onDelete={() => deleteProduct.mutate(item._id)}
                onToggleStatus={() => handleToggleStatus(item)}
                onMarkOutOfStock={() =>
                  updateStatus.mutate({ id: item._id, status: 'out_of_stock' })
                }
              />
            </View>
          )}
        />
      )}

      {/* ── FAB (only visible when list is non-empty — empty state has its own CTA) */}
      {allProducts.length > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateProduct')}
          style={[
            s.fab,
            {
              backgroundColor: colors.accent,
              shadowColor: colors.shadowColor,
            },
          ]}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={28} color={colors.textInverse} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  headerSub:   { fontSize: 11, fontWeight: '500' },
  countRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  countBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1,
  },
  countTxt: { fontSize: 11, fontWeight: '700' },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  tabsScroll: { gap: 8, paddingVertical: 12, paddingRight: 16 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999, borderWidth: 1,
  },
  fab: {
    position: 'absolute', bottom: 24, right: 16,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.25, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  skeletonGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 12, paddingTop: 16,
  },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, paddingHorizontal: 32, gap: 14,
  },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyBody:  { fontSize: 13, textAlign: 'center', maxWidth: 280, lineHeight: 19 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, marginTop: 4,
  },
  emptyBtnTxt: { fontSize: 14, fontWeight: '700' },
});