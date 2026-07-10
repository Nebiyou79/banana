/**
 * mobile/src/components/jobs/JobLocationMap.tsx
 *
 * Bottom-sheet modal that shows:
 *   • A map with the job's location pin (purple)
 *   • The candidate's current location pin (green)
 *   • A dashed straight-line connector between them
 *   • Distance badge, job title, and company name
 *   • "Get Directions" button that opens Google Maps / Apple Maps
 *   • "Apply Now" quick-action button
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Linking,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import MapView, {
  Marker,
  Polyline,
  UrlTile,
  Region,
} from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { NearbyJob } from '../../services/jobService';
import { UserLocation } from '../../screens/candidate/JobsNearMeScreen';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  visible:      boolean;
  job:          NearbyJob;
  userLocation: UserLocation | null;
  onClose:      () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

/**
 * Calculate a nice initial region that includes both markers.
 * Returns a Region that has enough padding around both points.
 */
function calcRegion(
  jobLat: number, jobLng: number,
  userLat?: number, userLng?: number
): Region {
  if (userLat === undefined || userLng === undefined) {
    return {
      latitude:       jobLat,
      longitude:      jobLng,
      latitudeDelta:  0.04,
      longitudeDelta: 0.04,
    };
  }

  const minLat = Math.min(jobLat, userLat);
  const maxLat = Math.max(jobLat, userLat);
  const minLng = Math.min(jobLng, userLng);
  const maxLng = Math.max(jobLng, userLng);

  const latDelta = Math.max((maxLat - minLat) * 1.6, 0.02);
  const lngDelta = Math.max((maxLng - minLng) * 1.6, 0.02);

  return {
    latitude:       (minLat + maxLat) / 2,
    longitude:      (minLng + maxLng) / 2,
    latitudeDelta:  latDelta,
    longitudeDelta: lngDelta,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const JobLocationMap: React.FC<Props> = ({ visible, job, userLocation, onClose }) => {
  const navigation = useNavigation<any>();
  const mapRef     = useRef<MapView>(null);
  const slideAnim  = useRef(new Animated.Value(600)).current;

  // Extract GeoJSON coordinates — stored as [lng, lat]
  const coords    = job.location?.coordinates?.coordinates;
  const hasCoords = coords && coords.length === 2;
  const jobLng    = hasCoords ? coords[0] : null;
  const jobLat    = hasCoords ? coords[1] : null;

  // Slide-in / slide-out animation
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue:         visible ? 0 : 600,
      useNativeDriver: true,
      tension:         65,
      friction:        11,
    }).start();
  }, [visible]);

  // Fit map to show both markers 300ms after opening
  useEffect(() => {
    if (!visible || !mapRef.current || !hasCoords) return;

    const timer = setTimeout(() => {
      const points: { latitude: number; longitude: number }[] = [
        { latitude: jobLat!, longitude: jobLng! }
      ];
      if (userLocation) {
        points.push({ latitude: userLocation.lat, longitude: userLocation.lng });
      }
      mapRef.current?.fitToCoordinates(points, {
        edgePadding: { top: 60, right: 50, bottom: 60, left: 50 },
        animated:    true,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [visible]);

  // Open native maps for turn-by-turn directions
  const openDirections = useCallback(() => {
    if (!jobLat || !jobLng) return;
    const dest    = `${jobLat},${jobLng}`;
    const encoded = encodeURIComponent(
      `${job.title} — ${job.ownerPreview?.name ?? job.company?.name ?? ''}`
    );
    const url = Platform.select({
      ios:     `maps://?daddr=${dest}&dirflg=d`,
      android: `google.navigation:q=${dest}&label=${encoded}`,
    });
    if (url) Linking.openURL(url).catch(() => {
      // Fallback: open in browser Google Maps
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${dest}`);
    });
  }, [jobLat, jobLng, job]);

  const goToJobDetail = useCallback(() => {
    onClose();
    setTimeout(() => navigation.navigate('JobDetail', { jobId: job._id }), 250);
  }, [job._id, navigation, onClose]);

  // Guard: if job has no coordinates, don't render the modal at all
  if (!hasCoords) return null;

  const owner         = job.ownerPreview ?? job.company ?? job.organization;
  const locationLabel = [
    job.location?.specificLocation,
    job.location?.city,
    job.location?.region?.replace(/-/g, ' '),
  ].filter(Boolean).join(', ');

  const initialRegion = calcRegion(
    jobLat!, jobLng!,
    userLocation?.lat, userLocation?.lng
  );

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Dim backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Sheet */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* ── Job info strip ── */}
        <View style={styles.jobStrip}>
          <View style={styles.jobStripLeft}>
            <Text style={styles.jobStripTitle} numberOfLines={2}>{job.title}</Text>
            <Text style={styles.jobStripCompany} numberOfLines={1}>
              {owner?.name ?? '—'}
              {owner?.verified && <Text style={styles.verifiedTick}> ✓</Text>}
            </Text>
            {locationLabel ? (
              <Text style={styles.jobStripLocation} numberOfLines={1}>
                <Ionicons name="location-outline" size={11} color="#9ca3af" /> {locationLabel}
              </Text>
            ) : null}
          </View>

          <View style={styles.jobStripRight}>
            {/* Distance badge */}
            <View style={styles.distBadge}>
              <Ionicons name="location" size={13} color="#6366f1" />
              <Text style={styles.distBadgeText}>{formatDistance(job.distanceKm)}</Text>
            </View>
            {/* Close button */}
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeIconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Map ── */}
        {/*
          provider={undefined} → uses the default native map engine (Apple Maps on iOS,
          Google Maps on Android) but we overlay OpenStreetMap tiles via UrlTile so
          NO Google Maps API key is needed.
        */}
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={undefined}
          initialRegion={initialRegion}
          showsUserLocation={false}
          showsCompass={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
        >
          {/* OpenStreetMap tile overlay — completely free, no API key */}
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
            tileSize={256}
          />
          {/* Job pin */}
          <Marker
            coordinate={{ latitude: jobLat!, longitude: jobLng! }}
            title={job.title}
            description={owner?.name}
            pinColor="#6366f1"
          />

          {/* User pin */}
          {userLocation && (
            <Marker
              coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
              title="Your Location"
              pinColor="#10b981"
            />
          )}

          {/* Straight-line connector (no API key needed) */}
          {userLocation && (
            <Polyline
              coordinates={[
                { latitude: userLocation.lat, longitude: userLocation.lng },
                { latitude: jobLat!,           longitude: jobLng! },
              ]}
              strokeColor="#6366f1"
              strokeWidth={2}
              lineDashPattern={[8, 5]}
              strokeColors={['#6366f1']}
            />
          )}
        </MapView>

        {/* ── Map legend ── */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#6366f1' }]} />
            <Text style={styles.legendText}>Job location</Text>
          </View>
          {userLocation && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>Your location</Text>
            </View>
          )}
        </View>

        {/* ── Action buttons ── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.directionsBtn]}
            onPress={openDirections}
            activeOpacity={0.85}
          >
            <Ionicons name="navigate" size={16} color="#fff" />
            <Text style={styles.directionsBtnText}>Get Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.applyBtn]}
            onPress={goToJobDetail}
            activeOpacity={0.85}
          >
            <Ionicons name="briefcase-outline" size={16} color="#6366f1" />
            <Text style={styles.applyBtnText}>View Job</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },

  sheet: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    backgroundColor: '#fff',
    borderTopLeftRadius:  22,
    borderTopRightRadius: 22,
    paddingBottom:   Platform.OS === 'ios' ? 34 : 20,
    overflow:        'hidden',
    // Subtle shadow on top edge
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: -3 },
    shadowOpacity:   0.10,
    shadowRadius:    12,
    elevation:       20,
  },

  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: '#d1d5db',
    alignSelf:       'center',
    marginTop:       10,
    marginBottom:    4,
  },

  // ── Job strip ──
  jobStrip: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f3f4f6',
    gap: 8,
  },
  jobStripLeft:    { flex: 1 },
  jobStripRight:   { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  jobStripTitle:   { fontSize: 15, fontWeight: '700', color: '#111827' },
  jobStripCompany: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  jobStripLocation:{ fontSize: 12, color: '#9ca3af', marginTop: 2, textTransform: 'capitalize' },
  verifiedTick:    { color: '#6366f1' },

  distBadge: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            3,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:   20,
  },
  distBadgeText: { fontSize: 12, color: '#6366f1', fontWeight: '700' },
  closeIconBtn:  { padding: 2 },

  // ── Map ──
  map: { width: '100%', height: 240 },

  // ── Legend ──
  legend: {
    flexDirection:    'row',
    gap:              16,
    paddingHorizontal: 16,
    paddingTop:        8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#6b7280' },

  // ── Actions ──
  actions: {
    flexDirection:    'row',
    gap:              10,
    paddingHorizontal: 16,
    paddingTop:        12,
  },
  actionBtn: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    paddingVertical: 13,
    borderRadius:   12,
  },
  directionsBtn:     { backgroundColor: '#6366f1' },
  directionsBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  applyBtn: {
    backgroundColor: '#eef2ff',
    borderWidth:     1,
    borderColor:     '#c7d2fe',
  },
  applyBtnText: { color: '#6366f1', fontWeight: '700', fontSize: 14 },
});

export default JobLocationMap;