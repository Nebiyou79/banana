// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/TenderEntityCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Displays the company/organization that posted the tender. Used inside
//  the BrowseTenderDetails Entity tab.
//
//  Auto-loads the entity profile via companyService when given an ID;
//  pass `entity` directly to skip the fetch (e.g. when already populated
//  by the parent's tender query).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeStore } from '../../store/themeStore';
import { useCompaniesByIds } from '../../hooks/useProfessionalTender';
import { SectionCard, InfoRow } from './_shared';
import type { CompanyProfile } from '../../services/companyService';

// ═════════════════════════════════════════════════════════════════════════════
//  PROPS
// ═════════════════════════════════════════════════════════════════════════════

export interface TenderEntityCardProps {
  /** Company id — the card will fetch the profile if `entity` is not given. */
  entityId?: string;
  /** Pre-populated entity profile. When set, no fetch happens. */
  entity?: Partial<CompanyProfile> & { _id?: string; name?: string };
  /** Role — controls icon and a couple of labels. */
  ownerRole?: 'company' | 'organization';
  /** Tap "View Profile" — caller navigates to the profile screen. */
  onViewProfile?: (entityId: string) => void;
}

// ═════════════════════════════════════════════════════════════════════════════
//  AVATAR
// ═════════════════════════════════════════════════════════════════════════════

const Avatar: React.FC<{
  name?: string;
  logo?: string;
  ownerRole?: 'company' | 'organization';
}> = ({ name, logo, ownerRole }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { bg: '#1E3A5F', fg: '#93C5FD', border: '#3B82F6' }
    : { bg: '#DBEAFE', fg: '#1D4ED8', border: '#BFDBFE' };

  // Logos can come as URLs — RN <Image> would handle it. For the stubbed
  // environment we just show the placeholder fallback (initial). In a real
  // build, replace this with an Image component when logo is set.
  const initial = name?.[0]?.toUpperCase() ?? '?';
  const isShort = !logo;

  return (
    <View style={[avatarStyles.root, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      {isShort ? (
        <Text style={[avatarStyles.initial, { color: palette.fg }]}>{initial}</Text>
      ) : (
        <Ionicons
          name={ownerRole === 'organization' ? 'people' : 'business'}
          size={28}
          color={palette.fg}
        />
      )}
    </View>
  );
};

const avatarStyles = StyleSheet.create({
  root: {
    width: 64, height: 64,
    borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  initial: { fontSize: 26, fontWeight: '800' },
});

// ═════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const TenderEntityCard: React.FC<TenderEntityCardProps> = ({
  entityId,
  entity: entityProp,
  ownerRole = 'company',
  onViewProfile,
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);

  // Only fetch when we have an id but no pre-populated entity
  const idsToFetch = useMemo(
    () => (entityId && !entityProp?.name ? [entityId] : []),
    [entityId, entityProp?.name],
  );
  const { data: fetched = [], isLoading } = useCompaniesByIds(idsToFetch, {
    enabled: idsToFetch.length > 0,
  });

  const entity: Partial<CompanyProfile> & { _id?: string; name?: string } | undefined =
    entityProp?.name ? entityProp : fetched[0];

  const palette = isDark
    ? { primary: '#60A5FA', primaryFg: '#0F172A', success: '#34D399', text: '#F1F5F9', muted: '#94A3B8', subtle: '#64748B' }
    : { primary: '#2563EB', primaryFg: '#FFFFFF', success: '#16A34A', text: '#0F172A', muted: '#64748B', subtle: '#94A3B8' };

  if (isLoading && !entity) {
    return (
      <SectionCard icon="business-outline" title="Posted by">
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={palette.primary} />
          <Text style={[styles.loadingText, { color: palette.muted }]}>
            Loading entity…
          </Text>
        </View>
      </SectionCard>
    );
  }

  if (!entity) {
    return (
      <SectionCard icon="business-outline" title="Posted by">
        <Text style={{ fontSize: 13, color: palette.muted, fontStyle: 'italic' }}>
          Entity information unavailable.
        </Text>
      </SectionCard>
    );
  }

  const resolvedId = entity._id ?? entityId;

  return (
    <View style={styles.stack}>
      <SectionCard
        icon={ownerRole === 'organization' ? 'people-outline' : 'business-outline'}
        title="Posted by"
      >
        <View style={styles.head}>
          <Avatar name={entity.name} logo={entity.logoUrl} ownerRole={ownerRole} />
          <View style={styles.headText}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: palette.text }]} numberOfLines={2}>
                {entity.name ?? 'Unknown'}
              </Text>
              {entity.verified && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={palette.success}
                  accessibilityLabel="Verified"
                />
              )}
            </View>
            {!!entity.industry && (
              <Text style={[styles.subline, { color: palette.muted }]} numberOfLines={1}>
                {entity.industry}
              </Text>
            )}
            {!!entity.location && (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={11} color={palette.subtle} />
                <Text style={[styles.metaText, { color: palette.subtle }]} numberOfLines={1}>
                  {entity.location}
                </Text>
              </View>
            )}
          </View>
        </View>

        {!!entity.description && (
          <Text style={[styles.description, { color: palette.text }]}>
            {entity.description}
          </Text>
        )}
      </SectionCard>

      {/* Contact + meta details */}
      <SectionCard icon="call-outline" title="Contact & Details">
        <InfoRow label="Email" value={entity.email} />
        <InfoRow label="Phone" value={entity.phone} />
        <InfoRow label="Website" value={entity.website} />
        <InfoRow
          label="Founded"
          value={entity.foundedYear ? String(entity.foundedYear) : undefined}
        />
        <InfoRow label="Size" value={entity.size} />
        <InfoRow label="Headquarters" value={entity.address} />
      </SectionCard>

      {/* View profile CTA */}
      {onViewProfile && resolvedId && (
        <Pressable
          onPress={() => onViewProfile(resolvedId)}
          style={({ pressed }: { pressed: boolean }) => [
            styles.cta,
            { backgroundColor: palette.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`View ${entity.name ?? 'company'} profile`}
        >
          <Ionicons name="open-outline" size={16} color={palette.primaryFg} />
          <Text style={[styles.ctaText, { color: palette.primaryFg }]}>
            View full profile
          </Text>
        </Pressable>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  stack: { gap: 12 },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  loadingText: { fontSize: 13 },

  head: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  headText: { flex: 1, gap: 4, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 18, fontWeight: '800', lineHeight: 22 },
  subline: { fontSize: 12, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontSize: 11 },

  description: { fontSize: 13, lineHeight: 19, marginTop: 10 },

  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6,
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12,
    minHeight: 44,
  },
  ctaText: { fontSize: 14, fontWeight: '700' },
});

export default TenderEntityCard;