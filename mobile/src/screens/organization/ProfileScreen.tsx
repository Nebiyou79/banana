/**
 * screens/organization/ProfileScreen.tsx
 *
 * Organization profile view.
 * - ProfileImageUploader type="avatar" avatarShape="square"
 * - Organization type pill, Contact info rows
 * - About, Mission, Values, Specialties sections
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useThemeStore }  from '../../store/themeStore';
import { useAuthStore }   from '../../store/authStore';
import {
  useProfile,
  useOrganizationRoleProfile,
  useVerificationStatus,
} from '../../hooks/useProfile';
import { SectionBlock, VerificationPill, SkeletonCard } from '../../components/shared/ProfileAtoms';
import { ProfileImageUploader } from '../../components/shared/ProfileImageUploader';
import type { OrganizationStackParamList } from '../../navigation/OrganizationNavigator';

type Nav  = NativeStackNavigationProp<OrganizationStackParamList>;
const ACC = '#8B5CF6';

const ORG_TYPE_LABELS: Record<string, string> = {
  'non-profit':  'Non-Profit',
  'government':  'Government',
  'educational': 'Educational',
  'healthcare':  'Healthcare',
  'other':       'Other',
};

// ─── Info row ─────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: string; label: string; value: string; href?: string }> = React.memo(
  ({ icon, label, value, href }) => {
    const { theme } = useThemeStore();
    return (
      <View style={ir.row}>
        <View style={[ir.icon, { backgroundColor: `${ACC}12` }]}>
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={15} color={ACC} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
          {href ? (
            <TouchableOpacity onPress={() => Linking.openURL(href)}>
              <Text style={{ color: ACC, fontSize: 13, fontWeight: '600' }}>{value}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>{value}</Text>
          )}
        </View>
      </View>
    );
  },
);

// ─── Tag chip ─────────────────────────────────────────────────────────────────

const Tag: React.FC<{ text: string }> = React.memo(({ text }) => (
  <View style={[tag.wrap, { backgroundColor: `${ACC}18`, borderColor: `${ACC}40` }]}>
    <Text style={[tag.text, { color: ACC }]}>{text}</Text>
  </View>
));

// ─── Main ─────────────────────────────────────────────────────────────────────

export const OrganizationProfileScreen: React.FC = () => {
  const { theme }  = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user }   = useAuthStore();
  const navigation = useNavigation<Nav>();

  const { data: profile, isLoading } = useProfile();
  const { data: roleProfile }        = useOrganizationRoleProfile();
  const { data: verification }       = useVerificationStatus();

  const prof      = profile as Record<string, unknown> | undefined;
  const avatarUrl = (prof?.avatar as Record<string, string> | undefined)?.secure_url ?? null;
  const vStatus   = (verification?.verificationStatus ?? 'none') as 'none' | 'partial' | 'full';
  const rp        = roleProfile as Record<string, unknown> | undefined;

  const orgType    = (rp?.organizationType as string) ?? '';
  const values     = (rp?.values    as string[]) ?? [];
  const specialties= (rp?.specialties as string[]) ?? [];
  const mission    = (rp?.mission   as string) ?? '';
  const secondaryPhone = (prof?.secondaryPhone as string) ?? '';

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 60, paddingHorizontal: spacing[5], gap: 16 }}>
        <SkeletonCard height={88} radius={16} style={{ width: 88 }} />
        <SkeletonCard height={24} radius={6} style={{ width: '55%' }} />
        <SkeletonCard height={80} radius={12} />
        <SkeletonCard height={80} radius={12} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      {/* Square logo */}
      <View style={{ paddingHorizontal: spacing[5], paddingTop: 56 }}>
        <ProfileImageUploader
          currentAvatarUrl={avatarUrl}
          accentColor={ACC}
          type="avatar"
          avatarShape="square"
          verifiedFull={vStatus === 'full'}
          showDeleteButtons
        />
      </View>

      {/* Name + type */}
      <View style={{ paddingHorizontal: spacing[5], marginTop: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: typography['2xl'], letterSpacing: -0.4 }}>
              {user?.name}
            </Text>
            {profile?.headline ? (
              <Text style={{ color: colors.textMuted, fontSize: typography.sm, marginTop: 2 }}>{profile.headline}</Text>
            ) : null}
          </View>
          <VerificationPill status={vStatus} />
        </View>

        {/* Org type pill */}
        {orgType ? (
          <View style={[s.typePill, { backgroundColor: `${ACC}18`, borderColor: `${ACC}40` }]}>
            <Text style={{ color: ACC, fontSize: 12, fontWeight: '700' }}>
              {ORG_TYPE_LABELS[orgType] ?? orgType}
            </Text>
          </View>
        ) : null}

        {/* Edit button */}
        <TouchableOpacity
          style={[s.editBtn, { backgroundColor: ACC }]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="pencil" size={14} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Contact */}
      <SectionBlock title="Contact & Details" style={{ marginHorizontal: spacing[5] }}>
        {profile?.location    ? <InfoRow icon="location-outline" label="Location"        value={profile.location} /> : null}
        {profile?.website     ? <InfoRow icon="globe-outline"    label="Website"         value={profile.website} href={profile.website} /> : null}
        {profile?.phone       ? <InfoRow icon="call-outline"     label="Primary Phone"   value={profile.phone} href={`tel:${profile.phone}`} /> : null}
        {secondaryPhone       ? <InfoRow icon="call-outline"     label="Secondary Phone" value={secondaryPhone} href={`tel:${secondaryPhone}`} /> : null}
        {rp?.registrationNumber ? <InfoRow icon="document-outline" label="Reg. Number"   value={String(rp.registrationNumber)} /> : null}
      </SectionBlock>

      {/* About */}
      {profile?.bio ? (
        <SectionBlock title="About" style={{ marginHorizontal: spacing[5] }}>
          <Text style={{ color: colors.textMuted, fontSize: typography.sm, lineHeight: 20 }}>{profile.bio}</Text>
        </SectionBlock>
      ) : null}

      {/* Mission */}
      {mission ? (
        <SectionBlock title="Mission" style={{ marginHorizontal: spacing[5] }}>
          <Text style={{ color: colors.textMuted, fontSize: typography.sm, lineHeight: 20, fontStyle: 'italic' }}>"{mission}"</Text>
        </SectionBlock>
      ) : null}

      {/* Values */}
      {values.length > 0 ? (
        <SectionBlock title="Values" style={{ marginHorizontal: spacing[5] }}>
          <View style={s.tagWrap}>{values.map((v) => <Tag key={v} text={v} />)}</View>
        </SectionBlock>
      ) : null}

      {/* Specialties */}
      {specialties.length > 0 ? (
        <SectionBlock title="Areas of Focus" style={{ marginHorizontal: spacing[5] }}>
          <View style={s.tagWrap}>{specialties.map((sp) => <Tag key={sp} text={sp} />)}</View>
        </SectionBlock>
      ) : null}
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  typePill: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, marginTop: 8 },
  editBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, marginTop: 10 },
  tagWrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

const ir = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});

const tag = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  text: { fontSize: 12, fontWeight: '600' },
});