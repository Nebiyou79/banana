import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApplicationStatus } from '../../services/applicationService';

interface Props {
  status: ApplicationStatus;
}

const STEPS = [
  { key: 'applied',             label: 'Applied'   },
  { key: 'under-review',        label: 'Review'    },
  { key: 'shortlisted',         label: 'Shortlist' },
  { key: 'interview-scheduled', label: 'Interview' },
  { key: 'offer-made',          label: 'Offer'     },
  { key: 'offer-accepted',      label: 'Hired'     },
];

const STATUS_STEP_INDEX: Record<ApplicationStatus, number> = {
  'applied':             0,
  'under-review':        1,
  'shortlisted':         2,
  'interview-scheduled': 3,
  'interviewed':         3,
  'offer-pending':       4,
  'offer-made':          4,
  'offer-accepted':      5,
  'offer-rejected':      4,
  'on-hold':             1,
  'rejected':            -1, // terminal state
  'withdrawn':           -1,
};

const ACCENT      = '#3B82F6';
const SUCCESS     = '#10B981';
const DANGER      = '#EF4444';
const STEP_BORDER = '#CBD5E1';

export const ApplicationStatusStepper: React.FC<Props> = ({ status }) => {
  const currentIdx   = STATUS_STEP_INDEX[status] ?? 0;
  const isTerminalBad = status === 'rejected' || status === 'withdrawn' || status === 'offer-rejected';
  const isTerminalGood = status === 'offer-accepted';
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <View style={s.container}>
      {STEPS.map((step, i) => {
        const isCurrent = i === currentIdx && !isTerminalBad && !isTerminalGood;
        const isComplete = isTerminalGood
          ? true
          : (i < currentIdx && !isTerminalBad);
        const isLast = i === STEPS.length - 1;

        const dotColor = isComplete
          ? SUCCESS
          : isCurrent
          ? ACCENT
          : isTerminalBad && i === currentIdx
          ? DANGER
          : 'transparent';

        const dotBorderColor = isComplete
          ? SUCCESS
          : isCurrent
          ? ACCENT
          : isTerminalBad && i === currentIdx
          ? DANGER
          : STEP_BORDER;

        const lineColor = isComplete && !isLast ? SUCCESS : STEP_BORDER;

        return (
          <View key={step.key} style={[s.stepWrapper, isLast ? null : { flex: 1 }]}>
            <View style={s.stepContent}>
              {/* Circle */}
              {isCurrent ? (
                <Animated.View
                  style={[
                    s.dot,
                    {
                      backgroundColor: ACCENT + '30',
                      borderColor: ACCENT,
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                >
                  <View style={[s.innerDot, { backgroundColor: ACCENT }]} />
                </Animated.View>
              ) : isComplete ? (
                <View style={[s.dot, { backgroundColor: SUCCESS, borderColor: SUCCESS }]}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              ) : isTerminalBad && i === currentIdx ? (
                <View style={[s.dot, { backgroundColor: DANGER, borderColor: DANGER }]}>
                  <Ionicons name="close" size={10} color="#fff" />
                </View>
              ) : (
                <View style={[s.dot, { backgroundColor: 'transparent', borderColor: dotBorderColor }]} />
              )}
              <Text
                numberOfLines={1}
                style={[
                  s.label,
                  {
                    color: isComplete || isCurrent ? '#0F172A' : '#94A3B8',
                    fontWeight: isCurrent ? '700' : '500',
                  },
                ]}
              >
                {step.label}
              </Text>
            </View>

            {/* Connector line */}
            {!isLast && (
              <View style={[s.line, { backgroundColor: lineColor }]} />
            )}
          </View>
        );
      })}
    </View>
  );
};

const DOT_SIZE = 24;

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepContent: {
    alignItems: 'center',
    gap: 4,
    width: DOT_SIZE,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 9,
    textAlign: 'center',
    width: 48,
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: 2,
    marginBottom: 16, // align with middle of dot
    borderRadius: 1,
  },
});
