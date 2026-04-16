/**
 * screens/company/ProfileScreen.tsx
 *
 * Company profile view.
 * - ProfileImageUploader type="avatar" avatarShape="square" for inline logo tap
 * - Industry, HQ, Website, Phone info rows
 * - About, Mission, Specialties sections
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useThemeStore }  from '../../store/themeStore';
import { useAuthStore }   from '../../store/authStore';
import { useProfile, useCompanyRoleProfile, useVerificationStatus } from '../../hooks/useProfile';
import { SectionBlock, VerificationPill, SkeletonCard } from '../../components/shared/ProfileAtoms';
import { ProfileImageUploader } from '../../components/shared/ProfileImageUploader';
import type { CompanyStackParamList } from '../../navigation/CompanyNavigator';

type Nav  = NativeStackNavigationProp<CompanyStackParamList>;
const ACC = '#3B82F6';

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

export const CompanyProfileScreen: React.FC = () => {
  const { theme }  = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user }   = useAuthStore();
  const navigation = useNavigation<Nav>();

  const { data: profile, isLoading } = useProfile();
  const { data: roleProfile }        = useCompanyRoleProfile();
  const { data: verification }       = useVerificationStatus();

  const prof      = profile as Record<string, unknown> | undefined;
  const avatarUrl = (prof?.avatar as Record<string, string> | undefined)?.secure_url ?? null;
  const vStatus   = (verification?.verificationStatus ?? 'none') as 'none' | 'partial' | 'full';
  const rp        = roleProfile as Record<string, unknown> | undefined;
  const specialties = (rp?.specialties as string[]) ?? [];
  const companyInfo = (rp?.companyInfo ?? rp) as Record<string, string> | undefined ?? {};

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
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

      {/* Square logo (avatar only, no cover for companies) */}
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

      {/* Name + headline */}
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

        {/* Edit button */}
        <TouchableOpacity
          style={[s.editBtn, { backgroundColor: ACC }]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="pencil" size={14} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Contact & Details */}
      <SectionBlock title="Contact & Details" style={{ marginHorizontal: spacing[5] }}>
        {companyInfo.industry ? <InfoRow icon="business-outline"  label="Industry"    value={companyInfo.industry} /> : null}
        {profile?.location    ? <InfoRow icon="location-outline"  label="Headquarters" value={profile.location} /> : null}
        {profile?.website     ? <InfoRow icon="globe-outline"     label="Website"     value={profile.website} href={profile.website} /> : null}
        {profile?.phone       ? <InfoRow icon="call-outline"      label="Phone"       value={profile.phone} href={`tel:${profile.phone}`} /> : null}
        {companyInfo.tin      ? <InfoRow icon="shield-outline"    label="TIN"         value={companyInfo.tin} /> : null}
      </SectionBlock>

      {/* About */}
      {profile?.bio ? (
        <SectionBlock title="About" style={{ marginHorizontal: spacing[5] }}>
          <Text style={{ color: colors.textMuted, fontSize: typography.sm, lineHeight: 20 }}>{profile.bio}</Text>
        </SectionBlock>
      ) : null}

      {/* Mission */}
      {rp?.mission ? (
        <SectionBlock title="Mission" style={{ marginHorizontal: spacing[5] }}>
          <Text style={{ color: colors.textMuted, fontSize: typography.sm, lineHeight: 20, fontStyle: 'italic' }}>
            "{String(rp.mission)}"
          </Text>
        </SectionBlock>
      ) : null}

      {/* Specialties */}
      {specialties.length > 0 ? (
        <SectionBlock title="Specialties" style={{ marginHorizontal: spacing[5] }}>
          <View style={s.tagWrap}>
            {specialties.map((sp) => <Tag key={sp} text={sp} />)}
          </View>
        </SectionBlock>
      ) : null}
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, marginTop: 12 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

const ir = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});

const tag = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  text: { fontSize: 12, fontWeight: '600' },
});