import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { FormError } from '../../components/auth/AuthDivider';
import { useForgotPassword } from '../../hooks/useAuth';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

export const ForgotPasswordScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing, borderRadius } = theme;
  const navigation = useNavigation<any>();
  const forgotPassword = useForgotPassword();

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit((data) => forgotPassword.mutate(data));
  const apiError = (forgotPassword.error as any)?.response?.data?.message;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { padding: spacing[6] }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
        </TouchableOpacity>

        <AuthHeader
          title="Forgot password?"
          subtitle="Enter your email and we'll send you a reset code."
          showLogo={false}
        />

        <FormError message={apiError} />

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
              leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
            />
          )}
        />

        {forgotPassword.isSuccess && (
          <View style={[styles.successBox, { backgroundColor: colors.successLight, borderRadius: borderRadius.lg }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
            <Text style={[styles.successText, { color: colors.success, fontSize: typography.sm }]}>
              Reset code sent! Check your email inbox.
            </Text>
          </View>
        )}

        <Button
          title="Send Reset Code"
          onPress={onSubmit}
          loading={forgotPassword.isPending}
          fullWidth size="lg"
          style={{ marginTop: 16 }}
          leftIcon={<Ionicons name="paper-plane-outline" size={18} color="#fff" />}
        />

        <TouchableOpacity style={styles.backToLogin} onPress={() => navigation.navigate('Login')}>
          <Ionicons name="arrow-back-outline" size={14} color={colors.primary} />
          <Text style={[styles.backToLoginText, { color: colors.primary, fontSize: typography.sm }]}>
            Back to login
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scroll:        { flexGrow: 1 },
  backBtn:       { marginBottom: 24 },
  successBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, marginTop: 8 },
  successText:   { flex: 1, fontWeight: '500' },
  backToLogin:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24 },
  backToLoginText: { fontWeight: '600' },
});