// src/components/auth/OtpInput.tsx
// Usage: <OtpInput length={6} value={otp} onChange={setOtp} error={apiError} />

import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { useTheme } from '../../hooks/useThemes';

interface OtpInputProps {
  length?:  number;
  value:    string;
  onChange: (val: string) => void;
  error?:   string;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  error,
}) => {
  const { colors, type, radius } = useTheme();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputs = useRef<(TextInput | null)[]>([]);

  // Pad / trim to exact length
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleChange = (text: string, index: number) => {
    // Paste
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
    index: number,
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

  const isFocused = (i: number) => focusedIndex === i;
  const hasError  = !!error;

  return (
    <View style={styles.container}>
      {digits.map((digit, i) => (
        <Pressable
          key={i}
          onPress={() => {
            inputs.current[i]?.focus();
            setFocusedIndex(i);
          }}
          style={[
            styles.box,
            {
              backgroundColor: colors.inputBg,
              borderRadius:    radius.md,
              borderColor: hasError
                ? colors.error
                : isFocused(i)
                ? colors.accent
                : digit
                ? colors.borderAccent
                : colors.borderPrimary,
              borderWidth: isFocused(i) || hasError ? 2 : 1.5,
            },
          ]}
          accessibilityLabel={`OTP digit ${i + 1}`}
        >
          <TextInput
            ref={(ref) => { inputs.current[i] = ref; }}
            value={digit}
            onChangeText={(t) => handleChange(t, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            onFocus={() => setFocusedIndex(i)}
            keyboardType="number-pad"
            maxLength={2}
            textAlign="center"
            selectTextOnFocus
            autoFocus={i === 0}
            style={[
              type.h2,
              {
                color:  colors.textPrimary,
                width:  '100%',
                height: '100%',
                textAlignVertical: 'center',
              },
            ]}
            caretHidden
          />
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection:  'row',
    justifyContent: 'center',
    gap:            10,
  },
  box: {
    width:          50,
    height:         60,
    alignItems:     'center',
    justifyContent: 'center',
  },
});

export default OtpInput;