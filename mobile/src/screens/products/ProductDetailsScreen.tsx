/**
 * mobile/src/screens/products/ProductDetailsScreen.tsx
 *
 * Public product detail screen — read-only for all visitors.
 *
 * UPDATED (major):
 *  - Switched from useThemeStore() (was reading colors.background / colors.text /
 *    colors.primary which DON'T exist on AppColors) to useTheme() — same shape
 *    as every other product screen
 *  - useIsCompanyOwner(product) replaces resolveIsOwner() inline call
 *  - All hardcoded hex (#FBBF24, #fff) replaced with theme tokens
 *  - localSaved now hydrates from useSavedProducts on mount, so the bookmark
 *    icon reflects truth, not just user-tap state
 *  - Pull-to-refresh added
 *  - Bottom CTA shows "Save to Favorites" outlined + "Contact Company" gold
 *    solid, matching the spec
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList, Linking, ActivityIndicator,
  StatusBar, Share, RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { useIsCompanyOwner } from '../../hooks/useIsCompanyOwner';
import {
  useProduct, useRelatedProducts,
  useSaveProduct, useUnsaveProduct, useSavedProducts,
} from '../../hooks/useProducts';

import { ProductImageGallery } from '../../components/products/ProductImageGallery';
import { PublicProductCard } from '../../components/products/PublicProductCard';
import { OwnerAvatar } from '../../components/products/OwnerAvatar';

import {
  formatPrice, getStockStatus, getStockBadgeConfig,
} from '../../utils/productHelpers';
import { productService, ProductCompany } from '../../services/productService';
import type { ProductsStackParamList } from './ProductMarketplaceScreen';

type Props = NativeStackScreenProps<ProductsStackParamList, 'ProductDetails'>;

const SHOW_MORE_LINES = 4;

export const ProductDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params;
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();

  const [descExpanded, setDescExpanded] = useState(false);
  const [localSaved, setLocalSaved]     = useState(false);

  const {
    data: product, isLoading, isError, refetch, isRefetching,
  } = useProduct(productId);
  const { data: related = [] }    = useRelatedProducts(productId);
  const saveProduct                = useSaveProduct();
  const unsaveProduct              = useUnsaveProduct();

  // Hydrate save state from server
  const { data: savedData } = useSavedProducts({ limit: 100 });
  useEffect(() => {
    if (!savedData) return;
    const ids = new Set<string>();
    savedData.pages.forEach(p => p.products.forEach(prod => ids.add(prod._id)));
    setLocalSaved(ids.has(productId));
  }, [savedData, productId]);

  // Ownership — used only to surface a "Manage" link, never to show edit UI here
  const isOwner = useIsCompanyOwner(product);

  const handleToggleSave = useCallback(() => {
    if (!user) return;
    const wasSaved = localSaved;
    setLocalSaved(!wasSaved); // optimistic
    const rollback = () => setLocalSaved(wasSaved);
    if (wasSaved) {
      unsaveProduct.mutate(productId, { onError: rollback });
    } else {
      saveProduct.mutate(productId, { onError: rollback });
    }
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

  // ── Loading / not-found ────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (isError || !product) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={56} color={colors.textMuted} />
          <Text style={[s.notFoundTxt, { color: colors.textPrimary }]}>
            {isError ? 'Failed to load product' : 'Product not found'}
          </Text>
          <TouchableOpacity onPress={() => (isError ? refetch() : navigation.goBack())}>
            <Text style={{ color: colors.accent, fontWeight: '600' }}>
              {isError ? 'Retry' : 'Go back'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const priceNum   = product.price?.amount ?? 0;
  const currency   = product.price?.currency ?? 'USD';
  const stockStat  = getStockStatus(product.inventory);
  const stockCfg   = getStockBadgeConfig(stockStat);
  const ownerName  = productService.getOwnerName(product);
  const ownerAvatar = productService.getOwnerAvatarUrl(product);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[s.topBar, { borderBottomColor: colors.borderPrimary }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={[s.topBarTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {product.name}
        </Text>

        <View style={{ flexDirection: 'row', gap: 14 }}>
          {user && !isOwner && (
            <TouchableOpacity
              onPress={handleToggleSave}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={localSaved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={localSaved ? colors.accent : colors.textPrimary}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleShare}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
        }
      >
        <ProductImageGallery images={product.images} />

        <View style={{ padding: 16, gap: 14 }}>

          {/* Stock + Featured badges */}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <View style={[s.badge, { backgroundColor: stockCfg.background }]}>
              <View style={[s.dot, { backgroundColor: stockCfg.color }]} />
              <Text style={[s.badgeTxt, { color: stockCfg.color }]}>{stockCfg.label}</Text>
            </View>
            {product.featured && (
              <View style={[s.badge, { backgroundColor: colors.warningBg }]}>
                <Ionicons name="star" size={10} color={colors.warning} />
                <Text style={[s.badgeTxt, { color: colors.warning }]}>Featured</Text>
              </View>
            )}
          </View>

          {/* Name + price */}
          <Text style={[s.name, { color: colors.textPrimary }]}>{product.name}</Text>
          <Text style={[s.price, { color: colors.accent }]}>
            {formatPrice(priceNum, currency)}
            {product.price?.unit && product.price.unit !== 'unit' ? (
              <Text style={[s.unit, { color: colors.textMuted }]}>
                {' '}/ {product.price.unit}
              </Text>
            ) : null}
          </Text>

          {/* Category */}
          {product.category && (
            <View style={[
              s.catChip,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderPrimary },
            ]}>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>
                {product.category}
                {product.subcategory ? ` › ${product.subcategory}` : ''}
              </Text>
            </View>
          )}

          {/* Owner card */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              s.ownerCard,
              { backgroundColor: colors.bgSurface, borderColor: colors.borderPrimary },
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text
                  style={[s.ownerName, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {ownerName}
                </Text>
                {product.ownerSnapshot?.verified && (
                  <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
                )}
              </View>
              {product.ownerSnapshot?.industry && (
                <Text
                  style={{ fontSize: 12, color: colors.textMuted }}
                  numberOfLines={1}
                >
                  {product.ownerSnapshot.industry}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Owner shortcut — only if viewer is owner */}
          {isOwner && (
            <TouchableOpacity
              style={[
                s.manageHint,
                { backgroundColor: colors.accentBg, borderColor: colors.borderAccent },
              ]}
              onPress={() =>
                // CompanyProductDetails lives on the Company stack, not the
                // Products stack. Cast is necessary because this screen's
                // type-safe param list doesn't know about it.
                (navigation as unknown as {
                  navigate: (n: string, p: { productId: string }) => void;
                }).navigate('CompanyProductDetails', { productId })
              }
              activeOpacity={0.85}
            >
              <Ionicons name="settings-outline" size={16} color={colors.accent} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.accent }}>
                Manage this product
              </Text>
            </TouchableOpacity>
          )}

          {/* Description */}
          {product.description && (
            <View>
              <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
                Description
              </Text>
              <Text
                style={[s.desc, { color: colors.textSecondary }]}
                numberOfLines={descExpanded ? undefined : SHOW_MORE_LINES}
              >
                {product.description}
              </Text>
              {product.description.length > 180 && (
                <TouchableOpacity onPress={() => setDescExpanded(v => !v)}>
                  <Text style={{
                    fontSize: 13, fontWeight: '600',
                    color: colors.accent, marginTop: 4,
                  }}>
                    {descExpanded ? 'Show less' : 'Show more'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Specifications */}
          {!!product.specifications?.length && (
            <View>
              <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
                Specifications
              </Text>
              <View style={[s.specTable, { borderColor: colors.borderPrimary }]}>
                {product.specifications.map((spec, i) => (
                  <View
                    key={`spec-${spec.key}-${i}`}
                    style={[
                      s.specRow,
                      {
                        backgroundColor: i % 2 === 0 ? colors.bgSurface : colors.bgPrimary,
                        borderTopColor:  colors.borderPrimary,
                        borderTopWidth:  i === 0 ? 0 : StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <Text style={[s.specKey, { color: colors.textMuted }]}>{spec.key}</Text>
                    <Text style={[s.specVal, { color: colors.textPrimary }]}>{spec.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tags */}
          {!!product.tags?.length && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {product.tags.map((tag, i) => (
                <View
                  key={`tag-${tag}-${i}`}
                  style={[s.tag, { backgroundColor: colors.bgSurface, borderColor: colors.borderPrimary }]}
                >
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Related */}
          {related.length > 0 && (
            <View>
              <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
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
                  <PublicProductCard
                    product={item}
                    onPress={() => navigation.push('ProductDetails', { productId: item._id })}
                    size="sm"
                    style={{ width: 160 }}
                  />
                )}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Bottom CTAs ─────────────────────────────────────────────────── */}
      <View style={[
        s.bottomBar,
        { backgroundColor: colors.bgPrimary, borderTopColor: colors.borderPrimary },
      ]}>
        <TouchableOpacity
          onPress={handleToggleSave}
          activeOpacity={0.85}
          style={[
            s.saveBtn,
            {
              backgroundColor: localSaved ? colors.accentBg : colors.bgSurface,
              borderColor:     localSaved ? colors.accent   : colors.borderPrimary,
            },
          ]}
        >
          <Ionicons
            name={localSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={localSaved ? colors.accent : colors.textMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleContact}
          activeOpacity={0.9}
          style={[s.contactBtn, { backgroundColor: colors.accent }]}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.textInverse} />
          <Text style={[s.contactBtnText, { color: colors.textInverse }]}>
            Contact Company
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:    { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 12,
  },
  topBarTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 32,
  },
  notFoundTxt: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  dot:      { width: 6, height: 6, borderRadius: 3 },
  badgeTxt: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  name:     { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  price:    { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  unit:     { fontSize: 14, fontWeight: '400' },
  catChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1,
  },
  ownerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  ownerName: { fontSize: 14, fontWeight: '700' },
  manageHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 10, borderWidth: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  desc:        { fontSize: 14, lineHeight: 22 },
  specTable:   { borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  specRow:     { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10 },
  specKey:     { flex: 1, fontSize: 13 },
  specVal:     { flex: 1, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  tag:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth, gap: 10,
  },
  saveBtn: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  contactBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12,
  },
  contactBtnText: { fontSize: 15, fontWeight: '700' },
});