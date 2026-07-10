// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/OwnerTenderDetails.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  UPDATED: Bids tab now shows OpenBidCard components with real bid data
//  FIXED (per TENDER_BID_SCREENS_UI_FIX.md §0.1, §0.2, §0.3, §0.4, §0.8):
//   • Replaced useThemeStore + local palette → useTheme()
//   • Action button colors: primary=colors.primary, destructive=colors.danger
//   • Tab strip active: colors.primary (gold)
//   • Insets on ScrollView paddingBottom
//   • All colors through tokens

import React, { useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { useGetBids } from '../../hooks/useBid';
import TenderHeader from './TenderHeader';
import SealedBidBanner from './SealedBidBanner';
import { OpenBidCard } from '../bids/OpenBidCard';
import {
  TenderProcurementInfo,
  TenderEligibilityInfo,
  TenderEvaluationInfo,
  TenderDatesInfo,
} from './TenderInfoComponents';
import TenderAttachmentList from './TenderAttachmentList';
import TenderAddendumList from './TenderAddendumList';
import { SectionCard, InfoRow } from './_shared';
import {
  areSealedBidsViewable,
  getAvailableActions,
  isTenderEditable,
  type ProfessionalTender,
  type TenderAction,
  type TenderAttachment,
} from '../../types/professionalTender';
import { Bid, BidStatus } from '../../types/bid';

// ═════════════════════════════════════════════════════════════════════════════
//  PROPS
// ═════════════════════════════════════════════════════════════════════════════

export type OwnerTabKey = 'overview' | 'details' | 'attachments' | 'addenda' | 'bids';

export interface OwnerTenderDetailsProps {
  tender:               ProfessionalTender;
  onAction?:            (action: TenderAction) => void;
  isMutating?:          boolean;
  onRevealBids?:        () => void;
  isRevealing?:         boolean;
  onUploadAttachment?:  () => void;
  onRemoveAttachment?:  (attachment: TenderAttachment) => void;
  onDownloadAttachment?: (attachment: TenderAttachment) => void;
  onIssueAddendum?:     () => void;
  onViewAllBids?:       () => void;
  onViewBidDetail?:     (bidId: string) => void;
  initialTab?:          OwnerTabKey;
  onBack?:              () => void;
}

// ═════════════════════════════════════════════════════════════════════════════
//  TABS
// ═════════════════════════════════════════════════════════════════════════════

interface TabDef { key: OwnerTabKey; label: string; icon: string }

const TABS: ReadonlyArray<TabDef> = [
  { key: 'overview',    label: 'Overview',    icon: 'grid-outline'          },
  { key: 'details',     label: 'Details',     icon: 'document-text-outline' },
  { key: 'attachments', label: 'Attachments', icon: 'folder-open-outline'   },
  { key: 'addenda',     label: 'Addenda',     icon: 'albums-outline'        },
  { key: 'bids',        label: 'Bids',        icon: 'inbox-outline'         },
];

// ─── Tab strip ────────────────────────────────────────────────────────────────

const TabStrip: React.FC<{
  current:  OwnerTabKey;
  onChange: (k: OwnerTabKey) => void;
  badges?:  Partial<Record<OwnerTabKey, number>>;
}> = ({ current, onChange, badges }) => {
  const { colors } = useTheme();

  return (
    <View style={[tabS.bar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tabS.row}
      >
        {TABS.map((t) => {
          const isActive = t.key === current;
          const fg       = isActive ? colors.primary : colors.textMuted;
          const badge    = badges?.[t.key];
          return (
            <Pressable
              key={t.key}
              onPress={() => onChange(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={t.label}
              style={({ pressed }: { pressed: boolean }) => [
                tabS.tab,
                {
                  borderBottomColor: isActive ? colors.primary : 'transparent',
                  opacity:           pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons name={t.icon as any} size={15} color={fg} />
              <Text style={[tabS.label, { color: fg }]} numberOfLines={1}>
                {t.label}
              </Text>
              {badge !== undefined && badge > 0 && (
                <View style={[tabS.badge, { backgroundColor: withAlpha(colors.primary, 0.15) }]}>
                  <Text style={[tabS.badgeText, { color: colors.primary }]}>
                    {badge > 99 ? '99+' : badge}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const tabS = StyleSheet.create({
  bar:       { borderBottomWidth: 1 },
  row:       { paddingHorizontal: 8 },
  tab:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2.5, minHeight: 44 },
  label:     { fontSize: 13, fontWeight: '700' },
  badge:     { minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10, fontWeight: '800' },
});

// ═════════════════════════════════════════════════════════════════════════════
//  ACTION META — intent → theme token colors
// ═════════════════════════════════════════════════════════════════════════════

interface ActionMeta {
  label:  string;
  icon:   string;
  intent: 'primary' | 'secondary' | 'destructive' | 'accent';
}

const ACTION_META: Record<TenderAction, ActionMeta> = {
  publish:     { label: 'Publish',       icon: 'send',                  intent: 'primary'     },
  edit:        { label: 'Edit',          icon: 'create-outline',        intent: 'secondary'   },
  delete:      { label: 'Delete',        icon: 'trash-outline',         intent: 'destructive' },
  lock:        { label: 'Lock',          icon: 'lock-closed-outline',   intent: 'accent'      },
  reveal:      { label: 'Reveal Bids',   icon: 'eye-outline',           intent: 'primary'     },
  close:       { label: 'Close Tender',  icon: 'checkmark-done',        intent: 'secondary'   },
  addAddendum: { label: 'Add Addendum',  icon: 'document-text-outline', intent: 'secondary'   },
  viewAllBids: { label: 'View All Bids', icon: 'list-outline',          intent: 'primary'     },
};

// ═════════════════════════════════════════════════════════════════════════════
//  STAT TILE
// ═════════════════════════════════════════════════════════════════════════════

const StatTile: React.FC<{
  icon:    string;
  label:   string;
  value:   string;
  hint?:   string;
  masked?: boolean;
}> = ({ icon, label, value, hint, masked }) => {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        stS.root,
        {
          backgroundColor: colors.bgCard,
          borderColor:     colors.border,
          borderRadius:    radius.md,
        },
      ]}
    >
      <Ionicons name={icon as any} size={18} color={masked ? colors.textMuted : colors.primary} />
      <Text style={[stS.value, { color: masked ? colors.textMuted : colors.text }]}>
        {value}
      </Text>
      <Text style={[stS.label, { color: colors.textMuted }]}>{label}</Text>
      {!!hint && (
        <Text style={[stS.hint, { color: colors.textMuted }]} numberOfLines={1}>
          {hint}
        </Text>
      )}
    </View>
  );
};

const stS = StyleSheet.create({
  root:  { flex: 1, alignItems: 'center', padding: 12, borderWidth: 1, gap: 4, minHeight: 80 },
  value: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  hint:  { fontSize: 10, textAlign: 'center', maxWidth: 100 },
});

// ═════════════════════════════════════════════════════════════════════════════
//  BIDS TAB CONTENT (NEW)
// ═════════════════════════════════════════════════════════════════════════════

const BidsTabContent: React.FC<{
  tenderId: string;
  isSealedHidden: boolean;
  isBidsRevealed: boolean;
  onViewBidDetail?: (bidId: string) => void;
}> = ({ tenderId, isSealedHidden, isBidsRevealed, onViewBidDetail }) => {
  const { colors, spacing, radius } = useTheme();
  const { data: bidsData, isLoading: bidsLoading } = useGetBids(tenderId);

  const bids: Bid[] = useMemo(() => {
    if (!bidsData) return [];
    return (bidsData as any).bids ?? (bidsData as any).data ?? [];
  }, [bidsData]);

  const totalBids = bidsData?.totalBids ?? bids.length;
  const sealedCount = (bidsData as any)?.sealedBids ?? 0;

  // Stats
  const stats = useMemo(() => ({
    total: totalBids,
    sealed: sealedCount,
    reviewing: bids.filter(b => b.status === BidStatus.UnderReview).length,
    shortlisted: bids.filter(b => b.status === BidStatus.Shortlisted).length,
    awarded: bids.filter(b => b.status === BidStatus.Awarded).length,
  }), [bids, totalBids, sealedCount]);

  if (bidsLoading) {
    return (
      <View style={[bidsStyles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[bidsStyles.loadingText, { color: colors.textMuted }]}>Loading bids...</Text>
      </View>
    );
  }

  if (isSealedHidden) {
    return (
      <View style={bidsStyles.stack}>
        {/* Sealed stats */}
        <View style={bidsStyles.statsRow}>
          <StatTile icon="mail-outline" label="Total Bids" value={String(stats.total)} hint="sealed" masked />
          <StatTile icon="lock-closed" label="Sealed" value={String(stats.sealed)} masked />
          <StatTile icon="hourglass-outline" label="Status" value="Sealed" masked />
        </View>

        {/* Sealed message */}
        <View style={[bidsStyles.sealedCard, {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
          borderRadius: radius.lg,
        }]}>
          <Ionicons name="lock-closed" size={32} color={colors.textMuted} />
          <Text style={[bidsStyles.sealedTitle, { color: colors.text }]}>
            Bids Are Sealed
          </Text>
          <Text style={[bidsStyles.sealedDesc, { color: colors.textMuted }]}>
            {stats.total} bid{stats.total !== 1 ? 's' : ''} received. Bid amounts and bidder identities are hidden until you reveal them.
          </Text>
        </View>
      </View>
    );
  }

  if (bids.length === 0) {
    return (
      <View style={bidsStyles.stack}>
        <View style={bidsStyles.statsRow}>
          <StatTile icon="mail-outline" label="Total Bids" value="0" />
          <StatTile icon="people-outline" label="Bidders" value="0" />
          <StatTile icon="trophy-outline" label="Awarded" value="0" />
        </View>

        <View style={[bidsStyles.emptyCard, {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
          borderRadius: radius.lg,
        }]}>
          <Ionicons name="documents-outline" size={32} color={colors.textMuted} />
          <Text style={[bidsStyles.emptyTitle, { color: colors.text }]}>No Bids Yet</Text>
          <Text style={[bidsStyles.emptyDesc, { color: colors.textMuted }]}>
            Share this tender to attract bidders. Bids will appear here once submitted.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={bidsStyles.stack}>
      {/* Stats row */}
      <View style={bidsStyles.statsRow}>
        <StatTile icon="mail-outline" label="Total" value={String(stats.total)} />
        {stats.reviewing > 0 && (
          <StatTile icon="search-outline" label="In Review" value={String(stats.reviewing)} />
        )}
        {stats.shortlisted > 0 && (
          <StatTile icon="star-outline" label="Shortlisted" value={String(stats.shortlisted)} />
        )}
        {stats.awarded > 0 && (
          <StatTile icon="trophy-outline" label="Awarded" value={String(stats.awarded)} />
        )}
      </View>

      {/* Bid count header */}
      <View style={bidsStyles.sectionHeader}>
        <Text style={[bidsStyles.sectionTitle, { color: colors.text }]}>
          All Bids ({bids.length})
        </Text>
      </View>

      {/* Bid cards */}
      {bids.map((bid) => (
        <OpenBidCard
          key={bid._id}
          bid={bid}
          tenderId={tenderId}
          isBidsRevealed={isBidsRevealed}
          viewerRole="owner"
          onClick={onViewBidDetail ? () => onViewBidDetail(bid._id) : undefined}
        />
      ))}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const OwnerTenderDetails: React.FC<OwnerTenderDetailsProps> = ({
  tender,
  onAction,
  isMutating,
  onRevealBids,
  isRevealing,
  onUploadAttachment,
  onRemoveAttachment,
  onDownloadAttachment,
  onIssueAddendum,
  onViewAllBids,
  onViewBidDetail,
  initialTab = 'overview',
  onBack,
}) => {
  const [tab, setTab] = useState<OwnerTabKey>(initialTab);
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const actions = useMemo(() => getAvailableActions(tender.status, tender.workflowType), [tender.status, tender.workflowType]);
  const isSealedHidden = !areSealedBidsViewable(tender.status, tender.workflowType);
  const isBidsRevealed = tender.status === 'revealed' || tender.status === 'closed';

  const bidsCount    = tender.bidCount ?? tender.metadata?.totalBids ?? 0;
  const attachCount  = tender.attachments?.length ?? 0;
  const addendaCount = tender.addenda?.length ?? 0;

  const badges = useMemo<Partial<Record<OwnerTabKey, number>>>(() => ({
    bids:        bidsCount,
    attachments: attachCount,
    addenda:     addendaCount,
  }), [bidsCount, attachCount, addendaCount]);

  const getActionColors = (intent: ActionMeta['intent']): { bg: string; fg: string } => {
    switch (intent) {
      case 'primary':     return { bg: colors.primary,                 fg: colors.textInverse };
      case 'destructive': return { bg: withAlpha(colors.danger, 0.12), fg: colors.danger };
      case 'accent':      return { bg: withAlpha(colors.info, 0.12),   fg: colors.info };
      default:            return { bg: colors.bgCard,                  fg: colors.text };
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <TenderHeader
        tender={tender}
        variant="owner"
        onBack={onBack}
      />

      <TabStrip current={tab} onChange={setTab} badges={badges} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── OVERVIEW ────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <View style={styles.stack}>
            <SealedBidBanner
              workflowType={tender.workflowType}
              status={tender.status}
              isRevealed={isBidsRevealed}
              deadline={tender.deadline}
              isOwner
              isRevealing={isRevealing}
              onReveal={onRevealBids}
            />

            <View style={styles.statsRow}>
              <StatTile icon="people-outline" label="Bids" value={isSealedHidden ? '—' : String(bidsCount)} hint={isSealedHidden ? 'sealed' : undefined} masked={isSealedHidden} />
              <StatTile icon="eye-outline" label="Views" value={String(tender.metadata?.visibleBids ?? 0)} />
              <StatTile icon="albums-outline" label="Addenda" value={String(addendaCount)} />
            </View>

            {actions.length > 0 && (
              <SectionCard icon="flash-outline" title="Actions">
                <View style={styles.actionGrid}>
                  {actions.map((action) => {
                    const meta = ACTION_META[action];
                    const { bg, fg } = getActionColors(meta.intent);
                    return (
                      <Pressable
                        key={action}
                        onPress={() => onAction?.(action)}
                        disabled={isMutating || !onAction}
                        style={({ pressed }: { pressed: boolean }) => [
                          styles.actionBtn,
                          { backgroundColor: bg, opacity: isMutating ? 0.6 : pressed ? 0.85 : 1 },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={meta.label}
                      >
                        <Ionicons name={meta.icon as any} size={16} color={fg} />
                        <Text style={[styles.actionLabel, { color: fg }]} numberOfLines={1}>{meta.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </SectionCard>
            )}

            <SectionCard icon="reader-outline" title="Description">
              <Text style={[styles.descText, { color: colors.text }]} numberOfLines={6}>{tender.description}</Text>
              {tender.description.length > 300 && (
                <Pressable onPress={() => setTab('details')} hitSlop={6} accessibilityRole="button">
                  <Text style={[styles.readMore, { color: colors.primary }]}>Read more in Details →</Text>
                </Pressable>
              )}
            </SectionCard>
          </View>
        )}

        {/* ── DETAILS ─────────────────────────────────────────────── */}
        {tab === 'details' && (
          <View style={styles.stack}>
            <SectionCard icon="reader-outline" title="Description">
              <Text style={[styles.descText, { color: colors.text }]}>{tender.description}</Text>
            </SectionCard>
            <TenderProcurementInfo tender={tender} />
            <TenderEligibilityInfo tender={tender} />
            <TenderEvaluationInfo tender={tender} />
            <TenderDatesInfo tender={tender} />
          </View>
        )}

        {/* ── ATTACHMENTS ──────────────────────────────────────────── */}
        {tab === 'attachments' && (
          <View style={styles.stack}>
            <TenderAttachmentList
              attachments={tender.attachments ?? []}
              mode="owner"
              onUploadMore={onUploadAttachment}
              onRemove={onRemoveAttachment}
              onDownload={onDownloadAttachment}
              busy={isMutating}
            />
          </View>
        )}

        {/* ── ADDENDA ──────────────────────────────────────────────── */}
        {tab === 'addenda' && (
          <View style={styles.stack}>
            <TenderAddendumList
              addenda={tender.addenda ?? []}
              mode="owner"
              onIssueAddendum={onIssueAddendum}
              disableIssue={tender.status === 'closed' || tender.status === 'cancelled' || tender.status === 'draft'}
            />
          </View>
        )}

        {/* ── BIDS (UPDATED) ───────────────────────────────────────── */}
        {tab === 'bids' && (
          <View style={styles.stack}>
            <SealedBidBanner
              workflowType={tender.workflowType}
              status={tender.status}
              isRevealed={isBidsRevealed}
              deadline={tender.deadline}
              isOwner
              isRevealing={isRevealing}
              onReveal={onRevealBids}
            />

            <BidsTabContent
              tenderId={tender._id}
              isSealedHidden={isSealedHidden}
              isBidsRevealed={isBidsRevealed}
              onViewBidDetail={onViewBidDetail}
            />

            {onViewAllBids && (
              <Pressable
                onPress={onViewAllBids}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.viewAllBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="View all bids"
              >
                <Ionicons name="list" size={16} color={colors.textInverse} />
                <Text style={[styles.viewAllText, { color: colors.textInverse }]}>View All Bids</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root:         { flex: 1 },
  scrollContent:{ padding: 14 },
  stack:        { gap: 12 },

  statsRow:   { flexDirection: 'row', gap: 8 },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, minHeight: 40, flexGrow: 1, flexBasis: '46%', justifyContent: 'center' },
  actionLabel:{ fontSize: 13, fontWeight: '700' },

  descText:   { fontSize: 13, lineHeight: 19 },
  readMore:   { fontSize: 12, fontWeight: '700', marginTop: 6 },

  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, minHeight: 46 },
  viewAllText:{ fontSize: 14, fontWeight: '700' },
});

// ─── Bids tab styles ──────────────────────────────────────────────────────────

const bidsStyles = StyleSheet.create({
  stack:           { gap: 12 },
  loadingContainer:{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  loadingText:     { fontSize: 13 },
  statsRow:        { flexDirection: 'row', gap: 8 },
  sectionHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle:    { fontSize: 14, fontWeight: '700' },
  sealedCard:      { alignItems: 'center', padding: 32, borderWidth: 1, gap: 10 },
  sealedTitle:     { fontSize: 16, fontWeight: '700' },
  sealedDesc:      { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  emptyCard:       { alignItems: 'center', padding: 32, borderWidth: 1, gap: 10 },
  emptyTitle:      { fontSize: 16, fontWeight: '700' },
  emptyDesc:       { fontSize: 13, textAlign: 'center', lineHeight: 19 },
});

export default OwnerTenderDetails;