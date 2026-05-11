// src/components/auth/OtpInput.tsx
// Usage: <OtpInput length={6} value={otp} onChange={setOtp} error={errorMsg} />

import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  Animated,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  error,
}) => {
  const { colors: c, radius, type, spacing } = useTheme();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputs = useRef<(TextInput | null)[]>([]);
  const anims = useRef(
    Array.from({ length }, () => new Animated.Value(0))
  ).current;

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const focusAnim = (i: number, toValue: number) =>
    Animated.timing(anims[i], {
      toValue,
      duration: 180,
      useNativeDriver: false,
    }).start();

  const handleChange = (text: string, index: number) => {
    // Handle paste
    if (text.length > 1) {
      const pasted = text.replace(/\D/g, '').slice(0, length);
      onChange(pasted);
      const next = Math.min(pasted.length, length - 1);
      inputs.current[next]?.focus();
      setFocusedIndex(next);
      return;
    }
    const cleaned = text.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    onChange(newDigits.join(''));
    if (cleaned && index < length - 1) {
      inputs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      }
    }
  };

  return (
    <View>
      <View style={styles.container}>
        {digits.map((digit, i) => {
          const isFocused = focusedIndex === i;
          const hasError = !!error;

          const borderColor = anims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [
              hasError
                ? c.danger
                : digit
                ? withAlpha(c.primary, 0.5)
                : c.inputBorder,
              hasError ? c.danger : c.primary,
            ],
          });

          const boxBg = digit
            ? withAlpha(c.primary, 0.08)
            : withAlpha(c.text, 0.04);

          return (
            <Pressable
              key={i}
              onPress={() => {
                inputs.current[i]?.focus();
                setFocusedIndex(i);
              }}
              accessibilityLabel={`OTP digit ${i + 1}`}
            >
              <Animated.View
                style={[
                  styles.box,
                  {
                    borderColor,
                    borderWidth: isFocused || hasError ? 2 : 1.5,
                    backgroundColor: boxBg,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <TextInput
                  ref={ref => {
                    inputs.current[i] = ref;
                  }}
                  value={digit}
                  onChangeText={t => handleChange(t, i)}
                  onKeyPress={e => handleKeyPress(e, i)}
                  onFocus={() => {
                    setFocusedIndex(i);
                    focusAnim(i, 1);
                  }}
                  onBlur={() => focusAnim(i, 0)}
                  keyboardType="number-pad"
                  maxLength={2}
                  textAlign="center"
                  selectTextOnFocus
                  autoFocus={i === 0}
                  caretHidden
                  style={[
                    styles.input,
                    { color: c.text },
                  ]}
                />
              </Animated.View>
            </Pressable>
          );
        })}
      </View>

      {error && (
        <Text
          style={[
            type.caption,
            { color: c.danger, marginTop: spacing.sm, textAlign: 'center' },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  box: {
    width: 48,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    fontSize: 22,
    fontWeight: '800',
    width: '100%',
    height: '100%',
    textAlignVertical: 'center',
  },
});

export default OtpInput;