// src/components/proposals/ProposalAttachmentList.tsx
// Banana Mobile App — Module 6B: Proposals
// Renders a list of proposal attachments with file type icons and optional delete.
// REFACTORED: Ionicons replace all emoji icons. useTheme() + withAlpha(). No hardcoded hex.

import React, { memo, useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ViewStyle, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import type { ProposalAttachment } from '../../types/proposal';

interface ProposalAttachmentListProps {
  attachments: ProposalAttachment[];
  canDelete?: boolean;
  onDelete?: (attachmentId: string) => Promise<void> | void;
  style?: ViewStyle;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type FileIconName = keyof typeof Ionicons.glyphMap;

function getFileIconName(mimetype: string, fileName: string): FileIconName {
  if (mimetype === 'application/pdf' || fileName.endsWith('.pdf'))
    return 'document-text-outline';
  if (
    mimetype === 'application/msword' ||
    mimetype.includes('wordprocessing') ||
    fileName.endsWith('.doc') ||
    fileName.endsWith('.docx')
  )
    return 'document-outline';
  if (mimetype.startsWith('image/'))
    return 'image-outline';
  if (mimetype.includes('zip') || mimetype.includes('compressed') || fileName.endsWith('.zip'))
    return 'archive-outline';
  if (mimetype === 'text/plain' || fileName.endsWith('.txt'))
    return 'reader-outline';
  return 'attach-outline';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const TYPE_LABELS: Record<string, string> = {
  cv:        'CV / Resume',
  portfolio: 'Portfolio',
  sample:    'Work Sample',
  other:     'Document',
};

// ─── AttachmentItem ───────────────────────────────────────────────────────────

interface AttachmentItemProps {
  attachment: ProposalAttachment;
  canDelete: boolean;
  onDelete?: (id: string) => Promise<void> | void;
}

const AttachmentItem: React.FC<AttachmentItemProps> = memo(({ attachment, canDelete, onDelete }) => {
  const { colors: c, radius, type } = useTheme();
  const [deleting, setDeleting] = useState(false);
  const styles = useMemo(() => makeItemStyles(c, radius), [c, radius]);

  const iconName = getFileIconName(attachment.mimetype, attachment.originalName);
  const typeLabel = TYPE_LABELS[attachment.attachmentType] ?? 'Document';

  const handleDelete = () =>
    Alert.alert('Remove Attachment', `Remove "${attachment.originalName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try { await onDelete?.(attachment._id); }
          finally { setDeleting(false); }
        },
      },
    ]);

  const handleOpen = () => {
    if (attachment.url) {
      Linking.openURL(attachment.url).catch(() =>
        Alert.alert('Cannot open file', 'The file URL could not be opened.'),
      );
    }
  };

  return (
    <TouchableOpacity onPress={handleOpen} activeOpacity={0.75} style={styles.item}>
      <View style={styles.iconBox}>
        <Ionicons name={iconName} size={18} color={c.primary} />
      </View>

      <View style={styles.info}>
        <Text style={[type.bodySm, { color: c.text, fontWeight: '600' }]} numberOfLines={1}>
          {attachment.originalName}
        </Text>
        <Text style={[type.caption, { color: c.textMuted, marginTop: 1 }]}>
          {typeLabel} · {formatBytes(attachment.size)}
        </Text>
      </View>

      {canDelete && onDelete && (
        <TouchableOpacity
          onPress={handleDelete}
          disabled={deleting}
          style={styles.deleteBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${attachment.originalName}`}
        >
          {deleting
            ? <ActivityIndicator size="small" color={c.danger} />
            : <Ionicons name="trash-outline" size={16} color={c.danger} />}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
});

AttachmentItem.displayName = 'AttachmentItem';

// ─── List ─────────────────────────────────────────────────────────────────────

const ProposalAttachmentList: React.FC<ProposalAttachmentListProps> = memo(({
  attachments, canDelete = false, onDelete, style,
}) => {
  if (!attachments?.length) return null;

  return (
    <View style={[styles.container, style]}>
      {attachments.map(att => (
        <AttachmentItem
          key={att._id}
          attachment={att}
          canDelete={canDelete}
          onDelete={onDelete}
        />
      ))}
    </View>
  );
});

ProposalAttachmentList.displayName = 'ProposalAttachmentList';

const styles = StyleSheet.create({ container: { gap: 8 } });

const makeItemStyles = (c: any, radius: any) =>
  StyleSheet.create({
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface ?? c.bgCard,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 10,
    },
    iconBox: {
      width: 36, height: 36,
      borderRadius: radius.sm,
      backgroundColor: withAlpha(c.primary, 0.10),
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    info: { flex: 1, gap: 2 },
    deleteBtn: {
      width: 36, height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
  });

export { ProposalAttachmentList };
export default ProposalAttachmentList;