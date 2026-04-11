import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore }  from '../../store/authStore';
import { useProfile, useFreelancerRoleProfile } from '../../hooks/useProfile';
import { freelancerService } from '../../services/freelancerService';

const ACCENT = '#10B981';

const StatCard: React.FC<{ label: string; value: string | number; icon: string }> = ({ label, value, icon }) => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  return (
    <View style={[s.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name={icon as any} size={22} color={ACCENT}/>
      <Text style={[s.statVal, { color: colors.text }]}>{value}</Text>
      <Text style={[s.statLbl, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
};

export const FreelancerDashboardScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user } = useAuthStore();
  const { data: profile } = useProfile();
  const { data: roleProfile } = useFreelancerRoleProfile();
  const { data: stats } = useQuery({ queryKey:['freelancer','stats'], queryFn: freelancerService.getStats, staleTime:5*60*1000 });
  const { data: portfolio } = useQuery({ queryKey:['freelancer','portfolio'], queryFn: freelancerService.getPortfolio, staleTime:5*60*1000 });
  const completion = profile?.profileCompletion?.percentage ?? 0;

  return (
    <ScrollView style={{ flex:1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing[5], paddingTop:56 }} showsVerticalScrollIndicator={false}>
      <Text style={[s.greeting, { color: colors.textMuted, fontSize: typography.sm }]}>Welcome back 👋</Text>
      <Text style={[s.name, { color: colors.text, fontSize: typography['2xl'] }]}>{user?.name}</Text>

      <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={s.row}><Text style={{ color: colors.text, fontWeight:'600' }}>Profile strength</Text><Text style={{ color: ACCENT, fontWeight:'700' }}>{completion}%</Text></View>
        <View style={[s.barBg, { backgroundColor: colors.border }]}><View style={[s.barFill, { width:`${completion}%` as any, backgroundColor: ACCENT }]}/></View>
      </View>

      <Text style={[s.section, { color: colors.text, fontSize: typography.base }]}>Overview</Text>
      <View style={s.statsRow}>
        <StatCard label="Rating"   value={stats?.rating?.toFixed(1) ?? '—'}  icon="star"/>
        <StatCard label="Projects" value={stats?.completedProjects ?? 0}      icon="checkmark-done"/>
        <StatCard label="Reviews"  value={stats?.reviewCount ?? 0}            icon="chatbubble"/>
      </View>

      {(roleProfile?.skills?.length ?? 0) > 0 && (
        <>
          <Text style={[s.section, { color: colors.text, fontSize: typography.base, marginTop:20 }]}>Skills</Text>
          <View style={s.chips}>
            {roleProfile!.skills.slice(0,10).map((sk) => (
              <View key={sk} style={[s.chip, { backgroundColor: ACCENT+'18', borderColor: ACCENT+'40' }]}>
                <Text style={{ color: ACCENT, fontSize:11, fontWeight:'600' }}>{sk}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {(portfolio?.length ?? 0) > 0 && (
        <>
          <Text style={[s.section, { color: colors.text, fontSize: typography.base, marginTop:20 }]}>Portfolio</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing[5] }} contentContainerStyle={{ paddingHorizontal: spacing[5], gap:12 }}>
            {portfolio!.slice(0,5).map((item) => (
              <View key={item._id} style={[s.portfolioCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {(item.mediaUrls?.[0] ?? item.mediaUrl)
                  ? <Image source={{ uri: item.mediaUrls?.[0] ?? item.mediaUrl }} style={s.portfolioImg}/>
                  : <View style={[s.portfolioImg, { backgroundColor: colors.border, alignItems:'center', justifyContent:'center' }]}><Ionicons name="image-outline" size={24} color={colors.textMuted}/></View>
                }
                <Text style={{ color: colors.text, fontWeight:'600', fontSize:12, padding:8 }} numberOfLines={1}>{item.title}</Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  greeting:     { fontWeight:'500', marginBottom:2 },
  name:         { fontWeight:'800', marginBottom:20, letterSpacing:-0.5 },
  card:         { borderRadius:16, borderWidth:1, padding:16, marginBottom:24 },
  row:          { flexDirection:'row', justifyContent:'space-between', marginBottom:8 },
  barBg:        { height:6, borderRadius:99, overflow:'hidden' },
  barFill:      { height:6, borderRadius:99 },
  section:      { fontWeight:'700', marginBottom:12 },
  statsRow:     { flexDirection:'row', gap:10 },
  statCard:     { flex:1, borderRadius:14, borderWidth:1, padding:14, alignItems:'center', gap:6 },
  statVal:      { fontWeight:'800', fontSize:22 },
  statLbl:      { fontSize:11, fontWeight:'500' },
  chips:        { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip:         { borderRadius:99, borderWidth:1, paddingHorizontal:10, paddingVertical:4 },
  portfolioCard:{ width:140, borderRadius:12, borderWidth:1, overflow:'hidden' },
  portfolioImg: { width:'100%', height:90 },
});
