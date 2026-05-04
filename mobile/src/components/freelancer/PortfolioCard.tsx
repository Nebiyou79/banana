// PortfolioCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getOptimizedUrl } from '../../services/freelancerService';
import type { PortfolioItem } from '../../types/freelancer';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

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
  const { colors, radius, type, shadows, spacing } = useTheme();
  const [imgError, setImgError] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(6)).current;

  const imageUrls = (item.mediaUrls ?? []).filter(u => u?.includes('cloudinary.com'));
  const coverUrl  = imageUrls[0] ?? item.mediaUrl ?? '';
  const optimized = getOptimizedUrl(coverUrl, 400, 300);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };

  return (
    <Animated.View style={{ width: CARD_WIDTH, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        onPress={() => onPress(item)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={[
          styles.card,
          {
            backgroundColor: colors.bgCard,
            borderRadius: radius.xl,
            borderColor: colors.borderPrimary,
            ...shadows.sm,
          },
        ]}
      >
        <View style={[styles.imageContainer, { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
          {!imgError && coverUrl ? (
            <Image
              source={{ uri: optimized }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, styles.imagePlaceholder, { backgroundColor: colors.accentBg }]}>
              <Ionicons name="image-outline" size={32} color={colors.accent} />
            </View>
          )}

          <View style={styles.badgesRow}>
            {item.featured && (
              <View style={[styles.badge, { backgroundColor: '#F59E0B', borderRadius: radius.sm }]}>
                <Ionicons name="star" size={10} color="#fff" />
              </View>
            )}
            {imageUrls.length > 1 && (
              <View style={[styles.badge, { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radius.sm }]}>
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{imageUrls.length}</Text>
                <Ionicons name="images-outline" size={9} color="#fff" style={{ marginLeft: 2 }} />
              </View>
            )}
          </View>

          {isOwner && (onEdit || onDelete) && (
            <View style={styles.ownerActions}>
              {onEdit && (
                <TouchableOpacity
                  onPress={() => onEdit(item)}
                  style={[styles.actionBtn, { backgroundColor: colors.accent, borderRadius: radius.full }]}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="pencil" size={11} color="#fff" />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  onPress={() => onDelete(item._id)}
                  style={[styles.actionBtn, { backgroundColor: colors.error, borderRadius: radius.full }]}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="trash" size={11} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={{ padding: spacing.card }}>
          <Text style={[type.body, { fontWeight: '700', color: colors.textPrimary }]} numberOfLines={2}>
            {item.title}
          </Text>

          {item.client && (
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={11} color={colors.textMuted} />
              <Text style={[type.caption, { color: colors.textMuted, marginLeft: spacing.xs, flex: 1 }]} numberOfLines={1}>
                {item.client}
              </Text>
            </View>
          )}

          {item.category && (
            <View style={[styles.categoryTag, { backgroundColor: colors.accentBg, borderRadius: radius.sm, marginTop: spacing.sm }]}>
              <Text style={[type.caption, { fontWeight: '600', color: colors.accent }]}>
                {item.category}
              </Text>
            </View>
          )}

          {item.technologies && item.technologies.length > 0 && (
            <View style={[styles.techRow, { marginTop: spacing.sm }]}>
              {item.technologies.slice(0, 2).map((t, i) => (
                <View key={i} style={[styles.techTag, { backgroundColor: colors.bgSecondary, borderRadius: radius.sm, borderColor: colors.borderPrimary }]}>
                  <Text style={[type.caption, { color: colors.textSecondary, fontWeight: '600' }]}>{t}</Text>
                </View>
              ))}
              {item.technologies.length > 2 && (
                <Text style={[type.caption, { color: colors.textMuted, marginLeft: spacing.xs }]}>
                  +{item.technologies.length - 2}
                </Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

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
  const { colors, radius, type, shadows, spacing } = useTheme();
  const [imgError, setImgError] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;

  const imageUrls = (item.mediaUrls ?? []).filter(u => u?.includes('cloudinary.com'));
  const coverUrl  = imageUrls[0] ?? item.mediaUrl ?? '';
  const optimized = getOptimizedUrl(coverUrl, 160, 120);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        onPress={() => onPress(item)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={[
          styles.listItem,
          {
            backgroundColor: colors.bgCard,
            borderRadius: radius.xl,
            borderColor: colors.borderPrimary,
            ...shadows.sm,
          },
        ]}
      >
        <View style={[styles.listThumb, { borderRadius: radius.md, backgroundColor: colors.accentBg }]}>
          {!imgError && coverUrl ? (
            <Image
              source={{ uri: optimized }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <Ionicons name="image-outline" size={24} color={colors.accent} />
          )}
          {item.featured && (
            <View style={[styles.featuredDot, { backgroundColor: '#F59E0B' }]} />
          )}
        </View>

        <View style={{ flex: 1, paddingLeft: spacing.md }}>
          <Text style={[type.bodySm, { fontWeight: '700', color: colors.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.description && (
            <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.listMeta}>
            {item.client && (
              <Text style={[type.caption, { color: colors.textMuted }]}>{item.client}</Text>
            )}
            {item.budget != null && (
              <Text style={[type.caption, { color: colors.accent, fontWeight: '700' }]}>
                ${item.budget.toLocaleString()}
              </Text>
            )}
          </View>
        </View>

        {isOwner && (
          <View style={styles.listActions}>
            {onEdit && (
              <TouchableOpacity onPress={() => onEdit(item)} style={styles.listActionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="pencil-outline" size={16} color={colors.accent} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={() => onDelete(item._id)} style={styles.listActionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card:           { borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  imageContainer: { height: 130, overflow: 'hidden', position: 'relative', backgroundColor: '#E5E7EB' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badgesRow:      { position: 'absolute', top: 8, left: 8, flexDirection: 'row', gap: 4 },
  badge:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3 },
  ownerActions:   { position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 4 },
  actionBtn:      { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  infoRow:        { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  categoryTag:    { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3 },
  techRow:        { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  techTag:        { paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, borderWidth: 1 },
  listItem:       { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, marginBottom: 10 },
  listThumb:      { width: 80, height: 70, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 },
  featuredDot:    { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4 },
  listMeta:       { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  listActions:    { flexDirection: 'row', gap: 8, paddingLeft: 8 },
  listActionBtn:  { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});