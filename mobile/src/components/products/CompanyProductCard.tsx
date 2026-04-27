/**
 * mobile/src/components/products/CompanyProductCard.tsx
 * Owner card variant. Edit / Toggle Status / Delete actions.
 * Zero hardcoded colors — everything via useTheme().
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet,
  ActionSheetIOS, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Product } from '../../services/productService';
import { formatPrice, getPrimaryImage, getProductStatusConfig } from '../../utils/productHelpers';

interface Props {
  product: Product;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onMarkOutOfStock?: () => void;
}

export const CompanyProductCard: React.FC<Props> = ({
  product, onPress, onEdit, onDelete, onToggleStatus, onMarkOutOfStock,
}) => {
  const { colors } = useTheme();
  const [imgError, setImgError] = useState(false);
  const [pressed, setPressed] = useState(false);

  const primaryImage = getPrimaryImage(product.images);
  const statusCfg = getProductStatusConfig(product.status);
  const priceNum = product.price?.amount ?? 0;
  const currency = product.price?.currency ?? 'USD';
  const isActive = product.status === 'active';
  const isOOS = product.status === 'out_of_stock';

  const showActions = useCallback(() => {
    const options = [
      'Edit',
      isActive ? 'Mark as Draft' : 'Mark as Active',
      isOOS ? 'Mark as Active' : 'Mark as Out of Stock',
      'Delete',
      'Cancel',
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: 3, cancelButtonIndex: 4, title: product.name },
        (idx) => {
          if (idx === 0) onEdit();
          else if (idx === 1) onToggleStatus();
          else if (idx === 2) (isOOS ? onToggleStatus : onMarkOutOfStock?.bind(null))?.();
          else if (idx === 3) onDelete();
        },
      );
    } else {
      Alert.alert(product.name, 'Choose an action', [
        { text: 'Edit', onPress: onEdit },
        { text: isActive ? 'Mark as Draft' : 'Mark as Active', onPress: onToggleStatus },
        ...(onMarkOutOfStock && !isOOS
          ? [{ text: 'Mark as Out of Stock', onPress: onMarkOutOfStock }]
          : []),
        { text: 'Delete', style: 'destructive' as const, onPress: onDelete },
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  }, [isActive, isOOS, onDelete, onEdit, onMarkOutOfStock, onToggleStatus, product.name]);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={0.85}
      style={[
        s.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.borderPrimary,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {/* Image */}
      <View style={[s.imgWrap, { backgroundColor: colors.skeleton }]}>
        {primaryImage && !imgError ? (
          <Image
            source={{ uri: primaryImage.secure_url }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={s.imgFallback}>
            <Ionicons name="image-outline" size={28} color={colors.textMuted} />
          </View>
        )}

        {/* Top-right status pill — owner sees this at all times */}
        <View style={[s.statusPill, { backgroundColor: statusCfg.color + '22' }]}>
          <View style={[s.dot, { backgroundColor: statusCfg.color }]} />
          <Text style={[s.statusTxt, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>

        {/* Top-left more menu */}
        <TouchableOpacity
          onPress={showActions}
          style={[s.moreBtn, { backgroundColor: colors.bgPrimary + 'CC' }]}
          hitSlop={8}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={s.body}>
        {!!product.category && (
          <Text style={[s.category, { color: colors.textMuted }]} numberOfLines={1}>
            {product.category.toUpperCase()}
          </Text>
        )}

        <Text style={[s.name, { color: colors.textPrimary }]} numberOfLines={2}>
          {product.name}
        </Text>

        {!!product.shortDescription && (
          <Text style={[s.desc, { color: colors.textSecondary }]} numberOfLines={2}>
            {product.shortDescription}
          </Text>
        )}

        <Text style={[s.price, { color: colors.textPrimary }]}>
          {formatPrice(priceNum, currency)}
          {!!product.price?.unit && product.price.unit !== 'unit' && (
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '500' }}>
              {' '}/ {product.price.unit}
            </Text>
          )}
        </Text>
      </View>

      {/* Action footer */}
      <View style={[s.footer, { borderTopColor: colors.borderPrimary }]}>
        <TouchableOpacity onPress={onEdit} style={s.footerBtn} hitSlop={8}>
          <Ionicons name="create-outline" size={16} color={colors.accent} />
          <Text style={[s.footerTxt, { color: colors.accent }]}>Edit</Text>
        </TouchableOpacity>

        <View style={[s.footerDivider, { backgroundColor: colors.borderPrimary }]} />

        <TouchableOpacity onPress={onDelete} style={s.footerBtn} hitSlop={8}>
          <Ionicons name="trash-outline" size={16} color={colors.error} />
          <Text style={[s.footerTxt, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  imgWrap: { aspectRatio: 16 / 10, position: 'relative' },
  imgFallback: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  statusPill: {
    position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center',
    gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 11, fontWeight: '700' },
  moreBtn: {
    position: 'absolute', top: 8, left: 8, width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: 12, gap: 6 },
  category: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  name: { fontSize: 15, fontWeight: '600', lineHeight: 19 },
  desc: { fontSize: 12, lineHeight: 16 },
  price: { fontSize: 16, fontWeight: '700', marginTop: 4, fontVariant: ['tabular-nums'] },
  footer: { flexDirection: 'row', borderTopWidth: 1 },
  footerBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 6,
  },
  footerDivider: { width: 1 },
  footerTxt: { fontSize: 13, fontWeight: '600' },
});