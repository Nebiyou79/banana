// ─────────────────────────────────────────────────────────────────────────────
//  src/components/freelanceTenders/FreelanceTenderCard.tsx
//  Two exports:
//   • FreelanceTenderBrowserCard  — freelancer browsing view (company logo, save)
//   • FreelanceTenderOwnerCard    — company/org owner view (applications button)
// ─────────────────────────────────────────────────────────────────────────────

import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import CompanyAvatar from '../shared/CompanyAvatar';
import type { FreelanceTenderListItem } from '../../types/freelanceTender';
import FreelanceTenderStatusBadge from './FreelanceTenderStatusBadge';
import FreelanceTenderDeadlineTimer from './FreelanceTenderDeadlineTimer';
import FreelanceTenderBudgetTag from './FreelanceTenderBudgetTag';
import FreelanceTenderSkillTags from './FreelanceTenderSkillTags';

// ─── Shared helpers ───────────────────────────────────────────────────────────
// In FreelanceTenderCard.tsx, update resolveOwnerPreview:

function resolveOwnerPreview(tender: FreelanceTenderListItem): {
  name: string;
  logoUrl: string | null;
  verified: boolean;
  type: 'company' | 'organization';
} {
  const oe = tender.ownerEntity as any;
  const o  = tender.owner as any;

  // DEBUG: Log the actual raw data
  console.log('🔍 [DEBUG] Full tender.ownerEntity:', JSON.stringify(oe, null, 2));
  console.log('🔍 [DEBUG] Full tender.owner:', JSON.stringify(o, null, 2));
  console.log('🔍 [DEBUG] Full tender object keys:', Object.keys(tender));

  if (oe && typeof oe === 'object') {
    // Try multiple possible field names for logo
    const logoUrl = 
      oe.avatarUrl || 
      oe.logo || 
      oe.logoUrl || 
      oe.avatar?.secure_url ||
      oe.avatar?.url ||
      oe.profileImage ||
      null;
    
    console.log('🔍 [DEBUG] Resolved logoUrl from ownerEntity:', logoUrl);
    
    return {
      name:     oe.name ?? oe.displayName ?? '',
      logoUrl:  logoUrl,
      verified: oe.verified ?? false,
      type:     (oe.type === 'organization' ? 'organization' : 'company') as 'company' | 'organization',
    };
  }
  
  if (o && typeof o === 'object') {
    const logoUrl = 
      o.avatarUrl || 
      o.logo || 
      o.logoUrl || 
      o.avatar?.secure_url ||
      o.avatar?.url ||
      o.profileImage ||
      null;
      
    console.log('🔍 [DEBUG] Resolved logoUrl from owner:', logoUrl);
    
    return {
      name:     o.name ?? o.displayName ?? '',
      logoUrl:  logoUrl,
      verified: o.verified ?? false,
      type:     'company',
    };
  }
  
  console.log('🔍 [DEBUG] No owner data found!');
  return { name: '', logoUrl: null, verified: false, type: 'company' };
}

// ─── Shared card shell ────────────────────────────────────────────────────────

interface CardShellProps {
  tender: FreelanceTenderListItem;
  onPress: () => void;
  children: React.ReactNode;
}

const CardShell: React.FC<CardShellProps> = memo(({ tender, onPress, children }) => {
  const { colors, radius, shadows } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: withAlpha(colors.primary, 0.10) }}
      style={({ pressed }) => [
        cardStyles.root,
        {
          backgroundColor: colors.surface,
          borderColor:     colors.border,
          borderRadius:    radius.lg,
          opacity:         pressed ? 0.93 : 1,
          ...shadows.sm,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Tender: ${tender.title}`}
    >
      {children}
    </Pressable>
  );
});

// ─── BROWSER CARD (Freelancer view) ──────────────────────────────────────────

export interface FreelanceTenderBrowserCardProps {
  tender:        FreelanceTenderListItem;
  onPress:       () => void;
  onSaveToggle?: () => void;
}

export const FreelanceTenderBrowserCard: React.FC<FreelanceTenderBrowserCardProps> = memo(
  ({ tender, onPress, onSaveToggle }) => {
    const { colors, type, radius } = useTheme();
    const owner = resolveOwnerPreview(tender);

    return (
      <CardShell tender={tender} onPress={onPress}>
        {/* ── Row 1: Company avatar + title ── */}
        <View style={cardStyles.topRow}>
          <CompanyAvatar
            preview={{
              type:     owner.type,
              name:     owner.name,
              logoUrl:  owner.logoUrl ?? undefined,
              verified: owner.verified,
            }}
            size={40}
            borderRadius={10}
          />
          <View style={cardStyles.titleBlock}>
            <Text
              style={[type.bodySm, { fontWeight: '700', color: colors.text, lineHeight: 20 }]}
              numberOfLines={2}
            >
              {tender.title}
            </Text>
            {owner.name ? (
              <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
                {owner.name}
                {owner.verified && (
                  <Text style={{ color: colors.success }}> ✓</Text>
                )}
              </Text>
            ) : null}
          </View>
          <FreelanceTenderStatusBadge status={tender.status} />
        </View>

        {/* ── Row 2: Category + deadline ── */}
        <View style={[cardStyles.row, { marginTop: 10 }]}>
          <View style={[cardStyles.categoryChip, { backgroundColor: withAlpha(colors.primary, 0.08), borderRadius: radius.sm }]}>
            <Text style={[type.caption, { color: colors.primary, fontWeight: '600' }]} numberOfLines={1}>
              {tender.procurementCategory}
            </Text>
          </View>
          <View style={cardStyles.spacer} />
          <FreelanceTenderDeadlineTimer deadline={tender.deadline} compact />
        </View>

        {/* ── Row 3: Budget + save ── */}
        <View style={[cardStyles.row, { marginTop: 10 }]}>
          <FreelanceTenderBudgetTag details={tender.details} />
          <View style={cardStyles.spacer} />
          {onSaveToggle && (
            <TouchableOpacity
              onPress={onSaveToggle}
              hitSlop={12}
              style={cardStyles.iconBtn}
              accessibilityLabel={tender.isSaved ? 'Unsave tender' : 'Save tender'}
              accessibilityRole="button"
            >
              <Ionicons
                name={tender.isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={tender.isSaved ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Row 4: Skills ── */}
        {tender.skillsRequired?.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <FreelanceTenderSkillTags skills={tender.skillsRequired} variant="compact" maxVisible={4} />
          </View>
        )}

        {/* ── Applied badge ── */}
        {tender.hasApplied && (
          <View style={[
            cardStyles.appliedBadge,
            { backgroundColor: withAlpha(colors.success, 0.11), borderRadius: radius.md },
          ]}>
            <Ionicons name="checkmark-circle" size={12} color={colors.success} />
            <Text style={[type.caption, { color: colors.success, fontWeight: '700', marginLeft: 4 }]}>
              Applied
            </Text>
          </View>
        )}
      </CardShell>
    );
  },
);

FreelanceTenderBrowserCard.displayName = 'FreelanceTenderBrowserCard';

// ─── OWNER CARD (Company / Organization view) ─────────────────────────────────

export interface FreelanceTenderOwnerCardProps {
  tender:               FreelanceTenderListItem;
  onPress:              () => void;
  onViewApplications?:  () => void;
  onViewProposals?:     () => void;
  role:                 'company' | 'organization';
}

export const FreelanceTenderOwnerCard: React.FC<FreelanceTenderOwnerCardProps> = memo(
  ({ tender, onPress, onViewApplications, onViewProposals, role }) => {
    const { colors, type, radius, spacing } = useTheme();

    const applicationCount =
      tender.metadata?.totalApplications ?? (tender as any).applicationCount ?? 0;

    const handleApplicationsPress = useCallback(
      (e: any) => {
        e.stopPropagation?.();
        onViewApplications?.();
      },
      [onViewApplications],
    );

    const handleProposalsPress = useCallback(
      (e: any) => {
        e.stopPropagation?.();
        onViewProposals?.();
      },
      [onViewProposals],
    );

    return (
      <CardShell tender={tender} onPress={onPress}>
        {/* ── Row 1: Status badge + title ── */}
        <View style={cardStyles.topRow}>
          <View style={cardStyles.titleBlock}>
            <Text
              style={[type.bodySm, { fontWeight: '700', color: colors.text, lineHeight: 20 }]}
              numberOfLines={2}
            >
              {tender.title}
            </Text>
            <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
              {tender.procurementCategory}
            </Text>
          </View>
          <FreelanceTenderStatusBadge status={tender.status} />
        </View>

        {/* ── Row 2: Budget + deadline ── */}
        <View style={[cardStyles.row, { marginTop: 10 }]}>
          <FreelanceTenderBudgetTag details={tender.details} />
          <View style={cardStyles.spacer} />
          <FreelanceTenderDeadlineTimer deadline={tender.deadline} compact />
        </View>

        {/* ── Row 3: Skills ── */}
        {tender.skillsRequired?.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <FreelanceTenderSkillTags skills={tender.skillsRequired} variant="compact" maxVisible={3} />
          </View>
        )}

        {/* ── Footer: stats + action buttons ── */}
        <View style={[cardStyles.ownerFooter, { borderTopColor: colors.border, marginTop: 12 }]}>
          {/* Application count stat */}
          <View style={cardStyles.row}>
            <Ionicons name="people-outline" size={14} color={colors.textMuted} />
            <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>
              {applicationCount} application{applicationCount !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={[cardStyles.row, { gap: 8, marginTop: 10 }]}>
            {/* Applications button → TenderApplicationsScreen */}
            {onViewApplications && (
              <TouchableOpacity
                onPress={handleApplicationsPress}
                style={[
                  cardStyles.actionBtn,
                  {
                    backgroundColor: withAlpha(colors.primary, 0.10),
                    borderColor:     withAlpha(colors.primary, 0.25),
                    borderRadius:    radius.md,
                    flex: 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="View applications"
              >
                <Ionicons name="people" size={14} color={colors.primary} />
                <Text style={[type.caption, { color: colors.primary, fontWeight: '700', marginLeft: 5 }]}>
                  Applications
                </Text>
              </TouchableOpacity>
            )}

            {/* Proposals button → TenderProposalsScreen */}
            {onViewProposals && (
              <TouchableOpacity
                onPress={handleProposalsPress}
                style={[
                  cardStyles.actionBtn,
                  {
                    backgroundColor: withAlpha(colors.info, 0.10),
                    borderColor:     withAlpha(colors.info, 0.25),
                    borderRadius:    radius.md,
                    flex: 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="View proposals"
              >
                <Ionicons name="document-text" size={14} color={colors.info} />
                <Text style={[type.caption, { color: colors.info, fontWeight: '700', marginLeft: 5 }]}>
                  Proposals
                </Text>
              </TouchableOpacity>
            )}

            {/* Chevron to detail */}
            <TouchableOpacity
              onPress={onPress}
              style={[
                cardStyles.iconBtn,
                {
                  backgroundColor: withAlpha(colors.textMuted, 0.07),
                  borderRadius:    radius.md,
                  width: 36,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open tender"
            >
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </CardShell>
    );
  },
);

FreelanceTenderOwnerCard.displayName = 'FreelanceTenderOwnerCard';

// ─── Backward-compat default export (auto-selects by role) ───────────────────

export interface FreelanceTenderCardProps {
  tender:               FreelanceTenderListItem;
  onPress:              () => void;
  onSaveToggle?:        () => void;
  onViewApplications?:  () => void;
  onViewProposals?:     () => void;
  role:                 'freelancer' | 'company' | 'organization';
}

const FreelanceTenderCard: React.FC<FreelanceTenderCardProps> = ({
  tender, onPress, onSaveToggle, onViewApplications, onViewProposals, role,
}) => {
  if (role === 'freelancer') {
    return (
      <FreelanceTenderBrowserCard
        tender={tender}
        onPress={onPress}
        onSaveToggle={onSaveToggle}
      />
    );
  }
  return (
    <FreelanceTenderOwnerCard
      tender={tender}
      onPress={onPress}
      onViewApplications={onViewApplications}
      onViewProposals={onViewProposals}
      role={role}
    />
  );
};

export default FreelanceTenderCard;

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardStyles = StyleSheet.create({
  root: {
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  titleBlock: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spacer: {
    flex: 1,
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  iconBtn: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ownerFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    minHeight: 36,
  },
});
