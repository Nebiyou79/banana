// src/screens/auth/LoginScreen.tsx
// Premium dark-navy login with Email / Mobile tab switcher + Ethiopia +251

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';

import { useLogin } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

const { width } = Dimensions.get('window');

// ─── Constants ────────────────────────────────────────────────────────────────
const NAVY      = '#050D1A';
const NAVY2     = '#0A1628';
const NAVY3     = '#0F2040';
const GOLD      = '#F1BB03';
const GOLD_DARK = '#B45309';
const TEXT_PRI  = '#F8FAFC';
const TEXT_MUT  = '#64748B';
const BORDER    = 'rgba(255,255,255,0.10)';
const INPUT_BG  = 'rgba(255,255,255,0.05)';
const ERROR     = '#EF4444';

// ─── Schemas ──────────────────────────────────────────────────────────────────
const emailSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
const mobileSchema = z.object({
  phone:    z.string().min(9, 'Enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type EmailForm  = z.infer<typeof emailSchema>;
type MobileForm = z.infer<typeof mobileSchema>;
type Nav        = NativeStackNavigationProp<AuthStackParamList>;

// ─── Sub-components ───────────────────────────────────────────────────────────
const PremiumInput: React.FC<{
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  error?: string;
  onSubmitEditing?: () => void;
  returnKeyType?: any;
}> = ({ label, placeholder, value, onChangeText, secureTextEntry, keyboardType,
        autoCapitalize, leftSlot, rightSlot, error, onSubmitEditing, returnKeyType }) => {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const borderColor = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [error ? ERROR : BORDER, error ? ERROR : GOLD],
  });

  return (
    <View style={{ marginBottom: 16 }}>
      {label && <Text style={[iStyles.label]}>{label}</Text>}
      <Animated.View style={[iStyles.wrap, { borderColor }]}>
        {leftSlot && <View style={iStyles.leftSlot}>{leftSlot}</View>}
        <TextInput
          style={iStyles.input}
          placeholder={placeholder}
          placeholderTextColor={TEXT_MUT}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'none'}
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType ?? 'done'}
        />
        {rightSlot && <View style={iStyles.rightSlot}>{rightSlot}</View>}
      </Animated.View>
      {error && <Text style={iStyles.errorText}>{error}</Text>}
    </View>
  );
};

const iStyles = StyleSheet.create({
  label:     { color: 'rgba(248,250,252,0.6)', fontSize: 12, marginBottom: 6, letterSpacing: 0.5 },
  wrap:      { flexDirection: 'row', alignItems: 'center', backgroundColor: INPUT_BG, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, height: 56 },
  leftSlot:  { marginRight: 10 },
  rightSlot: { marginLeft: 10 },
  input:     { flex: 1, color: TEXT_PRI, fontSize: 15, height: '100%' },
  errorText: { color: ERROR, fontSize: 12, marginTop: 4 },
});

// ─── Main ─────────────────────────────────────────────────────────────────────
type LoginTab = 'email' | 'mobile';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const login      = useLogin();

  const [tab, setTab]             = useState<LoginTab>('email');
  const [showPw, setShowPw]       = useState(false);
  const [mobileVal, setMobileVal] = useState('');
  const [pwVal, setPwVal]         = useState('');

  // Animations
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const tabAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }),
    ]).start();
  }, []);

  // Tab slide indicator
  const tabIndicatorLeft = tabAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['2%', '52%'],
  });

  const switchTab = (t: LoginTab) => {
    setTab(t);
    Animated.spring(tabAnim, {
      toValue: t === 'email' ? 0 : 1,
      useNativeDriver: false,
      tension: 60, friction: 8,
    }).start();
  };

  // Email form
  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', password: '' },
  });

  const onEmailSubmit = emailForm.handleSubmit((data) => login.mutate(data));

  const apiError = (() => {
    const err = login.error as any;
    if (!err) return undefined;
    if (!err.response) return 'Cannot reach server.';
    return err.response?.data?.message ?? 'Login failed.';
  })();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      {/* BG decoration dots */}
      <View style={[styles.bgDot, styles.bgDotTR]} />
      <View style={[styles.bgDot, styles.bgDotBL]} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={{
                opacity:   fadeAnim,
                transform: [{ translateY: slideAnim }],
                alignItems: 'center',
              }}
            >
              {/* Logo */}
              <View style={styles.logoRow}>
                <View style={styles.halo} />
                <Text style={styles.logoEmoji}>🍌💼</Text>
              </View>
              <Text style={styles.brandName}>Banana</Text>
              <Text style={styles.brandSub}>Sign In to your account</Text>

              {/* Tab switcher */}
              <View style={styles.tabWrap}>
                <Animated.View style={[styles.tabIndicator, { left: tabIndicatorLeft }]} />
                <Pressable style={styles.tabBtn} onPress={() => switchTab('email')}>
                  <Text style={[styles.tabLabel, tab === 'email' && styles.tabLabelActive]}>
                    📧 Email
                  </Text>
                </Pressable>
                <Pressable style={styles.tabBtn} onPress={() => switchTab('mobile')}>
                  <Text style={[styles.tabLabel, tab === 'mobile' && styles.tabLabelActive]}>
                    📱 Mobile
                  </Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* Error */}
            {apiError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={15} color={ERROR} />
                <Text style={{ color: ERROR, fontSize: 13, flex: 1 }}>{apiError}</Text>
              </View>
            )}

            {/* ── Email form ── */}
            {tab === 'email' && (
              <Animated.View style={{ opacity: fadeAnim }}>
                <Controller
                  control={emailForm.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <PremiumInput
                      placeholder="Email address"
                      value={field.value}
                      onChangeText={field.onChange}
                      keyboardType="email-address"
                      error={fieldState.error?.message}
                      leftSlot={<Ionicons name="mail-outline" size={18} color={TEXT_MUT} />}
                      returnKeyType="next"
                    />
                  )}
                />
                <Controller
                  control={emailForm.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <PremiumInput
                      placeholder="Password"
                      value={field.value}
                      onChangeText={field.onChange}
                      secureTextEntry={!showPw}
                      error={fieldState.error?.message}
                      leftSlot={<Ionicons name="lock-closed-outline" size={18} color={TEXT_MUT} />}
                      rightSlot={
                        <Pressable onPress={() => setShowPw(v => !v)}>
                          <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={TEXT_MUT} />
                        </Pressable>
                      }
                      returnKeyType="done"
                      onSubmitEditing={onEmailSubmit}
                    />
                  )}
                />
              </Animated.View>
            )}

            {/* ── Mobile form ── */}
            {tab === 'mobile' && (
              <Animated.View style={{ opacity: fadeAnim }}>
                <View style={{ marginBottom: 16 }}>
                  <Text style={iStyles.label}>Phone Number</Text>
                  <View style={[iStyles.wrap, { borderColor: BORDER }]}>
                    {/* Country code badge */}
                    <View style={styles.countryBadge}>
                      <Text style={{ fontSize: 16 }}>🇪🇹</Text>
                      <Text style={styles.countryCode}>+251</Text>
                      <Ionicons name="chevron-down" size={12} color={TEXT_MUT} />
                    </View>
                    <View style={styles.phoneDivider} />
                    <TextInput
                      style={[iStyles.input, { paddingLeft: 8 }]}
                      placeholder="9X XXX XXXX"
                      placeholderTextColor={TEXT_MUT}
                      value={mobileVal}
                      onChangeText={setMobileVal}
                      keyboardType="phone-pad"
                    />
                    <Ionicons name="call-outline" size={18} color={TEXT_MUT} />
                  </View>
                </View>
                <PremiumInput
                  placeholder="Password"
                  value={pwVal}
                  onChangeText={setPwVal}
                  secureTextEntry={!showPw}
                  leftSlot={<Ionicons name="lock-closed-outline" size={18} color={TEXT_MUT} />}
                  rightSlot={
                    <Pressable onPress={() => setShowPw(v => !v)}>
                      <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={TEXT_MUT} />
                    </Pressable>
                  }
                />
                <View style={styles.comingSoonBox}>
                  <Ionicons name="time-outline" size={14} color={GOLD} />
                  <Text style={{ color: GOLD, fontSize: 12, flex: 1 }}>
                    Mobile login is coming soon. Use email for now.
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Forgot */}
            <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginBottom: 8 }}>
              <Text style={{ color: GOLD, fontSize: 13, fontWeight: '600' }}>Forgot your password?</Text>
            </Pressable>

            {/* CTA */}
            <Pressable
              style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.88 : 1 }]}
              onPress={tab === 'email' ? onEmailSubmit : undefined}
              disabled={login.isPending}
            >
              {login.isPending ? (
                <Text style={styles.ctaText}>Signing in…</Text>
              ) : (
                <Text style={styles.ctaText}>Sign In</Text>
              )}
            </Pressable>

            {/* Footer */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
              <Text style={{ color: TEXT_MUT, fontSize: 14 }}>New here? </Text>
              <Pressable onPress={() => navigation.navigate('Register')}>
                <Text style={{ color: GOLD, fontSize: 14, fontWeight: '700' }}>Create Account</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: NAVY },
  scroll:  { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },

  bgDot:   { position: 'absolute', borderRadius: 999, opacity: 0.07 },
  bgDotTR: { width: 280, height: 280, top: -80, right: -80, backgroundColor: GOLD },
  bgDotBL: { width: 200, height: 200, bottom: -60, left: -60, backgroundColor: '#3B82F6' },

  // Logo
  logoRow:    { alignItems: 'center', justifyContent: 'center', marginBottom: 4, marginTop: 16, position: 'relative' },
  halo:       { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: GOLD, opacity: 0.12, shadowColor: GOLD, shadowOffset: {width:0,height:0}, shadowOpacity: 1, shadowRadius: 40, elevation: 20 },
  logoEmoji:  { fontSize: 60, letterSpacing: -8 },
  brandName:  { fontSize: 38, fontWeight: '900', color: GOLD, letterSpacing: -0.5, marginTop: 8 },
  brandSub:   { fontSize: 14, color: TEXT_MUT, marginTop: 4, marginBottom: 28 },

  // Tab
  tabWrap:      { width: '100%', height: 48, backgroundColor: NAVY3, borderRadius: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 28, position: 'relative', padding: 4 },
  tabIndicator: { position: 'absolute', width: '46%', height: 40, backgroundColor: GOLD, borderRadius: 11 },
  tabBtn:       { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  tabLabel:     { fontSize: 14, color: TEXT_MUT, fontWeight: '600' },
  tabLabelActive:{ color: NAVY },

  // Error
  errorBanner: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: 'rgba(239,68,68,0.1)', borderColor: ERROR, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 16 },

  // Mobile
  countryBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countryCode:   { color: TEXT_PRI, fontSize: 14, fontWeight: '600' },
  phoneDivider:  { width: 1, height: 24, backgroundColor: BORDER, marginHorizontal: 10 },
  comingSoonBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: 'rgba(241,187,3,0.08)', borderColor: 'rgba(241,187,3,0.25)', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },

  // CTA
  cta:     { backgroundColor: GOLD, borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center', shadowColor: GOLD, shadowOffset: {width:0,height:4}, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  ctaText: { color: NAVY, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});

export default LoginScreen;