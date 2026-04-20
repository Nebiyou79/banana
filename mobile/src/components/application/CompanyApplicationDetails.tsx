/**
 * src/components/application/CompanyApplicationDetails.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Company / Org 3-tab detail view.
 *
 * Tab 1 — Candidate Info  : candidate profile, cover letter, skills
 * Tab 2 — Attachments     : all files with download
 * Tab 3 — Manage Status   : change status, book interview, send response
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Application, buildAttachments } from '../../services/applicationService';
import { AttachmentsTab } from './AttachmentsTab';
import { StatusTab } from './StatusTab';

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabId = 'candidate' | 'attachments' | 'manage';

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'candidate',   label: 'Candidate',   icon: 'person-outline' },
  { id: 'attachments', label: 'Attachments', icon: 'folder-open-outline' },
  { id: 'manage',      label: 'Manage',      icon: 'settings-outline' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name?: string) =>
  (name ?? '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

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

// ─── Candidate tab ────────────────────────────────────────────────────────────

const CandidateTab: React.FC<{ application: Application; c: any }> = ({
  application, c,
}) => {
  const name     = application.userInfo?.name ?? application.candidate?.name ?? 'Candidate';
  const email    = application.userInfo?.email ?? application.candidate?.email ?? '';
  const phone    = application.userInfo?.phone ?? application.candidate?.phone ?? '';
  const location = application.userInfo?.location ?? application.candidate?.location ?? '';
  const avatar   = application.candidate?.avatar;

  return (
    <View style={{ gap: 12 }}>
      {/* Hero */}
      <View style={[sec.heroCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={sec.heroLeft}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={sec.avatar} />
          ) : (
            <View style={[sec.avatarFallback, { backgroundColor: c.primary }]}>
              <Text style={sec.avatarInitials}>{getInitials(name)}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[sec.heroName, { color: c.text }]}>{name}</Text>
            <Text style={[sec.heroEmail, { color: c.textMuted }]}>{email}</Text>
          </View>
        </View>
        {application.userInfo?.bio ? (
          <Text style={[sec.heroBio, { color: c.textMuted }]} numberOfLines={3}>
            {application.userInfo.bio}
          </Text>
        ) : null}
      </View>

      {/* Contact info */}
      <SectionCard title="Contact Information" icon="call-outline" iconColor="#3B82F6" c={c}>
        {email    && <InfoRow icon="mail-outline"       label="Email"    value={email}    c={c} />}
        {phone    && <InfoRow icon="call-outline"       label="Phone"    value={phone}    c={c} />}
        {location && <InfoRow icon="location-outline"   label="Location" value={location} c={c} />}
        {application.contactInfo?.telegram && (
          <InfoRow icon="paper-plane-outline" label="Telegram" value={application.contactInfo.telegram} c={c} />
        )}
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
              <View key={i} style={[sec.chip, { backgroundColor: '#F59E0B15', borderColor: '#F59E0B40' }]}>
                <Text style={[sec.chipText, { color: '#D97706' }]}>{sk}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      )}

      {/* CVs */}
      {(application.selectedCVs ?? []).length > 0 && (
        <SectionCard
          title={`CVs Submitted (${application.selectedCVs.length})`}
          icon="document-outline"
          iconColor="#EF4444"
          c={c}
        >
          {application.selectedCVs.map((cv, i) => (
            <View
              key={i}
              style={[sec.fileRow, { backgroundColor: c.background, borderColor: c.border }]}
            >
              <Ionicons name="document-text" size={18} color="#EF4444" />
              <Text style={[sec.fileText, { color: c.text }]} numberOfLines={1}>
                {cv.originalName ?? cv.filename ?? 'CV Document'}
              </Text>
            </View>
          ))}
        </SectionCard>
      )}

      {/* Work experience */}
      {(application.workExperience ?? []).length > 0 && (
        <SectionCard
          title={`Work Experience (${application.workExperience.length})`}
          icon="briefcase-outline"
          iconColor="#0EA5E9"
          c={c}
        >
          {application.workExperience.map((exp, i) => (
            <View
              key={i}
              style={[sec.expCard, { backgroundColor: c.background, borderColor: c.border }]}
            >
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
                    {exp.position}{exp.company ? ` @ ${exp.company}` : ''}
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
                  {exp.skills?.length ? (
                    <View style={[sec.chipRow, { marginTop: 6 }]}>
                      {exp.skills.slice(0, 5).map((sk, j) => (
                        <View key={j} style={[sec.chip, { backgroundColor: '#0EA5E915', borderColor: '#0EA5E940' }]}>
                          <Text style={[sec.chipText, { color: '#0284C7' }]}>{sk}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </>
              )}
            </View>
          ))}
        </SectionCard>
      )}

      {/* References */}
      {(application.references ?? []).length > 0 && (
        <SectionCard
          title={`References (${application.references.length})`}
          icon="people-outline"
          iconColor="#8B5CF6"
          c={c}
        >
          {application.references.map((ref, i) => (
            <View
              key={i}
              style={[sec.expCard, { backgroundColor: c.background, borderColor: c.border }]}
            >
              {ref.providedAsDocument ? (
                <View style={sec.docRow}>
                  <Ionicons name="document-text" size={16} color="#8B5CF6" />
                  <Text style={[sec.expTitle, { color: c.text }]}>
                    {ref.document?.originalName ?? 'Reference Document'}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={[sec.expTitle, { color: c.text }]}>
                    {ref.name}{ref.position ? `, ${ref.position}` : ''}
                  </Text>
                  {ref.company && (
                    <Text style={[sec.expDates, { color: c.textMuted }]}>{ref.company}</Text>
                  )}
                  {ref.email && (
                    <Text style={[sec.expDesc, { color: c.textMuted }]}>{ref.email}</Text>
                  )}
                  {ref.phone && (
                    <Text style={[sec.expDesc, { color: c.textMuted }]}>{ref.phone}</Text>
                  )}
                  {ref.allowsContact && (
                    <View style={[sec.contactBadge, { backgroundColor: '#10B98115' }]}>
                      <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                      <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '600' }}>
                        Allows contact
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          ))}
        </SectionCard>
      )}

      {/* Applied date */}
      <Text style={[sec.appliedDate, { color: c.textMuted }]}>
        Applied on{' '}
        {new Date(application.createdAt).toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric',
        })}
      </Text>
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface CompanyApplicationDetailsProps {
  application: Application;
  colors: any;
  onUpdated?: (app: Application) => void;
}

export const CompanyApplicationDetails: React.FC<CompanyApplicationDetailsProps> = ({
  application,
  colors: c,
  onUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('candidate');

  const attachments = useMemo(() => buildAttachments(application), [application]);

  return (
    <View style={{ flex: 1 }}>
      {/* Tab bar */}
      <View style={[tb.bar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const count  = tab.id === 'attachments' ? attachments.length : undefined;
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
        {activeTab === 'candidate' && (
          <CandidateTab application={application} c={c} />
        )}
        {activeTab === 'attachments' && (
          <AttachmentsTab
            attachments={attachments}
            showDownloadAll={attachments.length > 1}
            colors={c}
          />
        )}
        {activeTab === 'manage' && (
          <StatusTab
            application={application}
            role="company"
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
  bar:       { flexDirection: 'row', borderBottomWidth: 1 },
  tab:       {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 12, paddingHorizontal: 4,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: {},
  label:     { fontSize: 11, fontWeight: '700' },
  badge:     {
    minWidth: 17, height: 17, borderRadius: 9, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  content:   { padding: 16, paddingBottom: 40 },
});

const sec = StyleSheet.create({
  card:           { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  iconBox:        { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  title:          { fontSize: 14, fontWeight: '700' },
  heroCard:       { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 0, gap: 10 },
  heroLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:         { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontSize: 20, fontWeight: '700' },
  heroName:       { fontSize: 17, fontWeight: '800' },
  heroEmail:      { fontSize: 12, marginTop: 2 },
  heroBio:        { fontSize: 13, lineHeight: 18 },
  infoRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoLabel:      { fontSize: 12, width: 60 },
  infoValue:      { fontSize: 13, fontWeight: '600', flex: 1 },
  body:           { fontSize: 13, lineHeight: 20 },
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:           { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  chipText:       { fontSize: 12, fontWeight: '600' },
  fileRow:        {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 8, borderRadius: 8, borderWidth: 1, marginBottom: 4,
  },
  fileText:       { fontSize: 13, flex: 1 },
  expCard:        { padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 6 },
  expTitle:       { fontSize: 13, fontWeight: '600' },
  expDates:       { fontSize: 11, marginTop: 2 },
  expDesc:        { fontSize: 12, marginTop: 4, lineHeight: 16 },
  docRow:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactBadge:   {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4, alignSelf: 'flex-start',
  },
  appliedDate:    { fontSize: 12, textAlign: 'center', marginTop: 8 },
});
