// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/OwnerTenderDetails.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Tabbed owner-side detail view.
//
//  5 tabs:
//   1. Overview     — SealedBidBanner + status-driven action panel + summary
//   2. Details      — full Procurement / Eligibility / Evaluation / Dates
//   3. Attachments  — TenderAttachmentList in 'owner' mode
//   4. Addenda      — TenderAddendumList in 'owner' mode
//   5. Bids         — bid count + Reveal CTA + IncomingBids preview link
//
//  This component is a self-contained UI block — NOT a screen. Wrap it in
//  ProfessionalTenderDetailScreen with hooks for data + mutations.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeStore } from '../../store/themeStore';
import TenderHeader from './TenderHeader';
import SealedBidBanner from './SealedBidBanner';
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

// ═════════════════════════════════════════════════════════════════════════════
//  PROPS
// ═════════════════════════════════════════════════════════════════════════════

export type OwnerTabKey = 'overview' | 'details' | 'attachments' | 'addenda' | 'bids';

export interface OwnerTenderDetailsProps {
  tender: ProfessionalTender;

  /** Owner action handlers — wired from the screen layer. */
  onAction?: (action: TenderAction) => void;
  /** Whether any owner mutation is currently in flight. */
  isMutating?: boolean;
  /** Called when a sealed-bid reveal is tapped (drives the Bids-tab CTA). */
  onRevealBids?: () => void;
  /** Whether the reveal mutation is currently pending. */
  isRevealing?: boolean;

  /** Attachment-tab handlers */
  onUploadAttachment?: () => void;
  onRemoveAttachment?: (attachment: TenderAttachment) => void;
  onDownloadAttachment?: (attachment: TenderAttachment) => void;

  /** Addenda-tab handler */
  onIssueAddendum?: () => void;

  /** Bids-tab handler — opens the IncomingBids screen */
  onViewAllBids?: () => void;

  /** Initial tab — defaults to 'overview'. */
  initialTab?: OwnerTabKey;

  /** Back-button — typically passes `navigation.goBack`. */
  onBack?: () => void;
}

// ═════════════════════════════════════════════════════════════════════════════
//  TAB DEFINITIONS
// ═════════════════════════════════════════════════════════════════════════════

interface TabDef {
  key: OwnerTabKey;
  label: string;
  icon: string;
}

const TABS: ReadonlyArray<TabDef> = [
  { key: 'overview',    label: 'Overview',    icon: 'grid-outline' },
  { key: 'details',     label: 'Details',     icon: 'document-text-outline' },
  { key: 'attachments', label: 'Attachments', icon: 'folder-open-outline' },
  { key: 'addenda',     label: 'Addenda',     icon: 'albums-outline' },
  { key: 'bids',        label: 'Bids',        icon: 'inbox-outline' },
];

// ═════════════════════════════════════════════════════════════════════════════
//  TAB STRIP
// ═════════════════════════════════════════════════════════════════════════════

const TabStrip: React.FC<{
  current: OwnerTabKey;
  onChange: (k: OwnerTabKey) => void;
  badges?: Partial<Record<OwnerTabKey, number>>;
}> = ({ current, onChange, badges }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { bg: '#1E293B', border: '#334155', activeFg: '#60A5FA', idleFg: '#94A3B8', activeBd: '#60A5FA', badgeBg: '#1E3A5F', badgeFg: '#93C5FD' }
    : { bg: '#FFFFFF', border: '#E2E8F0', activeFg: '#2563EB', idleFg: '#64748B', activeBd: '#2563EB', badgeBg: '#DBEAFE', badgeFg: '#1D4ED8' };

  return (
    <View style={[tabStyles.bar, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tabStyles.row}
      >
        {TABS.map((t) => {
          const isActive = t.key === current;
          const fg = isActive ? palette.activeFg : palette.idleFg;
          const badge = badges?.[t.key];
          return (
            <Pressable
              key={t.key}
              onPress={() => onChange(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={t.label}
              style={({ pressed }: { pressed: boolean }) => [
                tabStyles.tab,
                {
                  borderBottomColor: isActive ? palette.activeBd : 'transparent',
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons name={t.icon as any} size={15} color={fg} />
              <Text style={[tabStyles.label, { color: fg }]} numberOfLines={1}>
                {t.label}
              </Text>
              {badge !== undefined && badge > 0 && (
                <View style={[tabStyles.badge, { backgroundColor: palette.badgeBg }]}>
                  <Text style={[tabStyles.badgeText, { color: palette.badgeFg }]}>
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

const tabStyles = StyleSheet.create({
  bar: { borderBottomWidth: 1 },
  row: { paddingHorizontal: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    minHeight: 44,
  },
  label: { fontSize: 13, fontWeight: '700' },
  badge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '800' },
});

// ═════════════════════════════════════════════════════════════════════════════
//  ACTION META
// ═════════════════════════════════════════════════════════════════════════════

interface ActionMeta {
  label: string;
  icon: string;
  intent: 'primary' | 'secondary' | 'destructive' | 'accent';
}

const ACTION_META: Record<TenderAction, ActionMeta> = {
  publish:      { label: 'Publish',       icon: 'send',                  intent: 'primary' },
  edit:         { label: 'Edit',          icon: 'create-outline',        intent: 'secondary' },
  delete:       { label: 'Delete',        icon: 'trash-outline',         intent: 'destructive' },
  lock:         { label: 'Lock',          icon: 'lock-closed-outline',   intent: 'accent' },
  reveal:       { label: 'Reveal Bids',   icon: 'eye-outline',           intent: 'primary' },
  close:        { label: 'Close Tender',  icon: 'checkmark-done',        intent: 'secondary' },
  addAddendum:  { label: 'Add Addendum',  icon: 'document-text-outline', intent: 'secondary' },
  viewAllBids:  { label: 'View All Bids', icon: 'list-outline',          intent: 'primary' },
};

// ═════════════════════════════════════════════════════════════════════════════
//  STAT TILE
// ═════════════════════════════════════════════════════════════════════════════

const StatTile: React.FC<{
  icon: string;
  label: string;
  value: string;
  hint?: string;
  masked?: boolean;
}> = ({ icon, label, value, hint, masked }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { bg: '#1E293B', border: '#334155', text: '#F1F5F9', muted: '#94A3B8', accent: '#60A5FA' }
    : { bg: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', accent: '#2563EB' };
  return (
    <View style={[statStyles.root, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <View style={statStyles.head}>
        <Ionicons name={icon as any} size={14} color={palette.accent} />
        <Text style={[statStyles.label, { color: palette.muted }]}>{label}</Text>
      </View>
      <Text style={[statStyles.value, { color: palette.text }]}>
        {masked ? '🔒 Hidden' : value}
      </Text>
      {!!hint && (
        <Text style={[statStyles.hint, { color: palette.muted }]} numberOfLines={1}>
          {hint}
        </Text>
      )}
    </View>
  );
};

const statStyles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    minHeight: 76,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  value: { fontSize: 18, fontWeight: '800' },
  hint: { fontSize: 10 },
});

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
  initialTab = 'overview',
  onBack,
}) => {
  const [tab, setTab] = useState<OwnerTabKey>(initialTab);
  const isDark = useThemeStore((s) => s.theme.isDark);

  const palette = useMemo(
    () => isDark
      ? { bg: '#0F172A', text: '#F1F5F9', muted: '#94A3B8', primary: '#60A5FA', primaryFg: '#0F172A', secondary: '#334155', secondaryFg: '#F1F5F9', accent: '#A855F7', accentFg: '#FFFFFF', destructive: '#F87171', destructiveFg: '#0F172A', surface: '#1E293B', border: '#334155' }
      : { bg: '#F8FAFC', text: '#0F172A', muted: '#64748B', primary: '#2563EB', primaryFg: '#FFFFFF', secondary: '#E2E8F0', secondaryFg: '#0F172A', accent: '#7C3AED', accentFg: '#FFFFFF', destructive: '#DC2626', destructiveFg: '#FFFFFF', surface: '#FFFFFF', border: '#E2E8F0' },
    [isDark],
  );

  const sealedViewable = areSealedBidsViewable(tender.status, tender.workflowType);
  const isSealedHidden = tender.workflowType === 'closed' && !sealedViewable;
  const actions = getAvailableActions(tender.status, tender.workflowType);

  // Tab badges — show counts inline with the tab labels
  const badges = useMemo(() => ({
    attachments: tender.attachments?.length ?? 0,
    addenda:     tender.addenda?.length ?? 0,
    bids:        isSealedHidden
      ? (tender.bidCount ?? tender.metadata?.totalBids ?? 0)
      : (tender.bidCount ?? 0),
  }), [tender.attachments, tender.addenda, tender.bidCount, tender.metadata?.totalBids, isSealedHidden]);

  // Days-left for the deadline tile
  const deadlineDate = new Date(tender.deadline);
  const isPast = deadlineDate.getTime() < Date.now();
  const daysLeft = Math.ceil((deadlineDate.getTime() - Date.now()) / 86_400_000);

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      {/* Header — sticky-feeling, sits above the tab strip */}
      <TenderHeader
        tender={tender}
        variant="owner"
        onBack={onBack}
      />

      {/* Tab strip */}
      <TabStrip current={tab} onChange={setTab} badges={badges} />

      {/* Body — single ScrollView per tab so each tab feels independent */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'overview' && (
          <View style={styles.stack}>
            <SealedBidBanner
              workflowType={tender.workflowType}
              status={tender.status}
              isRevealed={tender.status === 'revealed' || tender.status === 'closed'}
              deadline={tender.deadline}
              isOwner
              isRevealing={isRevealing}
              onReveal={onRevealBids}
            />

            {/* Quick stats */}
            <View style={styles.statsRow}>
              <StatTile
                icon="people-outline"
                label="Bids"
                value={isSealedHidden
                  ? 'Sealed'
                  : String(tender.bidCount ?? tender.metadata?.totalBids ?? 0)}
                hint={isSealedHidden ? 'Visible after reveal' : undefined}
                masked={isSealedHidden}
              />
              <StatTile
                icon={isPast ? 'time-outline' : 'calendar-outline'}
                label="Deadline"
                value={isPast ? 'Passed' : daysLeft <= 1 ? 'Today' : `${daysLeft}d`}
                hint={deadlineDate.toLocaleDateString()}
              />
              <StatTile
                icon="document-text-outline"
                label="Addenda"
                value={String(tender.addenda?.length ?? 0)}
              />
            </View>

            {/* Action bar */}
            {actions.length > 0 && (
              <SectionCard icon="flash-outline" title="Actions">
                <View style={styles.actionGrid}>
                  {actions.map((action) => {
                    const meta = ACTION_META[action];
                    const intent = meta.intent;
                    const bg =
                      intent === 'primary'     ? palette.primary :
                      intent === 'destructive' ? palette.destructive :
                      intent === 'accent'      ? palette.accent :
                                                 palette.secondary;
                    const fg =
                      intent === 'primary'     ? palette.primaryFg :
                      intent === 'destructive' ? palette.destructiveFg :
                      intent === 'accent'      ? palette.accentFg :
                                                 palette.secondaryFg;
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
                        <Text style={[styles.actionLabel, { color: fg }]} numberOfLines={1}>
                          {meta.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </SectionCard>
            )}

            {/* Quick description preview */}
            <SectionCard icon="reader-outline" title="Description">
              <Text
                style={[styles.descText, { color: palette.text }]}
                numberOfLines={6}
              >
                {tender.description}
              </Text>
              {tender.description.length > 300 && (
                <Pressable
                  onPress={() => setTab('details')}
                  hitSlop={6}
                  accessibilityRole="button"
                >
                  <Text style={[styles.readMore, { color: palette.primary }]}>
                    Read more in Details →
                  </Text>
                </Pressable>
              )}
            </SectionCard>
          </View>
        )}

        {tab === 'details' && (
          <View style={styles.stack}>
            <SectionCard icon="reader-outline" title="Description">
              <Text style={[styles.descText, { color: palette.text }]}>
                {tender.description}
              </Text>
            </SectionCard>
            <TenderProcurementInfo tender={tender} />
            <TenderEligibilityInfo tender={tender} />
            <TenderEvaluationInfo tender={tender} />
            <TenderDatesInfo tender={tender} />
          </View>
        )}

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

        {tab === 'addenda' && (
          <View style={styles.stack}>
            <TenderAddendumList
              addenda={tender.addenda ?? []}
              mode="owner"
              onIssueAddendum={onIssueAddendum}
              disableIssue={
                tender.status === 'closed' ||
                tender.status === 'cancelled' ||
                tender.status === 'draft'
              }
            />
            {/* Edit notice — when status === 'draft' */}
            {isTenderEditable(tender.status) && (
              <SectionCard icon="information-circle-outline" title="Edit available">
                <Text style={[styles.descText, { color: palette.muted, fontSize: 12 }]}>
                  This tender is still in draft. You can edit it directly from
                  the Overview tab — no addendum needed yet.
                </Text>
              </SectionCard>
            )}
          </View>
        )}

        {tab === 'bids' && (
          <View style={styles.stack}>
            <SealedBidBanner
              workflowType={tender.workflowType}
              status={tender.status}
              isRevealed={tender.status === 'revealed' || tender.status === 'closed'}
              deadline={tender.deadline}
              isOwner
              isRevealing={isRevealing}
              onReveal={onRevealBids}
            />

            <SectionCard icon="people-outline" title="Bid Activity">
              <InfoRow
                label="Total Bids"
                value={isSealedHidden
                  ? `${tender.bidCount ?? tender.metadata?.totalBids ?? 0} (sealed)`
                  : String(tender.bidCount ?? 0)}
              />
              <InfoRow
                label="Workflow"
                value={tender.workflowType === 'closed' ? 'Sealed' : 'Open'}
              />
              <InfoRow label="Status" value={tender.status.replace(/_/g, ' ')} />
            </SectionCard>

            {/* CTA — opens the IncomingBids screen for the full list */}
            <Pressable
              onPress={onViewAllBids}
              disabled={!onViewAllBids}
              style={({ pressed }: { pressed: boolean }) => [
                styles.viewAllBtn,
                {
                  backgroundColor: palette.primary,
                  opacity: !onViewAllBids ? 0.6 : pressed ? 0.85 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="View all bids"
            >
              <Ionicons name="list" size={16} color={palette.primaryFg} />
              <Text style={[styles.viewAllText, { color: palette.primaryFg }]}>
                View all bids
              </Text>
            </Pressable>
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
  root: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 32 },
  stack: { gap: 12 },

  statsRow: { flexDirection: 'row', gap: 8 },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 40,
    flexGrow: 1,
    flexBasis: '46%',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 13, fontWeight: '700' },

  descText: { fontSize: 13, lineHeight: 19 },
  readMore: { fontSize: 12, fontWeight: '700', marginTop: 6 },

  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    minHeight: 46,
  },
  viewAllText: { fontSize: 14, fontWeight: '700' },
});

export default OwnerTenderDetails;