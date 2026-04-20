/**
 * src/components/application/CandidateApplicationDetails.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Candidate's 3-tab detail view for a single application.
 *
 * Tab 1 — Information   : cover letter, skills, contact info, job info
 * Tab 2 — Attachments   : all files with download
 * Tab 3 — Status        : company response + timeline
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Application,
  buildAttachments,
} from '../../services/applicationService';
import { AttachmentsTab } from './AttachmentsTab';
import { StatusTab } from './StatusTab';

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabId = 'info' | 'attachments' | 'status';

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'info',        label: 'Information', icon: 'information-circle-outline' },
  { id: 'attachments', label: 'Attachments', icon: 'folder-open-outline' },
  { id: 'status',      label: 'Status',      icon: 'git-branch-outline' },
];

// ─── Small helpers ────────────────────────────────────────────────────────────

const SectionCard = ({
  title, icon, iconColor = '#3B82F6', children, c,
}: {
  title: string; icon: string; iconColor?: string; children: React.ReactNode; c: any;
}) => (
  <View style={[sec.card, { backgroundColor: c.surface, borderColor: c.border }]}>
    <View style={sec.header}>
      <View style={[sec.iconBox, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon as any} size={16} color={iconColor} />
      </View>
      <Text style={[sec.title, { color: c.text }]}>{title}</Text>
    </View>
    {children}
  </View>
);

const InfoRow = ({
  icon, label, value, c,
}: { icon: string; label: string; value: string; c: any }) => (
  <View style={sec.infoRow}>
    <Ionicons name={icon as any} size={15} color={c.textMuted} />
    <Text style={[sec.infoLabel, { color: c.textMuted }]}>{label}:</Text>
    <Text style={[sec.infoValue, { color: c.text }]} numberOfLines={1}>{value}</Text>
  </View>
);

// ─── Info Tab content ─────────────────────────────────────────────────────────

const InfoTab: React.FC<{ application: Application; c: any }> = ({ application, c }) => {
  const owner = application.job?.jobType === 'organization'
    ? application.job?.organization
    : application.job?.company;

  return (
    <View style={{ gap: 12 }}>
      {/* Contact info */}
      <SectionCard title="Your Contact Info" icon="call-outline" iconColor="#3B82F6" c={c}>
        {application.contactInfo?.email && (
          <InfoRow icon="mail-outline" label="Email" value={application.contactInfo.email} c={c} />
        )}
        {application.contactInfo?.phone && (
          <InfoRow icon="call-outline" label="Phone" value={application.contactInfo.phone} c={c} />
        )}
        {application.contactInfo?.location && (
          <InfoRow icon="location-outline" label="Location" value={application.contactInfo.location} c={c} />
        )}
        {application.contactInfo?.telegram && (
          <InfoRow icon="paper-plane-outline" label="Telegram" value={application.contactInfo.telegram} c={c} />
        )}
      </SectionCard>

      {/* Job info */}
      <SectionCard title="Job Details" icon="briefcase-outline" iconColor="#10B981" c={c}>
        <InfoRow icon="document-text-outline" label="Position" value={application.job?.title ?? ''} c={c} />
        {owner?.name && (
          <InfoRow icon="business-outline" label="Company" value={owner.name} c={c} />
        )}
        {application.job?.location?.region && (
          <InfoRow icon="location-outline" label="Region" value={application.job.location.region} c={c} />
        )}
        <InfoRow
          icon="calendar-outline"
          label="Applied"
          value={new Date(application.createdAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })}
          c={c}
        />
      </SectionCard>

      {/* Cover letter */}
      <SectionCard title="Cover Letter" icon="document-text-outline" iconColor="#6D28D9" c={c}>
        <Text style={[sec.body, { color: c.textSecondary ?? c.text }]}>
          {application.coverLetter}
        </Text>
      </SectionCard>

      {/* Skills */}
      {(application.skills ?? []).length > 0 && (
        <SectionCard title="Skills" icon="flash-outline" iconColor="#F59E0B" c={c}>
          <View style={sec.chipRow}>
            {application.skills.map((sk, i) => (
              <View key={i} style={[sec.chip, { backgroundColor: `#F59E0B15`, borderColor: `#F59E0B40` }]}>
                <Text style={[sec.chipText, { color: '#D97706' }]}>{sk}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      )}

      {/* CVs summary */}
      {(application.selectedCVs ?? []).length > 0 && (
        <SectionCard title={`CVs Submitted (${application.selectedCVs.length})`} icon="document-outline" iconColor="#EF4444" c={c}>
          {application.selectedCVs.map((cv, i) => (
            <View key={i} style={[sec.fileRow, { backgroundColor: c.background, borderColor: c.border }]}>
              <Ionicons name="document-text" size={18} color="#EF4444" />
              <Text style={[sec.fileText, { color: c.text }]} numberOfLines={1}>
                {cv.originalName ?? cv.filename ?? 'CV Document'}
              </Text>
            </View>
          ))}
        </SectionCard>
      )}

      {/* Work experience summary */}
      {(application.workExperience ?? []).length > 0 && (
        <SectionCard title={`Work Experience (${application.workExperience.length})`} icon="briefcase-outline" iconColor="#0EA5E9" c={c}>
          {application.workExperience.map((exp, i) => (
            <View key={i} style={[sec.expCard, { backgroundColor: c.background, borderColor: c.border }]}>
              {exp.providedAsDocument ? (
                <View style={sec.docRow}>
                  <Ionicons name="document-text" size={16} color="#0EA5E9" />
                  <Text style={[sec.expTitle, { color: c.text }]}>
                    {exp.document?.originalName ?? 'Experience Document'}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={[sec.expTitle, { color: c.text }]}>
                    {exp.position} {exp.company ? `at ${exp.company}` : ''}
                  </Text>
                  {(exp.startDate || exp.endDate) && (
                    <Text style={[sec.expDates, { color: c.textMuted }]}>
                      {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                    </Text>
                  )}
                  {exp.description && (
                    <Text style={[sec.expDesc, { color: c.textMuted }]} numberOfLines={2}>
                      {exp.description}
                    </Text>
                  )}
                </>
              )}
            </View>
          ))}
        </SectionCard>
      )}

      {/* References summary */}
      {(application.references ?? []).length > 0 && (
        <SectionCard title={`References (${application.references.length})`} icon="people-outline" iconColor="#8B5CF6" c={c}>
          {application.references.map((ref, i) => (
            <View key={i} style={[sec.expCard, { backgroundColor: c.background, borderColor: c.border }]}>
              {ref.providedAsDocument ? (
                <View style={sec.docRow}>
                  <Ionicons name="document-text" size={16} color="#8B5CF6" />
                  <Text style={[sec.expTitle, { color: c.text }]}>
                    {ref.document?.originalName ?? 'Reference Document'}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={[sec.expTitle, { color: c.text }]}>{ref.name}</Text>
                  {ref.position && (
                    <Text style={[sec.expDates, { color: c.textMuted }]}>
                      {ref.position}{ref.company ? ` · ${ref.company}` : ''}
                    </Text>
                  )}
                  {ref.email && (
                    <Text style={[sec.expDesc, { color: c.textMuted }]}>{ref.email}</Text>
                  )}
                </>
              )}
            </View>
          ))}
        </SectionCard>
      )}
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface CandidateApplicationDetailsProps {
  application: Application;
  colors: any;
  onUpdated?: (app: Application) => void;
}

export const CandidateApplicationDetails: React.FC<CandidateApplicationDetailsProps> = ({
  application,
  colors: c,
  onUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('info');

  const attachments = useMemo(() => buildAttachments(application), [application]);

  return (
    <View style={{ flex: 1 }}>
      {/* Tab bar */}
      <View style={[tb.bar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const count = tab.id === 'attachments' ? attachments.length : undefined;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[tb.tab, active && [tb.tabActive, { borderBottomColor: c.primary }]]}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={active ? c.primary : c.textMuted}
              />
              <Text style={[tb.label, { color: active ? c.primary : c.textMuted }]}>
                {tab.label}
              </Text>
              {count !== undefined && count > 0 && (
                <View style={[tb.badge, { backgroundColor: c.primary }]}>
                  <Text style={tb.badgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={tb.content}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'info' && (
          <InfoTab application={application} c={c} />
        )}
        {activeTab === 'attachments' && (
          <AttachmentsTab
            attachments={attachments}
            showDownloadAll={attachments.length > 1}
            colors={c}
          />
        )}
        {activeTab === 'status' && (
          <StatusTab
            application={application}
            role="candidate"
            colors={c}
            onUpdated={onUpdated}
          />
        )}
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const tb = StyleSheet.create({
  bar:       {
    flexDirection: 'row', borderBottomWidth: 1,
  },
  tab:       {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {},
  label:     { fontSize: 11, fontWeight: '700' },
  badge:     {
    minWidth: 17, height: 17, borderRadius: 9, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  content:   { padding: 16, paddingBottom: 40, gap: 0 },
});

const sec = StyleSheet.create({
  card:      { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  header:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  iconBox:   { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: 14, fontWeight: '700' },
  infoRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoLabel: { fontSize: 12, width: 60 },
  infoValue: { fontSize: 13, fontWeight: '600', flex: 1 },
  body:      { fontSize: 13, lineHeight: 20 },
  chipRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  chipText:  { fontSize: 12, fontWeight: '600' },
  fileRow:   {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 8, borderRadius: 8, borderWidth: 1, marginBottom: 4,
  },
  fileText:  { fontSize: 13, flex: 1 },
  expCard:   { padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 6 },
  expTitle:  { fontSize: 13, fontWeight: '600' },
  expDates:  { fontSize: 11, marginTop: 2 },
  expDesc:   { fontSize: 12, marginTop: 4, lineHeight: 16 },
  docRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
