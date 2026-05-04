// ImagePicker.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal, Pressable, ActivityIndicator, Animated, ViewStyle, Platform } from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  mimeType?: string;
  fileSize?: number;
}

interface ImagePickerComponentProps {
  value?: string;
  onPick: (image: PickedImage) => void;
  onRemove?: () => void;
  mode?: 'avatar' | 'cover' | 'thumbnail';
  loading?: boolean;
  disabled?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  allowsEditing?: boolean;
  style?: ViewStyle;
  placeholder?: string;
  label?: string;
  showCamera?: boolean;
}

const requestPermission = async (type: 'camera' | 'library'): Promise<boolean> => {
  if (type === 'camera') {
    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  } else {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }
};

export const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({
  value,
  onPick,
  onRemove,
  mode = 'avatar',
  loading = false,
  disabled = false,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85,
  allowsEditing = true,
  style,
  placeholder = '📷',
  label,
  showCamera = true,
}) => {
  const { colors, radius, type, spacing } = useTheme();
  const [sheetVisible, setSheetVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  const pickFromLibrary = async () => {
    setSheetVisible(false);
    const granted = await requestPermission('library');
    if (!granted) return;
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing,
      aspect: mode === 'cover' ? [16, 9] : [1, 1],
      quality,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onPick({ uri: asset.uri, width: asset.width, height: asset.height, mimeType: asset.mimeType, fileSize: asset.fileSize });
    }
  };

  const pickFromCamera = async () => {
    setSheetVisible(false);
    const granted = await requestPermission('camera');
    if (!granted) return;
    const result = await ExpoImagePicker.launchCameraAsync({
      allowsEditing,
      aspect: mode === 'cover' ? [16, 9] : [1, 1],
      quality,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onPick({ uri: asset.uri, width: asset.width, height: asset.height, mimeType: asset.mimeType, fileSize: asset.fileSize });
    }
  };

  const handlePress = () => {
    if (disabled || loading) return;
    if (showCamera) {
      setSheetVisible(true);
    } else {
      pickFromLibrary();
    }
  };

  const renderAvatar = () => (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={[styles.avatarWrapper, { backgroundColor: colors.bgSecondary, borderRadius: radius.full }, style]}>
      {value ? <Image source={{ uri: value }} style={styles.avatarImage} /> : <Text style={styles.avatarEmoji}>{placeholder}</Text>}
      <View style={[styles.avatarBadge, { backgroundColor: colors.accent, borderRadius: radius.full }]}>
        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={13} color="#fff" />}
      </View>
    </TouchableOpacity>
  );

  const renderCover = () => (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={[styles.coverWrapper, { backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary, borderRadius: radius.lg }, style]}>
      {value ? <Image source={{ uri: value }} style={StyleSheet.absoluteFillObject} resizeMode="cover" /> : null}
      <View style={[styles.coverOverlay, { backgroundColor: value ? 'rgba(0,0,0,0.35)' : 'transparent' }]}>
        {loading ? <ActivityIndicator color={value ? '#fff' : colors.accent} /> : (
          <View style={[styles.coverButton, { backgroundColor: value ? 'rgba(0,0,0,0.5)' : colors.accentBg, borderRadius: radius.md }]}>
            <Ionicons name="camera-outline" size={20} color={value ? '#fff' : colors.accent} />
            <Text style={[styles.coverButtonText, type.bodySm, { color: value ? '#fff' : colors.accent }]}>
              {value ? 'Change cover' : 'Add cover photo'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderThumbnail = () => (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={[styles.thumbnailWrapper, { backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary, borderRadius: radius.md }, style]}>
      {value ? <Image source={{ uri: value }} style={styles.thumbnailImage} resizeMode="cover" /> : <Ionicons name="image-outline" size={28} color={colors.textMuted} />}
      {loading && <View style={styles.thumbnailOverlay}><ActivityIndicator color={colors.accent} /></View>}
    </TouchableOpacity>
  );

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.container}>
        {mode === 'avatar' && renderAvatar()}
        {mode === 'cover' && renderCover()}
        {mode === 'thumbnail' && renderThumbnail()}
        {label && <Text style={[styles.label, type.caption, { color: colors.textMuted }]}>{label}</Text>}
        {value && onRemove && mode !== 'cover' && (
          <TouchableOpacity onPress={onRemove} style={[styles.removeBtn, { backgroundColor: colors.errorBg, borderRadius: radius.full }]}>
            <Ionicons name="trash-outline" size={13} color={colors.error} />
            <Text style={[styles.removeBtnText, type.caption, { color: colors.error }]}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={sheetVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setSheetVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetVisible(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.bgCard, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.borderPrimary, borderRadius: radius.full }]} />
          <Text style={[styles.sheetTitle, type.h4, { color: colors.textPrimary }]}>Choose photo</Text>

          <TouchableOpacity onPress={pickFromCamera} style={[styles.sheetOption, { borderBottomColor: colors.borderPrimary }]}>
            <View style={[styles.sheetOptionIcon, { backgroundColor: colors.accentBg, borderRadius: radius.md }]}>
              <Ionicons name="camera-outline" size={22} color={colors.accent} />
            </View>
            <View>
              <Text style={[styles.sheetOptionLabel, type.bodySm, { color: colors.textPrimary }]}>Take a photo</Text>
              <Text style={[styles.sheetOptionSub, type.caption, { color: colors.textMuted }]}>Use your camera</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={pickFromLibrary} style={styles.sheetOption}>
            <View style={[styles.sheetOptionIcon, { backgroundColor: colors.infoBg, borderRadius: radius.md }]}>
              <Ionicons name="images-outline" size={22} color={colors.info} />
            </View>
            <View>
              <Text style={[styles.sheetOptionLabel, type.bodySm, { color: colors.textPrimary }]}>Choose from library</Text>
              <Text style={[styles.sheetOptionSub, type.caption, { color: colors.textMuted }]}>Browse your photos</Text>
            </View>
          </TouchableOpacity>

          {value && onRemove && (
            <TouchableOpacity onPress={() => { setSheetVisible(false); onRemove(); }} style={[styles.sheetOption, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderPrimary, marginTop: spacing.sm }]}>
              <View style={[styles.sheetOptionIcon, { backgroundColor: colors.errorBg, borderRadius: radius.md }]}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </View>
              <View>
                <Text style={[styles.sheetOptionLabel, type.bodySm, { color: colors.error }]}>Remove photo</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => setSheetVisible(false)} style={[styles.cancelSheet, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}>
            <Text style={[styles.cancelSheetText, type.bodySm, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 10 },
  avatarWrapper: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'visible' },
  avatarImage: { width: 100, height: 100, borderRadius: 99 },
  avatarEmoji: { fontSize: 40 },
  avatarBadge: { position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  coverWrapper: { width: '100%', height: 140, overflow: 'hidden', borderWidth: 1.5, borderStyle: 'dashed' },
  coverOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  coverButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 20 },
  coverButtonText: { fontWeight: '600' },
  thumbnailWrapper: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, overflow: 'hidden', borderStyle: 'dashed' },
  thumbnailImage: { width: 80, height: 80 },
  thumbnailOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  label: { textAlign: 'center' },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5, paddingHorizontal: 12 },
  removeBtnText: { fontWeight: '600' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24 },
  sheetHandle: { width: 36, height: 4, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontWeight: '700', marginBottom: 16 },
  sheetOption: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetOptionIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sheetOptionLabel: { fontWeight: '600' },
  sheetOptionSub: { marginTop: 2 },
  cancelSheet: { marginTop: 16, paddingVertical: 14, alignItems: 'center' },
  cancelSheetText: { fontWeight: '600' },
});