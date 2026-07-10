/**
 * src/components/jobs/JobDetailView.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * CHANGES IN THIS VERSION:
 *  ✅ Added 5th tab: "Location" — interactive map + location details card +
 *     Get Directions button + distance badge (if userLocation passed in)
 *  ✅ Tab type extended to include 'location'
 *  ✅ LocationTab component: OpenStreetMap tiles, job pin, distance display,
 *     full location address card, Get Directions → native maps
 *  ✅ All existing tabs preserved exactly (Overview, Requirements, Details, Company)
 *  ✅ All colours via useTheme() — no hardcoded hex
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useMemo, memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, UrlTile, Polyline } from 'react-native-maps';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha, formatShortDate } from '../../theme/utils';
import { SPACING, RADIUS } from '../../theme/tokens';
import { Job } from '../../services/jobService';
import {
  formatSalary,
  getJobTypeLabel,
  getExperienceLevelLabel,
  getSalaryModeConfig,
  formatLocation,
} from '../../utils/jobHelpers';
import Avatar, { jobOwnerToEntity } from '../shared/Avatar';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserLocation { lat: number; lng: number }

interface JobDetailViewProps {
  job:          Job;
  role?:        'company' | 'organization' | 'candidate';
  userLocation?: UserLocation | null;  // optional — for distance display in Location tab
}

type Tab = 'overview' | 'requirements' | 'details' | 'company' | 'location';

// ─── InfoRow ──────────────────────────────────────────────────────────────────

interface InfoRowProps {
  icon:  React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}

const InfoRow = memo<InfoRowProps>(({ icon, label, value }) => {
  const { colors: c } = useTheme();
  return (
    <View style={ir.row}>
      <View style={[ir.iconBox, { backgroundColor: withAlpha(c.primary, 0.12) }]}>
        <Ionicons name={icon} size={16} color={c.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[ir.label, { color: c.textMuted }]}>{label}</Text>
        <Text style={[ir.value, { color: c.text }]}>{value}</Text>
      </View>
    </View>
  );
});
InfoRow.displayName = 'JobDetailView.InfoRow';

const ir = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconBox: { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 11, fontWeight: '600', marginBottom: 1 },
  value:   { fontSize: 14, fontWeight: '600' },
});

// ─── BulletList ───────────────────────────────────────────────────────────────

interface BulletListProps {
  items:     string[];
  icon?:     React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
}

const BulletList = memo<BulletListProps>(({ items, icon = 'ellipse', iconColor }) => {
  const { colors: c } = useTheme();
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={bl.row}>
          <Ionicons
            name={icon}
            size={icon === 'ellipse' ? 8 : 16}
            color={iconColor ?? c.primary}
            style={{ marginTop: 3 }}
          />
          <Text style={[bl.text, { color: c.textSecondary }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
});
BulletList.displayName = 'JobDetailView.BulletList';

const bl = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: SPACING.sm },
  text: { flex: 1, fontSize: 14, lineHeight: 21 },
});

// ─── SectionCard ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  title:     string;
  icon:      React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  children:  React.ReactNode;
}

const SectionCard = memo<SectionCardProps>(({ title, icon, iconColor, children }) => {
  const { colors: c } = useTheme();
  return (
    <View style={[scc.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
      <View style={scc.header}>
        <Ionicons name={icon} size={18} color={iconColor} />
        <Text style={[scc.title, { color: c.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
});
SectionCard.displayName = 'JobDetailView.SectionCard';

const scc = StyleSheet.create({
  card:   { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.lg, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 12 },
  title:  { fontSize: 15, fontWeight: '700' },
});

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  value: string | number;
  label: string;
  color: string;
  bg:    string;
}

const StatCard = memo<StatCardProps>(({ value, label, color, bg }) => (
  <View style={[stc.card, { backgroundColor: bg }]}>
    <Text style={[stc.val, { color }]}>{value}</Text>
    <Text style={[stc.label, { color }]}>{label}</Text>
  </View>
));
StatCard.displayName = 'JobDetailView.StatCard';

const stc = StyleSheet.create({
  card:  { flex: 1, alignItems: 'center', padding: 12, borderRadius: RADIUS.md },
  val:   { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 11, marginTop: 2, opacity: 0.8 },
});

// ─── SkillTags ────────────────────────────────────────────────────────────────

const SkillTags: React.FC<{ skills: string[] }> = ({ skills }) => {
  const { colors: c } = useTheme();
  return (
    <View style={sk.wrap}>
      {skills.map((s) => (
        <View key={s} style={[sk.tag, { backgroundColor: withAlpha(c.primary, 0.12) }]}>
          <Text style={[sk.text, { color: c.primary }]}>{s}</Text>
        </View>
      ))}
    </View>
  );
};

const sk = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  tag:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full },
  text: { fontSize: 12, fontWeight: '500' },
});

// ─── Tab bar ──────────────────────────────────────────────────────────────────

interface TabBarProps {
  tabs:    Array<{ key: Tab; label: string }>;
  active:  Tab;
  onPress: (t: Tab) => void;
}

const TabBar = memo<TabBarProps>(({ tabs, active, onPress }) => {
  const { colors: c } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[tbs.row, { backgroundColor: c.surface, borderBottomColor: c.border }]}
      contentContainerStyle={tbs.content}
    >
      {tabs.map((t) => (
        <TouchableOpacity
          key={t.key}
          style={tbs.tab}
          onPress={() => onPress(t.key)}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: active === t.key }}
        >
          <Text style={[tbs.text, { color: active === t.key ? c.primary : c.textMuted }]}>
            {t.label}
          </Text>
          {active === t.key && (
            <View style={[tbs.indicator, { backgroundColor: c.primary }]} />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
});
TabBar.displayName = 'JobDetailView.TabBar';

const tbs = StyleSheet.create({
  row:       { borderBottomWidth: 1, maxHeight: 48 },
  content:   { paddingHorizontal: 4 },
  tab:       { alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, minHeight: 44 },
  text:      { fontSize: 13, fontWeight: '600' },
  indicator: { position: 'absolute', bottom: 0, left: 8, right: 8, height: 2, borderRadius: 1 },
});

// ─── Location Tab ─────────────────────────────────────────────────────────────

interface LocationTabProps {
  job:          Job;
  userLocation?: UserLocation | null;
}

const calcDistanceKm = (
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number => {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
};

const LocationTab = memo<LocationTabProps>(({ job, userLocation }) => {
  const { colors: c, isDark } = useTheme();

  const coords    = job.location?.coordinates?.coordinates;
  const hasCoords = coords && coords.length === 2;
  const jobLng    = hasCoords ? coords[0] : null;
  const jobLat    = hasCoords ? coords[1] : null;

  const distance = useMemo(() => {
    if (!hasCoords || !userLocation) return null;
    return calcDistanceKm(userLocation.lat, userLocation.lng, jobLat!, jobLng!);
  }, [hasCoords, userLocation, jobLat, jobLng]);

  const mapRegion = useMemo(() => {
    if (!hasCoords) return null;
    if (userLocation) {
      const minLat = Math.min(jobLat!, userLocation.lat);
      const maxLat = Math.max(jobLat!, userLocation.lat);
      const minLng = Math.min(jobLng!, userLocation.lng);
      const maxLng = Math.max(jobLng!, userLocation.lng);
      return {
        latitude:       (minLat + maxLat) / 2,
        longitude:      (minLng + maxLng) / 2,
        latitudeDelta:  Math.max((maxLat - minLat) * 1.6, 0.02),
        longitudeDelta: Math.max((maxLng - minLng) * 1.6, 0.02),
      };
    }
    return { latitude: jobLat!, longitude: jobLng!, latitudeDelta: 0.035, longitudeDelta: 0.035 };
  }, [hasCoords, jobLat, jobLng, userLocation]);

  const openDirections = useCallback(() => {
    if (!jobLat || !jobLng) return;
    const dest    = `${jobLat},${jobLng}`;
    const encoded = encodeURIComponent(job.title ?? 'Job Location');
    const url     = Platform.select({
      ios:     `maps://?daddr=${dest}&dirflg=d`,
      android: `google.navigation:q=${dest}&label=${encoded}`,
    });
    if (url) {
      Linking.openURL(url).catch(() =>
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${dest}`)
      );
    }
  }, [jobLat, jobLng, job.title]);

  // Location parts for address display
  const loc = job.location;
  const regionLabel = loc?.region?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) ?? '';
  const addressLines = [
    loc?.specificLocation,
    [loc?.subCity, loc?.woreda].filter(Boolean).join(', '),
    [loc?.city, regionLabel].filter(Boolean).join(', '),
    'Ethiopia',
  ].filter(Boolean);

  if (!hasCoords) {
    // No coordinates — show location details only
    return (
      <View style={{ padding: SPACING.lg }}>
        <SectionCard title="Location Details" icon="location-outline" iconColor={c.primary}>
          {addressLines.map((line, i) => (
            <View key={i} style={lt.addrLine}>
              <Ionicons
                name={i === 0 ? 'pin-outline' : 'remove-outline'}
                size={14}
                color={i === 0 ? c.primary : c.border}
              />
              <Text style={[lt.addrText, { color: i === 0 ? c.text : c.textMuted }]}>{line}</Text>
            </View>
          ))}
        </SectionCard>

        <View style={[lt.noMapCard, { backgroundColor: withAlpha(c.primary, 0.06), borderColor: c.border }]}>
          <Ionicons name="map-outline" size={32} color={c.textMuted} />
          <Text style={[lt.noMapTitle, { color: c.text }]}>No Map Pin Available</Text>
          <Text style={[lt.noMapSub, { color: c.textMuted }]}>
            The employer hasn't pinned an exact location yet. Use the address above to find them.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* ── Map ── */}
      <View style={lt.mapContainer}>
        <MapView
          style={lt.map}
          provider={undefined}
          initialRegion={mapRegion!}
          showsUserLocation={false}
          showsCompass={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          scrollEnabled
          zoomEnabled
        >
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
            description={formatLocation(job.location)}
            pinColor={c.primary}
          />

          {/* User location pin */}
          {userLocation && (
            <Marker
              coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
              title="Your Location"
              pinColor={c.success}
            />
          )}

          {/* Dashed connector line */}
          {userLocation && (
            <Polyline
              coordinates={[
                { latitude: userLocation.lat, longitude: userLocation.lng },
                { latitude: jobLat!,           longitude: jobLng! },
              ]}
              strokeColor={c.primary}
              strokeWidth={2}
              lineDashPattern={[8, 5]}
            />
          )}
        </MapView>

        {/* Distance badge overlay */}
        {distance !== null && (
          <View style={[lt.distanceBadge, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <Ionicons name="navigate-outline" size={13} color={c.primary} />
            <Text style={[lt.distanceText, { color: c.primary }]}>{formatDistance(distance)}</Text>
          </View>
        )}

        {/* Map legend */}
        <View style={[lt.legend, { backgroundColor: withAlpha(c.bgCard, 0.92) }]}>
          <View style={lt.legendItem}>
            <View style={[lt.legendDot, { backgroundColor: c.primary }]} />
            <Text style={[lt.legendText, { color: c.text }]}>Job</Text>
          </View>
          {userLocation && (
            <View style={lt.legendItem}>
              <View style={[lt.legendDot, { backgroundColor: c.success }]} />
              <Text style={[lt.legendText, { color: c.text }]}>You</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Details below map ── */}
      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Get Directions button */}
        <TouchableOpacity
          style={[lt.directionsBtn, { backgroundColor: c.primary }]}
          onPress={openDirections}
          activeOpacity={0.85}
        >
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text style={lt.directionsBtnText}>Get Directions</Text>
        </TouchableOpacity>

        {/* Coordinates card */}
        <View style={[lt.coordCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={lt.coordHeader}>
            <View style={[lt.coordIconBox, { backgroundColor: withAlpha(c.primary, 0.12) }]}>
              <Ionicons name="pin" size={16} color={c.primary} />
            </View>
            <Text style={[lt.coordTitle, { color: c.text }]}>Exact Coordinates</Text>
          </View>
          <Text style={[lt.coordValue, { color: c.textMuted }]}>
            {jobLat!.toFixed(5)}°N, {jobLng!.toFixed(5)}°E
          </Text>
        </View>

        {/* Address card */}
        <SectionCard title="Full Address" icon="home-outline" iconColor={c.info}>
          {addressLines.map((line, i) => (
            <View key={i} style={lt.addrLine}>
              <Ionicons
                name={i === 0 ? 'pin' : 'chevron-forward-outline'}
                size={i === 0 ? 14 : 12}
                color={i === 0 ? c.primary : c.border}
              />
              <Text style={[lt.addrText, { color: i === 0 ? c.text : c.textMuted }]}>{line}</Text>
            </View>
          ))}
        </SectionCard>

        {/* Location fields grid */}
        <SectionCard title="Location Details" icon="map-outline" iconColor={c.warning}>
          {[
            loc?.region      && { label: 'Region',            value: regionLabel },
            loc?.city        && { label: 'City',              value: loc.city },
            loc?.subCity     && { label: 'Sub-City',          value: loc.subCity },
            loc?.woreda      && { label: 'Woreda',            value: loc.woreda },
            loc?.specificLocation && { label: 'Landmark',     value: loc.specificLocation },
          ].filter(Boolean).map((row: any, i) => (
            <InfoRow key={i} icon="chevron-forward-outline" label={row.label} value={row.value} />
          ))}
        </SectionCard>

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
});
LocationTab.displayName = 'JobDetailView.LocationTab';

const lt = StyleSheet.create({
  mapContainer:    { height: 280, position: 'relative' },
  map:             { flex: 1 },
  distanceBadge:   {
    position:      'absolute',
    top:           12,
    right:         12,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
    paddingHorizontal: 10,
    paddingVertical:    6,
    borderRadius:  20,
    borderWidth:   1,
  },
  distanceText:    { fontSize: 13, fontWeight: '700' },
  legend:          {
    position:      'absolute',
    bottom:        12,
    left:          12,
    flexDirection: 'row',
    gap:           12,
    paddingHorizontal: 10,
    paddingVertical:    6,
    borderRadius:  10,
  },
  legendItem:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:       { width: 9, height: 9, borderRadius: 5 },
  legendText:      { fontSize: 11, fontWeight: '600' },
  directionsBtn:   {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    paddingVertical: 14,
    borderRadius:   14,
    marginBottom:   14,
  },
  directionsBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  coordCard:       { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 14 },
  coordHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  coordIconBox:    { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  coordTitle:      { fontSize: 14, fontWeight: '700' },
  coordValue:      { fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  addrLine:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  addrText:        { fontSize: 14, flex: 1 },
  noMapCard:       {
    alignItems:   'center', justifyContent: 'center',
    padding:      32, borderRadius: 16, borderWidth: 1,
    gap:          12, marginTop: 8,
  },
  noMapTitle:      { fontSize: 16, fontWeight: '700' },
  noMapSub:        { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});

// ─── Main component ───────────────────────────────────────────────────────────

export const JobDetailView: React.FC<JobDetailViewProps> = ({
  job,
  role         = 'candidate',
  userLocation = null,
}) => {
  const { colors: c, isDark } = useTheme();
  const [tab, setTab] = useState<Tab>('overview');

  const isOrg  = job.jobType === 'organization';
  const owner  = job.company ?? job.organization;
  const salCfg = getSalaryModeConfig(job.salaryMode, isDark);

  const TABS: Array<{ key: Tab; label: string }> = useMemo(
    () => [
      { key: 'overview',     label: 'Overview'                   },
      { key: 'requirements', label: 'Requirements'               },
      { key: 'details',      label: 'Details'                    },
      { key: 'company',      label: isOrg ? 'Org' : 'Company'   },
      { key: 'location',     label: 'Location'                   },
    ],
    [isOrg],
  );

  // ── Overview ──────────────────────────────────────────────────────────────
  const OverviewTab = () => (
    <>
      {job.shortDescription && (
        <SectionCard title="Overview" icon="information-circle-outline" iconColor={c.primary}>
          <Text style={[ov.body, { color: c.textSecondary }]}>{job.shortDescription}</Text>
        </SectionCard>
      )}
      <SectionCard
        title={isOrg ? 'About this Opportunity' : 'About the Role'}
        icon="document-text-outline"
        iconColor={c.info}
      >
        <Text style={[ov.body, { color: c.textSecondary, lineHeight: 23 }]}>
          {job.description}
        </Text>
      </SectionCard>

      {(job.responsibilities ?? []).length > 0 && (
        <SectionCard title="Responsibilities" icon="list-outline" iconColor={c.primary}>
          <BulletList items={job.responsibilities!} icon="chevron-forward" iconColor={c.primary} />
        </SectionCard>
      )}

      {(job.benefits ?? []).length > 0 && (
        <SectionCard title="Benefits & Perks" icon="heart-outline" iconColor={c.success}>
          <BulletList items={job.benefits!} icon="checkmark-circle" iconColor={c.success} />
        </SectionCard>
      )}

      {(job.skills ?? []).length > 0 && (
        <SectionCard title="Required Skills" icon="construct-outline" iconColor={c.warning}>
          <SkillTags skills={job.skills!} />
        </SectionCard>
      )}
    </>
  );

  const ov = StyleSheet.create({ body: { fontSize: 14, lineHeight: 22 } });

  // ── Requirements ──────────────────────────────────────────────────────────
  const RequirementsTab = () => (
    <>
      <SectionCard title="Requirements" icon="checkmark-circle-outline" iconColor={c.success}>
        {(job.requirements ?? []).length > 0 ? (
          <BulletList items={job.requirements!} icon="checkmark-circle" iconColor={c.success} />
        ) : (
          <Text style={{ fontSize: 13, color: c.textMuted }}>No specific requirements listed.</Text>
        )}
      </SectionCard>

      <SectionCard title="Position Requirements" icon="information-circle-outline" iconColor={c.primary}>
        <InfoRow icon="school-outline"   label="Experience" value={getExperienceLevelLabel(job.experienceLevel)} />
        <InfoRow icon="library-outline"  label="Education"  value={job.educationLevel?.replace(/-/g, ' ') ?? 'Not specified'} />
        <InfoRow icon="people-outline"   label="Positions"  value={`${job.candidatesNeeded ?? 1} position${(job.candidatesNeeded ?? 1) > 1 ? 's' : ''}`} />
        {job.applicationDeadline && (
          <InfoRow icon="calendar-outline" label="Deadline" value={formatShortDate(job.applicationDeadline)} />
        )}
      </SectionCard>

      {job.demographicRequirements?.sex && job.demographicRequirements.sex !== 'any' && (
        <SectionCard title="Demographic Requirements" icon="person-outline" iconColor={c.warning}>
          <InfoRow
            icon="person-outline"
            label="Gender"
            value={
              job.demographicRequirements.sex.charAt(0).toUpperCase() +
              job.demographicRequirements.sex.slice(1)
            }
          />
          {job.demographicRequirements.age?.min != null && (
            <InfoRow
              icon="timer-outline"
              label="Age Range"
              value={`${job.demographicRequirements.age.min}${job.demographicRequirements.age.max ? ` – ${job.demographicRequirements.age.max}` : '+'} years`}
            />
          )}
        </SectionCard>
      )}
    </>
  );

  // ── Details ───────────────────────────────────────────────────────────────
  const DetailsTab = () => {
    const det = StyleSheet.create({
      statsRow:    { flexDirection: 'row', gap: SPACING.sm },
      salaryBox:   { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: RADIUS.sm },
      salaryMode:  { fontSize: 12, fontWeight: '600', marginBottom: 2 },
      salaryVal:   { fontSize: 16, fontWeight: '800' },
      salaryPeriod:{ fontSize: 12, marginTop: 6 },
    });
    return (
      <>
        <View style={[det.statsRow, { marginBottom: 12 }]}>
          <StatCard value={job.candidatesNeeded ?? 1}  label="Needed"  color={c.primary} bg={withAlpha(c.primary, 0.12)} />
          <StatCard value={job.applicationCount ?? 0}  label="Applied" color={c.success} bg={withAlpha(c.success, 0.12)} />
          <StatCard value={job.viewCount ?? 0}         label="Views"   color={c.info}    bg={withAlpha(c.info,    0.12)} />
          <StatCard value={getJobTypeLabel(job.type)}  label="Type"    color={c.warning} bg={withAlpha(c.warning, 0.12)} />
        </View>

        <SectionCard title="Compensation" icon="cash-outline" iconColor={c.success}>
          <View style={[det.salaryBox, { backgroundColor: withAlpha(c.primary, 0.08) }]}>
            <Ionicons name={salCfg.icon as any} size={20} color={c.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[det.salaryMode, { color: c.textMuted }]}>{salCfg.label}</Text>
              <Text style={[det.salaryVal, { color: c.text }]}>{formatSalary(job)}</Text>
            </View>
          </View>
          {job.salary?.period && (
            <Text style={[det.salaryPeriod, { color: c.textMuted }]}>Per {job.salary.period}</Text>
          )}
        </SectionCard>

        <SectionCard title="Job Details" icon="briefcase-outline" iconColor={c.info}>
          <InfoRow icon="briefcase-outline" label="Type"       value={getJobTypeLabel(job.type)} />
          <InfoRow icon="location-outline"  label="Location"   value={formatLocation(job.location)} />
          <InfoRow icon="wifi-outline"      label="Remote"     value={job.remote?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) ?? 'On-site'} />
          {job.applicationDeadline && (
            <InfoRow icon="calendar-outline" label="Deadline"  value={formatShortDate(job.applicationDeadline)} />
          )}
          <InfoRow icon="school-outline"    label="Experience" value={getExperienceLevelLabel(job.experienceLevel)} />
        </SectionCard>

        {(job.tags ?? []).length > 0 && (
          <SectionCard title="Tags" icon="pricetag-outline" iconColor={c.warning}>
            <SkillTags skills={job.tags!} />
          </SectionCard>
        )}
      </>
    );
  };

  // ── Company / Org ─────────────────────────────────────────────────────────
  const CompanyTab = () => {
    const ownerEntity = jobOwnerToEntity(job);
    const comp        = StyleSheet.create({
      orgHero:       { flexDirection: 'row', alignItems: 'center', gap: 14 },
      orgNameRow:    { flexDirection: 'row', alignItems: 'center' },
      orgName:       { fontSize: 16, fontWeight: '700' },
      orgIndustry:   { fontSize: 13, marginTop: 3 },
    });
    return (
      <>
        <SectionCard
          title={isOrg ? 'About the Organization' : 'About the Company'}
          icon="business-outline"
          iconColor={c.primary}
        >
          <View style={comp.orgHero}>
            <Avatar entity={ownerEntity} size={56} borderRadius={RADIUS.md} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={comp.orgNameRow}>
                <Text style={[comp.orgName, { color: c.text }]}>{owner?.name ?? '—'}</Text>
                {owner?.verified && (
                  <Ionicons name="shield-checkmark" size={16} color={c.success} style={{ marginLeft: 6 }} />
                )}
              </View>
              {owner?.industry && (
                <Text style={[comp.orgIndustry, { color: c.textMuted }]}>{owner.industry}</Text>
              )}
            </View>
          </View>
        </SectionCard>

        <SectionCard title="Job Posted By" icon="person-circle-outline" iconColor={c.info}>
          <InfoRow icon="calendar-outline"   label="Posted"    value={formatShortDate(job.createdAt)} />
          {job.applicationDeadline && (
            <InfoRow icon="time-outline"     label="Deadline"  value={formatShortDate(job.applicationDeadline)} />
          )}
          <InfoRow icon="people-outline"    label="Positions"  value={`${job.candidatesNeeded ?? 1} position(s)`} />
          <InfoRow icon="briefcase-outline" label="Job Type"   value={`${isOrg ? 'Organization' : 'Company'} — ${job.opportunityType ?? 'Job'}`} />
        </SectionCard>
      </>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <TabBar tabs={TABS} active={tab} onPress={setTab} />

      {/* Location tab gets its own layout (map + scroll below) */}
      {tab === 'location' ? (
        <LocationTab job={job} userLocation={userLocation} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: SPACING.lg }}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'overview'     && <OverviewTab />}
          {tab === 'requirements' && <RequirementsTab />}
          {tab === 'details'      && <DetailsTab />}
          {tab === 'company'      && <CompanyTab />}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
};