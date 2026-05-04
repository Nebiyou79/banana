// ImagePickerGrid.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, StyleSheet, Alert, Animated } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { uploadToCloudinary, optimizeCloudinaryUrl } from '../../utils/cloudinaryUpload';

interface UploadingItem {
  localUri: string;
  uploading: boolean;
  error: boolean;
  cloudUrl?: string;
}

interface ImagePickerGridProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  error?: string;
  label?: string;
}

export const ImagePickerGrid: React.FC<ImagePickerGridProps> = ({
  value, onChange, maxImages = 8, error, label = 'Project Images *',
}) => {
  const { colors, radius, type, spacing } = useTheme();
  const [queue, setQueue] = useState<UploadingItem[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const accumulatedRef = useRef<string[]>(value);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  accumulatedRef.current = value;

  const requestPermissions = async (source: 'library' | 'camera') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to take photos.');
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library access is required to select images.');
        return false;
      }
    }
    return true;
  };

  const pickImages = async (source: 'library' | 'camera') => {
    const remaining = maxImages - accumulatedRef.current.length;
    if (remaining <= 0) {
      Alert.alert('Limit reached', `Maximum ${maxImages} images allowed.`);
      return;
    }

    const ok = await requestPermissions(source);
    if (!ok) return;

    let result: ImagePicker.ImagePickerResult;

    if (source === 'camera') {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
      });
    }

    if (result.canceled || !result.assets?.length) return;

    const assets = result.assets;
    const newQueueItems: UploadingItem[] = assets.map(a => ({ localUri: a.uri, uploading: true, error: false }));
    setQueue(prev => [...prev, ...newQueueItems]);

    for (const asset of assets) {
      try {
        const uploaded = await uploadToCloudinary([asset.uri], 'portfolio');
        const cloudUrl = uploaded[0].url;
        accumulatedRef.current = [...accumulatedRef.current, cloudUrl];
        onChange(accumulatedRef.current);
        setQueue(prev => prev.map(q => q.localUri === asset.uri ? { ...q, uploading: false, cloudUrl } : q));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setQueue(prev => prev.map(q => q.localUri === asset.uri ? { ...q, uploading: false, error: true } : q));
        Alert.alert('Upload failed', message);
      }
    }

    setTimeout(() => { setQueue(prev => prev.filter(q => q.uploading || q.error)); }, 600);
  };

  const removeCloudUrl = (url: string) => {
    const next = accumulatedRef.current.filter(u => u !== url);
    accumulatedRef.current = next;
    onChange(next);
  };

  const retryItem = async (item: UploadingItem) => {
    setQueue(prev => prev.map(q => q.localUri === item.localUri ? { ...q, uploading: true, error: false } : q));
    try {
      const uploaded = await uploadToCloudinary([item.localUri], 'portfolio');
      const cloudUrl = uploaded[0].url;
      setQueue(prev => prev.filter(q => q.localUri !== item.localUri));
      accumulatedRef.current = [...accumulatedRef.current, cloudUrl];
      onChange(accumulatedRef.current);
    } catch {
      setQueue(prev => prev.map(q => q.localUri === item.localUri ? { ...q, uploading: false, error: true } : q));
    }
  };

  const removeQueueItem = (uri: string) => {
    setQueue(prev => prev.filter(q => q.localUri !== uri));
  };

  const showSourcePicker = () => {
    Alert.alert('Add Photo', 'Choose image source', [
      { text: 'Camera', onPress: () => pickImages('camera') },
      { text: 'Photo Library', onPress: () => pickImages('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const totalCount = value.length + queue.filter(q => q.uploading).length;
  const canAdd = totalCount < maxImages;

  return (
    <Animated.View style={{ opacity: fadeAnim, marginBottom: spacing.lg }}>
      <Text style={[type.caption, { fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm }]}>{label}</Text>

      <View style={[styles.infoBanner, { backgroundColor: colors.accentBg, borderRadius: radius.lg }]}>
        <Ionicons name="cloud-upload-outline" size={15} color={colors.accent} />
        <Text style={[type.caption, { color: colors.accent, marginLeft: spacing.xs, flex: 1 }]}>
          Images upload one at a time to Cloudinary CDN. Max {maxImages} images.
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <View style={styles.grid}>
          {value.map((url, i) => (
            <View key={url + i} style={[styles.thumb, { borderRadius: radius.md, borderColor: colors.borderPrimary }]}>
              <Image source={{ uri: optimizeCloudinaryUrl(url, 200, 200) }} style={[StyleSheet.absoluteFillObject, { borderRadius: radius.md }]} resizeMode="cover" />
              <TouchableOpacity onPress={() => removeCloudUrl(url)} style={[styles.removeBtn, { backgroundColor: colors.error, borderRadius: radius.full }]}>
                <Ionicons name="close" size={10} color="#fff" />
              </TouchableOpacity>
              <View style={[styles.cloudBadge, { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radius.sm }]}>
                <Ionicons name="cloud-done-outline" size={9} color="#fff" />
              </View>
            </View>
          ))}

          {queue.map(item => (
            <View key={item.localUri} style={[styles.thumb, { borderRadius: radius.md, borderColor: item.error ? colors.error : colors.borderPrimary }]}>
              <Image source={{ uri: item.localUri }} style={[StyleSheet.absoluteFillObject, { borderRadius: radius.md, opacity: 0.4 }]} resizeMode="cover" />
              {item.uploading && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 9, marginTop: 4 }}>Uploading…</Text>
                </View>
              )}
              {item.error && (
                <View style={styles.uploadOverlay}>
                  <Ionicons name="alert-circle" size={20} color={colors.error} />
                  <TouchableOpacity onPress={() => retryItem(item)} style={{ marginTop: 4 }}>
                    <Text style={{ color: '#fff', fontSize: 9, textDecorationLine: 'underline' }}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity onPress={() => removeQueueItem(item.localUri)} style={[styles.removeBtn, { backgroundColor: item.error ? colors.error : 'rgba(0,0,0,0.6)', borderRadius: radius.full }]}>
                <Ionicons name="close" size={10} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}

          {canAdd && (
            <TouchableOpacity
              onPress={showSourcePicker}
              style={[styles.addBtn, { borderRadius: radius.md, borderColor: error && !value.length ? colors.error : colors.borderPrimary, backgroundColor: colors.bgCard }]}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={28} color={colors.accent} />
              <Text style={[type.caption, { color: colors.textMuted, marginTop: 4 }]}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Text style={[type.caption, { color: colors.textMuted }]}>{value.length}/{maxImages} images uploaded</Text>
      {error && !value.length && <Text style={[type.caption, { color: colors.error, marginTop: spacing.xs }]}>{error}</Text>}
    </Animated.View>
  );
};

const THUMB_SIZE = 90;

const styles = StyleSheet.create({
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', padding: 10, marginBottom: 12 },
  grid: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  addBtn: { width: THUMB_SIZE, height: THUMB_SIZE, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  removeBtn: { position: 'absolute', top: 3, right: 3, width: 18, height: 18, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  cloudBadge: { position: 'absolute', bottom: 3, left: 3, padding: 2 },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
});