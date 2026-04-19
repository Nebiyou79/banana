/**
 * mobile/src/components/products/ProductCard.tsx  (FIXED + UPDATED)
 * Uses useTheme() hook — no ColorPalette type errors
 */
import React, { useState, useCallback, memo } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet,
  ViewStyle, FlatList, ActionSheetIOS, Platform, Alert, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Product, ProductStatus } from '../../services/productService';
import {
  formatPrice, getStockStatus, getStockBadgeConfig,
  getProductStatusConfig, getOwnerAvatarUrl, getOwnerName,
} from '../../utils/productHelpers';
import { OwnerAvatar } from './OwnerAvatar';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Types ──────────────────────────────────────────────────────────────────────

interface BaseProps {
  product: Product;
  onPress: () => void;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

interface PublicProps extends BaseProps {
  variant?: 'public';
  onSave?: (productId: string, isSaved: boolean) => void;
  isSaved?: boolean;
}

interface OwnerProps extends BaseProps {
  variant: 'owner';
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onMarkOutOfStock?: () => void;
}

type ProductCardProps = PublicProps | OwnerProps;

// ── Public card ────────────────────────────────────────────────────────────────

const PublicCard: React.FC<PublicProps> = ({
  product, onPress, onSave, isSaved = false, size = 'md', style,
}) => {
  const { colors, isDark } = useTheme();
  const [imgError, setImgError] = useState(false);
  const isSm = size === 'sm';
  const imgH = isSm ? 90 : 170;

  const sorted = [...(product.images ?? [])].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });
  const primary     = sorted[0];
  const priceNum    = product.price?.amount ?? (product.price as unknown as number);
  const currency    = product.price?.currency ?? 'USD';
  const stockStat   = getStockStatus(product.inventory);
  const stockCfg    = getStockBadgeConfig(stockStat);
  const ownerName   = getOwnerName(product);
  const ownerAvatar = getOwnerAvatarUrl(product);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        s.card,
        { backgroundColor: colors.bgCard ?? colors.bgSurface, borderRadius: 12, borderColor: colors.borderPrimary },
        style,
      ]}
    >
      {/* Image */}
      <View style={[s.imgWrap, { height: imgH, borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: colors.skeleton }]}>
        {primary && !imgError ? (
          <Image source={{ uri: primary.secure_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" onError={() => setImgError(true)} />
        ) : (
          <View style={s.imgFallback}>
            <Ionicons name="image-outline" size={isSm ? 22 : 36} color={colors.textMuted} />
          </View>
        )}

        {product.featured && (
          <View style={s.featuredBadge}>
            <Ionicons name="star" size={9} color="#0A2540" />
            {!isSm && <Text style={s.featuredTxt}>Featured</Text>}
          </View>
        )}

        <View style={[s.stockBadge, { backgroundColor: stockCfg.background }]}>
          <View style={[s.stockDot, { backgroundColor: stockCfg.color }]} />
          {!isSm && <Text style={[s.stockTxt, { color: stockCfg.color }]}>{stockCfg.label}</Text>}
        </View>

        {onSave && (
          <TouchableOpacity
            onPress={() => onSave(product._id, isSaved)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[s.saveBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
          >
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={14} color={isSaved ? '#FBBF24' : '#fff'} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={[s.content, { padding: isSm ? 8 : 12 }]}>
        {!isSm && (
          <View style={s.ownerRow}>
            <OwnerAvatar name={ownerName} avatarUrl={ownerAvatar} verified={product.ownerSnapshot?.verified} size={20} />
            <Text style={[s.ownerName, { color: colors.textMuted }]} numberOfLines={1}>{ownerName}</Text>
          </View>
        )}

        <Text style={[s.productName, { color: colors.textPrimary, fontSize: isSm ? 11 : 13 }]} numberOfLines={isSm ? 1 : 2}>
          {product.name}
        </Text>

        {!isSm && product.category && (
          <View style={[s.catChip, { backgroundColor: colors.inputBg, borderColor: colors.borderPrimary }]}>
            <Text style={{ fontSize: 10, color: colors.textMuted }} numberOfLines={1}>
              {product.category}{product.subcategory ? ` › ${product.subcategory}` : ''}
            </Text>
          </View>
        )}

        <Text style={[s.price, { color: colors.accent, fontSize: isSm ? 12 : 15 }]}>
          {formatPrice(priceNum, currency)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ── Owner card ─────────────────────────────────────────────────────────────────

const OwnerCard: React.FC<OwnerProps> = ({
  product, onPress, onEdit, onDelete, onToggleStatus, onMarkOutOfStock, size = 'md', style,
}) => {
  const { colors } = useTheme();
  const [imgError, setImgError] = useState(false);
  const isSm = size === 'sm';
  const imgH = isSm ? 90 : 150;

  const sorted = [...(product.images ?? [])].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });
  const primary    = sorted[0];
  const priceNum   = product.price?.amount ?? (product.price as unknown as number);
  const currency   = product.price?.currency ?? 'USD';
  const statusCfg  = getProductStatusConfig(product.status);

  const showActions = useCallback(() => {
    const isActive = product.status === 'active';
    const isOOS    = product.status === 'out_of_stock';
    const options  = [
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
          if (idx === 0) onEdit();
          else if (idx === 1) onToggleStatus();
          else if (idx === 2) isOOS ? onToggleStatus() : onMarkOutOfStock?.();
          else if (idx === 3) onDelete();
        }
      );
    } else {
      Alert.alert(product.name, 'Choose action', [
        { text: 'Edit Product',                                onPress: onEdit },
        { text: isActive ? 'Set as Draft' : 'Set as Active',  onPress: onToggleStatus },
        { text: isOOS ? 'Set as Active' : 'Mark Out of Stock',onPress: isOOS ? onToggleStatus : onMarkOutOfStock },
        { text: 'Delete Product', style: 'destructive',       onPress: onDelete },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [product, onEdit, onDelete, onToggleStatus, onMarkOutOfStock]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[s.card, { backgroundColor: colors.bgCard ?? colors.bgSurface, borderRadius: 12, borderColor: colors.borderPrimary }, style]}
    >
      <View style={[s.imgWrap, { height: imgH, borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: colors.skeleton }]}>
        {primary && !imgError ? (
          <Image source={{ uri: primary.secure_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" onError={() => setImgError(true)} />
        ) : (
          <View style={s.imgFallback}>
            <Ionicons name="cube-outline" size={isSm ? 22 : 36} color={colors.textMuted} />
          </View>
        )}

        <View style={[s.ownerStatusBadge, { backgroundColor: statusCfg.background }]}>
          <Text style={[s.ownerStatusTxt, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>

        <TouchableOpacity
          onPress={showActions}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[s.moreBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
        >
          <Ionicons name="ellipsis-vertical" size={16} color="#fff" />
        </TouchableOpacity>

        {(product.images?.length ?? 0) > 1 && (
          <View style={[s.multiIndicator, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <Ionicons name="images-outline" size={10} color="#fff" />
            <Text style={{ fontSize: 10, color: '#fff', fontWeight: '700' }}>{product.images!.length}</Text>
          </View>
        )}
      </View>

      <View style={[s.content, { padding: isSm ? 8 : 12 }]}>
        <Text style={[s.productName, { color: colors.textPrimary, fontSize: isSm ? 11 : 13 }]} numberOfLines={isSm ? 1 : 2}>
          {product.name}
        </Text>

        {!isSm && product.category && (
          <View style={[s.catChip, { backgroundColor: colors.inputBg, borderColor: colors.borderPrimary }]}>
            <Text style={{ fontSize: 10, color: colors.textMuted }} numberOfLines={1}>
              {product.category}{product.subcategory ? ` › ${product.subcategory}` : ''}
            </Text>
          </View>
        )}

        <Text style={[s.price, { color: colors.accent, fontSize: isSm ? 12 : 15 }]}>
          {formatPrice(priceNum, currency)}
        </Text>

        {!isSm && (
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
            {product.views ?? 0} views
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ── Exports ────────────────────────────────────────────────────────────────────

export const ProductCard: React.FC<ProductCardProps> = memo(props => {
  if (props.variant === 'owner') return <OwnerCard {...(props as OwnerProps)} />;
  return <PublicCard {...(props as PublicProps)} />;
});
ProductCard.displayName = 'ProductCard';

export const ProductCardSkeleton: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => {
  const { colors } = useTheme();
  return (
    <View style={[s.card, { backgroundColor: colors.bgSurface, borderRadius: 12, borderColor: colors.borderPrimary }]}>
      <View style={[s.imgWrap, { height: size === 'sm' ? 90 : 170, borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: colors.skeleton }]} />
      <View style={{ padding: 12, gap: 6 }}>
        <View style={{ height: 12, width: '70%', backgroundColor: colors.skeleton, borderRadius: 6 }} />
        <View style={{ height: 10, width: '50%', backgroundColor: colors.skeleton, borderRadius: 6 }} />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  card:            { borderWidth: 1, overflow: 'hidden' },
  imgWrap:         { overflow: 'hidden', position: 'relative' },
  imgFallback:     { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  featuredBadge:   { position: 'absolute', top: 8, left: 8, backgroundColor: '#FBBF24', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 3 },
  featuredTxt:     { fontSize: 9, fontWeight: '700', color: '#0A2540' },
  stockBadge:      { position: 'absolute', bottom: 8, right: 8, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 3 },
  stockDot:        { width: 5, height: 5, borderRadius: 2.5 },
  stockTxt:        { fontSize: 9, fontWeight: '700' },
  saveBtn:         { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ownerStatusBadge:{ position: 'absolute', top: 8, left: 8, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  ownerStatusTxt:  { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  moreBtn:         { position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  multiIndicator:  { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 8, gap: 3 },
  content:         { gap: 3 },
  ownerRow:        { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  ownerName:       { fontSize: 10, fontWeight: '500', flex: 1 },
  productName:     { fontWeight: '700', lineHeight: 18 },
  price:           { fontWeight: '700' },
  catChip:         { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1, marginTop: 2 },
});