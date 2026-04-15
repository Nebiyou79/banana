/**
 * screens/organization/
 * ─ DashboardScreen.tsx
 * ─ ProfileScreen.tsx
 * ─ EditProfileScreen.tsx
 * ─ MoreScreen.tsx
 *
 * All four Organization role screens, strictly isolated from Company / Candidate styles.
 * Accent colour: #8B5CF6 (violet).
 */

import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
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
import {
  ProfileHeader,
  SectionBlock, VerificationPill,
} from '../../components/shared/ProfileAtoms';
import type { OrganizationStackParamList } from '../../navigation/OrganizationNavigator';

type Nav  = NativeStackNavigationProp<OrganizationStackParamList>;
const ACC = '#8B5CF6';

const OrgTag: React.FC<{ text: string }> = React.memo(({ text }) => (
  <View style={[pt.tag, { backgroundColor: ACC + '18', borderColor: ACC + '40' }]}>
    <Text style={[pt.tagText, { color: ACC }]}>{text}</Text>
  </View>
));

const OrgInfoRow: React.FC<{ icon: string; label: string; value: string; href?: string }> = ({
  icon, label, value, href,
}) => {
  const { theme } = useThemeStore();
  return (
    <View style={pt.ir}>
      <View style={[pt.irIcon, { backgroundColor: ACC + '12' }]}>
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

export const OrganizationProfileScreen: React.FC = () => {
  const { theme }  = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user }   = useAuthStore();
  const navigation = useNavigation<Nav>();

  const { data: profile, isLoading } = useProfile();
  const { data: roleProfile }        = useOrganizationRoleProfile();
  const { data: verification }       = useVerificationStatus();

  const avatarUrl = profile?.avatar?.secure_url ?? null;
  const coverUrl  = profile?.cover?.secure_url  ?? null;
  const vStatus   = (verification?.verificationStatus ?? 'none') as any;
  const values    = roleProfile?.values    ?? [];
  const specialties = roleProfile?.specialties ?? [];

  if (isLoading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={ACC} /></View>;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      <ProfileHeader
        name={user?.name ?? 'Organization'}
        headline={profile?.headline}
        avatarUrl={avatarUrl}
        coverUrl={coverUrl}
        accentColor={ACC}
        verifiedFull={vStatus === 'full'}
        onEdit={() => navigation.navigate('EditProfile')}
        rightSlot={<VerificationPill status={vStatus} />}
      />

      <View style={{ paddingHorizontal: spacing[5], paddingBottom: 48 }}>
        {/* Contact */}
        <SectionBlock title="Contact & Details">
          {profile?.location && <OrgInfoRow icon="location-outline" label="Location" value={profile.location} />}
          {profile?.website  && <OrgInfoRow icon="globe-outline"    label="Website"  value={profile.website} href={profile.website} />}
          {profile?.phone    && <OrgInfoRow icon="call-outline"     label="Phone"    value={profile.phone} href={`tel:${profile.phone}`} />}
        </SectionBlock>

        {/* About */}
        {profile?.bio && (
          <SectionBlock title="About">
            <Text style={{ color: colors.textMuted, fontSize: typography.sm, lineHeight: 20 }}>{profile.bio}</Text>
          </SectionBlock>
        )}

        {/* Mission */}
        {roleProfile?.mission && (
          <SectionBlock title="Mission">
            <Text style={{ color: colors.textMuted, fontSize: typography.sm, lineHeight: 20, fontStyle: 'italic' }}>"{roleProfile.mission}"</Text>
          </SectionBlock>
        )}

        {/* Values */}
        {values.length > 0 && (
          <SectionBlock title="Values">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {values.map((v) => <OrgTag key={v} text={v} />)}
            </View>
          </SectionBlock>
        )}

        {/* Specialties */}
        {specialties.length > 0 && (
          <SectionBlock title="Areas of Focus">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {specialties.map((sp) => <OrgTag key={sp} text={sp} />)}
            </View>
          </SectionBlock>
        )}
      </View>
    </ScrollView>
  );
};
const pt = StyleSheet.create({
  tag:     { borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  tagText: { fontSize: 12, fontWeight: '600' },
  ir:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  irIcon:  { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});