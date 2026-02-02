/* eslint-disable @typescript-eslint/no-explicit-any */
import { Avatar, AvatarFallback, AvatarImage } from "@/components/social/ui/Avatar";
import { profileService, CloudinaryImage, Profile, PublicProfile } from "@/services/profileService";
import { cn } from "@/lib/utils";
import VerificationBadge, {
    VerificationStatus,
    BadgeSize
} from "@/components/verifcation/VerificationBadge";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_MAP: Record<AvatarSize, string> = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-xl",
    "2xl": "w-24 h-24 text-2xl",
};

// Map AvatarSize to VerificationBadge size
const VERIFICATION_SIZE_MAP: Record<AvatarSize, BadgeSize> = {
    xs: "sm",
    sm: "sm",
    md: "sm",
    lg: "md",
    xl: "md",
    "2xl": "lg",
};

// Union type for all possible avatar sources
type AvatarSource =
    | CloudinaryImage
    | string
    | null
    | undefined
    | Profile
    | PublicProfile
    // Company/Organization objects
    | {
        logoUrl?: string;
        avatar?: CloudinaryImage | string | null;
        verificationStatus?: string;
        isVerified?: boolean;
        verified?: boolean;
        user?: {
            avatar?: string;
            verificationStatus?: string;
            _id?: string;
        };
        _id?: string;
    }
    // Profile-like objects with nested user
    | {
        avatar?: CloudinaryImage | string | null;
        user?: {
            avatar?: string;
            verificationStatus?: string;
            _id?: string;
        };
        verificationStatus?: string;
        isVerified?: boolean;
        verified?: boolean;
        _id?: string;
    };

interface EntityAvatarProps {
    /** Name for fallback initials and alt text */
    name: string;

    /** Avatar source - accepts multiple formats */
    avatar?: AvatarSource;

    /** Size of the avatar */
    size?: AvatarSize;

    /** Additional CSS classes */
    className?: string;

    /** Whether to show a border */
    bordered?: boolean;

    /** Verification status (overrides auto-detection) */
    verificationStatus?: VerificationStatus;

    /** Whether to show verification badge */
    showVerification?: boolean;

    /** Whether to show premium badge */
    showPremium?: boolean;

    /** Custom fallback component */
    fallback?: React.ReactNode;

    /** Custom image URL getter */
    getImageUrl?: (source: AvatarSource) => string | null;

    /** Whether the avatar is clickable */
    clickable?: boolean;

    /** Click handler */
    onClick?: () => void;

    /** User ID for auto-fetching verification (if not in avatar source) */
    userId?: string;

    /** Theme mode */
    themeMode?: 'light' | 'dark';

    /** Whether to show verification tooltip */
    showVerificationTooltip?: boolean;
}

// Helper function to extract avatar URL from any source using profileService
export const extractAvatarUrl = (source: AvatarSource): string | null => {
    if (!source) return null;

    console.log('🔍 EntityAvatar extracting URL from source:', {
        sourceType: typeof source,
        isString: typeof source === 'string',
        isObject: typeof source === 'object',
        sourceKeys: typeof source === 'object' ? Object.keys(source) : []
    });

    // 1. CloudinaryImage object (direct from profileService) - highest priority
    if (typeof source === 'object' && 'secure_url' in source) {
        console.log('✅ Using CloudinaryImage secure_url');
        return source.secure_url;
    }

    // 2. String URL (direct URL)
    if (typeof source === 'string') {
        console.log('📝 String URL detected:', source);

        // Check if it's a Cloudinary URL first
        if (profileService.isCloudinaryUrl(source)) {
            console.log('☁️ Cloudinary URL detected');
            return source;
        }

        // If it's a local upload URL, try to normalize it
        if (source.includes('/uploads/') || source.includes('/company/logos/') || source.includes('/organization/logos/')) {
            console.warn('⚠️ Local upload URL detected, attempting to normalize:', source);

            // Extract public ID from URL
            const publicId = profileService.extractPublicIdFromUrl(source) ||
                source.split('/').pop()?.replace(/\.[^/.]+$/, '');

            if (publicId) {
                // Generate Cloudinary URL using profileService
                const cloudinaryUrl = profileService.generateCloudinaryUrl(publicId, {
                    width: 150,
                    height: 150,
                    crop: 'fill',
                    quality: 'auto'
                });

                if (cloudinaryUrl) {
                    console.log('🔄 Converted local URL to Cloudinary:', cloudinaryUrl);
                    return cloudinaryUrl;
                }
            }
        }

        return source;
    }

    // 3. Full Profile object (from profileService.getProfile())
    if ('avatar' in source && source.avatar) {
        console.log('👤 Profile avatar detected');

        if (typeof source.avatar === 'object' && 'secure_url' in source.avatar) {
            return source.avatar.secure_url;
        }

        if (typeof source.avatar === 'string') {
            // Use profileService to get optimized URL
            return profileService.getOptimizedAvatarUrl(source.avatar, 'medium');
        }
    }

    // 4. Profile with user.avatar (nested user object)
    if ('user' in source && source.user?.avatar) {
        console.log('👥 User avatar detected in nested object');
        const userAvatar = source.user.avatar;

        if (typeof userAvatar === 'string') {
            return profileService.getOptimizedAvatarUrl(userAvatar, 'medium');
        }
    }

    // 5. Company/Organization with logoUrl (companies often use logoUrl)
    if ('logoUrl' in source && source.logoUrl) {
        console.log('🏢 Company/Organization logoUrl detected:', source.logoUrl);

        if (typeof source.logoUrl === 'string') {
            // Use profileService to handle URL
            if (profileService.isCloudinaryUrl(source.logoUrl)) {
                return profileService.getOptimizedAvatarUrl(source.logoUrl, 'medium');
            } else {
                // Try to extract and convert
                const publicId = profileService.extractPublicIdFromUrl(source.logoUrl) ||
                    source.logoUrl.split('/').pop()?.replace(/\.[^/.]+$/, '');

                if (publicId) {
                    const cloudinaryUrl = profileService.generateCloudinaryUrl(publicId, {
                        width: 150,
                        height: 150,
                        crop: 'fill',
                        quality: 'auto'
                    });

                    if (cloudinaryUrl) {
                        console.log('🔄 Converted logoUrl to Cloudinary:', cloudinaryUrl);
                        return cloudinaryUrl;
                    }
                }

                return source.logoUrl;
            }
        }
    }

    // 6. Direct avatar property on company/org object
    if ('avatar' in source && source.avatar) {
        console.log('📸 Direct avatar property on object');

        if (typeof source.avatar === 'object' && 'secure_url' in source.avatar) {
            return source.avatar.secure_url;
        }

        if (typeof source.avatar === 'string') {
            return profileService.getOptimizedAvatarUrl(source.avatar, 'medium');
        }
    }

    console.log('❌ No avatar URL found in source');
    return null;
};

// Helper function to extract verification status
export const extractVerificationStatus = (source: AvatarSource): VerificationStatus => {
    if (!source || typeof source !== 'object') return 'none';

    // Priority 1: Direct verification status prop (most common for profiles)
    if ('verificationStatus' in source) {
        const status = source.verificationStatus;
        if (status === 'verified' || status === 'full') return 'full';
        if (status === 'pending' || status === 'partial') return 'partial';
        if (status === 'rejected' || status === 'none') return 'none';
    }

    // Priority 2: Verified boolean (common for companies/organizations)
    if ('verified' in source && source.verified === true) {
        return 'full';
    }

    // Priority 3: isVerified boolean
    if ('isVerified' in source && source.isVerified === true) {
        return 'full';
    }

    // Priority 4: From nested user object (Profile structure)
    if ('user' in source && typeof source.user === 'object') {
        const user = source.user;
        if (user.verificationStatus === 'verified' || user.verificationStatus === 'full') return 'full';
        if (user.verificationStatus === 'pending' || user.verificationStatus === 'partial') return 'partial';
        if (user.verificationStatus === 'rejected' || user.verificationStatus === 'none') return 'none';
    }

    return 'none';
};

// Helper function to extract user ID for verification fetching
export const extractUserId = (source: AvatarSource): string | undefined => {
    if (!source || typeof source !== 'object') return undefined;

    // From Profile user object
    if ('user' in source && source.user?._id) {
        return source.user._id;
    }

    // From direct _id
    if ('_id' in source && source._id) {
        return source._id;
    }

    return undefined;
};

// Helper function to get premium status
export const extractPremiumStatus = (source: AvatarSource): boolean => {
    if (!source || typeof source !== 'object') return false;

    // From Profile
    if ('premium' in source && source.premium) {
        return source.premium.isPremium === true;
    }

    return false;
};

// Normalize any object to a consistent avatar source format
export const normalizeAvatarSource = (
    source: any,
    type?: 'profile' | 'company' | 'organization'
): AvatarSource => {
    if (!source) return null;

    console.log('🔄 Normalizing avatar source:', { source, type });

    // If it's already a string or CloudinaryImage, return as-is
    if (typeof source === 'string' || (typeof source === 'object' && 'secure_url' in source)) {
        return source;
    }

    const normalized: any = {};

    // Copy relevant properties based on type
    if (type === 'profile') {
        // For profile objects
        if (source.avatar) normalized.avatar = source.avatar;
        if (source.user?.avatar) {
            if (!normalized.user) normalized.user = {};
            normalized.user.avatar = source.user.avatar;
        }
        if (source.verificationStatus !== undefined) normalized.verificationStatus = source.verificationStatus;
        if (source.isVerified !== undefined) normalized.isVerified = source.isVerified;
        if (source.premium !== undefined) normalized.premium = source.premium;
        if (source.user?._id) {
            if (!normalized.user) normalized.user = {};
            normalized.user._id = source.user._id;
        }
        if (source.user?.verificationStatus) {
            if (!normalized.user) normalized.user = {};
            normalized.user.verificationStatus = source.user.verificationStatus;
        }
    } else if (type === 'company' || type === 'organization') {
        // For company/organization objects
        if (source.logoUrl) normalized.logoUrl = source.logoUrl;
        if (source.avatar) normalized.avatar = source.avatar;
        if (source.verified !== undefined) normalized.verified = source.verified;
        if (source.verificationStatus !== undefined) normalized.verificationStatus = source.verificationStatus;
        if (source.isVerified !== undefined) normalized.isVerified = source.isVerified;
        if (source._id) normalized._id = source._id;

        // Try to get Cloudinary URL if we have a local URL
        if (source.logoUrl && typeof source.logoUrl === 'string') {
            if (source.logoUrl.includes('/uploads/')) {
                // Extract and try to create Cloudinary URL
                const filename = source.logoUrl.split('/').pop();
                if (filename) {
                    const publicId = filename.replace(/\.[^/.]+$/, '');
                    normalized.logoUrl = profileService.generateCloudinaryUrl(publicId, {
                        width: 150,
                        height: 150,
                        crop: 'fill'
                    }) || source.logoUrl;
                }
            }
        }
    } else {
        // Auto-detect based on properties
        if (source.logoUrl) {
            // Likely a company/organization
            normalized.logoUrl = source.logoUrl;
            if (source.verified !== undefined) normalized.verified = source.verified;
        } else if (source.user || source.avatar) {
            // Likely a profile
            if (source.avatar) normalized.avatar = source.avatar;
            if (source.user) normalized.user = source.user;
            if (source.verificationStatus !== undefined) normalized.verificationStatus = source.verificationStatus;
        }

        // Copy common properties
        if (source.verificationStatus !== undefined) normalized.verificationStatus = source.verificationStatus;
        if (source.isVerified !== undefined) normalized.isVerified = source.isVerified;
        if (source.verified !== undefined) normalized.verified = source.verified;
        if (source._id) normalized._id = source._id;
    }

    console.log('✅ Normalized to:', normalized);
    return normalized;
};

export function EntityAvatar({
    name,
    avatar,
    size = "md",
    className,
    bordered = true,
    verificationStatus: propVerificationStatus,
    showVerification = true,
    showPremium = true,
    fallback,
    getImageUrl,
    clickable = false,
    onClick,
    userId: propUserId,
    themeMode = 'light',
    showVerificationTooltip = true,
}: EntityAvatarProps) {
    // Normalize the avatar source to handle different object structures
    const normalizedAvatar = avatar ? normalizeAvatarSource(avatar) : avatar;

    // Extract the avatar URL using the helper or custom getter
    const avatarUrl = getImageUrl ? getImageUrl(normalizedAvatar) : extractAvatarUrl(normalizedAvatar);

    // Extract verification status
    const autoVerificationStatus = extractVerificationStatus(normalizedAvatar);
    const verificationStatus = propVerificationStatus || autoVerificationStatus;

    // Extract user ID for verification fetching
    const autoUserId = extractUserId(normalizedAvatar);
    const userId = propUserId || autoUserId;

    // Extract premium status
    const isPremium = showPremium && extractPremiumStatus(normalizedAvatar);

    // Get initials for fallback
    const initials = profileService.getInitials(name);

    // Determine final image URL (with fallback to placeholder)
    // Always use profileService.getPlaceholderAvatar for consistency
    const finalAvatarUrl = avatarUrl || profileService.getPlaceholderAvatar(name);

    // Get verification badge size based on avatar size
    const verificationBadgeSize = VERIFICATION_SIZE_MAP[size];

    console.log('🎨 EntityAvatar rendering:', {
        name,
        hasAvatarUrl: !!avatarUrl,
        finalAvatarUrl,
        verificationStatus,
        userId,
        isPremium
    });

    return (
        <div className="relative inline-block group">
            {/* Avatar Container */}
            <Avatar
                className={cn(
                    "rounded-full overflow-hidden",
                    bordered && "border-2 border-white dark:border-gray-800 shadow-sm",
                    clickable && "cursor-pointer hover:opacity-90 transition-opacity",
                    SIZE_MAP[size],
                    className
                )}
                onClick={onClick}
            >
                <AvatarImage
                    src={finalAvatarUrl}
                    alt={`${name}'s avatar`}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                        console.error('❌ Avatar image failed to load:', finalAvatarUrl);
                        // Fallback to placeholder on error - always use profileService
                        e.currentTarget.src = profileService.getPlaceholderAvatar(name);
                    }}
                    onLoad={() => {
                        console.log('✅ Avatar image loaded successfully:', finalAvatarUrl);
                    }}
                />
                <AvatarFallback className="font-medium bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                    {fallback || initials}
                </AvatarFallback>
            </Avatar>

            {/* Premium Badge (shown only if not verified) */}
            {isPremium && verificationStatus !== 'full' && (
                <div
                    className={cn(
                        "absolute bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center",
                        size === 'xs' || size === 'sm' ? 'w-3 h-3' :
                            size === 'md' || size === 'lg' ? 'w-4 h-4' : 'w-5 h-5',
                        size === 'xs' || size === 'sm' ? '-bottom-0.5 -right-0.5' :
                            size === 'md' || size === 'lg' ? '-bottom-1 -right-1' : '-bottom-1.5 -right-1.5'
                    )}
                    title="Premium"
                    aria-label="Premium member"
                >
                    <svg className="w-2/3 h-2/3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </div>
            )}

            {/* Verification Badge */}
            {showVerification && verificationStatus !== 'none' && (
                <div
                    className={cn(
                        "absolute",
                        size === 'xs' || size === 'sm' ? '-bottom-1 -right-1' :
                            size === 'md' ? '-bottom-1.5 -right-1.5' :
                                size === 'lg' ? '-bottom-2 -right-2' :
                                    '-bottom-3 -right-3'
                    )}
                >
                    <VerificationBadge
                        status={verificationStatus}
                        size={verificationBadgeSize}
                        showText={false}
                        showTooltip={showVerificationTooltip}
                        userId={userId}
                        autoFetch={!propVerificationStatus && !!userId}
                        themeMode={themeMode}
                        className={cn(
                            "shadow-md",
                            size === 'xs' || size === 'sm' ? "scale-75" :
                                size === 'md' ? "scale-90" :
                                    size === 'lg' ? "scale-100" :
                                        "scale-110"
                        )}
                    />
                </div>
            )}
        </div>
    );
}

// Pre-configured variants for common use cases
EntityAvatar.User = function UserAvatar(props: Omit<EntityAvatarProps, 'avatar'> & { user?: any }) {
    const normalizedAvatar = props.user ? normalizeAvatarSource(props.user, 'profile') : undefined;

    return (
        <EntityAvatar
            {...props}
            avatar={normalizedAvatar}
            name={props.name || props.user?.name || 'User'}
            userId={props.userId || props.user?._id || props.user?.user?._id}
        />
    );
};

EntityAvatar.Company = function CompanyAvatar(props: Omit<EntityAvatarProps, 'avatar'> & { company?: any }) {
    const normalizedAvatar = props.company ? normalizeAvatarSource(props.company, 'company') : undefined;

    return (
        <EntityAvatar
            {...props}
            avatar={normalizedAvatar}
            name={props.name || props.company?.name || 'Company'}
            userId={props.userId || props.company?.userId || props.company?._id}
            verificationStatus={props.verificationStatus || (props.company?.verified ? 'full' : 'none')}
        />
    );
};

EntityAvatar.Organization = function OrganizationAvatar(props: Omit<EntityAvatarProps, 'avatar'> & { organization?: any }) {
    const normalizedAvatar = props.organization ? normalizeAvatarSource(props.organization, 'organization') : undefined;

    return (
        <EntityAvatar
            {...props}
            avatar={normalizedAvatar}
            name={props.name || props.organization?.name || 'Organization'}
            userId={props.userId || props.organization?.userId || props.organization?._id}
            verificationStatus={props.verificationStatus || (props.organization?.verified ? 'full' : 'none')}
        />
    );
};

EntityAvatar.Profile = function ProfileAvatar(props: Omit<EntityAvatarProps, 'avatar'> & { profile?: Profile | PublicProfile }) {
    const normalizedAvatar = props.profile ? normalizeAvatarSource(props.profile, 'profile') : undefined;

    return (
        <EntityAvatar
            {...props}
            avatar={normalizedAvatar}
            name={props.name || props.profile?.user?.name || 'Profile'}
            userId={props.userId || props.profile?.user?._id}
        />
    );
};

// Utility function to use in any component
export const getEntityAvatarProps = (
    entity: any,
    options?: {
        name?: string;
        size?: AvatarSize;
        showVerification?: boolean;
        showPremium?: boolean;
        verificationStatus?: VerificationStatus;
        themeMode?: 'light' | 'dark';
    }
): Omit<EntityAvatarProps, 'className' | 'onClick' | 'clickable'> => {
    // Auto-detect entity type based on properties
    let entityType: 'profile' | 'company' | 'organization' | undefined;

    if (entity?.user || entity?.avatar?.secure_url) {
        entityType = 'profile';
    } else if (entity?.logoUrl || entity?.companyType) {
        entityType = 'company';
    } else if (entity?.organizationType) {
        entityType = 'organization';
    }

    const normalizedEntity = normalizeAvatarSource(entity, entityType);

    return {
        name: options?.name || entity?.name || entity?.user?.name || 'Unknown',
        avatar: normalizedEntity,
        size: options?.size || 'md',
        showVerification: options?.showVerification ?? true,
        showPremium: options?.showPremium ?? true,
        verificationStatus: options?.verificationStatus,
        themeMode: options?.themeMode || 'light',
        userId: entity?.user?._id || entity?._id,
    };
};

// Quick component for inline usage
export const InlineEntityAvatar: React.FC<Omit<EntityAvatarProps, 'size'> & {
    showName?: boolean;
    namePosition?: 'right' | 'bottom';
}> = ({ showName = true, namePosition = 'right', ...props }) => {
    return (
        <div className={`inline-flex items-center ${namePosition === 'bottom' ? 'flex-col' : 'gap-2'}`}>
            <EntityAvatar {...props} size="sm" />
            {showName && (
                <span className={`text-sm font-medium ${namePosition === 'bottom' ? 'mt-1' : ''}`}>
                    {props.name}
                </span>
            )}
        </div>
    );
};