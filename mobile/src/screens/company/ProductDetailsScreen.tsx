/**
 * mobile/src/screens/products/ProductDetailsScreen.tsx  (UPDATED)
 *
 * Unified product detail screen used by ALL roles.
 * Owner detection: compares user.company._id === product.companyId._id
 *
 * PUBLIC view  → scrollable gallery, full info, "Contact Seller" CTA
 * OWNER view   → same layout + Edit / Delete / Status-change action bar at bottom
 *
 * Route param: { productId: string; fromOwner?: boolean }
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Linking,
  ActivityIndicator,
  StatusBar,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import {
  useProduct,
  useRelatedProducts,
  useDeleteProduct,
  useUpdateProductStatus,
} from '../../hooks/useProducts';
import { ProductImageGallery } from '../../components/products/ProductImageGallery';
import { ProductCard } from '../../components/products/ProductCard';
import { formatPrice, getStockStatus, getStockBadgeConfig } from '../../utils/productHelpers';

// ─── Navigation type ──────────────────────────────────────────────────────────

export type ProductsStackParamList = {
  ProductMarketplace: undefined;
  ProductDetails:     { productId: string; fromOwner?: boolean };
  CreateProduct:      undefined;
  EditProduct:        { productId: string };
};

type Props = NativeStackScreenProps<ProductsStackParamList, 'ProductDetails'>;

const SHOW_MORE_LINES = 4;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isOwner(product: any, user: any): boolean {
  if (!user || !product) return false;
  if (user.role !== 'company') return false;

  const productCompanyId =
    typeof product.companyId === 'object'
      ? product.companyId?._id?.toString()
      : product.companyId?.toString();

  const userCompanyId = (
    user.company?._id ?? user.company?.id ?? (user as any).companyId
  )?.toString();

  return !!productCompanyId && !!userCompanyId && productCompanyId === userCompanyId;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const ProductDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params;
  const { theme } = useThemeStore();
  const { colors, spacing, borderRadius, shadows } = theme;
  const { user } = useAuthStore();

  const [descExpanded, setDescExpanded] = useState(false);

  const { data: product, isLoading } = useProduct(productId);
  const { data: relatedProducts } = useRelatedProducts(productId);
  const { mutate: deleteProduct, isPending: deleteLoading } = useDeleteProduct();
  const { mutate: updateStatus, isPending: statusLoading } = useUpdateProductStatus();

  const ownerView = product ? isOwner(product, user) : false;
  const company = typeof product?.companyId === 'object' ? product.companyId : null;

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} size="large" />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={56} color={colors.textMuted} />
          <Text style={[styles.notFoundText, { color: colors.text }]}>Product not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const priceNum = (product as any).price?.amount ?? product.price;
  const currency = (product as any).price?.currency ?? product.currency ?? 'USD';
  const stockStatus = getStockStatus(product.inventory);
  const stockConfig = getStockBadgeConfig(stockStatus);
  const hasSpecs = product.specifications && product.specifications.length > 0;
  const hasTags = product.tags && product.tags.length > 0;

  // ── Owner actions ──────────────────────────────────────────────────────────

  const handleOwnerActions = useCallback(() => {
    const isActive = product.status === 'active';
    const isDraft = product.status === 'draft';

    const options = [
      'Edit Product',
      isActive ? 'Set as Draft' : 'Set as Active',
      product.status !== 'out_of_stock' ? 'Mark Out of Stock' : 'Set as Active',
      'Delete Product',
      'Cancel',
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: 3, cancelButtonIndex: 4 },
        (idx) => {
          if (idx === 0) navigation.navigate('EditProduct', { productId });
          else if (idx === 1) updateStatus({ id: productId, status: isActive ? 'draft' : 'active' });
          else if (idx === 2)
            updateStatus({
              id: productId,
              status: product.status !== 'out_of_stock' ? 'out_of_stock' : 'active',
            } as any);
          else if (idx === 3) deleteProduct(productId, { onSuccess: () => navigation.goBack() });
        },
      );
    } else {
      Alert.alert('Product Actions', 'Choose an action', [
        { text: 'Edit Product', onPress: () => navigation.navigate('EditProduct', { productId }) },
        {
          text: isActive ? 'Set as Draft' : 'Set as Active',
          onPress: () => updateStatus({ id: productId, status: isActive ? 'draft' : 'active' }),
        },
        {
          text: product.status !== 'out_of_stock' ? 'Mark Out of Stock' : 'Set as Active',
          onPress: () =>
            updateStatus({
              id: productId,
              status: product.status !== 'out_of_stock' ? 'out_of_stock' : 'active',
            } as any),
        },
        {
          text: 'Delete Product',
          style: 'destructive',
          onPress: () =>
            deleteProduct(productId, { onSuccess: () => navigation.goBack() }),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [product, productId, navigation, updateStatus, deleteProduct]);

  const handleContactCompany = () => {
    Linking.openURL(`mailto:?subject=Inquiry about ${product.name}`);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* ── Navbar ── */}
      <View
        style={[
          styles.navbar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.navTitle, { color: colors.text }]} numberOfLines={1}>
          {product.name}
        </Text>

        {ownerView ? (
          <TouchableOpacity onPress={handleOwnerActions} style={styles.navBtn}>
            <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Image Gallery ── */}
        <ProductImageGallery images={product.images ?? []} height={300} />

        {/* ── Owner status banner ── */}
        {ownerView && product.status !== 'active' && (
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor:
                  product.status === 'draft'
                    ? '#F59E0B18'
                    : product.status === 'out_of_stock'
                    ? '#EF444418'
                    : '#6B728018',
              },
            ]}
          >
            <Ionicons
              name="warning-outline"
              size={16}
              color={
                product.status === 'draft'
                  ? '#F59E0B'
                  : product.status === 'out_of_stock'
                  ? '#EF4444'
                  : '#6B7280'
              }
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color:
                  product.status === 'draft'
                    ? '#F59E0B'
                    : product.status === 'discontinued'
                    ? '#EF4444'
                    : '#6B7280',
                textTransform: 'capitalize',
              }}
            >
              This product is {product.status} — not visible to the public
            </Text>
          </View>
        )}

        <View style={{ padding: 16, gap: 14 }}>

          {/* ── Price + Stock ── */}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>
              {formatPrice(priceNum, currency)}
            </Text>
            <View
              style={[
                styles.stockBadge,
                { backgroundColor: stockConfig.background },
              ]}
            >
              <View style={[styles.stockDot, { backgroundColor: stockConfig.color }]} />
              <Text style={[styles.stockText, { color: stockConfig.color }]}>
                {stockConfig.label}
              </Text>
            </View>
          </View>

          {/* ── Name + Featured ── */}
          <View style={styles.nameLine}>
            <Text style={[styles.name, { color: colors.text, flex: 1 }]}>
              {product.name}
            </Text>
            {product.featured && (
              <View style={[styles.featuredBadge, { backgroundColor: '#FBBF2420' }]}>
                <Ionicons name="star" size={13} color="#FBBF24" />
                <Text style={[styles.featuredText, { color: '#FBBF24' }]}>Featured</Text>
              </View>
            )}
          </View>

          {/* ── Company info ── */}
          {company && (
            <View
              style={[
                styles.companyRow,
                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.lg },
              ]}
            >
              <View style={[styles.companyIcon, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name="business-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.companyName, { color: colors.text }]}>
                  {company.name}
                </Text>
                {(company as any).industry && (
                  <Text style={[styles.companyIndustry, { color: colors.textMuted }]}>
                    {(company as any).industry}
                  </Text>
                )}
              </View>
              {(company as any).verified && (
                <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
              )}
            </View>
          )}

          {/* ── Description ── */}
          {product.description && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Description
              </Text>
              <Text
                style={[styles.bodyText, { color: colors.textSecondary }]}
                numberOfLines={descExpanded ? undefined : SHOW_MORE_LINES}
              >
                {product.description}
              </Text>
              {product.description.length > 180 && (
                <TouchableOpacity onPress={() => setDescExpanded((p) => !p)}>
                  <Text style={[styles.showMore, { color: colors.primary }]}>
                    {descExpanded ? 'Show less' : 'Show more'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Short description ── */}
          {product.shortDescription && (
            <Text style={[styles.shortDesc, { color: colors.textSecondary }]}>
              {product.shortDescription}
            </Text>
          )}

          {/* ── Category / subcategory ── */}
          <View style={styles.metaRow}>
            <MetaChip
              icon="folder-outline"
              label={product.category}
              colors={colors}
              borderRadius={borderRadius}
            />
            {product.subcategory && (
              <MetaChip
                icon="pricetag-outline"
                label={product.subcategory}
                colors={colors}
                borderRadius={borderRadius}
              />
            )}
          </View>

          {/* ── Tags ── */}
          {hasTags && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Tags</Text>
              <View style={styles.tagsWrap}>
                {product.tags!.map((tag) => (
                  <View
                    key={tag}
                    style={[
                      styles.tag,
                      { backgroundColor: colors.inputBg, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: colors.textMuted }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Specifications ── */}
          {hasSpecs && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Specifications
              </Text>
              <View
                style={[
                  styles.specsTable,
                  { borderColor: colors.border, borderRadius: borderRadius.lg, overflow: 'hidden' },
                ]}
              >
                {product.specifications!.map((spec, i) => (
                  <View
                    key={i}
                    style={[
                      styles.specRow,
                      {
                        backgroundColor:
                          i % 2 === 0 ? colors.surface : colors.background,
                        borderTopColor: colors.border,
                        borderTopWidth: i === 0 ? 0 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.specKey, { color: colors.textSecondary }]}>
                      {spec.key}
                    </Text>
                    <Text style={[styles.specVal, { color: colors.text }]}>
                      {spec.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Inventory ── */}
          <View style={styles.inventoryRow}>
            <Ionicons name="cube-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              {product.inventory?.trackQuantity
                ? `${product.inventory.quantity} units in stock`
                : 'Availability: Contact seller'}
            </Text>
          </View>

          {/* ── SKU ── */}
          {product.sku && (
            <Text style={[styles.sku, { color: colors.textMuted }]}>
              SKU: {product.sku}
            </Text>
          )}

          {/* ── Views (owner only) ── */}
          {ownerView && (
            <View style={styles.inventoryRow}>
              <Ionicons name="eye-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.bodyText, { color: colors.textMuted }]}>
                {product.views ?? 0} views
              </Text>
            </View>
          )}

          {/* ── Related Products ── */}
          {relatedProducts && relatedProducts.length > 0 && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Related Products
              </Text>
              <FlatList
                horizontal
                data={relatedProducts}
                keyExtractor={(item) => item._id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
                renderItem={({ item }) => (
                  <ProductCard
                    variant="public"
                    product={item}
                    onPress={() =>
                      navigation.replace('ProductDetails', { productId: item._id })
                    }
                    size="sm"
                  />
                )}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Sticky bottom bar ── */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            ...shadows.lg,
          },
        ]}
      >
        {ownerView ? (
          /* Owner actions */
          <View style={styles.ownerActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('EditProduct', { productId })}
              style={[
                styles.ownerBtn,
                { borderColor: colors.primary, borderRadius: borderRadius.lg },
              ]}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
              <Text style={[styles.ownerBtnText, { color: colors.primary }]}>
                Edit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                updateStatus({
                  id: productId,
                  status: product.status === 'active' ? 'draft' : 'active',
                })
              }
              disabled={statusLoading}
              style={[
                styles.ownerBtn,
                {
                  borderColor:
                    product.status === 'active' ? colors.error : '#22C55E',
                  borderRadius: borderRadius.lg,
                },
              ]}
            >
              {statusLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons
                    name={product.status === 'active' ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={product.status === 'active' ? colors.error : '#22C55E'}
                  />
                  <Text
                    style={[
                      styles.ownerBtnText,
                      { color: product.status === 'active' ? colors.error : '#22C55E' },
                    ]}
                  >
                    {product.status === 'active' ? 'Unpublish' : 'Publish'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                deleteProduct(productId, { onSuccess: () => navigation.goBack() })
              }
              disabled={deleteLoading}
              style={[
                styles.ownerBtnDestructive,
                { backgroundColor: colors.error, borderRadius: borderRadius.lg },
              ]}
            >
              {deleteLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                  <Text style={styles.ownerBtnDestructiveText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Public CTA */
          <TouchableOpacity
            onPress={handleContactCompany}
            style={[
              styles.contactBtn,
              { backgroundColor: colors.primary, borderRadius: borderRadius.lg },
            ]}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#fff" />
            <Text style={styles.contactBtnText}>Contact Seller</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

// ─── Small helpers ────────────────────────────────────────────────────────────

const MetaChip: React.FC<{
  icon: any;
  label: string;
  colors: any;
  borderRadius: any;
}> = ({ icon, label, colors, borderRadius }) => (
  <View
    style={[
      styles.metaChip,
      {
        backgroundColor: colors.inputBg,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
      },
    ]}
  >
    <Ionicons name={icon} size={13} color={colors.textMuted} />
    <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>{label}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  navBtn: { padding: 10, width: 44, alignItems: 'center' },
  navTitle: { flex: 1, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  notFoundText: { fontSize: 17, fontWeight: '600' },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: { fontSize: 24, fontWeight: '800' },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockText: { fontSize: 12, fontWeight: '600' },
  nameLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  featuredText: { fontSize: 11, fontWeight: '700' },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderWidth: 1,
  },
  companyIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  companyName: { fontSize: 14, fontWeight: '600' },
  companyIndustry: { fontSize: 12, marginTop: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  bodyText: { fontSize: 14, lineHeight: 22 },
  shortDesc: { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  showMore: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1,
  },
  metaChipText: { fontSize: 12, fontWeight: '500' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1,
  },
  tagText: { fontSize: 11 },
  specsTable: { borderWidth: 1 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  specKey: { fontSize: 13 },
  specVal: { fontSize: 13, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  inventoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sku: { fontSize: 11 },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  contactBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  ownerActions: { flexDirection: 'row', gap: 8 },
  ownerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 5,
    borderWidth: 1.5,
  },
  ownerBtnText: { fontSize: 13, fontWeight: '700' },
  ownerBtnDestructive: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 5,
  },
  ownerBtnDestructiveText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
