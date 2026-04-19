/**
 * screens/company/ProfileScreen.tsx
 */
import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Linking, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useProfile, useCompanyProfile } from '../../hooks/useProfile';
import { ProfileImageUploader } from '../../components/shared/ProfileImageUploader';
import {
  SkeletonCard, CompletionBar, InfoRow, BadgePill, VerifiedBadge,
} from '../../components/shared/ProfileAtoms';
import { useTheme } from '../../hooks/useTheme';

const ACCENT = '#3B82F6';

export const CompanyProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
 const { colors, type, spacing, isDark } = useTheme();

  const { data: profile, isLoading: pLoading, refetch: rP } = useProfile();
  const { data: company, isLoading: cLoading, refetch: rC } = useCompanyProfile();

  const isLoading = pLoading || cLoading;
  const onRefresh = useCallback(async () => { await Promise.all([rP(), rC()]); }, [rP, rC]);

  if (isLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }} contentContainerStyle={{ padding: 16 }}>
        <SkeletonCard  />
        <SkeletonCard />
        <SkeletonCard />
      </ScrollView>
    );
  }

  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar ?? null;
  const completion = profile?.profileCompletion?.percentage ?? 0;
  const name = company?.name ?? 'Your Company';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgPrimary }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={ACCENT} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Square logo upload — no cover for company */}
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <ProfileImageUploader
          currentAvatarUrl={avatarUrl}
          currentCoverUrl={null}
          accentColor={ACCENT}
          type="avatar"
          avatarShape="square"
          verifiedFull={profile?.verificationStatus === 'verified'}
        />
      </View>

      {/* Identity */}
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800' }}>{name}</Text>
          {(profile?.verificationStatus === 'verified' || company?.verified) && <VerifiedBadge size={18} />}
        </View>
        {company?.industry && (
          <Text style={{ color: ACCENT, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
            {company.industry}
          </Text>
        )}
        {company?.address && (
          <InfoRow icon="location-outline" text={company.address} style={{ marginBottom: 4 }} />
        )}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {company?.verified && (
            <BadgePill label="✓ Verified" color="#22C55E" textColor="#fff" />
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

        {/* Description */}
        {company?.description && (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>About</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginTop: 6 }}>
              {company.description}
            </Text>
          </View>
        )}

        {/* Contact */}
        <View style={[s.card, { backgroundColor: colors.bgCard }]}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Contact</Text>
          {company?.website && (
            <TouchableOpacity onPress={() => Linking.openURL(company.website!)}>
              <InfoRow icon="globe-outline" text={company.website} style={{ marginBottom: 6 }} />
            </TouchableOpacity>
          )}
          {company?.phone && (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${company.phone}`)}>
              <InfoRow icon="call-outline" text={company.phone} style={{ marginBottom: 6 }} />
            </TouchableOpacity>
          )}
          {company?.address && (
            <InfoRow icon="location-outline" text={company.address} />
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