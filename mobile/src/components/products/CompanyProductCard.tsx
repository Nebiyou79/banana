/**
 * mobile/src/components/products/CompanyProductCard.tsx  (FIXED)
 * Uses useTheme() hook — no ColorPalette type errors
 */
import React, { useState } from 'react';
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

  const primaryImage = getPrimaryImage(product.images);
  const statusCfg    = getProductStatusConfig(product.status);
  const priceNum     = product.price?.amount ?? (product.price as unknown as number);
  const currency     = product.price?.currency ?? 'USD';

  const showActions = () => {
    const isActive = product.status === 'active';
    const isOOS    = product.status === 'out_of_stock';
    const options  = [
      'Edit',
      isActive ? 'Mark as Draft' : 'Mark as Active',
      isOOS    ? 'Mark as Active' : 'Mark as Out of Stock',
      'Delete',
      'Cancel',
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: 3, cancelButtonIndex: 4, title: product.name },
        idx => {
          if (idx === 0) onEdit();
          else if (idx === 1) onToggleStatus();
          else if (idx === 2) isOOS ? onToggleStatus() : onMarkOutOfStock?.();
          else if (idx === 3) onDelete();
        }
      );
    } else {
      Alert.alert(product.name, 'Choose an action', [
        { text: 'Edit', onPress: onEdit },
        { text: isActive ? 'Mark as Draft' : 'Mark as Active', onPress: onToggleStatus },
        { text: isOOS ? 'Mark as Active' : 'Mark as Out of Stock', onPress: isOOS ? onToggleStatus : onMarkOutOfStock },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[s.card, { backgroundColor: colors.bgCard, borderColor: colors.borderPrimary, borderRadius: 12 }]}
    >
      <View style={[s.imgWrap, { borderRadius: 10, backgroundColor: colors.skeleton }]}>
        {primaryImage && !imgError ? (
          <Image source={{ uri: primaryImage.secure_url }} style={s.img} onError={() => setImgError(true)} resizeMode="cover" />
        ) : (
          <Ionicons name="cube-outline" size={26} color={colors.textMuted} />
        )}
      </View>

      <View style={s.info}>
        <Text style={[s.name, { color: colors.textPrimary }]} numberOfLines={1}>{product.name}</Text>
        <Text style={[s.category, { color: colors.textMuted }]} numberOfLines={1}>
          {product.category}{product.subcategory ? ` › ${product.subcategory}` : ''}
        </Text>
        <Text style={[s.price, { color: colors.accent }]}>{formatPrice(priceNum, currency)}</Text>
        <View style={[s.statusBadge, { backgroundColor: statusCfg.background }]}>
          <Text style={[s.statusTxt, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={showActions}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={[s.menuBtn, { backgroundColor: colors.borderSecondary ?? `${colors.borderPrimary}50` }]}
      >
        <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  card:      { flexDirection: 'row', alignItems: 'center', borderWidth: 1, padding: 12, gap: 12, marginBottom: 10 },
  imgWrap:   { width: 60, height: 60, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  img:       { width: '100%', height: '100%' },
  info:      { flex: 1, gap: 2 },
  name:      { fontSize: 14, fontWeight: '700' },
  category:  { fontSize: 11, marginTop: 1 },
  price:     { fontSize: 13, fontWeight: '700', marginTop: 2 },
  statusBadge:{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, marginTop: 4 },
  statusTxt: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  menuBtn:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});