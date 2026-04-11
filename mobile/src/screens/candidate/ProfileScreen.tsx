import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore }  from '../../store/authStore';
import { useProfile, useCandidateRoleProfile, useVerificationStatus } from '../../hooks/useProfile';
import { roleProfileService } from '../../services/roleProfileService';
import type { CandidateStackParamList } from '../../navigation/CandidateNavigator';

type Nav = NativeStackNavigationProp<CandidateStackParamList>;
const ACCENT = '#F59E0B';

export const CandidateProfileScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user } = useAuthStore();
  const navigation = useNavigation<Nav>();
  const { data: profile, isLoading } = useProfile();
  const { data: roleProfile } = useCandidateRoleProfile();
  const { data: verification } = useVerificationStatus();

  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar;
  const initials  = (user?.name ?? 'U').split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);

  if (isLoading) return <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.background }}><ActivityIndicator color={ACCENT}/></View>;

  return (
    <ScrollView style={{ flex:1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      {/* Cover */}
      <View style={[s.cover, { backgroundColor: ACCENT + '30' }]}>
        {profile?.cover?.secure_url && <Image source={{ uri: profile.cover.secure_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover"/>}
      </View>

      {/* Avatar row */}
      <View style={[s.avatarRow, { paddingHorizontal: spacing[5] }]}>
        <View style={[s.avatarWrap, { borderColor: colors.background }]}>
          {avatarUrl
            ? <Image source={{ uri: avatarUrl }} style={s.avatar}/>
            : <View style={[s.avatar, { backgroundColor: ACCENT, alignItems:'center', justifyContent:'center' }]}><Text style={{ color:'#fff', fontWeight:'800', fontSize: typography.xl }}>{initials}</Text></View>
          }
          {verification?.verificationStatus === 'full' && (
            <View style={[s.badge, { backgroundColor: '#10B981' }]}><Ionicons name="checkmark" size={10} color="#fff"/></View>
          )}
        </View>
        <TouchableOpacity style={[s.editBtn, { backgroundColor: ACCENT }]} onPress={() => navigation.navigate('EditProfile')}>
          <Ionicons name="pencil" size={14} color="#fff"/>
          <Text style={{ color:'#fff', fontWeight:'600', fontSize: typography.sm, marginLeft:4 }}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: spacing[5], paddingBottom: 40 }}>
        <Text style={[s.name, { color: colors.text, fontSize: typography['2xl'] }]}>{user?.name}</Text>
        {profile?.headline && <Text style={[s.headline, { color: colors.textMuted, fontSize: typography.base }]}>{profile.headline}</Text>}
        {profile?.location && (
          <View style={s.infoRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted}/>
            <Text style={{ color: colors.textMuted, fontSize: typography.sm, marginLeft:4 }}>{profile.location}</Text>
          </View>
        )}

        {profile?.bio && (
          <View style={[s.section, { borderColor: colors.border }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>About</Text>
            <Text style={{ color: colors.textMuted, fontSize: typography.sm, lineHeight:20 }}>{profile.bio}</Text>
          </View>
        )}

        {(roleProfile?.skills?.length ?? 0) > 0 && (
          <View style={[s.section, { borderColor: colors.border }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Skills</Text>
            <View style={s.chips}>
              {roleProfile!.skills.map((sk) => (
                <View key={sk} style={[s.chip, { backgroundColor: ACCENT+'18', borderColor: ACCENT+'40' }]}>
                  <Text style={{ color: ACCENT, fontSize: typography.xs, fontWeight:'600' }}>{sk}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {(roleProfile?.experience?.length ?? 0) > 0 && (
          <View style={[s.section, { borderColor: colors.border }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Experience</Text>
            {roleProfile!.experience.map((exp, i) => (
              <View key={i} style={s.timelineItem}>
                <Text style={{ color: colors.text, fontWeight:'700', fontSize: typography.sm }}>{exp.title}</Text>
                <Text style={{ color: ACCENT, fontWeight:'500', fontSize: typography.sm }}>{exp.company}</Text>
                <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>{roleProfileService.formatDateRange(exp.startDate, exp.endDate, exp.current)}</Text>
              </View>
            ))}
          </View>
        )}

        {(roleProfile?.education?.length ?? 0) > 0 && (
          <View style={[s.section, { borderColor: colors.border }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Education</Text>
            {roleProfile!.education.map((edu, i) => (
              <View key={i} style={s.timelineItem}>
                <Text style={{ color: colors.text, fontWeight:'700', fontSize: typography.sm }}>{edu.degree}{edu.field ? ` · ${edu.field}` : ''}</Text>
                <Text style={{ color: ACCENT, fontWeight:'500', fontSize: typography.sm }}>{edu.institution}</Text>
                <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>{roleProfileService.formatDateRange(edu.startDate, edu.endDate, edu.current)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  cover:       { height: 140 },
  avatarRow:   { flexDirection:'row', alignItems:'flex-end', justifyContent:'space-between', marginTop:-40, marginBottom:12 },
  avatarWrap:  { width:84, height:84, borderRadius:42, borderWidth:3, overflow:'hidden' },
  avatar:      { width:'100%', height:'100%' },
  badge:       { position:'absolute', bottom:2, right:2, width:18, height:18, borderRadius:9, alignItems:'center', justifyContent:'center' },
  editBtn:     { flexDirection:'row', alignItems:'center', paddingHorizontal:14, paddingVertical:8, borderRadius:99 },
  name:        { fontWeight:'800', marginBottom:4 },
  headline:    { marginBottom:6 },
  infoRow:     { flexDirection:'row', alignItems:'center', marginBottom:4 },
  section:     { borderTopWidth:1, paddingTop:16, marginTop:16 },
  sectionTitle:{ fontWeight:'700', marginBottom:10, fontSize:15 },
  chips:       { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip:        { borderRadius:99, borderWidth:1, paddingHorizontal:10, paddingVertical:4 },
  timelineItem:{ marginBottom:14 },
});