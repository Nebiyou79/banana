import React, { useRef, useEffect, useMemo } from 'react';
import {
  TouchableOpacity, View, Text, StyleSheet, Animated, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import type { CVTemplate } from '../../services/cvGeneratorService';

interface Props {
  template: CVTemplate;
  selected?: boolean;
  onSelect: () => void;
  style?: ViewStyle;
}

const STYLE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  classic: 'business-outline', modern: 'sparkles-outline',
  creative: 'color-palette-outline', professional: 'briefcase-outline',
  elegant: 'pencil-outline', tech: 'code-slash-outline',
  infographic: 'bar-chart-outline', compact: 'document-text-outline',
  academic: 'school-outline', freelancer: 'rocket-outline',
};

export const TemplateCard: React.FC<Props> = React.memo(({ template, selected = false, onSelect, style }) => {
  const { colors: c, radius, type, shadows } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(6)).current;

  const iconName: keyof typeof Ionicons.glyphMap = STYLE_ICONS[template.style] ?? 'document-outline';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const styles = useMemo(() => makeStyles(c, radius, shadows), [c, radius, shadows]);

  return (
    <Animated.View style={[
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: selected ? 1.02 : scaleAnim }] },
    ]}>
      <TouchableOpacity
        onPress={onSelect}
        onPressIn={() =>
          Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
        onPressOut={() =>
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
        activeOpacity={1}
        style={[
          styles.card,
          {
            borderWidth: selected ? 2.5 : 1.5,
            borderColor: selected ? template.primaryColor : c.border,
            ...(selected
              ? { ...shadows.md, shadowColor: template.primaryColor }
              : shadows.sm),
          },
          style,
        ]}
      >
        <View style={[styles.thumb, {
          backgroundColor: withAlpha(template.primaryColor, 0.12),
          borderTopLeftRadius: radius.lg - 2,
          borderTopRightRadius: radius.lg - 2,
        }]}>
          <Ionicons name={iconName} size={30} color={template.primaryColor} />
          {selected && (
            <View style={[styles.checkBadge, { backgroundColor: template.primaryColor }]}>
              <Ionicons name="checkmark" size={11} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text numberOfLines={1} style={[
            type.bodySm,
            { fontWeight: '700', color: selected ? template.primaryColor : c.text },
          ]}>
            {template.name}
          </Text>
          <View style={[styles.stylePill, { backgroundColor: withAlpha(template.primaryColor, 0.12) }]}>
            <Text style={[type.caption, {
              fontWeight: '700', color: template.primaryColor, textTransform: 'capitalize',
            }]}>
              {template.style}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

TemplateCard.displayName = 'TemplateCard';

const makeStyles = (c: any, radius: any, shadows: any) =>
  StyleSheet.create({
    card: {
      width: 148,
      overflow: 'hidden',
      backgroundColor: c.bgCard,
      borderRadius: radius.lg,
    },
    thumb: { height: 96, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    checkBadge: {
      position: 'absolute', top: 8, right: 8,
      width: 20, height: 20, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    info: { padding: 8, gap: 5 },
    stylePill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 7, paddingVertical: 2,
      borderRadius: 9999,
    },
  });