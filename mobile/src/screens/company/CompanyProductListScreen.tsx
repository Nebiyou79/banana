/**
 * src/screens/company/CompanyProductListScreen.tsx
 *
 * Fixes applied vs. previous version:
 *  - Status filter tabs: added explicit `height: 34` so they never balloon
 *    into tall pill capsules (the bug visible in the screenshot).
 *  - FAB repositioned with correct `bottom` accounting for safe-area insets
 *    so it never sits on top of list content.
 *  - SafeAreaView uses edges={['top']} only; list padding handles the bottom.
 *  - Header uses proper back-button with 44×44 hit target.
 *  - Skeleton grid uses `flex: 1` per-item inside a proper FlatList-style row.
 *  - StatusBar style driven by theme.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  StatusBar,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { useCompanyId } from '../../hooks/useCompanyId';
import { useIsCompanyOwner } from '../../hooks/useIsCompanyOwner';
import {
  useCompanyProducts,
  useDeleteProduct,
  useUpdateProductStatus,
} from '../../hooks/useProducts';
import { ProductSkeleton } from '../../components/products/ProductSkeleton';
import { Product, ProductStatus } from '../../services/productService';
import { ProductCard } from '../../components/products/ProductCard';
import { FONT_SIZE } from '../../theme/tokens';

type Props = { navigation: any; route?: any };
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

// ── Tab pill — fixed height so it can never balloon vertically ────────────────
const TAB_H = 34; // px — the critical fix

export const CompanyProductListScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark, spacing } = useTheme();
  const insets    = useSafeAreaInsets();
  const companyId = useCompanyId();
  const isOwner   = useIsCompanyOwner();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

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

  const handleToggleStatus = useCallback(
    (product: Product) => {
      const next: ProductStatus = product.status === 'active' ? 'draft' : 'active';
      updateStatus.mutate({ id: product._id, status: next });
    },
    [updateStatus],
  );

  // ── Not-owner guard ───────────────────────────────────────────────────────
  if (!isOwner) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={s.centered}>
          <View style={[s.iconRing, { borderColor: colors.border, backgroundColor: colors.bgCard }]}>
            <Ionicons name="lock-closed-outline" size={32} color={colors.textMuted} />
          </View>
          <Text style={[s.emptyTitle, { color: colors.text }]}>Company access only</Text>
          <Text style={[s.emptyBody, { color: colors.textMuted }]}>
            Switch to a company account to manage products.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Empty / error states ──────────────────────────────────────────────────
  const EmptyState = () => (
    <View style={s.centered}>
      <View style={[s.iconRing, { borderColor: `${colors.primary}40`, backgroundColor: `${colors.primary}12` }]}>
        <Ionicons name="cube-outline" size={32} color={colors.primary} />
      </View>
      <Text style={[s.emptyTitle, { color: colors.text }]}>No products yet</Text>
      <Text style={[s.emptyBody, { color: colors.textMuted }]}>
        Create your first product to showcase what your company offers.
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('CreateProduct')}
        style={[s.emptyBtn, { backgroundColor: colors.primary }]}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={16} color={colors.textInverse} />
        <Text style={[s.emptyBtnTxt, { color: colors.textInverse }]}>
          Add first product
        </Text>
      </TouchableOpacity>
    </View>
  );

  const ErrorState = () => (
    <View style={s.centered}>
      <View style={[s.iconRing, { borderColor: `${colors.danger}40`, backgroundColor: `${colors.danger}12` }]}>
        <Ionicons name="cloud-offline-outline" size={32} color={colors.danger} />
      </View>
      <Text style={[s.emptyTitle, { color: colors.text }]}>Couldn't load products</Text>
      <Text style={[s.emptyBody, { color: colors.textMuted }]}>
        {(error as Error | null)?.message ?? 'Check your connection and try again.'}
      </Text>
      <TouchableOpacity
        onPress={() => refetch()}
        style={[s.emptyBtn, { backgroundColor: colors.primary }]}
        activeOpacity={0.85}
      >
        <Ionicons name="refresh" size={16} color={colors.textInverse} />
        <Text style={[s.emptyBtnTxt, { color: colors.textInverse }]}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  // FAB needs enough clearance above the system nav bar
  const fabBottom = insets.bottom + 16;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[s.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        {/* Back button — always present so layout is symmetric */}
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : null)}
          style={s.headerBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        {/* Title + count */}
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: colors.text }]} numberOfLines={1}>
            My Products
          </Text>
          {totalCount > 0 && (
            <View style={s.countRow}>
              <View style={[s.countBadge, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}35` }]}>
                <Text style={[s.countNum, { color: colors.primary }]}>{totalCount}</Text>
              </View>
              <Text style={[s.countLabel, { color: colors.textMuted }]}>
                {totalCount === 1 ? 'product' : 'products'}
              </Text>
            </View>
          )}
        </View>

        {/* Add button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateProduct')}
          style={[s.addBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Ionicons name="add" size={20} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* ── Filter tabs ─────────────────────────────────────────────────────
           KEY FIX: each tab has an explicit fixed height (TAB_H = 34).
           Without this, FlexBox can stretch pills to fill the ScrollView
           cross-axis, producing the giant-tab bug in the screenshot.        */}
      <View style={[s.tabsBar, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabsContent}
          bounces={false}
        >
          {STATUS_TABS.map(tab => {
            const active = statusFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setStatusFilter(tab.key)}
                activeOpacity={0.75}
                style={[
                  s.tab,
                  {
                    height: TAB_H,                      // ← the fix
                    backgroundColor: active ? colors.primary       : colors.bg,
                    borderColor:     active ? colors.primary       : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    s.tabLabel,
                    { color: active ? colors.textInverse : colors.textMuted },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      {isLoading ? (
        /* Skeleton grid — two columns, fixed widths */
        <ScrollView contentContainerStyle={[s.skeletonWrap, { padding: spacing.md ?? 16 }]}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View
              key={`sk-${i}`}
              style={{
                width: NUM_COLUMNS === 2 ? (SCREEN_W - 48) / 2 : SCREEN_W - 32,
              }}
            >
              <ProductSkeleton size="md" />
            </View>
          ))}
        </ScrollView>
      ) : isError ? (
        <ErrorState />
      ) : (
        <FlashList
          data={allProducts}
          keyExtractor={item => item._id}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={{
            padding: 16,
            // Extra bottom padding so the FAB never overlaps the last card
            paddingBottom: fabBottom + 72,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
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
            <View style={{ flex: NUM_COLUMNS > 1 ? 1 : undefined, margin: 4 }}>
              <ProductCard
                product={item}
                onPress={() =>
                  navigation.navigate('CompanyProductDetails', { productId: item._id })
                }
                onEdit={() => navigation.navigate('EditProduct', { productId: item._id })}
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

      {/* ── FAB — only when there are products, never overlapping content ── */}
      {allProducts.length > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateProduct')}
          style={[
            s.fab,
            {
              backgroundColor: colors.primary,
              bottom: fabBottom,
              shadowColor: colors.primary,
            },
          ]}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={26} color={colors.textInverse} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 60,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg ?? 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: 1,
  },
  countNum: {
    fontSize: 11,
    fontWeight: '800',
  },
  countLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter tabs strip
  tabsBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',       // ← keeps pills vertically centered in the row
    flexDirection: 'row',
  },
  tab: {
    // height is set inline (TAB_H) — keeps pills compact
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  // Grid skeleton
  skeletonWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // Empty / error
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
    paddingTop: 40,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.md ?? 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyBody: {
    fontSize: FONT_SIZE.sm ?? 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 270,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 4,
  },
  emptyBtnTxt: {
    fontSize: FONT_SIZE.base ?? 14,
    fontWeight: '700',
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow (iOS)
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    // Shadow (Android)
    elevation: 8,
  },
});