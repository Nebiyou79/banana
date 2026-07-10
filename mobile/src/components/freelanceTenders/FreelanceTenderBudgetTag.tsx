import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import type { Currency, TenderDetails } from '../../types/freelanceTender';

export interface FreelanceTenderBudgetTagProps {
  details: TenderDetails;
}

const CURRENCY_SYMBOLS: Partial<Record<Currency, string>> = {
  USD: '$', EUR: '€', GBP: '£', ETB: 'ETB ',
};

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString();
}

function buildLabel(details: TenderDetails): string {
  const et = details.engagementType;
  if (et === 'negotiable') return 'Negotiable';

  if (et === 'fixed_salary' && details.salaryRange) {
    const { min, max, currency, period } = details.salaryRange;
    const sym = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
    const range =
      min != null && max != null ? `${sym}${formatCompact(min)}–${sym}${formatCompact(max)}`
      : min != null ? `${sym}${formatCompact(min)}+`
      : max != null ? `Up to ${sym}${formatCompact(max)}`
      : 'Negotiable';
    return `${range}/${period === 'monthly' ? 'mo' : 'yr'}`;
  }

  if (details.budget) {
    const { min, max, currency } = details.budget;
    const sym = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
    if ((details as any).isNegotiable) return 'Negotiable';
    if (min != null && max != null) return `${sym}${formatCompact(min)} – ${sym}${formatCompact(max)}`;
    if (min != null)                return `${sym}${formatCompact(min)}+`;
    if (max != null)                return `Up to ${sym}${formatCompact(max)}`;
  }
  return 'Negotiable';
}

const FreelanceTenderBudgetTag: React.FC<FreelanceTenderBudgetTagProps> = memo(({ details }) => {
  const { colors, radius } = useTheme();
  const label = useMemo(() => buildLabel(details), [details]);
  const isNegotiable = label === 'Negotiable';

  return (
    <View
      style={[
        styles.tag,
        {
          backgroundColor: isNegotiable
            ? withAlpha(colors.textMuted, 0.08)
            : withAlpha(colors.primary, 0.10),
          borderColor: isNegotiable
            ? withAlpha(colors.textMuted, 0.20)
            : withAlpha(colors.primary, 0.25),
          borderRadius: radius.sm,
        },
      ]}
    >
      <Text style={[styles.text, { color: isNegotiable ? colors.textMuted : colors.primary }]}>
        {label}
      </Text>
    </View>
  );
});

FreelanceTenderBudgetTag.displayName = 'FreelanceTenderBudgetTag';

const styles = StyleSheet.create({
  tag:  { paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '700' },
});

export default FreelanceTenderBudgetTag;
