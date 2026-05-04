// DatePickerField.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform, Animated, ViewStyle } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface DatePickerFieldProps {
  label?: string;
  value?: string;
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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label, value, onChange, placeholder = 'Select date',
  minDate, maxDate, error, optional = false, containerStyle,
}) => {
  const { colors, radius, type, spacing } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(toDate(value));
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && selected) {
        onChange(selected.toISOString().split('T')[0]);
      }
    } else {
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
    <Animated.View style={[{ opacity: fadeAnim, marginBottom: spacing.md }, containerStyle]}>
      {label && (
        <Text style={[type.caption, { fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs }]}>
          {label}
          {optional && <Text style={{ color: colors.textMuted, fontWeight: '400' }}> (optional)</Text>}
        </Text>
      )}

      <TouchableOpacity
        onPress={() => { setTempDate(toDate(value)); setShowPicker(true); }}
        activeOpacity={0.8}
        style={[styles.trigger, {
          backgroundColor: colors.bgCard,
          borderColor: error ? colors.error : colors.borderPrimary,
          borderRadius: radius.md,
        }]}
      >
        <Ionicons name="calendar-outline" size={18} color={display ? colors.accent : colors.textMuted} style={{ marginRight: 8 }} />
        <Text style={[type.body, { flex: 1, color: display ? colors.textPrimary : colors.textMuted }]}>
          {display || placeholder}
        </Text>
        {value ? (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        )}
      </TouchableOpacity>

      {error && <Text style={[type.caption, { color: colors.error, marginTop: spacing.xs }]}>{error}</Text>}

      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker value={tempDate} mode="date" display="default" onChange={handleChange} minimumDate={minDate} maximumDate={maxDate} />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={showPicker} transparent animationType="slide" onRequestClose={handleIosCancel}>
          <View style={styles.overlay}>
            <View style={[styles.modalBox, { backgroundColor: colors.bgCard, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
              <View style={[styles.toolbar, { borderBottomColor: colors.borderPrimary }]}>
                <TouchableOpacity onPress={handleIosCancel}>
                  <Text style={[type.body, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[type.body, { fontWeight: '700', color: colors.textPrimary }]}>{label ?? 'Select Date'}</Text>
                <TouchableOpacity onPress={handleIosConfirm}>
                  <Text style={[type.body, { fontWeight: '700', color: colors.accent }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker value={tempDate} mode="date" display="spinner" onChange={handleChange} minimumDate={minDate} maximumDate={maxDate} style={{ width: '100%', height: 200 }} />
            </View>
          </View>
        </Modal>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', height: 50, borderWidth: 1.5, paddingHorizontal: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { paddingBottom: 32, overflow: 'hidden' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
});