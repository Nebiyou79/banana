/**
 * mobile/src/screens/company/CompanyProductListScreen.tsx  (FIXED v5)
 *
 * THE ACTUAL ROOT CAUSE (confirmed by all debug sessions):
 * ─────────────────────────────────────────────────────────
 * useCurrentUser() — the hook that calls /auth/me and populates the user
 * object in the authStore — was never mounted in this screen or its parents
 * (at least not before this screen renders). So:
 *
 *   1. App boots → hydrateFromStorage() restores token, sets isLoading: true
 *   2. CompanyProductListScreen mounts
 *   3. isLoading: true → showAuthSpinner: true → spinner shows
 *   4. useCurrentUser() never fires → setUser() never called → isLoading NEVER
 *      flips to false → spinner shows forever
 *
 * Backend logs confirm the user IS authenticated (other endpoints return 200/304).
 * The company IS found (69cd1eabf6bca443da4ff68c). The problem is purely that
 * the auth store's user object is never populated in this screen's render cycle.
 *
 * FIX: call useCurrentUser() directly in this screen.
 * React Query deduplicates — if it's already mounted in a parent provider,
 * this is a no-op (returns cached data). If it's not mounted, this ensures
 * /auth/me is called and setUser() fires, which sets isLoading:false.
 *
 * Also uses isLoading===false as the isReady signal (v7 of useCompanyId),
 * eliminating any dependency on isHydrated which may or may not exist.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { useCompanyId } from '../../hooks/useCompanyId';
import { useIsCompanyOwner } from '../../hooks/useIsCompanyOwner';
import { useAuthStore } from '../../store/authStore';
import { useCurrentUser } from '../../hooks/useAuth';   // ← THE KEY FIX
import {
  useCompanyProducts,
  useDeleteProduct,
  useUpdateProductStatus,
} from '../../hooks/useProducts';
import { ProductSkeleton } from '../../components/products/ProductSkeleton';
import { Product, ProductStatus } from '../../services/productService';
import { ProductCard } from '../../components/products/ProductCard';
import { FONT_SIZE } from '../../theme/tokens';
import {
  ProductDebugPanel,
  debugRenderState,
  debugQueryState,
} from '../../utils/productDebug';

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
const NUM_COLUMNS         = SCREEN_W >= 375 ? 2 : 1;
const CARD_WIDTH          = (SCREEN_W - 32 - 8) / NUM_COLUMNS;
const ESTIMATED_ITEM_SIZE = CARD_WIDTH * (3 / 4) + 100;

export const CompanyProductListScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  // ── KEY FIX: ensure /auth/me is called so user gets populated ────────────
  // React Query deduplicates this — safe to call even if already mounted upstream.
  useCurrentUser();

  // ── Auth + ownership ──────────────────────────────────────────────────────
  const { companyId, isReady: authReady, isAuthenticated } = useCompanyId(true);
  const { isOwner, isReady } = useIsCompanyOwner(true);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const {
    data: companyProductsData,
    status,
    fetchStatus,
    isLoading,
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    dataUpdatedAt,
  } = useCompanyProducts(companyId ?? undefined, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 20,
  });

  const allProducts: Product[] = useMemo(
    () => companyProductsData?.pages.flatMap((p) => p.products) ?? [],
    [companyProductsData],
  );

  const totalCount = companyProductsData?.pages[0]?.pagination?.total ?? 0;

  const deleteProduct = useDeleteProduct();
  const updateStatus  = useUpdateProductStatus();

  const handleToggleStatus = useCallback((product: Product) => {
    const next: ProductStatus = product.status === 'active' ? 'draft' : 'active';
    updateStatus.mutate({ id: product._id, status: next });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Display state ─────────────────────────────────────────────────────────
  const showAuthSpinner = !isReady;
  const showDataSpinner = isReady && isOwner && !!companyId && (isLoading || isPending);

  if (__DEV__) {
    debugQueryState('CompanyProductListScreen', {
      status, fetchStatus, isLoading, isPending,
      isError, error, data: companyProductsData, dataUpdatedAt,
    });
    debugRenderState({
      showAuthSpinner, showDataSpinner, isOwner,
      isError, productCount: allProducts.length, statusFilter,
    });
  }

  // ── 1. Waiting for auth + user fetch to settle ────────────────────────────
  if (showAuthSpinner) {
    return (
      <View style={[s.safe, { backgroundColor: colors.bg }]}>
        {__DEV__ && <ProductDebugPanel companyId={companyId} authReady={authReady} isOwner={isOwner}
          queryResult={{ status, fetchStatus, isError, error, data: companyProductsData }} statusFilter={statusFilter} />}
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          {__DEV__ && (
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 8, textAlign: 'center' }}>
              DEV: waiting for auth hydration…{'\n'}
              isReady={String(isReady)} isAuthenticated={String(isAuthenticated)}{'\n'}
              user={user ? user.role : 'null'}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // ── 2. Hydrated but not logged in ─────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View style={[s.safe, { backgroundColor: colors.bg }]}>
        {__DEV__ && <ProductDebugPanel companyId={companyId} authReady={authReady} isOwner={isOwner}
          queryResult={{ status, fetchStatus, isError, error, data: companyProductsData }} statusFilter={statusFilter} />}
        <View style={s.centered}>
          <View style={[s.iconRing, { borderColor: `${colors.primary}40`, backgroundColor: `${colors.primary}12` }]}>
            <Ionicons name="person-outline" size={32} color={colors.primary} />
          </View>
          <Text style={[s.emptyTitle, { color: colors.text }]}>Sign in to continue</Text>
          <Text style={[s.emptyBody, { color: colors.textMuted }]}>
            Please log in to manage your company's products.
          </Text>
        </View>
      </View>
    );
  }

  // ── 3. Logged in, not a company account ───────────────────────────────────
  if (!isOwner) {
    return (
      <View style={[s.safe, { backgroundColor: colors.bg }]}>
        {__DEV__ && <ProductDebugPanel companyId={companyId} authReady={authReady} isOwner={isOwner}
          queryResult={{ status, fetchStatus, isError, error, data: companyProductsData }} statusFilter={statusFilter} />}
        <View style={s.centered}>
          <View style={[s.iconRing, { borderColor: colors.border, backgroundColor: colors.bgCard }]}>
            <Ionicons name="lock-closed-outline" size={32} color={colors.textMuted} />
          </View>
          <Text style={[s.emptyTitle, { color: colors.text }]}>Company access only</Text>
          <Text style={[s.emptyBody, { color: colors.textMuted }]}>
            Switch to a company account to manage products.
          </Text>
          {__DEV__ && (
            <Text style={{ color: '#ff6b6b', fontSize: 11, marginTop: 8, textAlign: 'center' }}>
              DEV: isOwner=false · user.role={user?.role ?? 'null'} · companyId={companyId ?? 'null'}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // ── 4. Loading first page of products ─────────────────────────────────────
  if (showDataSpinner) {
    return (
      <View style={[s.safe, { backgroundColor: colors.bg }]}>
        {__DEV__ && <ProductDebugPanel companyId={companyId} authReady={authReady} isOwner={isOwner}
          queryResult={{ status, fetchStatus, isError, error, data: companyProductsData }} statusFilter={statusFilter} />}
        <InScreenHeader totalCount={0} colors={colors} onAddPress={() => navigation.navigate('CreateProduct')} />
        <FilterTabBar statusFilter={statusFilter} onFilterChange={setStatusFilter} colors={colors} />
        <View style={s.skeletonWrap}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={`sk-${i}`} style={{ width: CARD_WIDTH }}>
              <ProductSkeleton size="md" />
            </View>
          ))}
        </View>
      </View>
    );
  }

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
        <Text style={[s.emptyBtnTxt, { color: colors.textInverse }]}>Add first product</Text>
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

  const fabBottom = insets.bottom + 16;

  // ── 5. Main render ────────────────────────────────────────────────────────
  return (
    <View style={[s.safe, { backgroundColor: colors.bg }]}>
      {__DEV__ && <ProductDebugPanel companyId={companyId} authReady={authReady} isOwner={isOwner}
        queryResult={{ status, fetchStatus, isError, error, data: companyProductsData }} statusFilter={statusFilter} />}

      <InScreenHeader totalCount={totalCount} colors={colors} onAddPress={() => navigation.navigate('CreateProduct')} />
      <FilterTabBar statusFilter={statusFilter} onFilterChange={setStatusFilter} colors={colors} />

      {isError ? (
        <ErrorState />
      ) : (
        <FlashList
          data={allProducts}
          keyExtractor={(item) => item._id}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={{ padding: 16, paddingBottom: fabBottom + 80 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<EmptyState />}
          ListFooterComponent={
            isFetchingNextPage
              ? <View style={{ paddingVertical: 20, alignItems: 'center' }}><ActivityIndicator color={colors.primary} /></View>
              : null
          }
          renderItem={({ item }) => (
            <View style={{ flex: NUM_COLUMNS > 1 ? 1 : undefined, margin: 4 }}>
              <ProductCard
                variant="owner"
                product={item}
                onPress={() => navigation.navigate('CompanyProductDetails', { productId: item._id })}
                onEdit={() => navigation.navigate('EditProduct', { productId: item._id })}
                onDelete={() => deleteProduct.mutate(item._id)}
                onToggleStatus={() => handleToggleStatus(item)}
                onMarkOutOfStock={() => updateStatus.mutate({ id: item._id, status: 'out_of_stock' })}
              />
            </View>
          )}
        />
      )}

      {allProducts.length > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateProduct')}
          style={[s.fab, { backgroundColor: colors.primary, bottom: fabBottom, shadowColor: colors.primary }]}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={26} color={colors.textInverse} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const InScreenHeader: React.FC<{ totalCount: number; colors: any; onAddPress: () => void }> = ({
  totalCount, colors, onAddPress,
}) => (
  <View style={[s.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
    <View style={s.headerCenter}>
      <Text style={[s.headerTitle, { color: colors.text }]}>My Products</Text>
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
    <TouchableOpacity
      onPress={onAddPress}
      style={[s.addBtn, { backgroundColor: colors.primary }]}
      activeOpacity={0.85}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      <Ionicons name="add" size={20} color={colors.textInverse} />
    </TouchableOpacity>
  </View>
);

const FilterTabBar: React.FC<{ statusFilter: StatusFilter; onFilterChange: (f: StatusFilter) => void; colors: any }> = ({
  statusFilter, onFilterChange, colors,
}) => (
  <View style={[s.tabsBar, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsContent} bounces={false}>
      {STATUS_TABS.map((tab) => {
        const active = statusFilter === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onFilterChange(tab.key)}
            activeOpacity={0.75}
            style={[s.tab, {
              height: 34,
              backgroundColor: active ? colors.primary : colors.bgCard,
              borderColor:     active ? colors.primary : colors.border,
            }]}
          >
            <Text style={[s.tabLabel, { color: active ? colors.textInverse : colors.textMuted }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:         { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 56 },
  headerCenter: { flex: 1 },
  headerTitle:  { fontSize: FONT_SIZE.lg ?? 18, fontWeight: '700', letterSpacing: -0.3 },
  countRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  countBadge:   { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 999, borderWidth: 1 },
  countNum:     { fontSize: 11, fontWeight: '800' },
  countLabel:   { fontSize: 12, fontWeight: '500' },
  addBtn:       { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabsBar:      { borderBottomWidth: StyleSheet.hairlineWidth },
  tabsContent:  { paddingHorizontal: 12, paddingVertical: 10, gap: 8, alignItems: 'center', flexDirection: 'row' },
  tab:          { paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel:     { fontSize: 13, fontWeight: '700', letterSpacing: 0.1 },
  skeletonWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16 },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12, paddingTop: 40 },
  iconRing:     { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  emptyTitle:   { fontSize: FONT_SIZE.md ?? 16, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  emptyBody:    { fontSize: FONT_SIZE.sm ?? 13, textAlign: 'center', lineHeight: 20, maxWidth: 270 },
  emptyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12, marginTop: 4 },
  emptyBtnTxt:  { fontSize: FONT_SIZE.base ?? 14, fontWeight: '700' },
  fab:          { position: 'absolute', right: 18, width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
});