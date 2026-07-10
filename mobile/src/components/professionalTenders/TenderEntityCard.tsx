// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/TenderEntityCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  FIXED:
//   • useThemeStore → useTheme() everywhere
//   • Avatar rendered via TenderOwnerAvatar (Profile / Cloudinary architecture)
//   • All colors through theme tokens — zero hardcoded hex

import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { useCompaniesByIds } from '../../hooks/useProfessionalTender';
import TenderOwnerAvatar from '../shared/TenderOwnerAvatar';
import { SectionCard, InfoRow } from './_shared';
import type { CompanyProfile } from '../../services/companyService';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TenderEntityCardProps {
  entityId?:   string;
  entity?:     Partial<CompanyProfile> & {
    _id?:      string;
    name?:     string;
    avatarUrl?: string | null;
    userProfile?: { avatar?: { secure_url?: string | null } };
  };
  ownerRole?:  'company' | 'organization';
  onViewProfile?: (entityId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TenderEntityCard: React.FC<TenderEntityCardProps> = ({
  entityId,
  entity: entityProp,
  ownerRole = 'company',
  onViewProfile,
}) => {
  const { colors, radius, type } = useTheme();

  // Only fetch when we have an id but no pre-populated entity name
  const idsToFetch = useMemo(
    () => (entityId && !entityProp?.name ? [entityId] : []),
    [entityId, entityProp?.name],
  );
  const { data: fetched = [], isLoading } = useCompaniesByIds(idsToFetch, {
    enabled: idsToFetch.length > 0,
  });

  const entity = entityProp?.name ? entityProp : fetched[0] as typeof entityProp | undefined;

  if (isLoading && !entity) {
    return (
      <SectionCard icon="business-outline" title="Posted by">
        <View style={S.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[type.caption, { color: colors.textMuted }]}>Loading entity…</Text>
        </View>
      </SectionCard>
    );
  }

  if (!entity) {
    return (
      <SectionCard icon="business-outline" title="Posted by">
        <Text style={[type.caption, { color: colors.textMuted, fontStyle: 'italic' }]}>
          Entity information unavailable.
        </Text>
      </SectionCard>
    );
  }

  const resolvedId = entity._id ?? entityId;

  return (
    <View style={{ gap: 12 }}>
      {/* ── Identity card ─────────────────────────────────────────── */}
      <SectionCard
        icon={ownerRole === 'organization' ? 'people-outline' : 'business-outline'}
        title="Posted by"
      >
        <View style={S.head}>
          {/* Avatar — profile architecture / Cloudinary */}
          <TenderOwnerAvatar
            entity={{
              name:        entity.name,
              avatarUrl:   (entity as any).avatarUrl ?? null,
              logo:        (entity as any).logo ?? null,
              logoUrl:     entity.logoUrl ?? null,
              verified:    entity.verified,
              userProfile: (entity as any).userProfile,
              ownerRole,
            }}
            size={64}
            showBadge={entity.verified ?? false}
          />

          <View style={S.headText}>
            <View style={S.nameRow}>
              <Text style={[S.name, { color: colors.text }]} numberOfLines={2}>
                {entity.name ?? 'Unknown'}
              </Text>
              {entity.verified && (
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              )}
            </View>
            {!!entity.industry && (
              <Text style={[S.sub, { color: colors.textMuted }]} numberOfLines={1}>
                {entity.industry}
              </Text>
            )}
            {!!(entity as any).location && (
              <View style={S.metaRow}>
                <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                <Text style={[S.metaText, { color: colors.textMuted }]} numberOfLines={1}>
                  {(entity as any).location}
                </Text>
              </View>
            )}
          </View>
        </View>

        {!!entity.description && (
          <Text style={[S.description, { color: colors.text }]}>
            {entity.description}
          </Text>
        )}
      </SectionCard>

      {/* ── Contact details ────────────────────────────────────────── */}
      <SectionCard icon="call-outline" title="Contact & Details">
        <InfoRow label="Email"      value={entity.email}                                 />
        <InfoRow label="Phone"      value={entity.phone}                                 />
        <InfoRow label="Website"    value={entity.website}                               />
        <InfoRow label="Founded"    value={entity.foundedYear ? String(entity.foundedYear) : undefined} />
        <InfoRow label="Size"       value={(entity as any).size}                         />
        <InfoRow label="Headquarters" value={entity.address}                             />
      </SectionCard>

      {/* ── View profile CTA ──────────────────────────────────────── */}
      {onViewProfile && resolvedId && (
        <Pressable
          onPress={() => onViewProfile(resolvedId)}
          style={({ pressed }: { pressed: boolean }) => [
            S.cta,
            { backgroundColor: colors.primary, borderRadius: radius.md, opacity: pressed ? 0.85 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`View ${entity.name ?? 'company'} profile`}
        >
          <Ionicons name="open-outline" size={16} color={colors.textInverse} />
          <Text style={[S.ctaText, { color: colors.textInverse }]}>View full profile</Text>
        </Pressable>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  loadingRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },

  head:        { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  headText:    { flex: 1, gap: 4, minWidth: 0 },
  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name:        { fontSize: 18, fontWeight: '800', lineHeight: 22, flex: 1 },
  sub:         { fontSize: 12, fontWeight: '600' },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText:    { fontSize: 11 },

  description: { fontSize: 13, lineHeight: 19, marginTop: 10 },

  cta:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 16, minHeight: 44 },
  ctaText: { fontSize: 14, fontWeight: '700' },
});

export default TenderEntityCard;