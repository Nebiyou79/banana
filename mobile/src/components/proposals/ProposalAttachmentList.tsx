// src/components/proposals/ProposalAttachmentList.tsx
// Banana Mobile App — Module 6B: Proposals
// Renders a list of proposal attachments with file type icons and optional delete.

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ViewStyle,
  Linking,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import type { ProposalAttachment } from '../../types/proposal';

interface ProposalAttachmentListProps {
  attachments: ProposalAttachment[];
  canDelete?: boolean;
  onDelete?: (attachmentId: string) => Promise<void> | void;
  style?: ViewStyle;
}

function getFileIcon(mimetype: string, fileName: string): string {
  if (mimetype === 'application/pdf' || fileName.endsWith('.pdf')) return '📄';
  if (
    mimetype === 'application/msword' ||
    mimetype.includes('wordprocessing') ||
    fileName.endsWith('.doc') ||
    fileName.endsWith('.docx')
  )
    return '📝';
  if (mimetype.startsWith('image/')) return '🖼️';
  if (mimetype.includes('zip') || mimetype.includes('compressed') || fileName.endsWith('.zip'))
    return '🗜️';
  if (mimetype === 'text/plain' || fileName.endsWith('.txt')) return '📃';
  return '📎';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getTypeLabel(type: ProposalAttachment['attachmentType']): string {
  const labels: Record<string, string> = {
    cv: 'CV / Resume',
    portfolio: 'Portfolio',
    sample: 'Work Sample',
    other: 'Document',
  };
  return labels[type] ?? 'Document';
}

interface AttachmentItemProps {
  attachment: ProposalAttachment;
  canDelete: boolean;
  onDelete?: (id: string) => Promise<void> | void;
}

const AttachmentItem: React.FC<AttachmentItemProps> = ({
  attachment,
  canDelete,
  onDelete,
}) => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Remove Attachment',
      `Remove "${attachment.originalName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await onDelete?.(attachment._id);
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleOpen = () => {
    if (attachment.url) {
      Linking.openURL(attachment.url).catch(() => {
        Alert.alert('Cannot open file', 'The file URL could not be opened.');
      });
    }
  };

  const icon = getFileIcon(attachment.mimetype, attachment.originalName);

  return (
    <TouchableOpacity
      onPress={handleOpen}
      activeOpacity={0.7}
      style={[
        styles.item,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.fileIcon}>{icon}</Text>
      </View>

      <View style={styles.fileInfo}>
        <Text
          style={[styles.fileName, { color: colors.text }]}
          numberOfLines={1}
        >
          {attachment.originalName}
        </Text>
        <Text style={[styles.fileMeta, { color: colors.textMuted }]}>
          {getTypeLabel(attachment.attachmentType)} • {formatBytes(attachment.size)}
        </Text>
      </View>

      {canDelete && onDelete && (
        <TouchableOpacity
          onPress={handleDelete}
          disabled={deleting}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Text style={styles.deleteIcon}>🗑️</Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export const ProposalAttachmentList: React.FC<ProposalAttachmentListProps> = ({
  attachments,
  canDelete = false,
  onDelete,
  style,
}) => {
  const { theme } = useThemeStore();
  const { colors } = theme;

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {attachments.map((att) => (
        <AttachmentItem
          key={att._id}
          attachment={att}
          canDelete={canDelete}
          onDelete={onDelete}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(241,187,3,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fileIcon: {
    fontSize: 18,
  },
  fileInfo: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
  },
  fileMeta: {
    fontSize: 11,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deleteIcon: {
    fontSize: 15,
  },
});

export default ProposalAttachmentList;
