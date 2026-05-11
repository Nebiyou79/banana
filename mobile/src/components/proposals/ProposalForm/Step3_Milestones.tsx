// src/components/proposals/ProposalForm/Step3_Milestones.tsx
// Banana Mobile App — Module 6B: Proposals
// Step 3: Optional payment milestones builder.
// REFACTORED: useTheme() + withAlpha(). Ionicons replace emoji. Memoized styles. No hardcoded hex.

import React, { useState, useMemo, memo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Switch, ViewStyle, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../theme/utils';
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

const Step3_Milestones: React.FC<Step3Props> = memo(({
  milestones, proposedAmount, currency, onMilestonesChange, style,
}) => {
  const { colors: c, radius, spacing, type } = useTheme();
  const [enabled, setEnabled] = useState(milestones.length > 0);
  const styles = useMemo(() => makeStyles(c, radius, spacing), [c, radius, spacing]);

  const milestoneTotal = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
  const diff    = Math.abs(milestoneTotal - proposedAmount);
  const isMatch = proposedAmount === 0 || diff / (proposedAmount || 1) <= TOLERANCE;
  const matchColor = isMatch ? c.success : c.danger;

  const inputBase = useMemo(() => ({
    color: c.text,
    backgroundColor: c.inputBg,
    borderColor: c.border,
  }), [c]);

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
    const updated = milestones
      .filter((_, i) => i !== index)
      .map((m, i) => ({ ...m, order: i }));
    onMilestonesChange(updated);
    if (updated.length === 0) setEnabled(false);
  };

  const handleUpdate = (index: number, patch: Partial<ProposalMilestone>) =>
    onMilestonesChange(milestones.map((m, i) => i === index ? { ...m, ...patch } : m));

  const pctOf = (amount: number) =>
    proposedAmount > 0 ? `${Math.round((amount / proposedAmount) * 100)}%` : '';

  return (
    <View style={[styles.container, style]}>
      {/* Step header */}
      <View style={styles.stepHeader}>
        <View style={[styles.stepNumBadge, { backgroundColor: c.primary }]}>
          <Text style={[type.caption, { color: c.textInverse, fontWeight: '800', fontSize: 13 }]}>3</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.bodyMd, { color: c.text, fontWeight: '700' }]}>Payment Milestones</Text>
          <Text style={[type.caption, { color: c.textMuted, marginTop: 1 }]}>
            Optional — break your project into deliverable stages
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          trackColor={{ false: c.border, true: withAlpha(c.primary, 0.40) }}
          thumbColor={enabled ? c.primary : c.textMuted}
        />
      </View>

      {enabled && (
        <View style={styles.body}>
          {milestones.map((milestone, index) => (
            <View key={index} style={[styles.milestoneCard, {
              backgroundColor: c.surface ?? c.bgCard,
              borderColor: c.border,
            }]}>
              {/* Card header */}
              <View style={styles.cardHeader}>
                <View style={[styles.circleNum, { backgroundColor: c.primary }]}>
                  <Text style={[type.caption, { color: c.textInverse, fontWeight: '800', fontSize: 11 }]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[type.bodySm, { color: c.textSecondary, fontWeight: '600', flex: 1 }]}>
                  Milestone {index + 1}
                  {milestone.amount > 0 && proposedAmount > 0 ? (
                    <Text style={[type.caption, { color: c.textMuted }]}>
                      {'  '}({pctOf(milestone.amount)} of total)
                    </Text>
                  ) : null}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemove(index)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.removeBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove milestone ${index + 1}`}
                >
                  <Ionicons name="close-circle-outline" size={20} color={c.danger} />
                </TouchableOpacity>
              </View>

              {/* Title */}
              <TextInput
                value={milestone.title}
                onChangeText={v => handleUpdate(index, { title: v })}
                placeholder="Milestone title *"
                placeholderTextColor={c.inputPlaceholder}
                style={[styles.input, inputBase]}
              />

              {/* Description */}
              <TextInput
                value={milestone.description ?? ''}
                onChangeText={v => handleUpdate(index, { description: v })}
                placeholder="Description (optional)"
                placeholderTextColor={c.inputPlaceholder}
                multiline numberOfLines={2}
                textAlignVertical="top"
                style={[styles.input, styles.descInput, inputBase]}
              />

              {/* Amount + Duration */}
              <View style={styles.twoCol}>
                <TextInput
                  value={milestone.amount > 0 ? String(milestone.amount) : ''}
                  onChangeText={v => handleUpdate(index, { amount: parseFloat(v) || 0 })}
                  placeholder={`Amount (${currency})`}
                  placeholderTextColor={c.inputPlaceholder}
                  keyboardType="numeric"
                  style={[styles.input, styles.flex1, inputBase]}
                />
                <View style={[styles.twoCol, styles.flex1]}>
                  <TextInput
                    value={milestone.duration > 0 ? String(milestone.duration) : ''}
                    onChangeText={v => handleUpdate(index, { duration: parseInt(v) || 1 })}
                    placeholder="Dur."
                    placeholderTextColor={c.inputPlaceholder}
                    keyboardType="numeric"
                    style={[styles.input, styles.durationInput, inputBase]}
                  />
                  <View style={styles.unitPills}>
                    {DURATION_UNITS.map(u => {
                      const active = milestone.durationUnit === u;
                      return (
                        <TouchableOpacity
                          key={u}
                          onPress={() => handleUpdate(index, { durationUnit: u })}
                          style={[styles.unitPill, {
                            backgroundColor: active ? c.primary : c.inputBg,
                            borderColor: active ? c.primary : c.border,
                          }]}
                          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                        >
                          <Text style={[type.caption, {
                            color: active ? c.textInverse : c.textMuted,
                            fontWeight: '700',
                          }]}>
                            {u[0].toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>
          ))}

          {/* Add button */}
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.addBtn, { borderColor: c.primary }]}
            accessibilityRole="button"
          >
            <Ionicons name="add-circle-outline" size={18} color={c.primary} style={{ marginRight: 6 }} />
            <Text style={[type.bodySm, { color: c.primary, fontWeight: '700' }]}>Add Milestone</Text>
          </TouchableOpacity>

          {/* Total validation */}
          {milestones.length > 0 && (
            <View style={[styles.totalBar, {
              backgroundColor: withAlpha(matchColor, 0.08),
              borderColor: withAlpha(matchColor, 0.40),
            }]}>
              <Ionicons
                name={isMatch ? 'checkmark-circle-outline' : 'warning-outline'}
                size={16}
                color={matchColor}
                style={{ marginRight: 8, flexShrink: 0 }}
              />
              <View>
                <Text style={[type.caption, { color: matchColor, fontWeight: '600' }]}>
                  Milestone total: {currency} {milestoneTotal.toLocaleString()}
                </Text>
                <Text style={[type.caption, { color: matchColor, fontWeight: '600', marginTop: 2 }]}>
                  Your bid: {currency} {proposedAmount.toLocaleString()}{' '}
                  {isMatch ? '· Match' : '· Must match within 5%'}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {!enabled && (
        <View style={[styles.disabledHint, {
          backgroundColor: c.surface ?? c.bgCard,
          borderColor: c.border,
        }]}>
          <Ionicons name="information-circle-outline" size={16} color={c.textMuted} style={{ marginRight: 8, flexShrink: 0, marginTop: 1 }} />
          <Text style={[type.bodySm, { color: c.textMuted, lineHeight: 20, flex: 1 }]}>
            Adding milestones helps clients feel confident by showing a clear payment schedule linked to deliverables.
          </Text>
        </View>
      )}
    </View>
  );
});

Step3_Milestones.displayName = 'Step3_Milestones';

const makeStyles = (c: any, radius: any, spacing: any) =>
  StyleSheet.create({
    container: { gap: 16 },
    stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepNumBadge: {
      width: 28, height: 28, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    body: { gap: 12 },
    milestoneCard: { borderRadius: radius.lg, borderWidth: 1, padding: 14, gap: 10 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    circleNum: {
      width: 24, height: 24, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center',
    },
    removeBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    input: {
      height: 44, borderWidth: 1.5, borderRadius: radius.md,
      paddingHorizontal: 12, fontSize: 14,
    },
    descInput: { height: 72, paddingTop: 10 },
    twoCol: { flexDirection: 'row', gap: 8 },
    flex1: { flex: 1 },
    durationInput: { width: 64, flex: undefined },
    unitPills: { flexDirection: 'row', gap: 4, alignItems: 'center' },
    unitPill: {
      width: 30, height: 30, borderRadius: radius.sm,
      borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2, borderStyle: 'dashed',
      borderRadius: radius.md, paddingVertical: 14, minHeight: 52,
    },
    totalBar: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderWidth: 1, borderRadius: radius.md, padding: 12,
    },
    disabledHint: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderWidth: 1, borderRadius: radius.md, padding: 14,
    },
  });

export { Step3_Milestones };
export default Step3_Milestones;