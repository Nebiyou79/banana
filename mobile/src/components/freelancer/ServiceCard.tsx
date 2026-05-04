// ServiceCard.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import type { FreelancerServiceItem } from '../../types/freelancer';

interface ServiceCardProps {
  service: FreelancerServiceItem;
  onEdit?: (service: FreelancerServiceItem) => void;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
}

const PRICE_TYPE_LABELS: Record<string, string> = {
  fixed:      'Fixed Price',
  hourly:     'Per Hour',
  negotiable: 'Negotiable',
};

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  design:      'color-palette-outline',
  development: 'code-slash-outline',
  marketing:   'megaphone-outline',
  writing:     'document-text-outline',
  consulting:  'briefcase-outline',
  data:        'bar-chart-outline',
  default:     'construct-outline',
};

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service, onEdit, onDelete, isOwner = false,
}) => {
  const { colors, radius, type, shadows, spacing } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const catKey  = service.category?.toLowerCase() ?? 'default';
  const iconName = CATEGORY_ICONS[catKey] ?? CATEGORY_ICONS.default;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderRadius: radius.xl,
          borderColor: service.isActive !== false ? colors.accent + '30' : colors.borderPrimary,
          ...shadows.sm,
        },
      ]}>
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: colors.accentBg, borderRadius: radius.md }]}>
            <Ionicons name={iconName} size={22} color={colors.accent} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[type.h4, { color: colors.textPrimary }]} numberOfLines={2}>
              {service.title}
            </Text>
            {service.category && (
              <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                {service.category}
              </Text>
            )}
          </View>

          <View style={[styles.statusBadge, { backgroundColor: service.isActive !== false ? colors.successBg : colors.errorBg, borderRadius: radius.full }]}>
            <View style={[styles.statusDot, { backgroundColor: service.isActive !== false ? colors.success : colors.error }]} />
            <Text style={[type.caption, { fontWeight: '700', color: service.isActive !== false ? colors.success : colors.error }]}>
              {service.isActive !== false ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {service.description && (
          <Text style={[styles.desc, type.bodySm, { color: colors.textMuted }]} numberOfLines={2}>
            {service.description}
          </Text>
        )}

        <View style={[styles.metaRow, { borderTopColor: colors.borderPrimary, paddingTop: spacing.md, marginTop: spacing.md }]}>
          {service.price != null && (
            <View style={styles.metaItem}>
              <Ionicons name="pricetag-outline" size={13} color={colors.accent} />
              <Text style={[type.bodySm, { color: colors.accent, fontWeight: '700', marginLeft: spacing.xs }]}>
                ${service.price.toLocaleString()}
              </Text>
              {service.priceType && (
                <Text style={[type.caption, { color: colors.textMuted, marginLeft: spacing.xs }]}>
                  · {PRICE_TYPE_LABELS[service.priceType] ?? service.priceType}
                </Text>
              )}
            </View>
          )}
          {service.deliveryTime && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={colors.textMuted} />
              <Text style={[type.caption, { color: colors.textMuted, marginLeft: spacing.xs }]}>
                {service.deliveryTime}
              </Text>
            </View>
          )}
        </View>

        {isOwner && (onEdit || onDelete) && (
          <View style={[styles.actions, { borderTopColor: colors.borderPrimary, paddingTop: spacing.md, marginTop: spacing.sm }]}>
            {onEdit && (
              <TouchableOpacity
                onPress={() => onEdit(service)}
                style={[styles.actionBtn, { backgroundColor: colors.accentBg, borderRadius: radius.md }]}
              >
                <Ionicons name="pencil-outline" size={14} color={colors.accent} />
                <Text style={[type.caption, { color: colors.accent, fontWeight: '700', marginLeft: spacing.xs }]}>Edit</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={() => onDelete(service._id)}
                style={[styles.actionBtn, { backgroundColor: colors.errorBg, borderRadius: radius.md }]}
              >
                <Ionicons name="trash-outline" size={14} color={colors.error} />
                <Text style={[type.caption, { color: colors.error, fontWeight: '700', marginLeft: spacing.xs }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card:       { padding: 16, borderWidth: 1.5, marginBottom: 12 },
  header:     { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox:    { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  statusDot:  { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  desc:       { marginTop: 10, lineHeight: 18 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1 },
  metaItem:   { flexDirection: 'row', alignItems: 'center' },
  actions:    { flexDirection: 'row', gap: 10, borderTopWidth: 1 },
  actionBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 38 },
});