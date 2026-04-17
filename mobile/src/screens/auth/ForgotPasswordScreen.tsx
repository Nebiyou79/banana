// src/screens/auth/ForgotPasswordScreen.tsx

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';

// import { useTheme }       from '../../hooks/useThemes';
import { Input }          from '../../components/ui/Input';
import { Button }         from '../../components/ui/Button';
import { AuthHeader }     from '../../components/auth/AuthHeader';
import { FormError }      from '../../components/auth/FormError';
import { useForgotPassword } from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

export const ForgotPasswordScreen: React.FC = () => {
  const { colors, type, spacing, isDark } = useTheme();
  const navigation      = useNavigation<any>();
  const forgotPassword  = useForgotPassword();

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit   = handleSubmit((data) => forgotPassword.mutate(data));
  const apiError   = (forgotPassword.error as any)?.response?.data?.message;
  const isSuccess  = forgotPassword.isSuccess;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bgPrimary }]}
      edges={['top', 'bottom']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingHorizontal: spacing.screen },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back-outline" size={22} color={colors.textPrimary} />
          </Pressable>

          <AuthHeader
            title="Forgot password?"
            subtitle="Enter your email and we'll send you a reset code."
            showLogo={false}
          />

          <FormError message={apiError} visible={!!apiError} />

          {/* Success banner */}
          {isSuccess && (
            <View
              style={[
                styles.successBox,
                {
                  backgroundColor: colors.successBg,
                  borderColor:     colors.success,
                  borderRadius:    12,
                  padding:         spacing.md,
                  marginBottom:    spacing.md,
                },
              ]}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
              <Text style={[type.bodySm, { color: colors.success, flex: 1 }]}>
                Reset code sent! Check your email inbox.
              </Text>
            </View>
          )}

          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <Input
                label="Email address"
                placeholder="you@example.com"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                leftIcon={
                  <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                }
              />
            )}
          />

          <Button
            title="Send Reset Code"
            onPress={onSubmit}
            loading={forgotPassword.isPending}
            disabled={isSuccess}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.lg }}
          />

          {/* Back to Login */}
          <Pressable
            onPress={() => navigation.navigate('Login')}
            style={styles.backToLogin}
            accessibilityLabel="Back to login"
          >
            <Ionicons name="arrow-back-outline" size={14} color={colors.accent} />
            <Text style={[type.bodySm, { color: colors.accent, fontWeight: '600' }]}>
              Back to login
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  scroll:      { flexGrow: 1, paddingTop: 16, paddingBottom: 40 },
  backBtn:     { marginBottom: 24 },
  successBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1 },
  backToLogin: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24 },
});

export default ForgotPasswordScreen;
