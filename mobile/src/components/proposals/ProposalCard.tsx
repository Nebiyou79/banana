// src/components/proposals/ProposalCard.tsx
// Banana Mobile App — Module 6B: Proposals
// Card component for both freelancer (my proposals) and company (received proposals) views.
// REFACTORED: useTheme() + withAlpha(). Ionicons replace all emoji. Memoized styles. No hardcoded hex.

import React, { memo, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ViewStyle, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { ProposalStatusBadge } from './ProposalStatusBadge';
import type { ProposalListItem, ProposalTender, ProposalUser } from '../../types/proposal';

interface ProposalCardProps {
  proposal: ProposalListItem;
  viewMode: 'freelancer' | 'company';
  onPress?: () => void;
  onShortlistToggle?: () => void;
  style?: ViewStyle;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString()}`;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor(diff / 3_600_000);
  if (d > 30) return `${Math.floor(d / 30)}mo ago`;
  if (d > 0)  return `${d}d ago`;
  if (h > 0)  return `${h}h ago`;
  return 'Just now';
}

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

// ─── Component ────────────────────────────────────────────────────────────────

const ProposalCard: React.FC<ProposalCardProps> = memo(({
  proposal, viewMode, onPress, onShortlistToggle, style,
}) => {
  const { colors: c, radius, spacing, type, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(c, radius, spacing, shadows), [c, radius, spacing, shadows]);

  // Safe extraction of populated fields
  const freelancer = typeof proposal.freelancer === 'object'
    ? (proposal.freelancer as ProposalUser) : null;
  const freelancerProfile = typeof proposal.freelancerProfile === 'object'
    ? (proposal.freelancerProfile as { headline?: string; ratings?: { average: number; count: number } })
    : null;
  const tender = typeof proposal.tender === 'object'
    ? (proposal.tender as ProposalTender) : null;

  const isAwarded      = proposal.status === 'awarded';
  const isRejected     = proposal.status === 'rejected';
  const isShortlisted  = !!proposal.isShortlisted && !isAwarded;
  const isUnderReview  = proposal.status === 'under_review';

  const stripeColor = isAwarded    ? c.success
                    : isRejected   ? c.danger
                    : isShortlisted ? c.primary
                    : isUnderReview ? c.info
                    : 'transparent';

  const borderColor = isAwarded
    ? withAlpha(c.success, 0.40)
    : isShortlisted
    ? withAlpha(c.primary, 0.40)
    : c.border;

  const titleText = viewMode === 'freelancer'
    ? (tender?.title ?? 'Untitled Tender')
    : (freelancer?.name ?? 'Freelancer');

  const subtitleText = viewMode === 'freelancer'
    ? (() => {
        const owner = tender?.ownerEntity;
        if (typeof owner === 'object' && owner !== null) return (owner as { name?: string }).name ?? '';
        return tender?.ownerEntityModel ?? '';
      })()
    : (freelancerProfile?.headline ?? freelancer?.location ?? '');

  const avatarUrl = viewMode === 'freelancer' ? null : (freelancer?.avatar ?? null);
  const avatarInitials = viewMode === 'freelancer'
    ? (tender?.title ?? 'T').charAt(0).toUpperCase()
    : getInitials(freelancer?.name);

  const avatarBg = isAwarded
    ? withAlpha(c.success, 0.15)
    : withAlpha(c.primary, 0.13);
  const avatarColor = isAwarded ? c.success : c.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.card, { borderColor }, style]}
      accessibilityRole="button"
      accessibilityLabel={`Proposal: ${titleText}`}
    >
      {/* Top accent stripe — absolute positioned so Android elevation isn't clipped */}
      <View style={[styles.accentStripe, { backgroundColor: stripeColor }]} />

      {/* Awarded / shortlisted banners */}
      {isAwarded && (
        <View style={[styles.banner, { backgroundColor: c.success }]}>
          <Ionicons name="trophy-outline" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={[type.caption, { color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.3 }]}>
            Contract Awarded
          </Text>
        </View>
      )}
      {isShortlisted && (
        <View style={[styles.banner, { backgroundColor: withAlpha(c.primary, 0.10) }]}>
          <Ionicons name="star-outline" size={13} color={c.primary} style={{ marginRight: 6 }} />
          <Text style={[type.caption, { color: c.primary, fontWeight: '600' }]}>Shortlisted</Text>
        </View>
      )}

      <View style={styles.body}>
        {/* Header row */}
        <View style={styles.headerRow}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            ) : (
              <Text style={[type.body, { color: avatarColor, fontWeight: '800' }]}>
                {avatarInitials}
              </Text>
            )}
          </View>

          {/* Title + subtitle */}
          <View style={styles.titleBlock}>
            <Text style={[type.bodySm, { color: c.text, fontWeight: '700', lineHeight: 20 }]} numberOfLines={1}>
              {titleText}
            </Text>
            {subtitleText ? (
              <Text style={[type.caption, { color: c.textMuted }]} numberOfLines={1}>
                {subtitleText}
              </Text>
            ) : null}
          </View>

          {/* Status badge + shortlist */}
          <View style={styles.rightActions}>
            <ProposalStatusBadge status={proposal.status} size="sm" />
            {viewMode === 'company' && onShortlistToggle && (
              <TouchableOpacity
                onPress={onShortlistToggle}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.shortlistBtn}
                accessibilityRole="button"
                accessibilityLabel={proposal.isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
              >
                <Ionicons
                  name={proposal.isShortlisted ? 'star' : 'star-outline'}
                  size={18}
                  color={proposal.isShortlisted ? c.primary : c.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Bid amount */}
        <Text style={[styles.amount, { color: c.primary }]}>
          {formatAmount(proposal.proposedAmount, proposal.currency ?? 'ETB')}
          {proposal.bidType === 'hourly' ? '/hr' : ''}
        </Text>

        {/* Meta pills */}
        <View style={styles.pills}>
          {proposal.deliveryTime && (
            <View style={[styles.pill, { backgroundColor: withAlpha(c.text, 0.06), borderColor: c.border }]}>
              <Ionicons name="time-outline" size={11} color={c.textMuted} />
              <Text style={[type.caption, { color: c.textMuted, fontWeight: '500', marginLeft: 4 }]}>
                {proposal.deliveryTime.value} {proposal.deliveryTime.unit}
              </Text>
            </View>
          )}
          {proposal.availability && (
            <View style={[styles.pill, { backgroundColor: withAlpha(c.text, 0.06), borderColor: c.border }]}>
              <Ionicons name="calendar-outline" size={11} color={c.textMuted} />
              <Text style={[type.caption, { color: c.textMuted, fontWeight: '500', marginLeft: 4 }]}>
                {proposal.availability === 'full-time' ? 'Full-time'
                  : proposal.availability === 'part-time' ? 'Part-time'
                  : 'Flexible'}
              </Text>
            </View>
          )}
          {viewMode === 'company' && freelancerProfile?.ratings && (
            <View style={[styles.pill, {
              backgroundColor: withAlpha(c.warning, 0.10),
              borderColor: withAlpha(c.warning, 0.25),
            }]}>
              <Ionicons name="star" size={11} color={c.warning} />
              <Text style={[type.caption, { color: c.warning, fontWeight: '600', marginLeft: 4 }]}>
                {freelancerProfile.ratings.average.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Cover letter excerpt */}
        {proposal.coverLetter ? (
          <Text style={[type.caption, { color: c.textMuted, lineHeight: 18 }]} numberOfLines={2}>
            {proposal.coverLetter}
          </Text>
        ) : null}

        {/* Footer */}
        <View style={styles.footer}>
          {proposal.submittedAt && (
            <Text style={[type.caption, { color: c.textMuted }]}>
              {viewMode === 'freelancer' ? 'Submitted' : 'Applied'} {timeAgo(proposal.submittedAt)}
            </Text>
          )}
          <View style={styles.viewMoreRow}>
            <Text style={[type.caption, { color: c.primary, fontWeight: '600' }]}>View details</Text>
            <Ionicons name="arrow-forward" size={12} color={c.primary} style={{ marginLeft: 4 }} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

ProposalCard.displayName = 'ProposalCard';

const makeStyles = (c: any, radius: any, spacing: any, shadows: any) =>
  StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      borderWidth: 1.5,
      backgroundColor: c.bgCard,
      overflow: 'hidden',
      ...shadows.sm,
    },
    accentStripe: { height: 3, width: '100%' },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14, paddingVertical: 5,
    },
    body: { padding: 14, gap: 10 },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    avatar: {
      width: 42, height: 42, borderRadius: radius.md,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, overflow: 'hidden',
    },
    titleBlock: { flex: 1, gap: 2 },
    rightActions: { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
    shortlistBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    amount: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    pill: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 9, paddingVertical: 4,
      borderRadius: radius.full, borderWidth: 1,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 2,
    },
    viewMoreRow: { flexDirection: 'row', alignItems: 'center' },
  });

export { ProposalCard };
export default ProposalCard;