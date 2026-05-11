import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import type { FreelancerServiceItem } from '../../types/freelancer';

interface ServiceCardProps {
  service: FreelancerServiceItem;
  onEdit?: (service: FreelancerServiceItem) => void;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
}

const PRICE_TYPE_LABELS: Record<string, string> = {
  fixed: 'Fixed Price',
  hourly: 'Per Hour',
  negotiable: 'Negotiable',
};

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  design: 'color-palette-outline',
  development: 'code-slash-outline',
  marketing: 'megaphone-outline',
  writing: 'document-text-outline',
  consulting: 'briefcase-outline',
  data: 'bar-chart-outline',
};

const getCategoryIcon = (cat?: string): keyof typeof Ionicons.glyphMap =>
  (cat && CATEGORY_ICONS[cat.toLowerCase()]) ? CATEGORY_ICONS[cat.toLowerCase()] : 'construct-outline';

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onEdit, onDelete, isOwner = false }) => {
  const { colors: c, radius, type, shadows, spacing } = useTheme();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(6)).current;

  const styles = useMemo(() => makeStyles(c, radius, spacing, shadows), [c, radius, spacing, shadows]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const isActive = service.isActive !== false;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[styles.card, { borderColor: isActive ? withAlpha(c.primary, 0.30) : c.border }]}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons name={getCategoryIcon(service.category)} size={22} color={c.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[type.bodySm, { fontWeight: '700', color: c.text }]} numberOfLines={2}>
              {service.title}
            </Text>
            {service.category ? (
              <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]} numberOfLines={1}>
                {service.category}
              </Text>
            ) : null}
          </View>
          <View style={[styles.statusBadge, {
            backgroundColor: isActive ? withAlpha(c.success, 0.14) : withAlpha(c.danger, 0.12),
          }]}>
            <View style={[styles.statusDot, { backgroundColor: isActive ? c.success : c.danger }]} />
            <Text style={[type.caption, { fontWeight: '700', color: isActive ? c.success : c.danger }]}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {service.description ? (
          <Text style={[type.bodySm, styles.desc, { color: c.textMuted }]} numberOfLines={2}>
            {service.description}
          </Text>
        ) : null}

        <View style={[styles.metaRow, { borderTopColor: c.border }]}>
          {service.price != null && (
            <View style={styles.metaItem}>
              <Ionicons name="pricetag-outline" size={13} color={c.primary} />
              <Text style={[type.bodySm, { color: c.primary, fontWeight: '700', marginLeft: spacing.xs }]}>
                ${service.price.toLocaleString()}
              </Text>
              {service.priceType ? (
                <Text style={[type.caption, { color: c.textMuted, marginLeft: spacing.xs }]}>
                  · {PRICE_TYPE_LABELS[service.priceType] ?? service.priceType}
                </Text>
              ) : null}
            </View>
          )}
          {service.deliveryTime ? (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={c.textMuted} />
              <Text style={[type.caption, { color: c.textMuted, marginLeft: spacing.xs }]}>
                {service.deliveryTime}
              </Text>
            </View>
          ) : null}
        </View>

        {isOwner && (onEdit || onDelete) && (
          <View style={[styles.actions, { borderTopColor: c.border }]}>
            {onEdit && (
              <TouchableOpacity
                onPress={() => onEdit(service)}
                style={[styles.actionBtn, { backgroundColor: withAlpha(c.primary, 0.10) }]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel="Edit service"
              >
                <Ionicons name="pencil-outline" size={14} color={c.primary} />
                <Text style={[type.caption, { color: c.primary, fontWeight: '700', marginLeft: spacing.xs }]}>
                  Edit
                </Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={() => onDelete(service._id)}
                style={[styles.actionBtn, { backgroundColor: withAlpha(c.danger, 0.10) }]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel="Delete service"
              >
                <Ionicons name="trash-outline" size={14} color={c.danger} />
                <Text style={[type.caption, { color: c.danger, fontWeight: '700', marginLeft: spacing.xs }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const makeStyles = (c: any, radius: any, spacing: any, shadows: any) =>
  StyleSheet.create({
    card: { padding: spacing.lg, borderWidth: 1.5, borderRadius: radius.xl, backgroundColor: c.bgCard, marginBottom: 12, ...shadows.sm },
    header: { flexDirection: 'row', alignItems: 'flex-start' },
    iconBox: {
      width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, borderRadius: radius.md, backgroundColor: withAlpha(c.primary, 0.10),
    },
    statusBadge: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 8, paddingVertical: 4,
      borderRadius: 9999, alignSelf: 'flex-start',
    },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
    desc: { marginTop: 10, lineHeight: 18 },
    metaRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingTop: spacing.md, marginTop: spacing.md,
    },
    metaItem: { flexDirection: 'row', alignItems: 'center' },
    actions: {
      flexDirection: 'row', gap: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingTop: spacing.md, marginTop: spacing.sm,
    },
    actionBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', height: 38, borderRadius: radius.md,
    },
  });