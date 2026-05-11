// src/screens/auth/ForgotPasswordScreen.tsx
// MIGRATED: useTheme() only, AuthShell, spacing/radius tokens, Ionicons only

import React, { useRef, useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  TextInput, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { useForgotPassword } from '../../hooks/useAuth';
import { AuthShell } from './_AuthShell';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormData = z.infer<typeof schema>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation     = useNavigation<any>();
  const forgotPassword = useForgotPassword();
  const { colors: c, spacing, radius, type } = useTheme();

  const borderAnim  = useRef(new Animated.Value(0)).current;
  const borderColor = borderAnim.interpolate({ inputRange: [0, 1], outputRange: [c.inputBorder, c.primary] });

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    forgotPassword.mutate(data, {
      onSuccess: (res) => {
        if (res.success) navigation.navigate('ResetPassword', { email: data.email });
      },
    });
  });

  const apiError  = (forgotPassword.error as any)?.response?.data?.message;
  const isPending = forgotPassword.isPending;

  return (
    <AuthShell>
      {/* Icon */}
      <View style={[S.iconWrap, { marginBottom: spacing.lg }]}>
        <View style={[S.iconHalo, { backgroundColor: withAlpha(c.primary, 0.10) }]} />
        <Ionicons name="key-outline" size={52} color={c.primary} />
      </View>

      <Text style={[type.h1, { color: c.text, marginBottom: spacing.sm }]}>Forgot Password?</Text>
      <Text style={[type.body, { color: c.textMuted, marginBottom: spacing.xl, lineHeight: 22 }]}>
        Enter your email and we'll send you a reset code.
      </Text>

      {/* Error */}
      {apiError && (
        <View style={[S.errorBanner, { backgroundColor: withAlpha(c.danger, 0.10), borderColor: c.danger, borderRadius: radius.md, marginBottom: spacing.md }]}>
          <Ionicons name="alert-circle-outline" size={15} color={c.danger} />
          <Text style={[type.bodySm, { color: c.danger, flex: 1, marginLeft: spacing.sm }]}>{apiError}</Text>
        </View>
      )}

      {/* Email input */}
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => {
          const err = fieldState.error?.message;
          return (
            <View style={{ marginBottom: spacing.xl }}>
              <Animated.View style={[S.inputWrap, {
                backgroundColor:   c.inputBg,
                borderColor:       err ? c.danger : borderColor,
                borderRadius:      radius.md,
              }]}>
                <Ionicons name="mail-outline" size={18} color={c.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[S.input, { color: c.text }]}
                  placeholder="Email address"
                  placeholderTextColor={c.inputPlaceholder}
                  value={field.value}
                  onChangeText={field.onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={onSubmit}
                  onFocus={() => Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start()}
                  onBlur ={() => Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start()}
                />
              </Animated.View>
              {err && <Text style={[type.caption, { color: c.danger, marginTop: 4 }]}>{err}</Text>}
            </View>
          );
        }}
      />

      {/* CTA */}
      <Pressable
        style={({ pressed }) => [S.cta, { backgroundColor: c.primary, borderRadius: radius.md, opacity: pressed ? 0.88 : 1 }]}
        onPress={onSubmit}
        disabled={isPending}
        accessibilityRole="button"
      >
        <Text style={[S.ctaText, { color: c.bg }]}>{isPending ? 'Sending…' : 'Send Reset Code'}</Text>
      </Pressable>

      {/* Back to login */}
      <Pressable onPress={() => navigation.navigate('Login')} style={[S.backToLogin, { marginTop: spacing.xl }]} hitSlop={8}>
        <Ionicons name="arrow-back-outline" size={14} color={c.primary} />
        <Text style={[type.bodySm, { color: c.primary, fontWeight: '600' }]}>Back to login</Text>
      </Pressable>
    </AuthShell>
  );
};

const S = StyleSheet.create({
  iconWrap:    { alignItems: 'center', position: 'relative' },
  iconHalo:    { position: 'absolute', width: 100, height: 100, borderRadius: 50 },
  errorBanner: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderWidth: 1, padding: 12 },
  inputWrap:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, paddingHorizontal: 16, height: 56 },
  input:       { flex: 1, fontSize: 15 },
  cta:         { height: 56, alignItems: 'center', justifyContent: 'center' },
  ctaText:     { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  backToLogin: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});

export default ForgotPasswordScreen;