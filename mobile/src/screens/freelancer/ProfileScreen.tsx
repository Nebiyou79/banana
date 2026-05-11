/**
 * screens/freelancer/ProfileScreen.tsx
 */
import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  RefreshControl, Linking, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { FONT_SIZE } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';
import {
  useProfile, useFreelancerProfile, useFreelancerCertifications,
} from '../../hooks/useProfile';
import { freelancerService } from '../../services/freelancerService';
import { ProfileImageUploader } from '../../components/shared/ProfileImageUploader';
import {
  SkeletonCard, CompletionBar, InfoRow, BadgePill, VerifiedBadge,
} from '../../components/shared/ProfileAtoms';

const AVAILABILITY_CONFIG: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  available:     { label: 'Available',     icon: 'checkmark-circle-outline', color: '#10B981' },
  'part-time':   { label: 'Part-time',     icon: 'time-outline',             color: '#F59E0B' },
  'not-available': { label: 'Not Available', icon: 'close-circle-outline',   color: '#EF4444' },
};

export const FreelancerProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, spacing, isDark } = useTheme();
  const { user } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);

  const { data: profile, isLoading: pLoading, refetch: rP } = useProfile();
  const { data: fpData, isLoading: fLoading, refetch: rF } = useFreelancerProfile();
  const { data: certs, isLoading: cLoading, refetch: rCerts } = useFreelancerCertifications();

  const isLoading = pLoading || fLoading;

  const accentColor = colors.organization; // purple for profile

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([rP(), rF(), rCerts()]);
    setRefreshing(false);
  }, [rP, rF, rCerts]);

  if (isLoading) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: spacing.lg }}
      >
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </ScrollView>
    );
  }

  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar ?? null;
  const coverUrl = profile?.cover?.secure_url ?? null;
  const name = profile?.user?.name ?? user?.name ?? 'Your Name';
  const fp = fpData?.freelancerProfile;
  const skills: string[] = (fpData?.skills ?? []).map((s: any) =>
    typeof s === 'string' ? s : s.name
  );
  const portfolio = (fpData?.portfolio ?? []).slice(0, 3);
  const certList = certs ?? fpData?.certifications ?? [];
  const completion = profile?.profileCompletion?.percentage ?? 0;
  const availability = fp?.availability ?? 'available';
  const avCfg = AVAILABILITY_CONFIG[availability] ?? AVAILABILITY_CONFIG.available;
  const socialLinks = fp?.socialLinks ?? profile?.socialLinks ?? {};
  const activeSocial = Object.entries(socialLinks).filter(([, v]) => !!v);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Inline upload */}
      <ProfileImageUploader
        currentAvatarUrl={avatarUrl}
        currentCoverUrl={coverUrl}
        accentColor={accentColor}
        type="both"
        avatarShape="circle"
        verifiedFull={fp?.verified}
      />

      {/* Identity */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>{name}</Text>
          {fp?.verified && <VerifiedBadge size={18} />}
        </View>
        {fp?.headline && (
          <Text style={{ color: accentColor, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
            {fp.headline}
          </Text>
        )}
        {profile?.location && (
          <InfoRow icon="location-outline" text={profile.location} style={{ marginBottom: 4 }} />
        )}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {/* Availability with Ionicons — no emoji */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4,
            backgroundColor: withAlpha(avCfg.color, 0.12), paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 }}>
            <Ionicons name={avCfg.icon} size={12} color={avCfg.color} />
            <Text style={{ color: avCfg.color, fontSize: 12, fontWeight: '700' }}>{avCfg.label}</Text>
          </View>
          {fp?.hourlyRate ? (
            <BadgePill label={`$${fp.hourlyRate}/hr`} color={withAlpha(accentColor, 0.10)} textColor={accentColor} />
          ) : null}
          {fp?.experienceLevel && (
            <BadgePill
              label={fp.experienceLevel.charAt(0).toUpperCase() + fp.experienceLevel.slice(1)}
              color={colors.bgCard}
              textColor={colors.textSecondary}
            />
          )}
        </View>
      </View>

      <View style={{ padding: spacing.lg, gap: 14 }}>
        {/* Edit */}
        <TouchableOpacity
          style={[s.editBtn, { backgroundColor: accentColor }]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="pencil-outline" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Completion */}
        {completion < 100 && (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            <CompletionBar percentage={completion} label="Profile Completion" accentColor={accentColor} />
          </View>
        )}

        {/* Bio */}
        {(fp?.headline ?? profile?.bio) && (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>About</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginTop: 6 }}>
              {fp?.headline ?? profile?.bio}
            </Text>
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Skills</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {skills.map((sk, i) => (
                <View key={i} style={[s.chip, { backgroundColor: withAlpha(accentColor, 0.10) }]}>
                  <Text style={{ color: accentColor, fontSize: 12, fontWeight: '600' }}>{sk}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Specialization */}
        {fp?.specialization && fp.specialization.length > 0 && (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Specializations</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {fp.specialization.map((spec: string, i: number) => (
                <View key={i} style={[s.chip, { backgroundColor: colors.bgCard }]}>
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Portfolio preview */}
        {portfolio.length > 0 && (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Portfolio</Text>
            {portfolio.map((item: any, i: number) => {
              const imgUrl = item.mediaUrls?.[0] ?? item.mediaUrl;
              return (
                <View
                  key={item._id ?? i}
                  style={[s.portfolioRow, { borderColor: colors.border }]}
                >
                  {imgUrl ? (
                    <Image
                      source={{ uri: freelancerService.getOptimizedUrl(imgUrl, 80, 80) }}
                      style={{ width: 60, height: 60, borderRadius: 10 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ width: 60, height: 60, borderRadius: 10, backgroundColor: withAlpha(accentColor, 0.10), alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="image-outline" size={24} color={accentColor} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>
                      {item.title}
                    </Text>
                    <Text numberOfLines={2} style={{ color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 2 }}>
                      {item.description}
                    </Text>
                    {item.technologies && item.technologies.length > 0 && (
                      <Text style={{ color: accentColor, fontSize: 11, marginTop: 4 }}>
                        {item.technologies.slice(0, 3).join(' · ')}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Certifications */}
        {certList.length > 0 && (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Certifications</Text>
            {certList.map((cert: any, i: number) => (
              <View key={cert._id ?? i} style={[s.certRow, { borderColor: colors.border }]}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: withAlpha(accentColor, 0.10), alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="ribbon-outline" size={16} color={accentColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>
                    {cert.name}
                  </Text>
                  <Text style={{ color: accentColor, fontSize: 12, fontWeight: '600' }}>{cert.issuer}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                    {new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </Text>
                  {cert.credentialUrl && (
                    <TouchableOpacity onPress={() => Linking.openURL(cert.credentialUrl!)}>
                      <Text style={{ color: accentColor, fontSize: 12, fontWeight: '600', marginTop: 4 }}>
                        View credential
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Social */}
        {activeSocial.length > 0 && (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Links</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
              {activeSocial.map(([platform, url]) => {
                const icons: Record<string, string> = {
                  linkedin: 'logo-linkedin', github: 'logo-github',
                  twitter: 'logo-twitter', tiktok: 'logo-tiktok',
                  behance: 'color-palette-outline', dribbble: 'basketball-outline',
                  youtube: 'logo-youtube', telegram: 'paper-plane-outline',
                  discord: 'chatbubbles-outline',
                };
                const icon = icons[platform] ?? 'link-outline';
                return (
                  <TouchableOpacity
                    key={platform}
                    onPress={() => Linking.openURL(url as string)}
                    style={[s.socialBtn, { backgroundColor: withAlpha(accentColor, 0.10) }]}
                  >
                    <Ionicons name={icon as any} size={20} color={accentColor} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Contact */}
        <View style={[s.card, { backgroundColor: colors.bgCard }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Contact</Text>
          {profile?.phone && (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${profile.phone}`)}>
              <InfoRow icon="call-outline" text={profile.phone} style={{ marginBottom: 6 }} />
            </TouchableOpacity>
          )}
          {profile?.website && (
            <TouchableOpacity onPress={() => Linking.openURL(profile.website!)}>
              <InfoRow icon="globe-outline" text={profile.website} style={{ marginBottom: 6 }} />
            </TouchableOpacity>
          )}
          {profile?.user?.email && (
            <InfoRow icon="mail-outline" text={profile.user.email} />
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
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  certRow: {
    flexDirection: 'row', gap: 12, marginTop: 12, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  portfolioRow: {
    flexDirection: 'row', gap: 12, marginTop: 12, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  socialBtn: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});