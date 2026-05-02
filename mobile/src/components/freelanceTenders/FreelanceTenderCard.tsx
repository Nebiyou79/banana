// mobile/src/components/freelanceTenders/FreelanceTenderCard.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import type { FreelanceTenderListItem } from '../../types/freelanceTender';
import FreelanceTenderBudgetTag from './FreelanceTenderBudgetTag';
import FreelanceTenderDeadlineTimer from './FreelanceTenderDeadlineTimer';
import FreelanceTenderSkillTags from './FreelanceTenderSkillTags';
import FreelanceTenderStatusBadge from './FreelanceTenderStatusBadge';

export interface FreelanceTenderCardProps {
  tender: FreelanceTenderListItem;
  /** Called when card body is pressed — no args, callee closes over tenderId */
  onPress: () => void;
  onSaveToggle?: () => void;
  role: 'freelancer' | 'company' | 'organization';
}

function getOwnerName(
  owner: FreelanceTenderListItem['owner'] | FreelanceTenderListItem['ownerEntity']
): string {
  if (!owner) return '';
  if (typeof owner === 'string') return '';
  return (owner as { name?: string }).name ?? '';
}

const FreelanceTenderCard: React.FC<FreelanceTenderCardProps> = memo(
  ({ tender, onPress, onSaveToggle, role }) => {
    const { theme } = useThemeStore();
    const c = theme.colors;

    const isFreelancer = role === 'freelancer';
    const isOwner = role === 'company' || role === 'organization';

    const ownerName =
      getOwnerName(tender.ownerEntity) || getOwnerName(tender.owner);

    const applicationCount =
      tender.metadata?.totalApplications ?? tender.applicationCount ?? 0;

    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: c.primary + '22' }}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: c.surface ?? c.card,
            shadowColor: c.text,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Tender: ${tender.title}`}
      >
        {/* Row 1 — Title + Status Badge */}
        <View style={styles.row}>
          <Text style={[styles.title, { color: c.text, flex: 1 }]} numberOfLines={2}>
            {tender.title}
          </Text>
          <FreelanceTenderStatusBadge status={tender.status} />
        </View>

        {/* Row 2 — Category · Owner + Deadline */}
        <View style={[styles.row, styles.mt6]}>
          <Text style={[styles.meta, { color: c.textMuted, flex: 1 }]} numberOfLines={1}>
            {tender.procurementCategory}
            {ownerName ? ` · ${ownerName}` : ''}
          </Text>
          <FreelanceTenderDeadlineTimer deadline={tender.deadline} />
        </View>

        {/* Row 3 — Budget + Save toggle */}
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

        {/* Row 4 — Skill tags */}
        {tender.skillsRequired?.length > 0 && (
          <View style={styles.mt8}>
            <FreelanceTenderSkillTags skills={tender.skillsRequired} variant="compact" />
          </View>
        )}

        {/* Applied badge */}
        {isFreelancer && tender.hasApplied && (
          <View style={[styles.appliedBadge, { backgroundColor: (c.success ?? '#10B981') + '18' }]}>
            <Text style={[styles.appliedText, { color: c.success ?? '#10B981' }]}>✓ Applied</Text>
          </View>
        )}

        {/* Footer — Application count (company/org owner) */}
        {isOwner && (
          <View style={[styles.footer, { borderTopColor: c.border ?? c.textMuted + '22' }]}>
            <View style={styles.row}>
              <Ionicons name="people-outline" size={14} color={c.textMuted} />
              <Text style={[styles.footerText, { color: c.textMuted }]}>
                {applicationCount} application{applicationCount !== 1 ? 's' : ''}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={c.textMuted}
                style={styles.chevron}
              />
            </View>
          </View>
        )}
      </Pressable>
    );
  }
);

FreelanceTenderCard.displayName = 'FreelanceTenderCard';

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  meta: { fontSize: 12, lineHeight: 16 },
  mt6: { marginTop: 6 },
  mt8: { marginTop: 8 },
  mt10: { marginTop: 10 },
  saveBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  appliedBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  appliedText: { fontSize: 11, fontWeight: '700' },
  footer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: { fontSize: 12, fontWeight: '600' },
  chevron: { marginLeft: 'auto' },
});

export default FreelanceTenderCard;
