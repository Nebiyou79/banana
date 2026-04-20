/**
 * mobile/src/screens/products/ProductDetailsScreen.tsx
 *
 * Public product detail screen — read-only for all visitors.
 *
 * Fixes:
 *  - No owner-only actions (edit / unpublish / delete) shown
 *  - Related products FlatList uses variant="public" and nestedScrollEnabled
 *  - Key warnings fixed with compound keyExtractors
 *  - Ownership resolved but used only to show "Manage" shortcut if the viewer
 *    happens to be the owning company (navigates to CompanyProductDetails)
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
  Share,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import {
  useProduct,
  useRelatedProducts,
  useSaveProduct,
  useUnsaveProduct,
  resolveIsOwner,
} from '../../hooks/useProducts';
import { ProductImageGallery } from '../../components/products/ProductImageGallery';
import { ProductCard } from '../../components/products/ProductCard';
import { OwnerAvatar } from '../../components/products/OwnerAvatar';
import {
  formatPrice,
  getStockStatus,
  getStockBadgeConfig,
} from '../../utils/productHelpers';
import { productService, ProductCompany } from '../../services/productService';
import type { ProductsStackParamList } from './ProductMarketplaceScreen';

type Props = NativeStackScreenProps<ProductsStackParamList, 'ProductDetails'>;

const SHOW_MORE_LINES = 4;

export const ProductDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId }  = route.params;
  const { theme }      = useThemeStore();
  const { colors, spacing, borderRadius } = theme;
  const { user }       = useAuthStore();

  const [descExpanded, setDescExpanded] = useState(false);
  const [localSaved, setLocalSaved]     = useState(false);

  const { data: product, isLoading } = useProduct(productId);
  const { data: related = [] }       = useRelatedProducts(productId);
  const saveProduct                  = useSaveProduct();
  const unsaveProduct                = useUnsaveProduct();

  // Ownership check — used ONLY to optionally surface a "Manage" link,
  // NOT to show edit/delete/unpublish UI that belongs in the Company screen.
  const isOwner = resolveIsOwner(user, product ?? null);

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
    } catch { /* user cancelled */ }
  }, [product, productId]);

  const handleContact = useCallback(() => {
    const company =
      product?.companyId && typeof product.companyId === 'object'
        ? (product.companyId as ProductCompany)
        : null;
    const phone   = company?.phone;
    const website = company?.website;
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    } else if (website) {
      Linking.openURL(
        website.startsWith('http') ? website : `https://${website}`,
      ).catch(() => {});
    }
  }, [product]);

  // ── Loading / not-found states ─────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 80 }}
        />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={56} color={colors.textMuted} />
          <Text style={[s.notFoundTxt, { color: colors.text }]}>
            Product not found
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>
              Go back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const priceNum  = product.price?.amount ?? (product.price as unknown as number);
  const currency  = product.price?.currency ?? 'USD';
  const stockStat = getStockStatus(product.inventory);
  const stockCfg  = getStockBadgeConfig(stockStat);

  const ownerName   = productService.getOwnerName(product);
  const ownerAvatar = productService.getOwnerAvatarUrl(product);
  const company     =
    typeof product.companyId === 'object'
      ? (product.companyId as ProductCompany)
      : null;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={[
          s.topBar,
          { borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text
          style={[s.topBarTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {product.name}
        </Text>

        <View style={{ flexDirection: 'row', gap: 14 }}>
          {/* Save toggle — only for authenticated non-owner users */}
          {user && !isOwner && (
            <TouchableOpacity
              onPress={handleToggleSave}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={localSaved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={localSaved ? '#FBBF24' : colors.text}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleShare}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="share-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Image gallery */}
        <ProductImageGallery images={product.images} />

        <View style={{ padding: 16, gap: 14 }}>

          {/* Stock badge */}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <View
              style={[s.badge, { backgroundColor: stockCfg.background }]}
            >
              <View style={[s.dot, { backgroundColor: stockCfg.color }]} />
              <Text style={[s.badgeTxt, { color: stockCfg.color }]}>
                {stockCfg.label}
              </Text>
            </View>
            {product.featured && (
              <View style={[s.badge, { backgroundColor: '#FBBF2420' }]}>
                <Ionicons name="star" size={10} color="#FBBF24" />
                <Text style={[s.badgeTxt, { color: '#FBBF24' }]}>
                  Featured
                </Text>
              </View>
            )}
          </View>

          {/* Name + price */}
          <Text style={[s.name, { color: colors.text }]}>
            {product.name}
          </Text>
          <Text style={[s.price, { color: colors.primary }]}>
            {formatPrice(priceNum, currency)}
            {product.price?.unit ? (
              <Text style={[s.unit, { color: colors.textMuted }]}>
                {' '}/ {product.price.unit}
              </Text>
            ) : null}
          </Text>

          {/* Category */}
          {product.category ? (
            <View
              style={[
                s.catChip,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={{ fontSize: 11, color: colors.textMuted }}>
                {product.category}
                {product.subcategory ? ` › ${product.subcategory}` : ''}
              </Text>
            </View>
          ) : null}

          {/* Owner card — read-only, no actions */}
          <TouchableOpacity
            activeOpacity={0.75}
            style={[
              s.ownerCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={handleContact}
          >
            <OwnerAvatar
              name={ownerName}
              avatarUrl={ownerAvatar}
              verified={product.ownerSnapshot?.verified}
              size={40}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[s.ownerName, { color: colors.text }]}
                numberOfLines={1}
              >
                {ownerName}
              </Text>
              {product.ownerSnapshot?.industry ? (
                <Text
                  style={{ fontSize: 12, color: colors.textMuted }}
                  numberOfLines={1}
                >
                  {product.ownerSnapshot.industry}
                </Text>
              ) : null}
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          {/* Owner shortcut — only visible if viewer IS the owner,
              navigates to the management screen (no edit UI here) */}
          {isOwner && (
            <TouchableOpacity
              style={[
                s.manageHint,
                { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' },
              ]}
              onPress={() =>
                // Navigate UP to CompanyNavigator's details screen
                // Using (navigation as any) because ProductsStack doesn't define this route.
                // The company user will only see this button when inside the Company navigator
                // via ProductMarketplace → ProductDetails → this hint.
                (navigation as any).navigate('CompanyProductDetails', { productId })
              }
            >
              <Ionicons name="settings-outline" size={16} color={colors.primary} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
                Manage this product
              </Text>
            </TouchableOpacity>
          )}

          {/* Description */}
          {product.description ? (
            <View>
              <Text style={[s.sectionTitle, { color: colors.text }]}>
                Description
              </Text>
              <Text
                style={[s.desc, { color: colors.textMuted }]}
                numberOfLines={descExpanded ? undefined : SHOW_MORE_LINES}
              >
                {product.description}
              </Text>
              <TouchableOpacity
                onPress={() => setDescExpanded(v => !v)}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.primary,
                    marginTop: 4,
                  }}
                >
                  {descExpanded ? 'Show less' : 'Show more'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Specifications */}
          {product.specifications && product.specifications.length > 0 ? (
            <View>
              <Text style={[s.sectionTitle, { color: colors.text }]}>
                Specifications
              </Text>
              <View
                style={[s.specTable, { borderColor: colors.border }]}
              >
                {product.specifications.map((spec, i) => (
                  <View
                    key={`spec-${spec.key}-${i}`}
                    style={[
                      s.specRow,
                      {
                        backgroundColor:
                          i % 2 === 0 ? colors.surface : colors.background,
                        borderTopColor: colors.border,
                        borderTopWidth:
                          i === 0 ? 0 : StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <Text style={[s.specKey, { color: colors.textMuted }]}>
                      {spec.key}
                    </Text>
                    <Text style={[s.specVal, { color: colors.text }]}>
                      {spec.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Tags */}
          {product.tags && product.tags.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {product.tags.map((tag, i) => (
                <View
                  key={`tag-${tag}-${i}`}
                  style={[
                    s.tag,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Related products — PUBLIC variant, no owner actions */}
          {related.length > 0 ? (
            <View>
              <Text style={[s.sectionTitle, { color: colors.text }]}>
                Related Products
              </Text>
              <FlatList
                horizontal
                nestedScrollEnabled
                data={related}
                keyExtractor={item => `related-${item._id}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
                renderItem={({ item }) => (
                  <ProductCard
                    variant="public"
                    product={item}
                    onPress={() =>
                      navigation.push('ProductDetails', { productId: item._id })
                    }
                    size="sm"
                    style={{ width: 160 }}
                  />
                )}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Bottom CTA — contact seller only, no owner management */}
      <View
        style={[
          s.bottomBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleToggleSave}
          style={[
            s.saveBtn,
            {
              backgroundColor: localSaved
                ? '#FBBF2420'
                : colors.surface,
              borderColor: localSaved ? '#FBBF24' : colors.border,
            },
          ]}
        >
          <Ionicons
            name={localSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={localSaved ? '#FBBF24' : colors.textMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleContact}
          style={[s.contactBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#fff" />
          <Text style={s.contactBtnText}>Contact Seller</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:    { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  topBarTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  notFoundTxt: { fontSize: 16, fontWeight: '600' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dot:     { width: 6, height: 6, borderRadius: 3 },
  badgeTxt:{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  name:    { fontSize: 20, fontWeight: '800', lineHeight: 26 },
  price:   { fontSize: 22, fontWeight: '800' },
  unit:    { fontSize: 14, fontWeight: '400' },
  catChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  ownerName:   { fontSize: 14, fontWeight: '700' },
  manageHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  desc:    { fontSize: 14, lineHeight: 22 },
  specTable:   { borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  specRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  specKey: { flex: 1, fontSize: 13 },
  specVal: { flex: 1, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  saveBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  contactBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
