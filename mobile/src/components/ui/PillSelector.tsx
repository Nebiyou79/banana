// src/components/ui/PillSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface Option<T extends string> {
  value: T;
  label: string;
  color?: string;
}

interface PillSelectorProps<T extends string> {
  label?: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}

export function PillSelector<T extends string>({
  label,
  value,
  options,
  onChange,
}: PillSelectorProps<T>) {
  const { colors: c, spacing, radius, type } = useTheme();

  return (
    <View>
      {label ? (
        <Text
          style={[
            type.label,
            { color: c.textSecondary, marginBottom: spacing.sm },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {options.map((opt) => {
          const active = opt.value === value;
          const accent = opt.color ?? c.primary;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{
                paddingHorizontal: spacing.lg,
                height: 36,
                borderRadius: radius.full,
                borderWidth: 1.5,
                backgroundColor: active ? accent : 'transparent',
                borderColor: active ? accent : c.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: active ? '#FFFFFF' : c.textSecondary,
                  fontWeight: '600',
                  fontSize: type.bodySm.fontSize,
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}