import React, { useState, useEffect } from 'react';
import { Card } from '@/components/social/ui/Card';
import { profileService, Profile, Language } from '@/services/profileService';
import {
  Award,
  Globe,
  Code,
  Building,
  Calendar,
  Users,
  Target,
  Heart,
  Briefcase,
  Star,
  GlobeIcon,
  Sparkles
} from 'lucide-react';
import { colorClasses } from '@/utils/color';
import { Skeleton } from '../ui/Skeleton';

interface ProfileAboutSectionProps {
  profile: Profile;
  isLoading?: boolean;
}

export const ProfileAboutSection: React.FC<ProfileAboutSectionProps> = ({
  profile,
  isLoading = false,
}) => {
  // Safely destructure with defaults
  const { roleSpecific = {
    skills: [],
    education: [],
    experience: [],
    certifications: [],
    portfolio: [],
    companyInfo: undefined
  }, user = {
    _id: '',
    name: 'User',
    email: '',
    role: 'candidate',
    isActive: false,
    verificationStatus: 'pending'
  }, languages = [], interests = [], bio, website } = profile || {};
  
  const [optimizedLanguages, setOptimizedLanguages] = useState<Language[]>([]);
  
  // Calculate experience years once with safe defaults
  const experienceYears = roleSpecific?.experience ? 
    profileService.getExperienceYears(roleSpecific.experience) : 0;

  // Format website URL with safe check
  const formattedWebsite = website ? profileService.formatSocialLink('website', website) : '';
  const displayWebsite = website?.replace(/^https?:\/\//, '');

  // Role-specific icon and color mapping with fallback
  const roleConfig = {
    candidate: {
      icon: Briefcase,
      primaryColor: 'blue',
      secondaryColor: 'teal'
    },
    freelancer: {
      icon: Sparkles,
      primaryColor: 'purple',
      secondaryColor: 'pink'
    },
    company: {
      icon: Building,
      primaryColor: 'darkNavy',
      secondaryColor: 'blue'
    },
    organization: {
      icon: Users,
      primaryColor: 'green',
      secondaryColor: 'teal'
    },
    admin: {
      icon: Star,
      primaryColor: 'gold',
      secondaryColor: 'goldenMustard'
    },
    default: {
      icon: Briefcase,
      primaryColor: 'blue',
      secondaryColor: 'teal'
    }
  };

  const currentRole = user?.role ? roleConfig[user.role as keyof typeof roleConfig] || roleConfig.default : roleConfig.default;
  const RoleIcon = currentRole.icon;

  // Safe function to get missing fields - FIXED VERSION
  const getMissingFieldsSafe = (): string[] => {
    if (!profile) return [];
    
    try {
      // Create a safe profile object with all required properties
      const safeProfile = {
        ...profile,
        avatar: profile.avatar || null,
        user: profile.user || {
          _id: '',
          name: '',
          email: '',
          role: 'candidate',
          isActive: false,
          verificationStatus: 'pending'
        },
        socialLinks: profile.socialLinks || {},
        roleSpecific: profile.roleSpecific || {
          skills: [],
          education: [],
          experience: [],
          certifications: [],
          portfolio: [],
          companyInfo: undefined
        },
        headline: profile.headline || '',
        bio: profile.bio || '',
        location: profile.location || ''
      };
      
      return profileService.getMissingFields(safeProfile);
    } catch (error) {
      console.error('Error getting missing fields:', error);
      return [];
    }
  };

  const missingFields = getMissingFieldsSafe();

  // Safe calculation of profile strength
  const calculateProfileStrengthSafe = (): number => {
    if (!profile) return 0;
    
    try {
      return profileService.calculateProfileStrength(profile);
    } catch (error) {
      console.error('Error calculating profile strength:', error);
      return 0;
    }
  };

  // Safe getter for display role
  const getDisplayRoleSafe = (): string => {
    if (!user?.role) return 'User';
    
    try {
      return profileService.getDisplayRole(user.role);
    } catch (error) {
      console.error('Error getting display role:', error);
      return user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }
  };

  // Loading state skeleton
  if (isLoading || !profile) {
    return (
      <Card className={`${colorClasses.bg.white} ${colorClasses.border.gray400} rounded-2xl p-6`}>
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <Skeleton className="h-8 w-32" />
        </div>
        
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </Card>
    );
  }

  // Safely get profile properties
  const safeProfile = {
    skills: roleSpecific?.skills || [],
    experience: roleSpecific?.experience || [],
    portfolio: roleSpecific?.portfolio || [],
    companyInfo: roleSpecific?.companyInfo || {},
    certifications: roleSpecific?.certifications || []
  };

  const renderRoleSpecificInfo = () => {
    const role = user?.role || 'candidate';

    switch (role) {
      case 'candidate':
        return (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Skills Card */}
            <div className={`${colorClasses.bg.white} rounded-xl p-6 ${colorClasses.border.gray400} transition-all duration-200 hover:shadow-lg`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`p-2.5 rounded-lg ${colorClasses.bg.blue} ${colorClasses.text.white}`}>
                  <Code className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-lg">Skills & Expertise</h4>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {safeProfile.skills.length > 0 ? (
                  safeProfile.skills.slice(0, 8).map((skill, index) => (
                    <span
                      key={index}
                      className={`px-3.5 py-2 ${colorClasses.bg.gray100} ${colorClasses.text.gray800} rounded-lg text-sm ${colorClasses.border.gray400} hover:${colorClasses.border.blue} transition-colors duration-200`}
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className={`${colorClasses.text.gray400} italic`}>No skills added yet</p>
                )}
                {safeProfile.skills.length > 8 && (
                  <span className={`px-3.5 py-2 ${colorClasses.bg.gray100} ${colorClasses.text.gray400} rounded-lg text-sm`}>
                    +{safeProfile.skills.length - 8} more
                  </span>
                )}
              </div>
            </div>

            {/* Experience Card */}
            <div className={`${colorClasses.bg.white} rounded-xl p-6 ${colorClasses.border.gray400} transition-all duration-200 hover:shadow-lg`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`p-2.5 rounded-lg ${colorClasses.bg.darkNavy} ${colorClasses.text.white}`}>
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-lg">Professional Experience</h4>
              </div>
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <span className={`text-4xl font-bold ${colorClasses.text.darkNavy}`}>
                    {safeProfile.experience.length}
                  </span>
                  <span className={`text-lg ${colorClasses.text.gray400} mb-1`}>
                    position{safeProfile.experience.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className={`text-sm ${colorClasses.text.gray600}`}>
                  <span className="font-medium">{experienceYears} years</span> of professional experience
                </div>
              </div>
            </div>
          </div>
        );

      case 'freelancer':
        return (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Skills Card */}
            <div className={`${colorClasses.bg.white} rounded-xl p-6 ${colorClasses.border.gray400} transition-all duration-200 hover:shadow-lg`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`p-2.5 rounded-lg ${colorClasses.bg.darkNavy} ${colorClasses.text.white}`}>
                  <Code className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-lg">Technical Skills</h4>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {safeProfile.skills.length > 0 ? (
                  safeProfile.skills.slice(0, 6).map((skill, index) => (
                    <span
                      key={index}
                      className={`px-3.5 py-2 ${colorClasses.bg.gray100} ${colorClasses.text.gray800} rounded-lg text-sm ${colorClasses.border.gray400} hover:${colorClasses.border.darkNavy} transition-colors duration-200`}
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className={`${colorClasses.text.gray400} italic`}>No skills added yet</p>
                )}
              </div>
            </div>

            {/* Portfolio Card */}
            <div className={`${colorClasses.bg.white} rounded-xl p-6 ${colorClasses.border.gray400} transition-all duration-200 hover:shadow-lg`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`p-2.5 rounded-lg ${colorClasses.bg.orange} ${colorClasses.text.white}`}>
                  <Target className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-lg">Portfolio</h4>
              </div>
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <span className={`text-4xl font-bold ${colorClasses.text.darkNavy}`}>
                    {safeProfile.portfolio.length}
                  </span>
                  <span className={`text-lg ${colorClasses.text.gray400} mb-1`}>
                    project{safeProfile.portfolio.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className={`text-sm ${colorClasses.text.gray600}`}>
                  {safeProfile.portfolio.length > 0 ? 'Successfully delivered' : 'No projects added yet'}
                </div>
              </div>
            </div>
          </div>
        );

      case 'company':
      case 'organization':
        const companyInfo = safeProfile.companyInfo;
        return (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Industry */}
            {companyInfo?.industry && (
              <div className={`${colorClasses.bg.white} rounded-xl p-6 ${colorClasses.border.gray400} transition-all duration-200 hover:shadow-lg`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-lg ${colorClasses.bg.darkNavy} ${colorClasses.text.white}`}>
                    <Building className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold">Industry</h4>
                </div>
                <p className={`font-medium ${colorClasses.text.gray800}`}>{companyInfo.industry}</p>
              </div>
            )}

            {/* Founded Year */}
            {companyInfo?.foundedYear && (
              <div className={`${colorClasses.bg.white} rounded-xl p-6 ${colorClasses.border.gray400} transition-all duration-200 hover:shadow-lg`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-lg ${colorClasses.bg.blue} ${colorClasses.text.white}`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold">Founded</h4>
                </div>
                <p className={`font-medium ${colorClasses.text.gray800}`}>{companyInfo.foundedYear}</p>
              </div>
            )}

            {/* Team Size */}
            {companyInfo?.size && (
              <div className={`${colorClasses.bg.white} rounded-xl p-6 ${colorClasses.border.gray400} transition-all duration-200 hover:shadow-lg`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-lg ${colorClasses.bg.green} ${colorClasses.text.white}`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold">Team Size</h4>
                </div>
                <p className={`font-medium ${colorClasses.text.gray800}`}>
                  {companyInfo.size === '1000+' ? '1000+' : companyInfo.size} 
                  <span className={`${colorClasses.text.gray400} font-normal ml-1`}>employees</span>
                </p>
              </div>
            )}

            {/* Company Type */}
            {companyInfo?.companyType && (
              <div className={`${colorClasses.bg.white} rounded-xl p-6 ${colorClasses.border.gray400} transition-all duration-200 hover:shadow-lg`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-lg ${colorClasses.bg.teal} ${colorClasses.text.white}`}>
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold">Company Type</h4>
                </div>
                <p className={`font-medium ${colorClasses.text.gray800}`}>
                  {companyInfo.companyType?.replace(/-/g, ' ') || ''}
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Format proficiency for display with safe fallback
  const formatProficiency = (proficiency: string): string => {
    try {
      return profileService.getProficiencyLabel(proficiency);
    } catch (error) {
      console.error('Error formatting proficiency:', error);
      return proficiency.charAt(0).toUpperCase() + proficiency.slice(1);
    }
  };

  // Safe getter for primary color class
  const getPrimaryColorClass = (): string => {
    try {
      return colorClasses.bg[currentRole.primaryColor as keyof typeof colorClasses.bg] || colorClasses.bg.blue;
    } catch (error) {
      return colorClasses.bg.blue;
    }
  };

  return (
    <Card 
      className={`${colorClasses.bg.white} ${colorClasses.border.gray400} rounded-2xl p-6 md:p-8 transition-all duration-300`}
      aria-label="Profile About Section"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`p-3 rounded-xl ${getPrimaryColorClass()} ${colorClasses.text.white}`}>
          <RoleIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className={`text-2xl font-bold ${colorClasses.text.darkNavy}`}>
            About {user?.name || 'User'}
          </h2>
          <p className={`${colorClasses.text.gray600} mt-1`}>
            {getDisplayRoleSafe()} • Profile Strength: {calculateProfileStrengthSafe()}%
          </p>
        </div>
      </div>

      {/* Bio Section */}
      {bio && (
        <div 
          className={`mb-8 ${colorClasses.bg.gray100} rounded-xl p-6 ${colorClasses.border.gray400}`}
          aria-labelledby="bio-heading"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-lg ${colorClasses.bg.goldenMustard} ${colorClasses.text.white}`}>
              <Heart className="w-5 h-5" />
            </div>
            <h3 id="bio-heading" className={`font-semibold text-lg ${colorClasses.text.darkNavy}`}>
              Bio
            </h3>
          </div>
          <p className={`${colorClasses.text.gray700} whitespace-pre-line leading-relaxed`}>
            {bio}
          </p>
        </div>
      )}

      {/* Role-Specific Information */}
      <div className="mb-8" aria-label="Professional Information">
        <h3 className={`font-semibold text-lg ${colorClasses.text.darkNavy} mb-6`}>
          Professional Information
        </h3>
        {renderRoleSpecificInfo()}
      </div>

      {/* Languages & Interests Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Languages */}
        {languages && languages.length > 0 && (
          <div 
            className={`${colorClasses.bg.white} rounded-xl p-6 ${colorClasses.border.gray400} transition-all duration-200 hover:shadow-lg`}
            aria-labelledby="languages-heading"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2.5 rounded-lg ${colorClasses.bg.teal} ${colorClasses.text.white}`}>
                <GlobeIcon className="w-5 h-5" />
              </div>
              <h3 id="languages-heading" className={`font-semibold text-lg ${colorClasses.text.darkNavy}`}>
                Languages
              </h3>
            </div>
            <div className="space-y-4">
              {languages.map((lang, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  role="listitem"
                  tabIndex={0}
                  aria-label={`${lang.language}, ${formatProficiency(lang.proficiency)} proficiency`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${colorClasses.bg.blue} flex items-center justify-center`}>
                      <span className="text-lg" aria-hidden="true">🌐</span>
                    </div>
                    <span className={`font-medium ${colorClasses.text.gray800}`}>
                      {lang.language}
                    </span>
                  </div>
                  <span className={`px-3 py-1 text-sm ${getPrimaryColorClass()} ${colorClasses.text.white} rounded-full`}>
                    {formatProficiency(lang.proficiency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {interests && interests.length > 0 && (
          <div 
            className={`${colorClasses.bg.white} rounded-xl p-6 ${colorClasses.border.gray400} transition-all duration-200 hover:shadow-lg`}
            aria-labelledby="interests-heading"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2.5 rounded-lg ${colorClasses.bg.teal} ${colorClasses.text.white}`}>
                <Heart className="w-5 h-5" />
              </div>
              <h3 id="interests-heading" className={`font-semibold text-lg ${colorClasses.text.darkNavy}`}>
                Interests
              </h3>
            </div>
            <div className="flex flex-wrap gap-2.5" role="list">
              {interests.map((interest, index) => (
                <span
                  key={index}
                  className={`px-3.5 py-2 ${colorClasses.bg.gray100} ${colorClasses.text.gray800} rounded-lg text-sm ${colorClasses.border.gray400} hover:${colorClasses.border.darkNavy} transition-colors duration-200`}
                  role="listitem"
                  tabIndex={0}
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Website Link */}
      {website && (
        <div className="mt-8 pt-8 border-t border-gray-300" aria-label="Website link">
          <a
            href={formattedWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex items-center gap-4 ${colorClasses.bg.white} hover:${colorClasses.bg.gray100} rounded-xl p-4 ${colorClasses.border.gray400} hover:${colorClasses.border.blue} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
            aria-label={`Visit ${displayWebsite}`}
          >
            <div className={`p-2.5 rounded-lg ${colorClasses.bg.blue} ${colorClasses.text.white} group-hover:scale-105 transition-transform duration-200 group-focus:ring-2 group-focus:ring-blue-500`}>
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className={`font-medium ${colorClasses.text.gray800} group-hover:${colorClasses.text.blue} transition-colors`}>
                Website
              </div>
              <div className={`text-sm ${colorClasses.text.gray600} group-hover:${colorClasses.text.blue} transition-colors`}>
                {displayWebsite}
              </div>
            </div>
            <span className="ml-auto text-sm text-gray-400 group-hover:text-blue-500 transition-colors" aria-hidden="true">
              ↗
            </span>
          </a>
        </div>
      )}

      {/* Missing Fields Notification (Optional) */}
      {missingFields.length > 0 && (
        <div className={`mt-6 p-4 rounded-lg ${colorClasses.bg.gray100} ${colorClasses.border.gray400} border`}>
          <p className={`text-sm ${colorClasses.text.gray600}`}>
            <span className="font-medium">Complete your profile:</span> Add {missingFields.slice(0, 3).join(', ')}
            {missingFields.length > 3 ? ' and more' : ''}
          </p>
        </div>
      )}
    </Card>
  );
};