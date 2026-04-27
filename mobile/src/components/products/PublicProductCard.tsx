/**
 * mobile/src/components/products/PublicProductCard.tsx
 * Public-facing card. Shows company attribution. Save / View Details actions.
 * No edit/delete affordances — read-only for non-owners.
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Product } from '../../services/productService';
import {
  formatPrice, getStockStatus, getStockBadgeConfig,
  getOwnerAvatarUrl, getOwnerName, getPrimaryImage,
} from '../../utils/productHelpers';
import { OwnerAvatar } from './OwnerAvatar';

interface Props {
  product: Product;
  onPress: () => void;
  onSave?: (productId: string, isSaved: boolean) => void;
  isSaved?: boolean;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const PublicProductCard: React.FC<Props> = ({
  product, onPress, onSave, isSaved = false, size = 'md', style,
}) => {
  const { colors } = useTheme();
  const [imgError, setImgError] = useState(false);
  const [pressed, setPressed] = useState(false);
  const isSm = size === 'sm';
  const imgH = isSm ? 100 : 170;

  const primary = getPrimaryImage(product.images);
  const priceNum = product.price?.amount ?? 0;
  const currency = product.price?.currency ?? 'USD';
  const stockCfg = getStockBadgeConfig(getStockStatus(product.inventory));
  const ownerName = getOwnerName(product);
  const ownerAvatar = getOwnerAvatarUrl(product);
  const verified = product.ownerSnapshot?.verified ?? false;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={0.9}
      style={[
        s.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.borderPrimary,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      <View style={[s.imgWrap, { height: imgH, backgroundColor: colors.skeleton }]}>
        {primary && !imgError ? (
          <Image
            source={{ uri: primary.secure_url }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={s.imgFallback}>
            <Ionicons name="image-outline" size={isSm ? 22 : 32} color={colors.textMuted} />
          </View>
        )}

        {!!product.category && (
          <View style={[s.catPill, { backgroundColor: colors.bgPrimary + 'D9' }]}>
            <Text style={[s.catTxt, { color: colors.textSecondary }]} numberOfLines={1}>
              {product.category}
            </Text>
          </View>
        )}

        {!!onSave && (
          <TouchableOpacity
            onPress={() => onSave(product._id, isSaved)}
            style={[s.saveBtn, { backgroundColor: colors.bgPrimary + 'D9' }]}
            hitSlop={8}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={16}
              color={isSaved ? colors.accent : colors.textPrimary}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.body}>
        {/* Company attribution — only on public cards */}
        <View style={s.ownerRow}>
          <OwnerAvatar name={ownerName} avatarUrl={ownerAvatar} verified={verified} size={isSm ? 18 : 22} />
          <Text style={[s.ownerName, { color: colors.textSecondary }]} numberOfLines={1}>
            {ownerName}
          </Text>
          {verified && (
            <Ionicons name="checkmark-circle" size={12} color={colors.accent} />
          )}
        </View>

        <Text
          style={[s.name, { color: colors.textPrimary, fontSize: isSm ? 13 : 15 }]}
          numberOfLines={2}
        >
          {product.name}
        </Text>

        {!isSm && !!product.shortDescription && (
          <Text style={[s.desc, { color: colors.textSecondary }]} numberOfLines={2}>
            {product.shortDescription}
          </Text>
        )}

        <View style={s.priceRow}>
          <Text style={[s.price, { color: colors.textPrimary, fontSize: isSm ? 14 : 16 }]}>
            {formatPrice(priceNum, currency)}
          </Text>
          <View style={[s.stockPill, { backgroundColor: stockCfg.background }]}>
            <Text style={[s.stockTxt, { color: stockCfg.color }]}>{stockCfg.label}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  imgWrap: { position: 'relative', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  imgFallback: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  catPill: {
    position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, maxWidth: '60%',
  },
  catTxt: { fontSize: 10, fontWeight: '600' },
  saveBtn: {
    position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: 12, gap: 6 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ownerName: { flex: 1, fontSize: 11, fontWeight: '500' },
  name: { fontWeight: '600', lineHeight: 19 },
  desc: { fontSize: 12, lineHeight: 16 },
  priceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2,
  },
  price: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  stockPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  stockTxt: { fontSize: 10, fontWeight: '700' },
});