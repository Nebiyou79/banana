// src/components/proposals/ProposalForm/Step3_Milestones.tsx
// Banana Mobile App — Module 6B: Proposals
// Step 3: Optional payment milestones builder — dynamic add/remove with total validation.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ViewStyle,
  Alert,
} from 'react-native';
import { useThemeStore } from '../../../store/themeStore';
import type { ProposalMilestone, ProposalDurationUnit } from '../../../types/proposal';

interface Step3Props {
  milestones: ProposalMilestone[];
  proposedAmount: number;
  currency: string;
  onMilestonesChange: (milestones: ProposalMilestone[]) => void;
  style?: ViewStyle;
}

const DURATION_UNITS: ProposalDurationUnit[] = ['days', 'weeks', 'months'];
const TOLERANCE = 0.05;

function newMilestone(order: number): ProposalMilestone {
  return { title: '', description: '', amount: 0, duration: 1, durationUnit: 'weeks', order };
}

export const Step3_Milestones: React.FC<Step3Props> = ({
  milestones,
  proposedAmount,
  currency,
  onMilestonesChange,
  style,
}) => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  const [enabled, setEnabled] = useState(milestones.length > 0);

  const milestoneTotal = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
  const diff = Math.abs(milestoneTotal - proposedAmount);
  const isMatch = proposedAmount === 0 || diff / (proposedAmount || 1) <= TOLERANCE;

  const inputStyle = [
    styles.input,
    { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border },
  ];

  const handleToggle = (val: boolean) => {
    setEnabled(val);
    if (!val) onMilestonesChange([]);
    else if (milestones.length === 0) onMilestonesChange([newMilestone(0)]);
  };

  const handleAdd = () => {
    if (milestones.length >= 10) {
      Alert.alert('Maximum milestones', 'You can add up to 10 milestones per proposal.');
      return;
    }
    onMilestonesChange([...milestones, newMilestone(milestones.length)]);
  };

  const handleRemove = (index: number) => {
    const updated = milestones.filter((_, i) => i !== index).map((m, i) => ({ ...m, order: i }));
    onMilestonesChange(updated);
    if (updated.length === 0) setEnabled(false);
  };

  const handleUpdate = (index: number, patch: Partial<ProposalMilestone>) => {
    const updated = milestones.map((m, i) => (i === index ? { ...m, ...patch } : m));
    onMilestonesChange(updated);
  };

  const pctOf = (amount: number) =>
    proposedAmount > 0 ? `${Math.round((amount / proposedAmount) * 100)}%` : '';

  return (
    <View style={[styles.container, style]}>
      {/* Step header */}
      <View style={styles.stepHeader}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>3</Text>
        </View>
        <View style={styles.stepTitleBlock}>
          <Text style={[styles.stepTitle, { color: colors.text }]}>Payment Milestones</Text>
          <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
            Optional — break your project into deliverable stages
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          trackColor={{ false: colors.border, true: '#F1BB03' }}
          thumbColor={enabled ? '#0A2540' : colors.textMuted}
        />
      </View>

      {enabled && (
        <View style={styles.body}>
          {milestones.map((milestone, index) => (
            <View
              key={index}
              style={[
                styles.milestoneCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {/* Card header */}
              <View style={styles.cardHeader}>
                <View style={styles.circleNum}>
                  <Text style={styles.circleNumText}>{index + 1}</Text>
                </View>
                <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
                  Milestone {index + 1}
                  {milestone.amount > 0 && proposedAmount > 0 ? (
                    <Text style={[styles.pctLabel, { color: colors.textMuted }]}>
                      {'  '}({pctOf(milestone.amount)} of total)
                    </Text>
                  ) : null}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemove(index)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.removeBtn}
                >
                  <Text style={styles.removeIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Title */}
              <TextInput
                value={milestone.title}
                onChangeText={(v) => handleUpdate(index, { title: v })}
                placeholder="Milestone title *"
                placeholderTextColor={colors.placeholder}
                style={inputStyle}
              />

              {/* Description */}
              <TextInput
                value={milestone.description ?? ''}
                onChangeText={(v) => handleUpdate(index, { description: v })}
                placeholder="Description (optional)"
                placeholderTextColor={colors.placeholder}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                style={[inputStyle, styles.descInput]}
              />

              {/* Amount + Duration row */}
              <View style={styles.twoCol}>
                <TextInput
                  value={milestone.amount > 0 ? String(milestone.amount) : ''}
                  onChangeText={(v) => handleUpdate(index, { amount: parseFloat(v) || 0 })}
                  placeholder={`Amount (${currency})`}
                  placeholderTextColor={colors.placeholder}
                  keyboardType="numeric"
                  style={[inputStyle, styles.flex1]}
                />
                <View style={[styles.twoCol, styles.flex1]}>
                  <TextInput
                    value={milestone.duration > 0 ? String(milestone.duration) : ''}
                    onChangeText={(v) => handleUpdate(index, { duration: parseInt(v) || 1 })}
                    placeholder="Dur."
                    placeholderTextColor={colors.placeholder}
                    keyboardType="numeric"
                    style={[inputStyle, styles.durationInput]}
                  />
                  <View style={styles.unitPills}>
                    {DURATION_UNITS.map((u) => (
                      <TouchableOpacity
                        key={u}
                        onPress={() => handleUpdate(index, { durationUnit: u })}
                        style={[
                          styles.unitPill,
                          {
                            backgroundColor:
                              milestone.durationUnit === u ? '#0A2540' : colors.inputBg,
                            borderColor:
                              milestone.durationUnit === u ? '#0A2540' : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.unitPillText,
                            {
                              color:
                                milestone.durationUnit === u ? '#fff' : colors.textMuted,
                            },
                          ]}
                        >
                          {u[0].toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ))}

          {/* Add button */}
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.addBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.addBtnText, { color: '#F1BB03' }]}>+ Add Milestone</Text>
          </TouchableOpacity>

          {/* Total validation */}
          {milestones.length > 0 && (
            <View
              style={[
                styles.totalBar,
                {
                  backgroundColor: isMatch
                    ? 'rgba(16,185,129,0.08)'
                    : 'rgba(239,68,68,0.08)',
                  borderColor: isMatch ? '#10B981' : '#EF4444',
                },
              ]}
            >
              <Text style={[styles.totalText, { color: isMatch ? '#059669' : '#DC2626' }]}>
                Milestone total: {currency} {milestoneTotal.toLocaleString()}
              </Text>
              <Text style={[styles.totalText, { color: isMatch ? '#059669' : '#DC2626' }]}>
                Your bid: {currency} {proposedAmount.toLocaleString()}{' '}
                {isMatch ? '✓ Match' : '⚠ Must match within 5%'}
              </Text>
            </View>
          )}
        </View>
      )}

      {!enabled && (
        <View
          style={[
            styles.disabledHint,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.disabledHintText, { color: colors.textMuted }]}>
            💡 Adding milestones helps clients feel confident by showing a clear payment schedule linked to deliverables.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  stepHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1BB03',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNumberText: { color: '#0A2540', fontSize: 13, fontWeight: '800' },
  stepTitleBlock: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: '700' },
  stepSubtitle: { fontSize: 12, marginTop: 1 },
  body: { gap: 12 },
  milestoneCard: {
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 10,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  circleNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#F1BB03', alignItems: 'center', justifyContent: 'center',
  },
  circleNumText: { color: '#0A2540', fontSize: 11, fontWeight: '800' },
  cardTitle: { flex: 1, fontSize: 13, fontWeight: '600' },
  pctLabel: { fontSize: 11, fontWeight: '400' },
  removeBtn: { padding: 4 },
  removeIcon: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
  input: {
    height: 44, borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 12, fontSize: 14,
  },
  descInput: { height: 72, paddingTop: 10 },
  twoCol: { flexDirection: 'row', gap: 8 },
  flex1: { flex: 1 },
  durationInput: { width: 64, flex: undefined },
  unitPills: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  unitPill: {
    width: 30, height: 30, borderRadius: 8, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  unitPillText: { fontSize: 11, fontWeight: '700' },
  addBtn: {
    borderWidth: 2, borderStyle: 'dashed', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  addBtnText: { fontSize: 14, fontWeight: '700' },
  totalBar: {
    borderWidth: 1, borderRadius: 10, padding: 12, gap: 4,
  },
  totalText: { fontSize: 13, fontWeight: '600' },
  disabledHint: {
    borderWidth: 1, borderRadius: 12, padding: 14,
  },
  disabledHintText: { fontSize: 13, lineHeight: 20 },
});

export default Step3_Milestones;
