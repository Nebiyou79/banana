import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { useThemeStore } from '../../store/themeStore';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { Input } from '../../components/ui/Input';

const ACCENT = '#F59E0B';

export const CandidateEditProfileScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<any>();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const { control, handleSubmit } = useForm({
    defaultValues: {
      headline: profile?.headline ?? '',
      bio:      profile?.bio      ?? '',
      location: profile?.location ?? '',
      phone:    profile?.phone    ?? '',
      website:  profile?.website  ?? '',
    },
  });

  const onSave = handleSubmit((data) =>
    updateProfile.mutate(data, { onSuccess: () => navigation.goBack() })
  );

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
          <Ionicons name="close" size={24} color={colors.text}/>
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.text, fontSize: typography.lg }]}>Edit Profile</Text>
        <TouchableOpacity onPress={onSave} disabled={updateProfile.isPending}>
          <Text style={{ color: ACCENT, fontSize: typography.base, fontWeight:'700' }}>
            {updateProfile.isPending ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[5] }} keyboardShouldPersistTaps="handled">
        <Controller control={control} name="headline"
          render={({ field }) => <Input label="Headline" placeholder="e.g. Frontend Developer" value={field.value} onChangeText={field.onChange}/>}/>
        <Controller control={control} name="bio"
          render={({ field }) => <Input label="Bio" placeholder="Tell employers about yourself…" value={field.value} onChangeText={field.onChange} multiline numberOfLines={4}/>}/>
        <Controller control={control} name="location"
          render={({ field }) => <Input label="Location" placeholder="City, Country" value={field.value} onChangeText={field.onChange} leftIcon={<Ionicons name="location-outline" size={16} color={colors.textMuted}/>}/>}/>
        <Controller control={control} name="phone"
          render={({ field }) => <Input label="Phone" placeholder="+1 555 000 0000" value={field.value} onChangeText={field.onChange} keyboardType="phone-pad" leftIcon={<Ionicons name="call-outline" size={16} color={colors.textMuted}/>}/>}/>
        <Controller control={control} name="website"
          render={({ field }) => <Input label="Website" placeholder="https://yoursite.com" value={field.value} onChangeText={field.onChange} keyboardType="url" autoCapitalize="none" leftIcon={<Ionicons name="globe-outline" size={16} color={colors.textMuted}/>}/>}/>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  header:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16, paddingTop:52, borderBottomWidth:1 },
  title:   { fontWeight:'700' },
  iconBtn: { width:36, height:36, alignItems:'center', justifyContent:'center' },
});