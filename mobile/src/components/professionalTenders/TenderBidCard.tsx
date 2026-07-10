// src/components/professionalTenders/TenderBidCard.tsx
// Professional tender card with live bid count, status badge, and actions.
// Fetches bid count from bid service for real-time display.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useGetBids } from '../../hooks/useBid';
import { withAlpha } from '../../theme/utils';
import type { ProfessionalTenderListItem, ProfessionalTenderStatus } from '../../types/professionalTender';

// ─── Status badge config ──────────────────────────────────────────────────────

type ColorFn = (colors: ReturnType<typeof useTheme>['colors']) => { bg: string; fg: string };

const STATUS_META: Record<ProfessionalTenderStatus, { label: string; getColors: ColorFn }> = {
  draft:            { label: 'Draft',            getColors: (c) => ({ bg: withAlpha(c.textMuted, 0.12), fg: c.textMuted }) },
  published:        { label: 'Published',        getColors: (c) => ({ bg: c.successBg,                   fg: c.success }) },
  closed:           { label: 'Closed',           getColors: (c) => ({ bg: c.dangerBg,                    fg: c.danger }) },
  awarded:          { label: 'Awarded',          getColors: (c) => ({ bg: withAlpha(c.warning, 0.15),    fg: c.warning }) },
  revealed:         { label: 'Revealed',         getColors: (c) => ({ bg: c.infoBg,                      fg: c.info }) },
  cancelled:        { label: 'Cancelled',        getColors: (c) => ({ bg: c.dangerBg,                    fg: c.danger }) },
  locked:           { label: 'Locked',           getColors: (c) => ({ bg: withAlpha(c.info, 0.12),       fg: c.info }) },
  deadline_reached: { label: 'Deadline Reached', getColors: (c) => ({ bg: withAlpha(c.warning, 0.12),    fg: c.warning }) },
};

// ─── Action button ────────────────────────────────────────────────────────────

type Variant = 'primary' | 'neutral' | 'success' | 'danger' | 'outline';

interface ActionButtonProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant: Variant;
  loading?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, icon, onPress, variant, loading }) => {
  const { colors } = useTheme();

  const getStyle = (): { bg: string; border: string; text: string } => {
    switch (variant) {
      case 'primary': return { bg: withAlpha(colors.primary, 0.12), border: withAlpha(colors.primary, 0.30), text: colors.primary };
      case 'success': return { bg: withAlpha(colors.success, 0.12), border: withAlpha(colors.success, 0.30), text: colors.success };
      case 'danger':  return { bg: withAlpha(colors.danger, 0.08),  border: withAlpha(colors.danger, 0.25),  text: colors.danger };
      case 'outline': return { bg: 'transparent',                   border: colors.border,                     text: colors.text };
      default:        return { bg: colors.surface,                  border: colors.border,                     text: colors.text };
    }
  };

  const s = getStyle();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        abStyles.btn,
        { backgroundColor: s.bg, borderColor: s.border, opacity: pressed || loading ? 0.7 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={s.text} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={13} color={s.text} />}
          <Text style={[abStyles.text, { color: s.text }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: ProfessionalTenderStatus }> = ({ status }) => {
  const { colors } = useTheme();
  const meta = STATUS_META[status] ?? STATUS_META.draft;
  const { bg, fg } = meta.getColors(colors);
  return (
    <View style={[sbStyles.root, { backgroundColor: bg }]}>
      <Text style={[sbStyles.label, { color: fg }]}>{meta.label.toUpperCase()}</Text>
    </View>
  );
};

// ─── Bid stat pill ────────────────────────────────────────────────────────────

interface BidStatProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color: string;
}

const BidStat: React.FC<BidStatProps> = ({ icon, value, label, color }) => (
  <View style={[bidStatStyles.root, { backgroundColor: withAlpha(color, 0.08) }]}>
    <Ionicons name={icon} size={14} color={color} />
    <Text style={[bidStatStyles.value, { color }]}>{value}</Text>
    <Text style={[bidStatStyles.label, { color }]}>{label}</Text>
  </View>
);

// ─── Main card ────────────────────────────────────────────────────────────────

export interface TenderBidCardProps {
  tender: ProfessionalTenderListItem;
  onPress: () => void;
  onEdit?: () => void;
  onViewBids?: () => void;
  onPublish?: () => void;
  onDelete?: () => void;
}

export const TenderBidCard: React.FC<TenderBidCardProps> = ({
  tender,
  onPress,
  onEdit,
  onViewBids,
  onPublish,
  onDelete,
}) => {
  const { colors, radius } = useTheme();

  // Fetch live bid count
  const { data: bidsData, isLoading: bidsLoading } = useGetBids(tender._id);

  const bidCount = bidsData?.totalBids ?? tender.bidCount ?? 0;
  const sealedCount = bidsData?.sealedBids ?? 0;
  const isSealed = (tender as any).workflowType === 'closed';
  const isDraft = tender.status === 'draft';
  const isPublished = tender.status === 'published';

  // Calculate stats
  const stats = useMemo(() => {
    if (!bidsData?.bids) return { reviewing: 0, shortlisted: 0, awarded: 0 };
    return {
      reviewing: bidsData.bids.filter((b: any) => b.status === 'under_review').length,
      shortlisted: bidsData.bids.filter((b: any) => b.status === 'shortlisted').length,
      awarded: bidsData.bids.filter((b: any) => b.status === 'awarded').length,
    };
  }, [bidsData]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        cardStyles.root,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
          borderRadius: radius.xl,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      accessibilityRole="button"
    >
      {/* Top accent strip */}
      <View style={[cardStyles.strip, { backgroundColor: isSealed ? '#8B5CF6' : colors.primary }]} />

      <View style={cardStyles.body}>
        {/* ── Header: Category + Status badges ── */}
        <View style={cardStyles.header}>
          <View style={cardStyles.badges}>
            {tender.procurementCategory && (
              <View style={[cardStyles.categoryBadge, { backgroundColor: colors.surface }]}>
                <Text style={[cardStyles.categoryText, { color: colors.textMuted }]}>
                  {tender.procurementCategory}
                </Text>
              </View>
            )}
            <View style={[cardStyles.workflowBadge, {
              backgroundColor: isSealed ? withAlpha('#8B5CF6', 0.12) : withAlpha(colors.success, 0.12),
            }]}>
              <Ionicons
                name={isSealed ? 'lock-closed' : 'lock-open'}
                size={10}
                color={isSealed ? '#8B5CF6' : colors.success}
              />
              <Text style={[cardStyles.workflowText, { color: isSealed ? '#8B5CF6' : colors.success }]}>
                {isSealed ? 'Sealed' : 'Open'}
              </Text>
            </View>
          </View>
          <StatusBadge status={tender.status} />
        </View>

        {/* ── Title ── */}
        <Text style={[cardStyles.title, { color: colors.text }]} numberOfLines={2}>
          {tender.title}
        </Text>

        {/* ── Reference + Deadline ── */}
        <View style={cardStyles.metaRow}>
          {tender.referenceNumber && (
            <Text style={[cardStyles.ref, { color: colors.textMuted }]}>
              Ref: {tender.referenceNumber}
            </Text>
          )}
          {tender.deadline && (
            <View style={cardStyles.deadline}>
              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
              <Text style={[cardStyles.deadlineText, { color: colors.textMuted }]}>
                {new Date(tender.deadline).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* ── Divider ── */}
        <View style={[cardStyles.divider, { backgroundColor: colors.border }]} />

        {/* ── Bid Stats ── */}
        {bidsLoading ? (
          <View style={cardStyles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[cardStyles.loadingText, { color: colors.textMuted }]}>Loading bids...</Text>
          </View>
        ) : (
          <View style={cardStyles.statsGrid}>
            <BidStat
              icon="mail-outline"
              value={bidCount}
              label="Total Bids"
              color={colors.primary}
            />
            {isSealed && sealedCount > 0 && (
              <BidStat
                icon="lock-closed"
                value={sealedCount}
                label="Sealed"
                color="#8B5CF6"
              />
            )}
            {stats.reviewing > 0 && (
              <BidStat
                icon="search-outline"
                value={stats.reviewing}
                label="In Review"
                color="#3B82F6"
              />
            )}
            {stats.shortlisted > 0 && (
              <BidStat
                icon="star-outline"
                value={stats.shortlisted}
                label="Shortlisted"
                color="#14B8A6"
              />
            )}
            {stats.awarded > 0 && (
              <BidStat
                icon="trophy-outline"
                value={stats.awarded}
                label="Awarded"
                color="#F1BB03"
              />
            )}
          </View>
        )}

        {/* ── Actions ── */}
        <View style={cardStyles.actionsRow}>
          {onViewBids && bidCount > 0 && (
            <ActionButton
              label={`View Bids (${bidCount})`}
              icon="eye-outline"
              onPress={onViewBids}
              variant="primary"
            />
          )}
          {onViewBids && bidCount === 0 && (
            <ActionButton
              label="No Bids Yet"
              icon="mail-outline"
              onPress={onViewBids}
              variant="outline"
            />
          )}
          {onEdit && isDraft && (
            <ActionButton label="Edit" icon="create-outline" onPress={onEdit} variant="neutral" />
          )}
          {onPublish && isDraft && (
            <ActionButton label="Publish" icon="paper-plane-outline" onPress={onPublish} variant="success" />
          )}
          {onDelete && isDraft && (
            <ActionButton label="Delete" icon="trash-outline" onPress={onDelete} variant="danger" />
          )}
        </View>
      </View>
    </Pressable>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardStyles = StyleSheet.create({
  root: { borderWidth: 1, overflow: 'hidden', flexDirection: 'row' },
  strip: { width: 4, alignSelf: 'stretch' },
  body: { flex: 1, padding: 14, gap: 8 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  categoryBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  categoryText: { fontSize: 10, fontWeight: '600' },
  workflowBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  workflowText: { fontSize: 9, fontWeight: '700' },

  // Title & Meta
  title: { fontSize: 15, fontWeight: '700', lineHeight: 20, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  ref: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  deadline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deadlineText: { fontSize: 11 },

  // Divider
  divider: { height: 1, marginVertical: 2 },

  // Stats
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  loadingText: { fontSize: 12 },
  statsGrid: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },

  // Actions
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
});

const abStyles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, minHeight: 36 },
  text: { fontSize: 11, fontWeight: '700' },
});

const sbStyles = StyleSheet.create({
  root: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, flexShrink: 0 },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});

const bidStatStyles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  value: { fontSize: 13, fontWeight: '800' },
  label: { fontSize: 9, fontWeight: '600' },
});

export default TenderBidCard;