/**
 * screens/company/ProfileScreen.tsx
 *
 * Read-only Company "business card" view.
 */

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Linking, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useThemeStore }  from '../../store/themeStore';
import { useAuthStore }   from '../../store/authStore';
import { useProfile, useCompanyRoleProfile, useVerificationStatus } from '../../hooks/useProfile';
import {
  ProfileHeader, SectionBlock, VerificationPill,
} from '../../components/shared/ProfileAtoms';
import type { CompanyStackParamList } from '../../navigation/CompanyNavigator';

type Nav  = NativeStackNavigationProp<CompanyStackParamList>;
const ACC = '#3B82F6';

// ─── Specialties / tags ────────────────────────────────────────────────────────

const Tag: React.FC<{ text: string }> = React.memo(({ text }) => (
  <View style={[tag.wrap, { backgroundColor: ACC + '18', borderColor: ACC + '40' }]}>
    <Text style={[tag.text, { color: ACC }]}>{text}</Text>
  </View>
));

// ─── Info row ─────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: string; label: string; value: string; href?: string }> = ({
  icon, label, value, href,
}) => {
  const { theme } = useThemeStore();
  return (
    <View style={ir.row}>
      <View style={[ir.icon, { backgroundColor: ACC + '12' }]}>
        <Ionicons name={icon as any} size={15} color={ACC} />
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
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const CompanyProfileScreen: React.FC = () => {
  const { theme }   = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user }    = useAuthStore();
  const navigation  = useNavigation<Nav>();
  const { data: profile, isLoading }    = useProfile();
  const { data: roleProfile }           = useCompanyRoleProfile();
  const { data: verification }          = useVerificationStatus();

  const avatarUrl = profile?.avatar?.secure_url ?? null;
  const coverUrl  = profile?.cover?.secure_url  ?? null;
  const vStatus   = verification?.verificationStatus ?? 'none';
  const specialties = roleProfile?.specialties ?? [];

  if (isLoading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={ACC} /></View>;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      <ProfileHeader
        name={user?.name ?? 'Company'}
        headline={profile?.headline}
        avatarUrl={avatarUrl}
        coverUrl={coverUrl}
        accentColor={ACC}
        verifiedFull={vStatus === 'full'}
        onEdit={() => navigation.navigate('EditProfile')}
        rightSlot={<VerificationPill status={vStatus as any} />}
      />

      <View style={{ paddingHorizontal: spacing[5], paddingBottom: 48 }}>

        {/* Contact info */}
        <SectionBlock title="Contact & Details">
          {roleProfile?.companyInfo?.industry ? (
            <InfoRow icon="business-outline" label="Industry" value={roleProfile.companyInfo.industry} />
          ) : null}
          {profile?.location ? (
            <InfoRow icon="location-outline" label="Headquarters" value={profile.location} />
          ) : null}
          {profile?.website ? (
            <InfoRow icon="globe-outline" label="Website" value={profile.website} href={profile.website} />
          ) : null}
          {profile?.phone ? (
            <InfoRow icon="call-outline" label="Phone" value={profile.phone} href={`tel:${profile.phone}`} />
          ) : null}
        </SectionBlock>

        {/* About */}
        {profile?.bio ? (
          <SectionBlock title="About">
            <Text style={{ color: colors.textMuted, fontSize: typography.sm, lineHeight: 20 }}>{profile.bio}</Text>
          </SectionBlock>
        ) : null}

        {/* Mission */}
        {roleProfile?.mission ? (
          <SectionBlock title="Mission">
            <Text style={{ color: colors.textMuted, fontSize: typography.sm, lineHeight: 20, fontStyle: 'italic' }}>"{roleProfile.mission}"</Text>
          </SectionBlock>
        ) : null}

        {/* Specialties */}
        {specialties.length > 0 ? (
          <SectionBlock title="Specialties">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {specialties.map((sp) => <Tag key={sp} text={sp} />)}
            </View>
          </SectionBlock>
        ) : null}

      </View>
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const tag = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  text: { fontSize: 12, fontWeight: '600' },
});

const ir = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});