// src/screens/auth/ForgotPasswordScreen.tsx
// Fixed: navigates to OtpVerify (for reset) after successful email submit

import React, { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar,
  TextInput, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useForgotPassword } from '../../hooks/useAuth';

const NAVY  = '#050D1A';
const GOLD  = '#F1BB03';
const TEXT_PRI = '#F8FAFC';
const TEXT_MUT = '#64748B';
const BORDER   = 'rgba(255,255,255,0.10)';
const INPUT_BG = 'rgba(255,255,255,0.05)';
const ERROR    = '#EF4444';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormData = z.infer<typeof schema>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation     = useNavigation<any>();
  const forgotPassword = useForgotPassword();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }),
    ]).start();
  }, []);

  const { control, handleSubmit, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    forgotPassword.mutate(data, {
      onSuccess: (res) => {
        if (res.success) {
          // Navigate to ResetPassword which has the OTP+new password flow
          navigation.navigate('ResetPassword', { email: data.email });
        }
      },
    });
  });

  const apiError  = (forgotPassword.error as any)?.response?.data?.message;
  const isPending = forgotPassword.isPending;

  const borderAnim = useRef(new Animated.Value(0)).current;
  const borderColor = borderAnim.interpolate({ inputRange: [0,1], outputRange: [BORDER, GOLD] });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={[styles.bgDot, { top: -60, right: -60 }]} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            {/* Back */}
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <View style={styles.backCircle}>
                <Ionicons name="arrow-back" size={18} color={TEXT_PRI} />
              </View>
            </Pressable>

            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              {/* Icon */}
              <View style={styles.iconWrap}>
                <View style={styles.iconHalo} />
                <Text style={{ fontSize: 52 }}>🔑</Text>
              </View>

              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>Enter your email and we'll send you a reset code.</Text>

              {/* Error */}
              {apiError && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={15} color={ERROR} />
                  <Text style={{ color: ERROR, fontSize: 13, flex: 1 }}>{apiError}</Text>
                </View>
              )}

              {/* Email input */}
              <Controller
                control={control}
                name="email"
                render={({ field, fieldState }) => {
                  const err = fieldState.error?.message;
                  return (
                    <View style={{ marginBottom: 24 }}>
                      <Animated.View style={[styles.inputWrap, { borderColor: err ? ERROR : borderColor }]}>
                        <Ionicons name="mail-outline" size={18} color={TEXT_MUT} style={{ marginRight: 10 }} />
                        <TextInput
                          style={styles.input}
                          placeholder="Email address"
                          placeholderTextColor={TEXT_MUT}
                          value={field.value}
                          onChangeText={field.onChange}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          returnKeyType="done"
                          onSubmitEditing={onSubmit}
                          onFocus={() => Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start()}
                          onBlur={() => Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start()}
                        />
                      </Animated.View>
                      {err && <Text style={{ color: ERROR, fontSize: 12, marginTop: 4 }}>{err}</Text>}
                    </View>
                  );
                }}
              />

              {/* CTA */}
              <Pressable
                style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.88 : 1 }]}
                onPress={onSubmit}
                disabled={isPending}
              >
                <Text style={styles.ctaText}>{isPending ? 'Sending…' : 'Send Reset Code'}</Text>
              </Pressable>

              {/* Back to login */}
              <Pressable onPress={() => navigation.navigate('Login')} style={styles.backToLogin}>
                <Ionicons name="arrow-back-outline" size={14} color={GOLD} />
                <Text style={{ color: GOLD, fontSize: 13, fontWeight: '600' }}>Back to login</Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: NAVY },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48 },
  bgDot:  { position: 'absolute', width: 220, height: 220, borderRadius: 999, backgroundColor: GOLD, opacity: 0.06 },

  backBtn:    { marginBottom: 24 },
  backCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },

  iconWrap: { alignItems: 'center', marginBottom: 24, position: 'relative' },
  iconHalo: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: GOLD, opacity: 0.10, shadowColor: GOLD, shadowOffset: {width:0,height:0}, shadowOpacity: 0.8, shadowRadius: 30, elevation: 15 },

  title:    { fontSize: 28, fontWeight: '900', color: TEXT_PRI, marginBottom: 8 },
  subtitle: { fontSize: 14, color: TEXT_MUT, marginBottom: 24, lineHeight: 22 },

  errorBanner: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: 'rgba(239,68,68,0.10)', borderColor: ERROR, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 16 },

  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, height: 56 },
  input:     { flex: 1, color: TEXT_PRI, fontSize: 15 },

  cta:        { backgroundColor: GOLD, borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center', shadowColor: GOLD, shadowOffset: {width:0,height:4}, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  ctaText:    { color: NAVY, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  backToLogin:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
});

export default ForgotPasswordScreen;