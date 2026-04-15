import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
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
  default:     'construct-outline',
};

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service, onEdit, onDelete, isOwner = false,
}) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography, shadows, spacing } = theme;

  const catKey = service.category?.toLowerCase() ?? 'default';
  const iconName = CATEGORY_ICONS[catKey] ?? CATEGORY_ICONS.default;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: borderRadius.xl,
          borderColor: service.isActive !== false ? colors.primary + '30' : colors.border,
          ...shadows.sm,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: colors.primaryLight, borderRadius: borderRadius.md }]}>
          <Ionicons name={iconName} size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing[3] }}>
          <Text style={{ fontSize: typography.base, fontWeight: '700', color: colors.text }} numberOfLines={2}>
            {service.title}
          </Text>
          {service.category && (
            <Text style={{ fontSize: typography.xs, color: colors.textMuted, marginTop: 2 }}>
              {service.category}
            </Text>
          )}
        </View>

        {/* Status badge */}
        <View style={[
          styles.statusBadge,
          {
            backgroundColor: service.isActive !== false ? colors.successLight : colors.errorLight,
            borderRadius: 20,
          },
        ]}>
          <View style={[
            styles.statusDot,
            { backgroundColor: service.isActive !== false ? colors.success : colors.error },
          ]} />
          <Text style={{
            fontSize: 9,
            fontWeight: '700',
            color: service.isActive !== false ? colors.success : colors.error,
          }}>
            {service.isActive !== false ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Description */}
      {service.description && (
        <Text style={[styles.desc, { color: colors.textMuted, fontSize: typography.sm }]} numberOfLines={2}>
          {service.description}
        </Text>
      )}

      {/* Meta row */}
      <View style={[styles.metaRow, { borderTopColor: colors.border, paddingTop: spacing[3], marginTop: spacing[3] }]}>
        {service.price != null && (
          <View style={styles.metaItem}>
            <Ionicons name="pricetag-outline" size={13} color={colors.primary} />
            <Text style={{ fontSize: typography.sm, color: colors.primary, fontWeight: '700', marginLeft: 4 }}>
              ${service.price.toLocaleString()}
            </Text>
            {service.priceType && (
              <Text style={{ fontSize: 10, color: colors.textMuted, marginLeft: 4 }}>
                · {PRICE_TYPE_LABELS[service.priceType] ?? service.priceType}
              </Text>
            )}
          </View>
        )}
        {service.deliveryTime && (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.textMuted} />
            <Text style={{ fontSize: typography.xs, color: colors.textMuted, marginLeft: 4 }}>
              {service.deliveryTime}
            </Text>
          </View>
        )}
      </View>

      {/* Owner actions */}
      {isOwner && (onEdit || onDelete) && (
        <View style={[styles.actions, { borderTopColor: colors.border, paddingTop: spacing[3], marginTop: spacing[2] }]}>
          {onEdit && (
            <TouchableOpacity
              onPress={() => onEdit(service)}
              style={[styles.actionBtn, { backgroundColor: colors.primaryLight, borderRadius: borderRadius.md }]}
            >
              <Ionicons name="pencil-outline" size={14} color={colors.primary} />
              <Text style={{ fontSize: typography.xs, color: colors.primary, fontWeight: '700', marginLeft: 4 }}>
                Edit
              </Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(service._id)}
              style={[styles.actionBtn, { backgroundColor: colors.errorLight, borderRadius: borderRadius.md }]}
            >
              <Ionicons name="trash-outline" size={14} color={colors.error} />
              <Text style={{ fontSize: typography.xs, color: colors.error, fontWeight: '700', marginLeft: 4 }}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  desc: {
    marginTop: 10,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
  },
});
