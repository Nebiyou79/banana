/**
 * screens/organization/ProfileScreen.tsx
 */
import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Linking, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useProfile, useOrganizationProfile } from '../../hooks/useProfile';
import { organizationService } from '../../services/companyService';
import { ProfileImageUploader } from '../../components/shared/ProfileImageUploader';
import {
  SkeletonCard, CompletionBar, InfoRow, BadgePill, VerifiedBadge,
} from '../../components/shared/ProfileAtoms';
import useTheme from '../../hooks/useThemes';

const ACCENT = '#10B981';

export const OrganizationProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, type, spacing, isDark } = useTheme(); 

  const { data: profile, isLoading: pLoading, refetch: rP } = useProfile();
  const { data: org, isLoading: oLoading, refetch: rO } = useOrganizationProfile();

  const isLoading = pLoading || oLoading;
  const onRefresh = useCallback(async () => { await Promise.all([rP(), rO()]); }, [rP, rO]);

  if (isLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }} contentContainerStyle={{ padding: 16 }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </ScrollView>
    );
  }

  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar ?? null;
  const completion = profile?.profileCompletion?.percentage ?? 0;
  const typeLabel = organizationService.getOrganizationTypeLabel(org?.organizationType);
  const location = org?.address ?? '';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgPrimary }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={ACCENT} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Square logo — no cover */}
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <ProfileImageUploader
          currentAvatarUrl={avatarUrl}
          currentCoverUrl={null}
          accentColor={ACCENT}
          type="avatar"
          avatarShape="square"
          verifiedFull={org?.verified}
        />
      </View>

      {/* Identity */}
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800' }}>
            {org?.name ?? 'Your Organization'}
          </Text>
          {org?.verified && <VerifiedBadge size={18} />}
        </View>
        {typeLabel && (
          <Text style={{ color: ACCENT, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
            {typeLabel}
          </Text>
        )}
        {org?.industry && (
          <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 4 }}>{org.industry}</Text>
        )}
        {location && (
          <InfoRow icon="location-outline" text={location} style={{ marginBottom: 4 }} />
        )}

        {/* Type pill + verification */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {typeLabel && (
            <BadgePill label={typeLabel} color={ACCENT + '20'} textColor={ACCENT} />
          )}
          {org?.verified && (
            <BadgePill label="✓ Verified" color="#22C55E" textColor="#fff" />
          )}
          {org?.registrationNumber && (
            <BadgePill
              label={`Reg: ${org.registrationNumber}`}
              color={colors.bgSurface}
              textColor={colors.textMuted}
            />
          )}
        </View>
      </View>

      <View style={{ padding: 16, gap: 14 }}>
        {/* Edit */}
        <TouchableOpacity
          style={[s.editBtn, { backgroundColor: ACCENT }]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="pencil-outline" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Completion */}
        {completion < 100 && (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            <CompletionBar percentage={completion} label="Profile Completion" accentColor={ACCENT} />
          </View>
        )}

        {/* Mission */}
        {org?.mission && (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="flag-outline" size={16} color={ACCENT} />
              <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Mission</Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 22, fontStyle: 'italic' }}>
              "{org.mission}"
            </Text>
          </View>
        )}

        {/* About */}
        {org?.description && (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>About</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginTop: 6 }}>
              {org.description}
            </Text>
          </View>
        )}

        {/* Contact */}
        <View style={[s.card, { backgroundColor: colors.bgCard }]}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Contact</Text>
          {org?.website && (
            <TouchableOpacity onPress={() => Linking.openURL(org.website!)}>
              <InfoRow icon="globe-outline" text={org.website} style={{ marginBottom: 6 }} />
            </TouchableOpacity>
          )}
          {org?.phone && (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${org.phone}`)}>
              <InfoRow icon="call-outline" text={org.phone} style={{ marginBottom: 6 }} />
            </TouchableOpacity>
          )}
          {org?.secondaryPhone && (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${org.secondaryPhone}`)}>
              <InfoRow icon="call-outline" text={`${org.secondaryPhone} (alt)`} style={{ marginBottom: 6 }} />
            </TouchableOpacity>
          )}
          {org?.address && (
            <InfoRow icon="location-outline" text={org.address} />
          )}
        </View>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12,
  },
  card: { borderRadius: 14, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
});