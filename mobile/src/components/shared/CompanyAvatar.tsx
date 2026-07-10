/**
 * src/components/shared/CompanyAvatar.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Drop-in reusable company/organization avatar component.
 * 
 * DEBUG MODE ENABLED — set DEBUG_ENABLED = false to disable
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Avatar, { AvatarEntity } from './Avatar';
import { 
  resolveLogoUrl, 
  jobToCompanyPreview, 
  applicationToCompanyPreview,
  CompanyPreview,
  OwnerType 
} from '../../models/companyPreview';
import type { Job } from '../../services/jobService';
import type { Application } from '../../services/applicationService';

// ═══════════════════════════════════════════════════════════════════════════════
// DEBUG CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════
const DEBUG_ENABLED = __DEV__ && true;

const LOG_PREFIX = '🔍 [CompanyAvatar]';
const debugLog = (message: string, data?: any) => {
  if (!DEBUG_ENABLED) return;
  console.log(`${LOG_PREFIX} ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

// ─── Props ────────────────────────────────────────────────────────────────────

type CompanyAvatarProps = {
  size?: number;
  borderRadius?: number;
  style?: any;
  verified?: boolean;
  showDebug?: boolean;
} & (
  | { job: Job; application?: never; owner?: never; preview?: never }
  | { application: Application; job?: never; owner?: never; preview?: never }
  | { owner: Record<string, any>; type: OwnerType; job?: never; application?: never; preview?: never }
  | { preview: CompanyPreview; job?: never; application?: never; owner?: never; type?: never }
);

// ─── Component ───────────────────────────────────────────────────────────────

const CompanyAvatarComponent: React.FC<CompanyAvatarProps> = ({
  size = 48,
  borderRadius,
  style,
  verified: verifiedOverride,
  showDebug = DEBUG_ENABLED,
  ...props
}) => {
  const preview = useMemo<CompanyPreview>(() => {
    let result: CompanyPreview;

    if ('job' in props && props.job) {
      debugLog('Resolving from JOB');
      result = jobToCompanyPreview(props.job);
    } else if ('application' in props && props.application) {
      debugLog('Resolving from APPLICATION');
      result = applicationToCompanyPreview(props.application);
    } else if ('preview' in props && props.preview) {
      debugLog('Resolving from PREVIEW object');
      result = props.preview;
    } else if ('owner' in props && props.owner) {
      debugLog('Resolving from OWNER object');
      result = toCompanyPreviewFromOwner(props.owner, props.type);
    } else {
      debugLog('⚠️ No valid source — using fallback');
      result = { type: 'company', name: 'Company' };
    }

    debugLog('✅ FINAL RESOLVED PREVIEW:', {
      type: result.type,
      name: result.name,
      logoUrl: result.logoUrl ? `${result.logoUrl.substring(0, 80)}...` : 'NONE',
      hasLogoUrl: !!result.logoUrl,
      verified: result.verified,
    });

    return result;
  }, [props]);

  const entity: AvatarEntity = useMemo(() => {
    return {
      type: preview.type as 'company' | 'organization',
      name: preview.name,
      logoUrl: preview.logoUrl,
      logo: preview.logoUrl,
      verified: verifiedOverride ?? preview.verified,
    };
  }, [preview, verifiedOverride]);

  return (
    <View style={[{ position: 'relative' }, style]}>
      <Avatar
        entity={entity}
        size={size}
        borderRadius={borderRadius}
        verified={verifiedOverride ?? preview.verified}
      />
      {showDebug && (
        <View style={debugStyles.badge}>
          <Text style={debugStyles.text}>
            {preview.logoUrl ? '✓' : '✗'}
          </Text>
        </View>
      )}
    </View>
  );
};

// Helper for owner prop
function toCompanyPreviewFromOwner(owner: Record<string, any>, type: OwnerType): CompanyPreview {
  const resolvedUrl = resolveLogoUrl(owner);
  return {
    _id: owner._id?.toString(),
    type,
    name: owner.name ?? (type === 'organization' ? 'Organization' : 'Company'),
    logoUrl: resolvedUrl,
    avatarUrl: resolvedUrl,
    avatarPublicId: owner.avatarPublicId,
    verified: owner.verified ?? false,
    industry: owner.industry ?? owner.organizationType,
    website: owner.website,
  };
}

CompanyAvatarComponent.displayName = 'CompanyAvatar';

const debugStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS — THIS IS WHAT THE OTHER FILES IMPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const CompanyAvatar = CompanyAvatarComponent;
export default CompanyAvatar;

// Re-export utilities for convenience
export { resolveLogoUrl, jobToCompanyPreview, applicationToCompanyPreview };
export type { CompanyPreview, OwnerType };