/**
 * mobile/src/screens/products/ProductDetailsScreen.tsx  (UPDATED)
 *
 * Public product detail screen.
 * - Company avatar resolved from ownerSnapshot or populated companyId
 * - Save / unsave button
 * - Contact seller CTA
 * - Category / subcategory badges
 * - Related products rail
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList, Linking, ActivityIndicator, StatusBar, Share,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useProduct, useRelatedProducts, useSaveProduct, useUnsaveProduct } from '../../hooks/useProducts';
import { ProductImageGallery } from '../../components/products/ProductImageGallery';
import { ProductCard } from '../../components/products/ProductCard';
import { OwnerAvatar } from '../../components/products/OwnerAvatar';
import { formatPrice, getStockStatus, getStockBadgeConfig } from '../../utils/productHelpers';
import type { ProductsStackParamList } from './ProductMarketplaceScreen';
import { ProductCompany } from '../../services/productService';

type Props = NativeStackScreenProps<ProductsStackParamList, 'ProductDetails'>;

const SHOW_MORE_LINES = 4;

export const ProductDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params;
  const { theme }     = useThemeStore();
  const { colors, spacing, borderRadius, shadows } = theme;
  const { user }      = useAuthStore();

  const [descExpanded, setDescExpanded] = useState(false);

  const { data: product, isLoading } = useProduct(productId);
  const { data: related = [] }       = useRelatedProducts(productId);
  const saveProduct                  = useSaveProduct();
  const unsaveProduct                = useUnsaveProduct();

  // Is this product saved by the current user?
  // (The backend returns savedBy array stripped for public — rely on local state only)
  const [localSaved, setLocalSaved]    = useState(false);

  const handleToggleSave = useCallback(() => {
    if (!user) return;
    if (localSaved) {
      unsaveProduct.mutate(productId);
    } else {
      saveProduct.mutate(productId);
    }
    setLocalSaved(v => !v);
  }, [localSaved, productId, user, saveProduct, unsaveProduct]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out ${product?.name} on Banana\nhttps://getbananalink.com/products/${productId}`,
      });
    } catch {}
  }, [product, productId]);

  const handleContact = useCallback(() => {
    const company = product?.companyId && typeof product.companyId === 'object'
      ? product.companyId as ProductCompany
      : null;
    const email = (company as unknown as Record<string, string>)?.email;
    const phone = (company as unknown as Record<string, string>)?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else if (email) {
      Linking.openURL(`mailto:${email}?subject=Inquiry about ${product?.name}`);
    } else {
      Linking.openURL(`mailto:?subject=Inquiry about ${product?.name}`);
    }
  }, [product]);

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

  const company      = typeof product.companyId === 'object' ? product.companyId as ProductCompany : null;
  const ownerSnap    = product.ownerSnapshot;
  const companyName  = ownerSnap?.name    || company?.name    || 'Company';
  const companyVerif = ownerSnap?.verified || company?.verified || false;
  const avatarUrl    = ownerSnap?.avatarUrl || ownerSnap?.logoUrl || company?.logoUrl;
  const avatarPubId  = ownerSnap?.avatarPublicId;
  const industry     = ownerSnap?.industry || company?.industry;
  const website      = ownerSnap?.website  || company?.website;

  const priceNum   = product.price?.amount ?? (product.price as unknown as number);
  const currency   = product.price?.currency ?? 'USD';
  const stockStat  = getStockStatus(product.inventory);
  const stockConf  = getStockBadgeConfig(stockStat);
  const hasSpecs   = !!product.specifications?.length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* ── Navbar ── */}
      <View style={[styles.navbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]} numberOfLines={1}>
          {product.name}
        </Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity onPress={handleShare} style={styles.navBtn}>
            <Ionicons name="share-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          {user && (
            <TouchableOpacity onPress={handleToggleSave} style={styles.navBtn}>
              <Ionicons
                name={localSaved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={localSaved ? colors.primary : colors.text}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Gallery */}
        <ProductImageGallery images={product.images ?? []} height={320} />

        <View style={{ padding: 16, gap: 16 }}>

          {/* Price + stock */}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>
              {formatPrice(priceNum, currency)}
            </Text>
            {product.price?.unit && product.price.unit !== 'unit' && (
              <Text style={{ fontSize: 13, color: colors.textMuted, marginLeft: 2 }}>
                / {product.price.unit}
              </Text>
            )}
            <View style={[styles.stockBadge, { backgroundColor: stockConf.background }]}>
              <View style={[styles.stockDot, { backgroundColor: stockConf.color }]} />
              <Text style={[styles.stockText, { color: stockConf.color }]}>{stockConf.label}</Text>
            </View>
          </View>

          {/* Name + featured */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Text style={[styles.name, { color: colors.text, flex: 1 }]}>{product.name}</Text>
            {product.featured && (
              <View style={[styles.featuredBadge, { backgroundColor: '#FBBF2420' }]}>
                <Ionicons name="star" size={12} color="#FBBF24" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#FBBF24' }}>Featured</Text>
              </View>
            )}
          </View>

          {/* Category pills */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {product.category && (
              <View style={[styles.catPill, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name="folder-outline" size={11} color={colors.textMuted} />
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>
                  {product.category}
                </Text>
              </View>
            )}
            {product.subcategory && (
              <View style={[styles.catPill, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name="pricetag-outline" size={11} color={colors.textMuted} />
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>
                  {product.subcategory}
                </Text>
              </View>
            )}
          </View>

          {/* Company card */}
          <View style={[
            styles.companyCard,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.lg },
          ]}>
            <OwnerAvatar
              name={companyName}
              avatarUrl={avatarUrl}
              avatarPublicId={avatarPubId}
              verified={companyVerif}
              size={44}
            />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={[styles.companyName, { color: colors.text }]}>{companyName}</Text>
                {companyVerif && (
                  <Ionicons name="checkmark-circle" size={15} color="#22C55E" />
                )}
              </View>
              {industry && (
                <Text style={[styles.companyIndustry, { color: colors.textMuted }]}>{industry}</Text>
              )}
              {website && (
                <TouchableOpacity onPress={() => Linking.openURL(website.startsWith('http') ? website : `https://${website}`)}>
                  <Text style={{ fontSize: 12, color: colors.primary, marginTop: 2 }} numberOfLines={1}>
                    {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Description */}
          {product.description && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
              <Text
                style={[styles.bodyText, { color: colors.textSecondary }]}
                numberOfLines={descExpanded ? undefined : SHOW_MORE_LINES}
              >
                {product.description}
              </Text>
              {product.description.length > 180 && (
                <TouchableOpacity onPress={() => setDescExpanded(v => !v)}>
                  <Text style={[styles.showMore, { color: colors.primary }]}>
                    {descExpanded ? 'Show less' : 'Show more'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Tags */}
          {product.tags?.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {product.tags.map(tag => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Specifications */}
          {hasSpecs && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Specifications</Text>
              <View style={[styles.specsTable, { borderColor: colors.border, borderRadius: borderRadius.lg, overflow: 'hidden' }]}>
                {product.specifications!.map((spec, i) => (
                  <View
                    key={i}
                    style={[
                      styles.specRow,
                      {
                        backgroundColor: i % 2 === 0 ? colors.surface : colors.background,
                        borderTopColor: colors.border, borderTopWidth: i === 0 ? 0 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.specKey, { color: colors.textSecondary }]}>{spec.key}</Text>
                    <Text style={[styles.specVal, { color: colors.text }]}>{spec.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Inventory note */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="cube-outline" size={15} color={colors.textMuted} />
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              {product.inventory?.trackQuantity
                ? `${product.inventory.quantity} units in stock`
                : 'Availability: Contact seller'}
            </Text>
          </View>

          {/* Related */}
          {related.length > 0 && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Related Products</Text>
              <FlatList
                horizontal
                data={related}
                keyExtractor={item => item._id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
                renderItem={({ item }) => (
                  <ProductCard
                    variant="public"
                    product={item}
                    onPress={() => navigation.replace('ProductDetails', { productId: item._id })}
                    onSave={handleSave => {}}
                    size="sm"
                    style={{ width: 160 }}
                  />
                )}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Sticky CTA ── */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, ...shadows.lg }]}>
        <TouchableOpacity
          onPress={handleContact}
          style={[styles.contactBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.lg }]}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#fff" />
          <Text style={styles.contactBtnText}>Contact Seller</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 4, paddingVertical: 8, borderBottomWidth: 1,
  },
  navBtn:       { padding: 10, width: 44, alignItems: 'center' },
  navTitle:     { flex: 1, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  notFound:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  notFoundText: { fontSize: 17, fontWeight: '600' },
  priceRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  price:        { fontSize: 26, fontWeight: '800' },
  stockBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4, marginLeft: 'auto',
  },
  stockDot:     { width: 6, height: 6, borderRadius: 3 },
  stockText:    { fontSize: 12, fontWeight: '600' },
  name:         { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  featuredBadge:{
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4,
  },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
  },
  companyCard:  { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderWidth: 1 },
  companyName:  { fontSize: 15, fontWeight: '700' },
  companyIndustry: { fontSize: 12, marginTop: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  bodyText:     { fontSize: 14, lineHeight: 22 },
  showMore:     { fontSize: 13, fontWeight: '600', marginTop: 4 },
  tag: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1,
  },
  specsTable:   { borderWidth: 1 },
  specRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  specKey:      { fontSize: 13 },
  specVal:      { fontSize: 13, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  bottomBar:    { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 14, gap: 8,
  },
  contactBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
