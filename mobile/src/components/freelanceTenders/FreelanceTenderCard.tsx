import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import type { FreelanceTenderListItem } from '../../types/freelanceTender';
import FreelanceTenderBudgetTag from './FreelanceTenderBudgetTag';
import FreelanceTenderDeadlineTimer from './FreelanceTenderDeadlineTimer';
import FreelanceTenderSkillTags from './FreelanceTenderSkillTags';
import FreelanceTenderStatusBadge from './FreelanceTenderStatusBadge';

export interface FreelanceTenderCardProps {
  tender: FreelanceTenderListItem;
  onPress: () => void;
  onSaveToggle?: () => void;
  role: 'freelancer' | 'company' | 'organization';
}

function getOwnerName(
  owner: FreelanceTenderListItem['owner'] | FreelanceTenderListItem['ownerEntity'],
): string {
  if (!owner) return '';
  if (typeof owner === 'string') return '';
  return (owner as { name?: string }).name ?? '';
}

const FreelanceTenderCard: React.FC<FreelanceTenderCardProps> = memo(
  ({ tender, onPress, onSaveToggle, role }) => {
    const { colors: c, radius, type, shadows, spacing } = useTheme();
    const styles = useMemo(() => makeStyles(c, radius, spacing, shadows), [c, radius, spacing, shadows]);

    const isFreelancer = role === 'freelancer';
    const isOwner = role === 'company' || role === 'organization';
    const ownerName = getOwnerName(tender.ownerEntity) || getOwnerName(tender.owner);
    const applicationCount = tender.metadata?.totalApplications ?? tender.applicationCount ?? 0;

    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: withAlpha(c.primary, 0.13) }}
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.92 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={`Tender: ${tender.title}`}
      >
        {/* Row 1 — Title + Status */}
        <View style={styles.row}>
          <Text style={[type.bodySm, { fontWeight: '700', color: c.text, flex: 1, lineHeight: 20 }]} numberOfLines={2}>
            {tender.title}
          </Text>
          <FreelanceTenderStatusBadge status={tender.status} />
        </View>

        {/* Row 2 — Category + Deadline */}
        <View style={[styles.row, styles.mt6]}>
          <Text style={[type.caption, { color: c.textMuted, flex: 1 }]} numberOfLines={1}>
            {tender.procurementCategory}{ownerName ? ` · ${ownerName}` : ''}
          </Text>
          <FreelanceTenderDeadlineTimer deadline={tender.deadline} />
        </View>

        {/* Row 3 — Budget + Save */}
        <View style={[styles.row, styles.mt10]}>
          <FreelanceTenderBudgetTag details={tender.details} />
          {isFreelancer && onSaveToggle && (
            <Pressable
              onPress={onSaveToggle}
              hitSlop={12}
              style={styles.saveBtn}
              accessibilityLabel={tender.isSaved ? 'Unsave tender' : 'Save tender'}
              accessibilityRole="button"
            >
              <Ionicons
                name={tender.isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={tender.isSaved ? c.primary : c.textMuted}
              />
            </Pressable>
          )}
        </View>

        {/* Row 4 — Skills */}
        {tender.skillsRequired?.length > 0 && (
          <View style={styles.mt8}>
            <FreelanceTenderSkillTags skills={tender.skillsRequired} variant="compact" />
          </View>
        )}

        {/* Applied badge */}
        {isFreelancer && tender.hasApplied && (
          <View style={[styles.appliedBadge, { backgroundColor: withAlpha(c.success, 0.12) }]}>
            <Ionicons name="checkmark-circle" size={12} color={c.success} />
            <Text style={[type.caption, { color: c.success, fontWeight: '700', marginLeft: 4 }]}>
              Applied
            </Text>
          </View>
        )}

        {/* Footer — App count for owner */}
        {isOwner && (
          <View style={[styles.footer, { borderTopColor: c.border }]}>
            <View style={styles.row}>
              <Ionicons name="people-outline" size={14} color={c.textMuted} />
              <Text style={[type.caption, { color: c.textMuted, fontWeight: '600' }]}>
                {applicationCount} application{applicationCount !== 1 ? 's' : ''}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={c.textMuted} style={{ marginLeft: 'auto' }} />
            </View>
          </View>
        )}
      </Pressable>
    );
  },
);

FreelanceTenderCard.displayName = 'FreelanceTenderCard';

const makeStyles = (c: any, radius: any, spacing: any, shadows: any) =>
  StyleSheet.create({
    card: {
      padding: spacing.lg,
      borderRadius: radius.lg,
      marginBottom: 12,
      backgroundColor: c.surface ?? c.bgCard,
      ...shadows.sm,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    mt6:  { marginTop: 6 },
    mt8:  { marginTop: 8 },
    mt10: { marginTop: 10 },
    saveBtn: {
      minWidth: 44, minHeight: 44,
      alignItems: 'center', justifyContent: 'center',
      marginLeft: 'auto',
    },
    appliedBadge: {
      marginTop: 10,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10, paddingVertical: 4,
      borderRadius: 10,
    },
    footer: {
      marginTop: 12, paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
  });

export default FreelanceTenderCard;