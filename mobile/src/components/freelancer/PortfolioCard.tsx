/**
 * components/freelancer/PortfolioCard.tsx
 *
 * Grid card + list item for portfolio items.
 * Only renders Cloudinary images. Falls back gracefully.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { getOptimizedUrl } from '../../services/freelancerService';
import type { PortfolioItem } from '../../types/freelancer';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// ─── Grid Card ────────────────────────────────────────────────────────────────

interface PortfolioCardProps {
  item: PortfolioItem;
  onPress: (item: PortfolioItem) => void;
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  item, onPress, onEdit, onDelete, isOwner = false,
}) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography, shadows, spacing } = theme;
  const [imgError, setImgError] = useState(false);

  const imageUrls = (item.mediaUrls ?? []).filter(u => u?.includes('cloudinary.com'));
  const coverUrl  = imageUrls[0] ?? item.mediaUrl ?? '';
  const optimized = getOptimizedUrl(coverUrl, 400, 300);

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          width: CARD_WIDTH,
          backgroundColor: colors.card,
          borderRadius: borderRadius.xl,
          borderColor: colors.border,
          ...shadows.md,
        },
      ]}
    >
      {/* Image */}
      <View style={[styles.imageContainer, {
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
      }]}>
        {!imgError && coverUrl ? (
          <Image
            source={{ uri: optimized }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.imagePlaceholder, {
            backgroundColor: colors.primaryLight,
          }]}>
            <Ionicons name="image-outline" size={32} color={colors.primary} />
          </View>
        )}

        {/* Badges */}
        <View style={styles.badgesRow}>
          {item.featured && (
            <View style={[styles.badge, { backgroundColor: '#F59E0B', borderRadius: 10 }]}>
              <Ionicons name="star" size={10} color="#fff" />
            </View>
          )}
          {imageUrls.length > 1 && (
            <View style={[styles.badge, { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10 }]}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{imageUrls.length}</Text>
              <Ionicons name="images-outline" size={9} color="#fff" style={{ marginLeft: 2 }} />
            </View>
          )}
        </View>

        {/* Owner actions */}
        {isOwner && (onEdit || onDelete) && (
          <View style={styles.ownerActions}>
            {onEdit && (
              <TouchableOpacity
                onPress={() => onEdit(item)}
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="pencil" size={11} color="#fff" />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={() => onDelete(item._id)}
                style={[styles.actionBtn, { backgroundColor: colors.error }]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="trash" size={11} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      <View style={{ padding: spacing[3] }}>
        <Text
          style={{ fontSize: typography.sm, fontWeight: '700', color: colors.text }}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        {item.client && (
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={11} color={colors.textMuted} />
            <Text style={{ fontSize: 10, color: colors.textMuted, marginLeft: 4, flex: 1 }} numberOfLines={1}>
              {item.client}
            </Text>
          </View>
        )}

        {item.category && (
          <View style={[styles.categoryTag, {
            backgroundColor: colors.primaryLight,
            borderRadius: 8,
            marginTop: spacing[2],
          }]}>
            <Text style={{ fontSize: 9, fontWeight: '600', color: colors.primary }}>
              {item.category}
            </Text>
          </View>
        )}

        {item.technologies && item.technologies.length > 0 && (
          <View style={[styles.techRow, { marginTop: spacing[2] }]}>
            {item.technologies.slice(0, 2).map((t, i) => (
              <View key={i} style={[styles.techTag, {
                backgroundColor: colors.surface,
                borderRadius: 6,
                borderColor: colors.border,
              }]}>
                <Text style={{ fontSize: 9, color: colors.textSecondary, fontWeight: '600' }}>{t}</Text>
              </View>
            ))}
            {item.technologies.length > 2 && (
              <Text style={{ fontSize: 9, color: colors.textMuted, marginLeft: 4 }}>
                +{item.technologies.length - 2}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── List Item ────────────────────────────────────────────────────────────────

interface PortfolioListItemProps {
  item: PortfolioItem;
  onPress: (item: PortfolioItem) => void;
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
}

export const PortfolioListItem: React.FC<PortfolioListItemProps> = ({
  item, onPress, onEdit, onDelete, isOwner = false,
}) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography, shadows, spacing } = theme;
  const [imgError, setImgError] = useState(false);

  const imageUrls = (item.mediaUrls ?? []).filter(u => u?.includes('cloudinary.com'));
  const coverUrl  = imageUrls[0] ?? item.mediaUrl ?? '';
  const optimized = getOptimizedUrl(coverUrl, 160, 120);

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      activeOpacity={0.85}
      style={[
        styles.listItem,
        {
          backgroundColor: colors.card,
          borderRadius: borderRadius.xl,
          borderColor: colors.border,
          ...shadows.sm,
        },
      ]}
    >
      {/* Thumbnail */}
      <View style={[styles.listThumb, {
        borderRadius: borderRadius.lg,
        backgroundColor: colors.primaryLight,
      }]}>
        {!imgError && coverUrl ? (
          <Image
            source={{ uri: optimized }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Ionicons name="image-outline" size={24} color={colors.primary} />
        )}
        {item.featured && (
          <View style={[styles.featuredDot, { backgroundColor: '#F59E0B' }]} />
        )}
      </View>

      {/* Info */}
      <View style={{ flex: 1, paddingLeft: spacing[3] }}>
        <Text style={{ fontSize: typography.sm, fontWeight: '700', color: colors.text }} numberOfLines={1}>
          {item.title}
        </Text>
        {item.description && (
          <Text style={{ fontSize: typography.xs, color: colors.textMuted, marginTop: 2 }} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.listMeta}>
          {item.client && (
            <Text style={{ fontSize: 10, color: colors.textMuted }}>{item.client}</Text>
          )}
          {item.budget != null && (
            <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700' }}>
              ${item.budget.toLocaleString()}
            </Text>
          )}
        </View>
      </View>

      {/* Actions */}
      {isOwner && (
        <View style={styles.listActions}>
          {onEdit && (
            <TouchableOpacity
              onPress={() => onEdit(item)}
              style={styles.listActionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pencil-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(item._id)}
              style={styles.listActionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card:           { borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  imageContainer: { height: 130, overflow: 'hidden', position: 'relative', backgroundColor: '#E5E7EB' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badgesRow:      { position: 'absolute', top: 8, left: 8, flexDirection: 'row', gap: 4 },
  badge:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3 },
  ownerActions:   { position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 4 },
  actionBtn:      { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoRow:        { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  categoryTag:    { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3 },
  techRow:        { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  techTag:        { paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, borderWidth: 1 },
  // List
  listItem:       { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, marginBottom: 10 },
  listThumb:      { width: 80, height: 70, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 },
  featuredDot:    { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4 },
  listMeta:       { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  listActions:    { flexDirection: 'row', gap: 8, paddingLeft: 8 },
  listActionBtn:  { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});