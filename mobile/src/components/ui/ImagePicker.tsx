import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  ViewStyle,
  Platform,
} from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  mimeType?: string;
  fileSize?: number;
}

interface ImagePickerComponentProps {
  /** Current image URI to display */
  value?: string;
  onPick: (image: PickedImage) => void;
  onRemove?: () => void;
  /** 'avatar' = round 120px  |  'cover' = wide 16:9  |  'thumbnail' = square 80px */
  mode?: 'avatar' | 'cover' | 'thumbnail';
  loading?: boolean;
  disabled?: boolean;
  /** Max width of picked image (default 1200) */
  maxWidth?: number;
  /** Max height of picked image (default 1200) */
  maxHeight?: number;
  /** JPEG quality 0–1 (default 0.85) */
  quality?: number;
  allowsEditing?: boolean;
  style?: ViewStyle;
  /** Fallback emoji when no image */
  placeholder?: string;
  /** Label shown below the control */
  label?: string;
  /** Show both camera and gallery options */
  showCamera?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const requestPermission = async (type: 'camera' | 'library'): Promise<boolean> => {
  if (type === 'camera') {
    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  } else {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

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
  const { theme } = useThemeStore();
  const [sheetVisible, setSheetVisible] = useState(false);

  // ── Pick from library ────────────────────────────────────────────────────
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
      onPick({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
      });
    }
  };

  // ── Pick from camera ─────────────────────────────────────────────────────
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
      onPick({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
      });
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

  // ── Render shapes ────────────────────────────────────────────────────────

  const renderAvatar = () => (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[styles.avatarWrapper, { backgroundColor: theme.colors.borderLight }, style]}
    >
      {value ? (
        <Image source={{ uri: value }} style={styles.avatarImage} />
      ) : (
        <Text style={styles.avatarEmoji}>{placeholder}</Text>
      )}
      <View style={[styles.avatarBadge, { backgroundColor: theme.colors.primary }]}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="camera" size={13} color="#fff" />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderCover = () => (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      style={[
        styles.coverWrapper,
        {
          backgroundColor: theme.colors.borderLight,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {value ? (
        <Image source={{ uri: value }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : null}
      <View
        style={[
          styles.coverOverlay,
          { backgroundColor: value ? 'rgba(0,0,0,0.35)' : 'transparent' },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={value ? '#fff' : theme.colors.primary} />
        ) : (
          <View style={[styles.coverButton, { backgroundColor: value ? 'rgba(0,0,0,0.5)' : theme.colors.primary + '18' }]}>
            <Ionicons
              name="camera-outline"
              size={20}
              color={value ? '#fff' : theme.colors.primary}
            />
            <Text style={[styles.coverButtonText, { color: value ? '#fff' : theme.colors.primary }]}>
              {value ? 'Change cover' : 'Add cover photo'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderThumbnail = () => (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[
        styles.thumbnailWrapper,
        { backgroundColor: theme.colors.borderLight, borderColor: theme.colors.border },
        style,
      ]}
    >
      {value ? (
        <Image source={{ uri: value }} style={styles.thumbnailImage} resizeMode="cover" />
      ) : (
        <Ionicons name="image-outline" size={28} color={theme.colors.textMuted} />
      )}
      {loading && (
        <View style={styles.thumbnailOverlay}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <View style={styles.container}>
        {mode === 'avatar' && renderAvatar()}
        {mode === 'cover' && renderCover()}
        {mode === 'thumbnail' && renderThumbnail()}

        {label && (
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
        )}

        {/* Remove button */}
        {value && onRemove && mode !== 'cover' && (
          <TouchableOpacity
            onPress={onRemove}
            style={[styles.removeBtn, { backgroundColor: theme.colors.errorLight }]}
          >
            <Ionicons name="trash-outline" size={13} color={theme.colors.error} />
            <Text style={[styles.removeBtnText, { color: theme.colors.error }]}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Source picker sheet */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setSheetVisible(false)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setSheetVisible(false)}
        />
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.sheetHandle, { backgroundColor: theme.colors.border }]} />

          <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
            Choose photo
          </Text>

          <TouchableOpacity
            onPress={pickFromCamera}
            style={[styles.sheetOption, { borderBottomColor: theme.colors.border }]}
          >
            <View style={[styles.sheetOptionIcon, { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons name="camera-outline" size={22} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={[styles.sheetOptionLabel, { color: theme.colors.text }]}>
                Take a photo
              </Text>
              <Text style={[styles.sheetOptionSub, { color: theme.colors.textMuted }]}>
                Use your camera
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickFromLibrary}
            style={styles.sheetOption}
          >
            <View style={[styles.sheetOptionIcon, { backgroundColor: theme.colors.infoLight }]}>
              <Ionicons name="images-outline" size={22} color={theme.colors.info} />
            </View>
            <View>
              <Text style={[styles.sheetOptionLabel, { color: theme.colors.text }]}>
                Choose from library
              </Text>
              <Text style={[styles.sheetOptionSub, { color: theme.colors.textMuted }]}>
                Browse your photos
              </Text>
            </View>
          </TouchableOpacity>

          {value && onRemove && (
            <TouchableOpacity
              onPress={() => { setSheetVisible(false); onRemove(); }}
              style={[styles.sheetOption, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E2E8F0', marginTop: 8 }]}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: theme.colors.errorLight }]}>
                <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
              </View>
              <View>
                <Text style={[styles.sheetOptionLabel, { color: theme.colors.error }]}>
                  Remove photo
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setSheetVisible(false)}
            style={[styles.cancelSheet, { backgroundColor: theme.colors.borderLight }]}
          >
            <Text style={[styles.cancelSheetText, { color: theme.colors.textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
  },

  // Avatar mode
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 99,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },

  // Cover mode
  coverWrapper: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  coverOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  coverButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Thumbnail mode
  thumbnailWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
    borderStyle: 'dashed',
  },
  thumbnailImage: {
    width: 80,
    height: 80,
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Label & remove
  label: {
    fontSize: 13,
    textAlign: 'center',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 99,
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 99,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  sheetOptionSub: {
    fontSize: 13,
    marginTop: 2,
  },
  cancelSheet: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelSheetText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
