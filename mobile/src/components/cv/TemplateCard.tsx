// TemplateCard.tsx
import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CVTemplate } from '../../services/cvGeneratorService';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  template: CVTemplate;
  selected?: boolean;
  onSelect: () => void;
  style?: ViewStyle;
}

const STYLE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  classic: 'business-outline', modern: 'sparkles-outline', creative: 'color-palette-outline',
  professional: 'briefcase-outline', elegant: 'pencil-outline', tech: 'code-slash-outline',
  infographic: 'bar-chart-outline', compact: 'document-text-outline', academic: 'school-outline',
  freelancer: 'rocket-outline',
};

export const TemplateCard: React.FC<Props> = ({ template, selected = false, onSelect, style }) => {
  const { colors, radius, type, shadows } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(6)).current;

  const iconName: keyof typeof Ionicons.glyphMap = STYLE_ICONS[template.style] ?? 'document-outline';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: selected ? 1.02 : scaleAnim }] }}>
      <TouchableOpacity
        onPress={onSelect}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={[
          styles.card,
          {
            backgroundColor: colors.bgCard,
            borderRadius: radius.lg,
            borderWidth: selected ? 2.5 : 1.5,
            borderColor: selected ? template.primaryColor : colors.borderPrimary,
            ...(selected ? { ...shadows.md, shadowColor: template.primaryColor } : shadows.sm),
          },
          style,
        ]}
      >
        <View style={[styles.thumb, { backgroundColor: template.primaryColor + '1E', borderTopLeftRadius: radius.lg - 2, borderTopRightRadius: radius.lg - 2 }]}>
          <Ionicons name={iconName} size={30} color={template.primaryColor} />
          {selected && (
            <View style={[styles.checkBadge, { backgroundColor: template.primaryColor, borderRadius: radius.full }]}>
              <Ionicons name="checkmark" size={11} color="#fff" />
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text numberOfLines={1} style={[type.bodySm, { fontWeight: '700', color: selected ? template.primaryColor : colors.textPrimary }]}>
            {template.name}
          </Text>
          <View style={[styles.stylePill, { backgroundColor: template.primaryColor + '18', borderRadius: radius.full }]}>
            <Text style={[type.caption, { fontWeight: '700', color: template.primaryColor, textTransform: 'capitalize' }]}>
              {template.style}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: { width: 148, overflow: 'hidden' },
  thumb: { height: 96, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  checkBadge: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  info: { padding: 8, gap: 5 },
  stylePill: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2 },
});