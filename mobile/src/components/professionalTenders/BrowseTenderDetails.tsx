// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/BrowseTenderDetails.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Tabbed browser-side detail view (for prospective bidders).
//
//  6 tabs:
//   1. Overview     — SealedBidBanner + summary + brief description
//   2. Details      — Procurement / Eligibility / Evaluation / Dates
//   3. Attachments  — TenderAttachmentList in 'browser' mode (read+download)
//   4. Addenda      — TenderAddendumList in 'browser' mode (read-only)
//   5. Actions      — TenderActionsPanel (Place Bid / View My Bid / Save / Share)
//   6. Entity       — TenderEntityCard (the company that posted)
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
// import TenderActionsPanel from './TenderActionsPanel';
import TenderEntityCard from './TenderEntityCard';
import { SectionCard } from './_shared';
import type {
  ProfessionalTender,
  TenderAttachment,
} from '../../types/professionalTender';

// ═════════════════════════════════════════════════════════════════════════════
//  PROPS
// ═════════════════════════════════════════════════════════════════════════════

export type BrowseTabKey =
  | 'overview'
  | 'details'
  | 'attachments'
  | 'addenda'
  | 'actions'
  | 'entity';

export interface BrowseTenderDetailsProps {
  tender: ProfessionalTender;

  /** Whether the current user is invited (when tender.visibilityType === 'invite_only'). */
  isInvited?: boolean;

  /** Save / unsave the tender. */
  isSaved?: boolean;
  onToggleSave?: () => void;

  /** Place Bid → bid form. */
  onPlaceBid?: () => void;
  /** View existing bid → bid detail. */
  onViewBid?: (bidId: string) => void;
  /** Share the tender. */
  onShare?: () => void;
  /** Ask a question (Q&A). */
  onAskQuestion?: () => void;

  /** Download an attachment. */
  onDownloadAttachment?: (attachment: TenderAttachment) => void;

  /** Tap "View profile" inside the Entity tab. */
  onViewEntityProfile?: (entityId: string) => void;

  /** Initial tab — defaults to 'overview'. */
  initialTab?: BrowseTabKey;

  /** Back button. */
  onBack?: () => void;
}

// ═════════════════════════════════════════════════════════════════════════════
//  TAB DEFINITIONS
// ═════════════════════════════════════════════════════════════════════════════

interface TabDef {
  key: BrowseTabKey;
  label: string;
  icon: string;
}

const TABS: ReadonlyArray<TabDef> = [
  { key: 'overview',    label: 'Overview',    icon: 'grid-outline' },
  { key: 'details',     label: 'Details',     icon: 'document-text-outline' },
  { key: 'attachments', label: 'Attachments', icon: 'folder-open-outline' },
  { key: 'addenda',     label: 'Addenda',     icon: 'albums-outline' },
  { key: 'actions',     label: 'Actions',     icon: 'paper-plane-outline' },
  { key: 'entity',      label: 'Entity',      icon: 'business-outline' },
];

// ═════════════════════════════════════════════════════════════════════════════
//  TAB STRIP
// ═════════════════════════════════════════════════════════════════════════════

const TabStrip: React.FC<{
  current: BrowseTabKey;
  onChange: (k: BrowseTabKey) => void;
  badges?: Partial<Record<BrowseTabKey, number>>;
  emphasizedTabs?: BrowseTabKey[];     // tabs with a "you should look here" pulse
}> = ({ current, onChange, badges, emphasizedTabs }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { bg: '#1E293B', border: '#334155', activeFg: '#A855F7', idleFg: '#94A3B8', activeBd: '#A855F7', badgeBg: '#3B0764', badgeFg: '#D8B4FE', emphasizeBg: '#3B0764', emphasizeFg: '#D8B4FE' }
    : { bg: '#FFFFFF', border: '#E2E8F0', activeFg: '#7C3AED', idleFg: '#64748B', activeBd: '#7C3AED', badgeBg: '#EDE9FE', badgeFg: '#6D28D9', emphasizeBg: '#EDE9FE', emphasizeFg: '#6D28D9' };

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
          const emphasize = emphasizedTabs?.includes(t.key) && !isActive;

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
              {emphasize && (
                <View style={[tabStyles.dot, { backgroundColor: palette.emphasizeFg }]} />
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
  dot: { width: 6, height: 6, borderRadius: 999, marginLeft: 2 },
});

// ═════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const BrowseTenderDetails: React.FC<BrowseTenderDetailsProps> = ({
  tender,
  isInvited,
  isSaved,
  onToggleSave,
  onPlaceBid,
  onViewBid,
  onShare,
  onAskQuestion,
  onDownloadAttachment,
  onViewEntityProfile,
  initialTab = 'overview',
  onBack,
}) => {
  const [tab, setTab] = useState<BrowseTabKey>(initialTab);
  const isDark = useThemeStore((s) => s.theme.isDark);

  const palette = useMemo(
    () => isDark
      ? { bg: '#0F172A', text: '#F1F5F9', muted: '#94A3B8', primary: '#60A5FA', primaryFg: '#0F172A', surface: '#1E293B', border: '#334155' }
      : { bg: '#F8FAFC', text: '#0F172A', muted: '#64748B', primary: '#2563EB', primaryFg: '#FFFFFF', surface: '#FFFFFF', border: '#E2E8F0' },
    [isDark],
  );

  const ownerEntity = typeof tender.ownerEntity === 'object' ? tender.ownerEntity : undefined;
  const ownerEntityId = typeof tender.ownerEntity === 'string'
    ? tender.ownerEntity
    : ownerEntity?._id;

  const badges = useMemo(() => ({
    attachments: tender.attachments?.length ?? 0,
    addenda:     tender.addenda?.length ?? 0,
  }), [tender.attachments, tender.addenda]);

  // Subtle nudge: pulse the Actions tab if the user can bid and hasn't yet
  const emphasizedTabs: BrowseTabKey[] = useMemo(() => {
    const canBid = (tender.status === 'published' || tender.status === 'locked')
      && new Date(tender.deadline).getTime() > Date.now();
    return canBid && !tender.myBid ? ['actions'] : [];
  }, [tender.status, tender.deadline, tender.myBid]);

  // Header bookmark button (top-right)
  const headerRightAction = onToggleSave ? (
    <Pressable
      onPress={onToggleSave}
      hitSlop={10}
      style={[
        styles.bookmarkBtn,
        { backgroundColor: 'rgba(255,255,255,0.18)' },
      ]}
      accessibilityRole="button"
      accessibilityLabel={isSaved ? 'Remove from saved' : 'Save tender'}
    >
      <Ionicons
        name={isSaved ? 'bookmark' : 'bookmark-outline'}
        size={18}
        color="#FFFFFF"
      />
    </Pressable>
  ) : undefined;

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <TenderHeader
        tender={tender}
        variant="browser"
        onBack={onBack}
        rightAction={headerRightAction}
      />

      <TabStrip
        current={tab}
        onChange={setTab}
        badges={badges}
        emphasizedTabs={emphasizedTabs}
      />

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
              isOwner={false}
            />

            {/* Description preview */}
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

            {/* Quick CTA — go to actions tab */}
            <Pressable
              onPress={() => setTab('actions')}
              style={({ pressed }: { pressed: boolean }) => [
                styles.quickCta,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go to actions"
            >
              <Ionicons name="paper-plane" size={18} color={palette.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.quickCtaTitle, { color: palette.text }]}>
                  {tender.myBid ? 'View your bid' : 'Ready to bid?'}
                </Text>
                <Text style={[styles.quickCtaDesc, { color: palette.muted }]}>
                  Open the Actions tab for bid options.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={palette.muted} />
            </Pressable>
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
              mode="browser"
              onDownload={onDownloadAttachment}
            />
          </View>
        )}

        {tab === 'addenda' && (
          <View style={styles.stack}>
            <TenderAddendumList
              addenda={tender.addenda ?? []}
              mode="browser"
            />
          </View>
        )}

        {/* {tab === 'actions' && (
          <View style={styles.stack}>
            <TenderActionsPanel
              tender={tender}
              isInvited={isInvited}
              isSaved={isSaved}
              onToggleSave={onToggleSave}
              onPlaceBid={onPlaceBid}
              onViewBid={onViewBid}
              onShare={onShare}
              onAskQuestion={onAskQuestion}
            />
          </View>
        )} */}

        {tab === 'entity' && (
          <View style={styles.stack}>
            <TenderEntityCard
              entityId={ownerEntityId}
              entity={ownerEntity}
              ownerRole={tender.ownerRole}
              onViewProfile={onViewEntityProfile}
            />
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

  bookmarkBtn: {
    width: 36, height: 36,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  descText: { fontSize: 13, lineHeight: 19 },
  readMore: { fontSize: 12, fontWeight: '700', marginTop: 6 },

  quickCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickCtaTitle: { fontSize: 14, fontWeight: '700' },
  quickCtaDesc:  { fontSize: 12, marginTop: 2 },
});

export default BrowseTenderDetails;