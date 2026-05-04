// PromoCodeInput.tsx
import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';
import { useTheme } from '../../hooks/useTheme';
import { useValidatePromoCode } from '../../hooks/usePromoCode';
import type { PromoCodeBenefits } from '../../services/promoCodeService';

const codeSchema = z.string().min(3, 'Code must be at least 3 characters').max(30);

const BenefitPill: React.FC<{
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  accentColor: string;
}> = ({ icon, label, value, accentColor }) => {
  const { colors, radius, type } = useTheme();

  return (
    <View style={[bp.pill, { backgroundColor: accentColor + '12', borderColor: accentColor + '30', borderRadius: radius.lg }]}>
      <Ionicons name={icon} size={18} color={accentColor} />
      <View style={{ marginLeft: 10 }}>
        <Text style={[type.caption, { color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }]}>
          {label}
        </Text>
        <Text style={[type.body, { fontWeight: '800', color: accentColor }]}>
          {value}
        </Text>
      </View>
    </View>
  );
};

const bp = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, flex: 1 },
});

const SuccessRing: React.FC = () => {
  const scale = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }], alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="checkmark-circle" size={38} color="#059669" />
      </View>
    </Animated.View>
  );
};

interface Props {
  onApply?: (code: string, benefits: PromoCodeBenefits) => void;
}

export const PromoCodeInput: React.FC<Props> = ({ onApply }) => {
  const { colors, radius, type, shadows, spacing } = useTheme();
  const [code, setCode] = useState('');
  const [zodError, setZodError] = useState<string | null>(null);
  const validate = useValidatePromoCode();

  const isSuccess = validate.isSuccess && validate.data?.success;
  const isError = (validate.isSuccess && !validate.data?.success) || validate.isError;
  const errorMsg = validate.isError
    ? (validate.error as any)?.message ?? 'Validation failed'
    : validate.data?.message ?? 'Invalid code';

  const appliedCode = validate.data?.data?.code;
  const benefits = validate.data?.data?.benefits;
  const referrer = validate.data?.data?.referrer;

  const handleValidate = useCallback(() => {
    const parsed = codeSchema.safeParse(code.trim());
    if (!parsed.success) {
      setZodError(parsed.error.errors[0]?.message ?? 'Invalid');
      return;
    }
    setZodError(null);
    validate.mutate(code.trim().toUpperCase());
  }, [code, validate]);

  const handleReset = useCallback(() => {
    validate.reset();
    setCode('');
    setZodError(null);
  }, [validate]);

  const handleApply = useCallback(() => {
    if (!appliedCode || !benefits) return;
    onApply?.(appliedCode, benefits);
  }, [appliedCode, benefits, onApply]);

  if (isSuccess && benefits) {
    return (
      <View style={[s.card, { backgroundColor: colors.bgCard, borderRadius: radius.xl, borderColor: '#10B981' + '40', ...shadows.md }]}>
        <View style={s.successHeader}>
          <SuccessRing />
          <Text style={[type.h3, { fontWeight: '800', color: '#059669', marginTop: 10 }]}>
            Code Applied!
          </Text>
          {referrer && (
            <Text style={[type.bodySm, { color: colors.textMuted, marginTop: 4 }]}>
              Referred by <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{referrer.name}</Text>
            </Text>
          )}
          <View style={[s.codeBadge, { backgroundColor: '#D1FAE5', borderRadius: radius.md, marginTop: 12 }]}>
            <Text style={{ fontSize: 18, fontWeight: '800', letterSpacing: 3, color: '#065F46' }}>
              {appliedCode}
            </Text>
          </View>
        </View>

        <Text style={[type.caption, { fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 20, marginBottom: 10 }]}>
          Benefits Unlocked
        </Text>
        <View style={s.benefitRow}>
          {benefits.discountPercentage > 0 && (
            <BenefitPill icon="pricetag-outline" label="Discount" value={`${benefits.discountPercentage}% off`} accentColor="#3B82F6" />
          )}
          {benefits.rewardPoints > 0 && (
            <BenefitPill icon="star-outline" label="Points" value={`+${benefits.rewardPoints} pts`} accentColor="#F59E0B" />
          )}
        </View>
        <View style={s.benefitRow}>
          {benefits.cashback > 0 && (
            <BenefitPill icon="cash-outline" label="Cashback" value={`$${benefits.cashback}`} accentColor="#10B981" />
          )}
          {benefits.freeMonths > 0 && (
            <BenefitPill icon="gift-outline" label="Free Months" value={`${benefits.freeMonths} mo`} accentColor="#8B5CF6" />
          )}
          {benefits.customReward && (
            <BenefitPill icon="ribbon-outline" label="Reward" value={benefits.customReward} accentColor="#EC4899" />
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
          <TouchableOpacity onPress={handleReset} style={[s.btnSecondary, { borderColor: colors.borderPrimary, borderRadius: radius.md }]}>
            <Text style={[type.bodySm, { fontWeight: '600', color: colors.textMuted }]}>Remove</Text>
          </TouchableOpacity>
          {onApply && (
            <TouchableOpacity onPress={handleApply} style={[s.btnPrimary, { backgroundColor: '#059669', borderRadius: radius.md, flex: 2 }]}>
              <Ionicons name="checkmark-outline" size={16} color="#fff" />
              <Text style={[type.bodySm, { fontWeight: '700', color: '#fff', marginLeft: 6 }]}>Apply Benefits</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[s.card, { backgroundColor: colors.bgCard, borderRadius: radius.xl, borderColor: colors.borderPrimary, ...shadows.sm }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Ionicons name="gift-outline" size={18} color={colors.accent} />
          <Text style={[type.body, { fontWeight: '700', color: colors.textPrimary, marginLeft: 8 }]}>
            Have a promo code?
          </Text>
        </View>
        <Text style={[type.caption, { color: colors.textMuted, marginBottom: 14, lineHeight: 17 }]}>
          Enter a referral or discount code to unlock benefits.
        </Text>

        <View style={[s.inputRow, {
          borderColor: isError ? '#EF4444' : zodError ? '#EF4444' : colors.borderPrimary,
          backgroundColor: colors.bgSecondary,
          borderRadius: radius.md,
        }]}>
          <TextInput
            value={code}
            onChangeText={t => {
              setCode(t.toUpperCase());
              setZodError(null);
              if (validate.isError || validate.isSuccess) validate.reset();
            }}
            placeholder="ENTER CODE"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleValidate}
            style={[s.textInput, type.body, { color: colors.textPrimary }]}
          />
          <TouchableOpacity
            onPress={handleValidate}
            disabled={validate.isPending || !code.trim()}
            style={[s.validateBtn, {
              backgroundColor: !code.trim() ? colors.borderPrimary : colors.accent,
              borderRadius: radius.sm,
            }]}
          >
            {validate.isPending ? (
              <Text style={[type.caption, { color: '#fff', fontWeight: '700' }]}>…</Text>
            ) : (
              <Text style={[type.caption, { color: '#fff', fontWeight: '700' }]}>Apply</Text>
            )}
          </TouchableOpacity>
        </View>

        {(zodError || isError) && (
          <View style={[s.errorRow, { backgroundColor: '#FEE2E2', borderRadius: radius.sm, marginTop: 10 }]}>
            <Ionicons name="close-circle-outline" size={15} color="#EF4444" />
            <Text style={[type.caption, { color: '#DC2626', marginLeft: 7, flex: 1 }]}>
              {zodError ?? errorMsg}
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  card: { padding: 18, borderWidth: 1.5 },
  successHeader: { alignItems: 'center', paddingTop: 4 },
  codeBadge: { paddingHorizontal: 20, paddingVertical: 10 },
  benefitRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5 },
  textInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, letterSpacing: 2, fontWeight: '700' },
  validateBtn: { marginRight: 5, paddingHorizontal: 14, paddingVertical: 10 },
  errorRow: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  btnSecondary: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  btnPrimary: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});