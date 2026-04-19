import { useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdCard } from '../components/ads';
import {
  CertificationItem,
  CompanyInfoCard,
  CompletionRing,
  EducationItem,
  ExperienceItem,
  PortfolioTile,
  ProfileHeader,
  SkillChips,
  SocialLinksRow,
} from '../components/profile';
import {
  EmptyState,
  ErrorState,
  SectionHeader,
} from '../components/shared';
import {
  useOwnProfile,
  useProfileCompletion,
  useRoleProfile,
} from '../hooks';
import { getAdForPlacement } from '../theme/adsConfig';
import { useSocialTheme } from '../theme/socialTheme';
import type { Profile, UserRole } from '../types';

const ProfileScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<any>();

  const profileQ = useOwnProfile();
  const completionQ = useProfileCompletion();
  const roleQ = useRoleProfile();

  const profile: Profile | null = profileQ.data ?? null;
  const role = profile?.user?.role as UserRole | undefined;
  const showPortfolio =
    role === 'freelancer' || role === 'company' || role === 'organization';
  const showCompanyInfo = role === 'company' || role === 'organization';

  const roleSpecific =
    (roleQ.data && typeof roleQ.data === 'object' ? (roleQ.data as any) : {}) ||
    {};

  const skills =
    roleSpecific.skills ?? profile?.roleSpecific?.skills ?? [];
  const experience =
    roleSpecific.experience ?? profile?.roleSpecific?.experience ?? [];
  const education =
    roleSpecific.education ?? profile?.roleSpecific?.education ?? [];
  const certifications =
    roleSpecific.certifications ??
    profile?.roleSpecific?.certifications ??
    [];
  const portfolio =
    roleSpecific.portfolio ?? profile?.roleSpecific?.portfolio ?? [];
  const companyInfo =
    roleSpecific.companyInfo ?? profile?.roleSpecific?.companyInfo;

  const ad = getAdForPlacement(theme.role, 'profile');

  const onEdit = useCallback(() => {
    navigation.navigate('EditProfile');
  }, [navigation]);

  const onFollowers = useCallback(() => {
    navigation.navigate('Followers', { title: 'Followers' });
  }, [navigation]);

  const onFollowing = useCallback(() => {
    navigation.navigate('Following', { title: 'Following' });
  }, [navigation]);

  if (profileQ.isLoading) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: theme.bg }]}
      >
        <ActivityIndicator color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (profileQ.isError || !profile) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.bg }]}>
        <ErrorState
          message="Couldn't load your profile"
          onRetry={profileQ.refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          profile={profile}
          isOwn
          onEditPress={onEdit}
          onAvatarPress={onEdit}
          onCoverPress={onEdit}
          onFollowersPress={onFollowers}
          onFollowingPress={onFollowing}
        />

        {/* Profile completion */}
        {completionQ.data &&
        typeof completionQ.data === 'object' &&
        (completionQ.data as any)?.percentage !== undefined ? (
          <View
            style={[
              styles.completionCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <CompletionRing
              percentage={(completionQ.data as any).percentage ?? 0}
              label="done"
            />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text
                style={[styles.completionTitle, { color: theme.text }]}
              >
                Complete your profile
              </Text>
              <Text
                style={[styles.completionSub, { color: theme.subtext }]}
                numberOfLines={3}
              >
                A complete profile gets 3× more views. Add the missing
                sections to stand out.
              </Text>
              <TouchableOpacity
                onPress={onEdit}
                activeOpacity={0.85}
                style={[
                  styles.completionBtn,
                  { backgroundColor: theme.primary },
                ]}
              >
                <Text style={styles.completionBtnText}>Complete now</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Social links */}
        <View style={{ paddingHorizontal: 16 }}>
          <SocialLinksRow links={profile.socialLinks} />
        </View>

        {/* Skills */}
        <SectionHeader title="Skills" />
        <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
          <SkillChips skills={skills} />
        </View>

        {/* Ad between sections */}
        {ad ? (
          <View style={{ marginTop: 8 }}>
            <AdCard ad={ad} />
          </View>
        ) : null}

        {/* Experience */}
        <SectionHeader title="Experience" />
        <View style={styles.section}>
          {experience.length === 0 ? (
            <EmptyState
              icon="briefcase-outline"
              title="No experience added"
              actionLabel="Add experience"
              onAction={onEdit}
            />
          ) : (
            experience.map((e: any, i: number) => (
              <ExperienceItem key={e._id ?? i} experience={e} />
            ))
          )}
        </View>

        {/* Education */}
        <SectionHeader title="Education" />
        <View style={styles.section}>
          {education.length === 0 ? (
            <EmptyState
              icon="school-outline"
              title="No education added"
              actionLabel="Add education"
              onAction={onEdit}
            />
          ) : (
            education.map((e: any, i: number) => (
              <EducationItem key={e._id ?? i} education={e} />
            ))
          )}
        </View>

        {/* Certifications */}
        <SectionHeader title="Certifications" />
        <View style={styles.section}>
          {certifications.length === 0 ? (
            <EmptyState
              icon="ribbon-outline"
              title="No certifications added"
              actionLabel="Add certification"
              onAction={onEdit}
            />
          ) : (
            certifications.map((c: any, i: number) => (
              <CertificationItem key={c._id ?? i} cert={c} />
            ))
          )}
        </View>

        {/* Company Info (company / org) */}
        {showCompanyInfo && companyInfo ? (
          <>
            <SectionHeader title="About" />
            <View style={styles.section}>
              <CompanyInfoCard info={companyInfo} />
            </View>
          </>
        ) : null}

        {/* Portfolio (freelancer / company / organization) */}
        {showPortfolio ? (
          <>
            <SectionHeader title="Portfolio" />
            <View style={styles.section}>
              {portfolio.length === 0 ? (
                <EmptyState
                  icon="albums-outline"
                  title="No portfolio items yet"
                  subtitle="Showcase your best work to stand out."
                  actionLabel="Add portfolio"
                  onAction={onEdit}
                />
              ) : (
                portfolio.map((p: any, i: number) => (
                  <PortfolioTile key={p._id ?? i} item={p} />
                ))
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  completionTitle: { fontSize: 14, fontWeight: '700' },
  completionSub: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  completionBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    minHeight: 36,
    justifyContent: 'center',
  },
  completionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});

export default ProfileScreen;