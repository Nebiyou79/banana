/**
 * DatePickerField.tsx
 * Cross-platform date picker:
 *   iOS  → native DateTimePicker in a modal
 *   Android → native DateTimePicker opens inline
 *
 * Usage:
 *   <DatePickerField
 *     label="Issue Date *"
 *     value={form.issueDate}        // ISO string or undefined
 *     onChange={v => set('issueDate', v)}
 *     maxDate={new Date()}
 *     error={errors.issueDate}
 *   />
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  ViewStyle,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

interface DatePickerFieldProps {
  label?: string;
  value?: string;          // ISO date string "YYYY-MM-DD" or full ISO
  onChange: (isoDate: string) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  error?: string;
  optional?: boolean;
  containerStyle?: ViewStyle;
}

const toDate = (value?: string): Date => {
  if (!value) return new Date();
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
};

const formatDisplay = (value?: string): string => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  error,
  optional = false,
  containerStyle,
}) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography, spacing } = theme;

  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(toDate(value));

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && selected) {
        onChange(selected.toISOString().split('T')[0]);
      }
    } else {
      // iOS: update temp only; confirm via Done button
      if (selected) setTempDate(selected);
    }
  };

  const handleIosConfirm = () => {
    onChange(tempDate.toISOString().split('T')[0]);
    setShowPicker(false);
  };

  const handleIosCancel = () => {
    setTempDate(toDate(value));
    setShowPicker(false);
  };

  const handleClear = () => onChange('');

  const display = formatDisplay(value);

  return (
    <View style={[{ marginBottom: spacing[4] }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: typography.sm,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: 6,
          }}
        >
          {label}
          {optional && (
            <Text style={{ color: colors.textMuted, fontWeight: '400' }}> (optional)</Text>
          )}
        </Text>
      )}

      <TouchableOpacity
        onPress={() => {
          setTempDate(toDate(value));
          setShowPicker(true);
        }}
        activeOpacity={0.8}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
            borderRadius: borderRadius.md,
          },
        ]}
      >
        <Ionicons
          name="calendar-outline"
          size={18}
          color={display ? colors.primary : colors.textMuted}
          style={{ marginRight: 8 }}
        />
        <Text
          style={{
            flex: 1,
            fontSize: typography.base,
            color: display ? colors.text : colors.placeholder,
          }}
        >
          {display || placeholder}
        </Text>
        {value ? (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        )}
      </TouchableOpacity>

      {error && (
        <Text style={{ color: colors.error, fontSize: typography.xs, marginTop: 4 }}>
          {error}
        </Text>
      )}

      {/* Android: inline picker */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={minDate}
          maximumDate={maxDate}
        />
      )}

      {/* iOS: modal picker */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={handleIosCancel}
        >
          <View style={styles.overlay}>
            <View
              style={[
                styles.modalBox,
                { backgroundColor: colors.surface },
              ]}
            >
              {/* Toolbar */}
              <View
                style={[
                  styles.toolbar,
                  { borderBottomColor: colors.border },
                ]}
              >
                <TouchableOpacity onPress={handleIosCancel}>
                  <Text style={{ color: colors.textMuted, fontSize: typography.base }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: typography.base,
                    fontWeight: '700',
                  }}
                >
                  {label ?? 'Select Date'}
                </Text>
                <TouchableOpacity onPress={handleIosConfirm}>
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: typography.base,
                      fontWeight: '700',
                    }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={minDate}
                maximumDate={maxDate}
                style={{ width: '100%', height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1.5,
    paddingHorizontal: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
});
