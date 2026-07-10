/**
 * mobile/src/screens/candidate/JobsNearMeScreen.tsx
 * FIXED: Removed useSafeAreaInsets() and manual paddingTop
 * FIXED: Removed SafeAreaView (handled by root navigator)
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useNearbyJobs } from '../../hooks/useJobs';
import { NearbyJob } from '../../services/jobService';
import JobLocationMap from '../../components/jobs/JobLocationMap';

export interface UserLocation {
  lat: number;
  lng: number;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

const DistanceBadge: React.FC<{ km: number }> = ({ km }) => (
  <View style={styles.distanceBadge}>
    <Ionicons name="location" size={11} color="#6366f1" />
    <Text style={styles.distanceBadgeText}>{formatDistance(km)}</Text>
  </View>
);

const Chip: React.FC<{ label: string; color?: string; bg?: string }> = ({
  label, color = '#374151', bg = '#f3f4f6'
}) => (
  <View style={[styles.chip, { backgroundColor: bg }]}>
    <Text style={[styles.chipText, { color }]}>{label}</Text>
  </View>
);

interface NearbyJobCardProps {
  job:          NearbyJob;
  onPress:      () => void;
  onMapPress:   () => void;
}

const NearbyJobCard: React.FC<NearbyJobCardProps> = ({ job, onPress, onMapPress }) => {
  const owner     = job.ownerPreview ?? job.company ?? job.organization;
  const days      = daysUntil(job.applicationDeadline);
  const hasCoords = !!job.location?.coordinates?.coordinates?.length;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${job.title} at ${owner?.name}`}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardTitleBlock}>
          <View style={styles.cardTitleRow}>
            {job.urgent && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>URGENT</Text>
              </View>
            )}
            <Text style={styles.cardTitle} numberOfLines={2}>{job.title}</Text>
          </View>
          <Text style={styles.cardCompany} numberOfLines={1}>
            {owner?.name ?? '—'}
            {owner?.verified && (
              <Text style={styles.verifiedTick}> ✓</Text>
            )}
          </Text>
        </View>

        {hasCoords && (
          <TouchableOpacity
            style={styles.mapIconBtn}
            onPress={onMapPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="View on map"
          >
            <Ionicons name="map-outline" size={20} color="#6366f1" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.metaRow}>
        <DistanceBadge km={job.distanceKm} />
        {job.type && (
          <Chip label={job.type.replace(/-/g, ' ')} />
        )}
        {job.remote && job.remote !== 'on-site' && (
          <Chip label={job.remote} color="#16a34a" bg="#dcfce7" />
        )}
        {job.experienceLevel && (
          <Chip label={job.experienceLevel.replace(/-/g, ' ')} color="#9333ea" bg="#f3e8ff" />
        )}
      </View>

      <Text style={styles.locationText} numberOfLines={1}>
        <Ionicons name="location-outline" size={12} color="#9ca3af" />
        {' '}
        {[
          job.location?.specificLocation,
          job.location?.city,
          job.location?.region?.replace(/-/g, ' ')
        ]
          .filter(Boolean)
          .join(', ') || 'Location not specified'}
      </Text>

      {job.salaryDisplay && job.salaryMode !== 'hidden' && (
        <Text style={styles.salary}>{job.salaryDisplay}</Text>
      )}
      {job.salaryMode === 'negotiable' && (
        <Text style={styles.salary}>Negotiable</Text>
      )}
      {job.salaryMode === 'company-scale' && (
        <Text style={styles.salary}>As per company scale</Text>
      )}

      {days !== null && days > 0 && days <= 7 && (
        <View style={styles.deadlineRow}>
          <Ionicons name="time-outline" size={13} color="#f59e0b" />
          <Text style={styles.deadlineText}>
            Closes in {days} day{days !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
      {days !== null && days <= 0 && (
        <View style={styles.deadlineRow}>
          <Ionicons name="close-circle-outline" size={13} color="#ef4444" />
          <Text style={[styles.deadlineText, { color: '#ef4444' }]}>Deadline passed</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const;

const JobsNearMeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating]           = useState(false);
  const [radiusKm, setRadiusKm]           = useState<number>(25);
  const [selectedJob, setSelectedJob]     = useState<NearbyJob | null>(null);
  const [mapVisible, setMapVisible]       = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useNearbyJobs(
    userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng, radius: radiusKm }
      : null
  );

  const allJobs: NearbyJob[] = data?.pages.flatMap(p => p.jobs) ?? [];
  const totalResults = data?.pages[0]?.pagination.totalResults ?? 0;

  const requestLocation = useCallback(async () => {
    setLocating(true);
    setLocationError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(
          'Location access is required to find jobs near you.\n\nPlease enable it in your device Settings.'
        );
        setLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (e: any) {
      setLocationError(e?.message ?? 'Could not determine your location. Please try again.');
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => { requestLocation(); }, []);

  useEffect(() => {
    if (userLocation) refetch();
  }, [radiusKm]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const openMap = useCallback((job: NearbyJob) => {
    setSelectedJob(job);
    setMapVisible(true);
  }, []);

  const closeMap = useCallback(() => setMapVisible(false), []);

  if (locating && !userLocation) {
    return (
      <View style={styles.fullScreen}>
        <StatusBar barStyle="dark-content" />
        <TouchableOpacity style={styles.backBtnAbsolute} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.statusTitle}>Finding your location…</Text>
        <Text style={styles.statusSub}>Please allow location access when prompted</Text>
      </View>
    );
  }

  if (locationError && !userLocation) {
    return (
      <View style={styles.fullScreen}>
        <StatusBar barStyle="dark-content" />
        <TouchableOpacity style={styles.backBtnAbsolute} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Ionicons name="location-outline" size={56} color="#ef4444" />
        <Text style={styles.errorTitle}>Location Required</Text>
        <Text style={styles.errorBody}>{locationError}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestLocation}>
          <Text style={styles.primaryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Jobs Near Me</Text>
          {userLocation && !isLoading && (
            <Text style={styles.headerSub}>
              {totalResults} job{totalResults !== 1 ? 's' : ''} within {radiusKm} km
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.locateBtn}
          onPress={requestLocation}
          disabled={locating}
          accessibilityLabel="Refresh my location"
        >
          {locating
            ? <ActivityIndicator size="small" color="#6366f1" />
            : <Ionicons name="locate-outline" size={22} color="#6366f1" />
          }
        </TouchableOpacity>
      </View>

      <View style={styles.radiusBar}>
        <Text style={styles.radiusLabel}>Within:</Text>
        {RADIUS_OPTIONS.map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.radiusChip, radiusKm === r && styles.radiusChipActive]}
            onPress={() => setRadiusKm(r)}
            accessibilityLabel={`${r} kilometre radius`}
          >
            <Text style={[styles.radiusChipText, radiusKm === r && styles.radiusChipTextActive]}>
              {r} km
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && !data ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.statusTitle}>Searching nearby jobs…</Text>
        </View>
      ) : (
        <FlatList
          data={allJobs}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <NearbyJobCard
              job={item}
              onPress={() => navigation.navigate('JobDetail', { jobId: item._id })}
              onMapPress={() => openMap(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={refetch}
              tintColor="#6366f1"
              colors={['#6366f1']}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="briefcase-search-outline" size={56} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No jobs found nearby</Text>
              <Text style={styles.emptySub}>
                There are no active jobs within {radiusKm} km of your location.{'\n'}
                Try increasing the radius above.
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage
              ? <ActivityIndicator size="small" color="#6366f1" style={styles.footerLoader} />
              : null
          }
        />
      )}

      {selectedJob && (
        <JobLocationMap
          visible={mapVisible}
          job={selectedJob}
          userLocation={userLocation}
          onClose={closeMap}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f9fafb' },
  fullScreen:  {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32, backgroundColor: '#fff', gap: 12
  },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  backBtn:       { padding: 4 },
  backBtnAbsolute: { position: 'absolute', top: 16, left: 16, padding: 4, zIndex: 10 },
  headerCenter:  { flex: 1 },
  headerTitle:   { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerSub:     { fontSize: 12, color: '#6b7280', marginTop: 1 },
  locateBtn:     { padding: 4, width: 32, alignItems: 'center' },

  radiusBar: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap',
    paddingHorizontal: 16, paddingVertical: 8, gap: 6,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7eb',
  },
  radiusLabel:         { fontSize: 13, color: '#6b7280', marginRight: 2 },
  radiusChip:          {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  radiusChipActive:    { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  radiusChipText:      { fontSize: 12, color: '#6b7280' },
  radiusChipTextActive:{ color: '#6366f1', fontWeight: '700' },

  listContent: { padding: 12, paddingBottom: 32, gap: 10 },
  footerLoader:{ marginVertical: 16 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTop:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitleBlock:{ flex: 1 },
  cardTitleRow:  { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  cardTitle:     { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  cardCompany:   { fontSize: 13, color: '#6b7280', marginTop: 3 },
  verifiedTick:  { color: '#6366f1' },

  urgentBadge:   {
    backgroundColor: '#fef3c7', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  urgentText:    { fontSize: 9, fontWeight: '800', color: '#b45309', letterSpacing: 0.5 },

  mapIconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  metaRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 10,
  },
  distanceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20,
  },
  distanceBadgeText: { fontSize: 11, color: '#6366f1', fontWeight: '700' },
  chip:    {
    backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20,
  },
  chipText:{ fontSize: 11, textTransform: 'capitalize' },

  locationText:{ fontSize: 12, color: '#9ca3af', marginTop: 8, textTransform: 'capitalize' },
  salary:      { fontSize: 13, color: '#059669', fontWeight: '600', marginTop: 4 },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  deadlineText:{ fontSize: 12, color: '#f59e0b', fontWeight: '600' },

  statusTitle: { fontSize: 16, fontWeight: '600', color: '#111827', textAlign: 'center', marginTop: 12 },
  statusSub:   { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  errorTitle:  { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center', marginTop: 12 },
  errorBody:   { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  primaryBtn:  {
    backgroundColor: '#6366f1',
    paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 10, marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  emptyContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 10 },
  emptyTitle:     { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub:       { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 22 },
});

export default JobsNearMeScreen;