/**
 * mobile/src/screens/company/ComapnyProductDetailsScreen.tsx
 * Owner product detail — full management actions.
 * Uses useTheme() hook.
 *
 * FIXES:
 *  - route param type now 'CompanyProductDetails'
 *  - isOwner guard on every owner-only action (bottom bar, action sheet)
 *  - Related list uses a plain horizontal ScrollView instead of a FlatList
 *    inside a ScrollView (removes the "VirtualizedLists should never be
 *    nested … keyExtractor" warning)
 *  - Related cards navigate owner-vs-public based on actual ownership
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, StatusBar,
  Alert, ActionSheetIOS, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { useProduct, useRelatedProducts, useDeleteProduct, useUpdateProductStatus } from '../../hooks/useProducts';
import { ProductImageGallery } from '../../components/products/ProductImageGallery';
import { ProductCard } from '../../components/products/ProductCard';
import { formatPrice, getStockStatus, getStockBadgeConfig, getProductStatusConfig } from '../../utils/productHelpers';
import { ProductStatus } from '../../services/productService';
import { CompanyStackParamList } from '../../navigation/CompanyNavigator';

type Props = NativeStackScreenProps<CompanyStackParamList, 'CompanyProductDetails'>;

export const CompanyProductDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params;
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();

  const [descExpanded, setDescExpanded] = useState(false);

  const { data: product, isLoading }    = useProduct(productId);
  const { data: related = [] }           = useRelatedProducts(productId);
  const { mutate: deleteProduct, isPending: deleteLoading } = useDeleteProduct();
  const { mutate: updateStatus, isPending: statusLoading }  = useUpdateProductStatus();

  // ── Ownership check ────────────────────────────────────────────────────────
  const currentCompanyId =
    (typeof user?.company === 'string' ? user.company : user?.company?._id) ?? user?._id;

  const productOwnerId =
    product && (typeof product.companyId === 'object' ? product.companyId?._id : product.companyId);

  const isOwner =
    !!user &&
    (user.role === 'admin' ||
      (user.role === 'company' &&
        !!productOwnerId &&
        !!currentCompanyId &&
        productOwnerId === currentCompanyId));

  const handleOwnerActions = useCallback(() => {
    if (!product || !isOwner) return;
    const isActive = product.status === 'active';
    const isOOS    = product.status === 'out_of_stock';

    const options = [
      'Edit Product',
      isActive ? 'Set as Draft' : 'Set as Active',
      isOOS    ? 'Set as Active' : 'Mark Out of Stock',
      'Delete Product',
      'Cancel',
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: 3, cancelButtonIndex: 4 },
        idx => {
          if (idx === 0) navigation.navigate('EditProduct', { productId });
          else if (idx === 1) updateStatus({ id: productId, status: isActive ? 'draft' : 'active' });
          else if (idx === 2) updateStatus({ id: productId, status: isOOS ? 'active' : 'out_of_stock' as ProductStatus });
          else if (idx === 3) deleteProduct(productId, { onSuccess: () => navigation.goBack() });
        }
      );
    } else {
      Alert.alert('Product Actions', 'Choose an action', [
        { text: 'Edit Product', onPress: () => navigation.navigate('EditProduct', { productId }) },
        { text: isActive ? 'Set as Draft' : 'Set as Active', onPress: () => updateStatus({ id: productId, status: isActive ? 'draft' : 'active' }) },
        { text: isOOS ? 'Set as Active' : 'Mark Out of Stock', onPress: () => updateStatus({ id: productId, status: isOOS ? 'active' : 'out_of_stock' as ProductStatus }) },
        { text: 'Delete Product', style: 'destructive', onPress: () => deleteProduct(productId, { onSuccess: () => navigation.goBack() }) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [product, isOwner, productId, navigation, updateStatus, deleteProduct]);

  if (isLoading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator color={colors.accent} style={{ marginTop: 80 }} size="large" />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
        <View style={s.notFound}>
          <Ionicons name="alert-circle-outline" size={56} color={colors.textMuted} />
          <Text style={[s.notFoundTxt, { color: colors.textPrimary }]}>Product not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.accent, fontWeight: '600' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const priceNum   = product.price?.amount ?? (product.price as unknown as number);
  const currency   = product.price?.currency ?? 'USD';
  const stockStat  = getStockStatus(product.inventory);
  const stockCfg   = getStockBadgeConfig(stockStat);
  const statusCfg  = getProductStatusConfig(product.status);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Navbar */}
      <View style={[s.navbar, { backgroundColor: colors.bgSurface, borderBottomColor: colors.borderPrimary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.navBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.navTitle, { color: colors.textPrimary }]} numberOfLines={1}>{product.name}</Text>
        {isOwner ? (
          <TouchableOpacity onPress={handleOwnerActions} style={s.navBtn}>
            <Ionicons name="ellipsis-vertical" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={s.navBtn} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <ProductImageGallery images={product.images ?? []} height={300} />

        {/* Status banner for non-active products */}
        {product.status !== 'active' && (
          <View style={[s.statusBanner, { backgroundColor: `${statusCfg.color}14` }]}>
            <Ionicons name="warning-outline" size={15} color={statusCfg.color} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: statusCfg.color }}>
              Status: {statusCfg.label} — not visible to the public
            </Text>
          </View>
        )}

        <View style={{ padding: 16, gap: 14 }}>
          {/* Price + stock */}
          <View style={s.priceRow}>
            <Text style={[s.price, { color: colors.accent }]}>{formatPrice(priceNum, currency)}</Text>
            <View style={[s.stockBadge, { backgroundColor: stockCfg.background }]}>
              <View style={[s.stockDot, { backgroundColor: stockCfg.color }]} />
              <Text style={[s.stockTxt, { color: stockCfg.color }]}>{stockCfg.label}</Text>
            </View>
          </View>

          {/* Name + featured */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Text style={[s.name, { color: colors.textPrimary, flex: 1 }]}>{product.name}</Text>
            {product.featured && (
              <View style={[s.featuredBadge, { backgroundColor: '#FBBF2420' }]}>
                <Ionicons name="star" size={12} color="#FBBF24" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#FBBF24' }}>Featured</Text>
              </View>
            )}
          </View>

          {/* Category */}
          {product.category && (
            <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>
              <View style={[s.catPill, { backgroundColor: colors.inputBg, borderColor: colors.borderPrimary }]}>
                <Ionicons name="folder-outline" size={11} color={colors.textMuted} />
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>{product.category}</Text>
              </View>
              {product.subcategory && (
                <View style={[s.catPill, { backgroundColor: colors.inputBg, borderColor: colors.borderPrimary }]}>
                  <Ionicons name="pricetag-outline" size={11} color={colors.textMuted} />
                  <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>{product.subcategory}</Text>
                </View>
              )}
            </View>
          )}

          {/* Stats */}
          <View style={[s.statsRow, { backgroundColor: colors.bgSurface, borderColor: colors.borderPrimary }]}>
            <Stat icon="eye-outline" label="Views" value={String(product.views ?? 0)} colors={colors} />
            <View style={[s.statDivider, { backgroundColor: colors.borderPrimary }]} />
            <Stat icon="cube-outline" label="In Stock" value={product.inventory?.trackQuantity ? String(product.inventory.quantity) : '∞'} colors={colors} />
            <View style={[s.statDivider, { backgroundColor: colors.borderPrimary }]} />
            <Stat icon="pricetag-outline" label="SKU" value={product.sku || 'N/A'} colors={colors} />
          </View>

          {/* Description */}
          {product.description && (
            <View>
              <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Description</Text>
              <Text style={[s.bodyTxt, { color: colors.textSecondary }]} numberOfLines={descExpanded ? undefined : 4}>
                {product.description}
              </Text>
              {product.description.length > 180 && (
                <TouchableOpacity onPress={() => setDescExpanded(v => !v)}>
                  <Text style={[s.showMore, { color: colors.accent }]}>{descExpanded ? 'Show less' : 'Show more'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Specifications */}
          {!!product.specifications?.length && (
            <View>
              <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Specifications</Text>
              <View style={[s.specsTable, { borderColor: colors.borderPrimary, overflow: 'hidden' }]}>
                {product.specifications.map((spec, i) => (
                  <View
                    key={i}
                    style={[
                      s.specRow,
                      {
                        backgroundColor: i % 2 === 0 ? colors.bgSurface : colors.bgPrimary,
                        borderTopColor: colors.borderPrimary,
                        borderTopWidth: i === 0 ? 0 : 1,
                      },
                    ]}
                  >
                    <Text style={[s.specKey, { color: colors.textSecondary }]}>{spec.key}</Text>
                    <Text style={[s.specVal, { color: colors.textPrimary }]}>{spec.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tags */}
          {product.tags?.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {product.tags.map(tag => (
                <View key={tag} style={[s.tag, { backgroundColor: colors.inputBg, borderColor: colors.borderPrimary }]}>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Related — plain horizontal ScrollView avoids nested-VirtualizedList warning */}
          {related.length > 0 && (
            <View>
              <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Related Products</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
              >
                {related.map(item => {
                  const relatedOwnerId =
                    typeof item.companyId === 'object' ? item.companyId?._id : item.companyId;
                  const relatedIsOwn =
                    !!currentCompanyId && !!relatedOwnerId && relatedOwnerId === currentCompanyId;

                  if (relatedIsOwn) {
                    return (
                      <ProductCard
                        key={item._id}
                        variant="owner"
                        product={item}
                        onPress={() => navigation.replace('CompanyProductDetails', { productId: item._id })}
                        onEdit={() => navigation.navigate('EditProduct', { productId: item._id })}
                        onDelete={() => deleteProduct(item._id)}
                        onToggleStatus={() =>
                          updateStatus({ id: item._id, status: item.status === 'active' ? 'draft' : 'active' })
                        }
                        size="sm"
                        style={{ width: 160 }}
                      />
                    );
                  }

                  return (
                    <ProductCard
                      key={item._id}
                      variant="public"
                      product={item}
                      onPress={() => navigation.navigate('CompanyProductDetails', { productId: item._id })}
                      size="sm"
                      style={{ width: 160 }}
                    />
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom action bar — owner only */}
      {isOwner && (
        <View style={[s.bottomBar, { backgroundColor: colors.bgSurface, borderTopColor: colors.borderPrimary }]}>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditProduct', { productId })}
            style={[s.actionBtn, { borderColor: colors.accent }]}
          >
            <Ionicons name="create-outline" size={18} color={colors.accent} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.accent }}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => updateStatus({ id: productId, status: product.status === 'active' ? 'draft' : 'active' })}
            disabled={statusLoading}
            style={[s.actionBtn, { borderColor: product.status === 'active' ? colors.error : '#22C55E' }]}
          >
            {statusLoading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <>
                <Ionicons
                  name={product.status === 'active' ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={product.status === 'active' ? colors.error : '#22C55E'}
                />
                <Text style={{ fontSize: 13, fontWeight: '700', color: product.status === 'active' ? colors.error : '#22C55E' }}>
                  {product.status === 'active' ? 'Unpublish' : 'Publish'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => deleteProduct(productId, { onSuccess: () => navigation.goBack() })}
            disabled={deleteLoading}
            style={[s.deleteBtn, { backgroundColor: colors.error }]}
          >
            {deleteLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Delete</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const Stat: React.FC<{ icon: string; label: string; value: string; colors: Record<string, string> }> = ({ icon, label, value, colors }) => (
  <View style={{ flex: 1, alignItems: 'center', gap: 3 }}>
    <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={16} color={colors.textMuted} />
    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{value}</Text>
    <Text style={{ fontSize: 10, color: colors.textMuted }}>{label}</Text>
  </View>
);

const s = StyleSheet.create({
  safe:         { flex: 1 },
  navbar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 8, borderBottomWidth: 1 },
  navBtn:       { padding: 10, width: 44, alignItems: 'center' },
  navTitle:     { flex: 1, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  notFound:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  notFoundTxt:  { fontSize: 17, fontWeight: '600' },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  priceRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price:        { fontSize: 24, fontWeight: '800' },
  stockBadge:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  stockDot:     { width: 6, height: 6, borderRadius: 3 },
  stockTxt:     { fontSize: 12, fontWeight: '600' },
  name:         { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  featuredBadge:{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  catPill:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  statsRow:     { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statDivider:  { width: 1, height: 32, marginHorizontal: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  bodyTxt:      { fontSize: 14, lineHeight: 22 },
  showMore:     { fontSize: 13, fontWeight: '600', marginTop: 4 },
  specsTable:   { borderWidth: 1, borderRadius: 10 },
  specRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  specKey:      { fontSize: 13 },
  specVal:      { fontSize: 13, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  tag:          { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  bottomBar:    { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, gap: 8 },
  actionBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 5, borderWidth: 1.5, borderRadius: 12 },
  deleteBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 5, borderRadius: 12 },
});