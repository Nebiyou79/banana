// components/freelancer/ProfileCompletion.tsx
'use client';

import React from 'react';
import { colorClasses, getTheme, ThemeMode } from '@/utils/color';
import { UserProfile } from '@/services/freelancerService';

interface ProfileCompletionProps {
  profile: UserProfile;
  showActions?: boolean;
  onImprove?: () => void;
  themeMode?: ThemeMode;
}

const ProfileCompletion: React.FC<ProfileCompletionProps> = ({
  profile,
  showActions = false,
  onImprove,
  themeMode = 'light'
}) => {
  const theme = getTheme(themeMode);

  // Always use the backend-calculated score for consistency
  const completionScore = profile.freelancerProfile?.profileCompletion || 0;

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-amber-500 to-amber-600';
    if (score >= 40) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const getStatusInfo = (score: number) => {
    if (score >= 90) return { status: 'Excellent', description: 'Your profile is fully optimized', icon: '🎉' };
    if (score >= 80) return { status: 'Great', description: 'Your profile is in good shape', icon: '👍' };
    if (score >= 60) return { status: 'Good', description: 'Your profile needs some improvements', icon: '📈' };
    if (score >= 40) return { status: 'Basic', description: 'Complete more sections to improve', icon: '📝' };
    return { status: 'Incomplete', description: 'Start building your profile', icon: '🚀' };
  };

  const statusInfo = getStatusInfo(completionScore);

  // Calculate completed sections for UI display only
  const getCompletedFields = () => {
    const fields = [];

    // Basic Info
    if (profile.name) fields.push('Name');
    if (profile.email) fields.push('Email');
    if (profile.avatar) fields.push('Profile Photo');
    if (profile.bio) fields.push('Bio');
    if (profile.location) fields.push('Location');
    if (profile.phone) fields.push('Phone');
    if (profile.dateOfBirth) fields.push('Date of Birth');
    if (profile.gender) fields.push('Gender');

    // Professional Info
    if (profile.freelancerProfile?.headline) fields.push('Professional Headline');
    if (profile.skills?.length >= 3) fields.push('Skills');
    if (profile.freelancerProfile?.experienceLevel) fields.push('Experience Level');
    if (profile.freelancerProfile?.hourlyRate) fields.push('Hourly Rate');
    if (profile.freelancerProfile?.availability) fields.push('Availability');

    // Freelancer Specific Sections
    if (profile.portfolio?.length) fields.push('Portfolio');
    if (profile.certifications?.length) fields.push('Certifications');

    // Additional
    if (profile.website) fields.push('Website');
    if (profile.socialLinks && Object.values(profile.socialLinks).some(link => link)) fields.push('Social Links');
    if (profile.freelancerProfile?.timezone) fields.push('Timezone');
    if (profile.freelancerProfile?.englishProficiency) fields.push('English Proficiency');

    return fields;
  };

  const getMissingFields = () => {
    const allFields = [
      'Name', 'Email', 'Profile Photo', 'Bio', 'Location', 'Phone', 'Date of Birth', 'Gender',
      'Professional Headline', 'Skills', 'Experience Level', 'Hourly Rate', 'Availability',
      'Portfolio', 'Certifications',
      'Website', 'Social Links', 'Timezone', 'English Proficiency'
    ];
    const completed = getCompletedFields();
    return allFields.filter(field => !completed.includes(field));
  };

  const getSuggestions = () => {
    const completed = getCompletedFields();
    const suggestions = [];

    // Check what's actually missing based on completed fields
    if (!completed.includes('Certifications')) {
      suggestions.push('Add professional certifications to boost credibility');
    }
    if (!completed.includes('Portfolio') || (profile.portfolio && profile.portfolio.length < 2)) {
      suggestions.push('Add at least 2 portfolio items to showcase your work');
    }
    if (!completed.includes('Skills') || (profile.skills && profile.skills.length < 3)) {
      suggestions.push('Add at least 3 skills to improve visibility');
    }
    if (!completed.includes('Professional Headline')) {
      suggestions.push('Add a professional headline to stand out');
    }
    if (!completed.includes('Hourly Rate')) {
      suggestions.push('Set your hourly rate to attract clients');
    }
    if (!completed.includes('Bio')) {
      suggestions.push('Write a compelling bio to describe your services');
    }
    if (!completed.includes('Date of Birth') && profile.freelancerProfile) {
      suggestions.push('Add your date of birth for age verification');
    }
    if (!completed.includes('Gender') && profile.freelancerProfile) {
      suggestions.push('Specify your gender for demographic information');
    }

    return suggestions.slice(0, 3);
  };

  const completedFields = getCompletedFields();
  const missingFields = getMissingFields();
  const suggestions = getSuggestions();

  const isDarkMode = themeMode === 'dark';

  return (
    <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border ${colorClasses.border.gray400} ${colorClasses.bg.white}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div>
          <h3 className={`text-base sm:text-lg font-bold mb-1 ${colorClasses.text.darkNavy}`}>
            Profile Strength - {statusInfo.status}
          </h3>
          <p className={`text-xs sm:text-sm ${colorClasses.text.gray600}`}>{statusInfo.description}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end mb-1">
            <span className="text-xl sm:text-2xl mr-2">{statusInfo.icon}</span>
            <span className={`text-2xl sm:text-3xl font-bold ${colorClasses.text.darkNavy}`}>
              {completionScore}%
            </span>
          </div>
          <p className={`text-xs sm:text-sm ${colorClasses.text.gray600}`}>
            {completedFields.length}/{completedFields.length + missingFields.length} completed
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 sm:mb-6">
        <div className={`w-full rounded-full h-2 sm:h-3 shadow-inner ${colorClasses.bg.gray100}`}>
          <div
            className={`h-2 sm:h-3 rounded-full bg-gradient-to-r ${getProgressColor(completionScore)} transition-all duration-1000 ease-out`}
            style={{ width: `${completionScore}%` }}
          ></div>
        </div>
        <div className={`flex justify-between text-xs mt-1 sm:mt-2 ${colorClasses.text.gray600}`}>
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Strengths */}
        <div>
          <h4 className={`font-bold mb-2 sm:mb-3 flex items-center ${colorClasses.text.gray800}`}>
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-2 ${colorClasses.bg.teal}`}></div>
            Completed Sections ({completedFields.length})
          </h4>
          <ul className="space-y-1.5 sm:space-y-2">
            {completedFields.slice(0, 5).map((field, index) => (
              <li key={index} className={`flex items-center text-xs sm:text-sm rounded-lg p-2 sm:p-3 ${colorClasses.bg.teal} ${colorClasses.text.white}`}>
                <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full mr-2 sm:mr-3 ${colorClasses.bg.white}`}></div>
                <span className="font-medium truncate">{field}</span>
              </li>
            ))}
            {completedFields.length === 0 && (
              <li className={`text-xs sm:text-sm italic p-2 sm:p-3 ${colorClasses.text.gray600}`}>
                No sections completed yet
              </li>
            )}
            {completedFields.length > 5 && (
              <li className={`text-xs sm:text-sm italic p-2 sm:p-3 ${colorClasses.text.gray600}`}>
                +{completedFields.length - 5} more sections completed
              </li>
            )}
          </ul>
        </div>

        {/* Suggestions */}
        <div>
          <h4 className={`font-bold mb-2 sm:mb-3 flex items-center ${colorClasses.text.gray800}`}>
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-2 ${colorClasses.bg.orange}`}></div>
            To Improve ({suggestions.length})
          </h4>
          <ul className="space-y-1.5 sm:space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className={`flex items-center text-xs sm:text-sm rounded-lg p-2 sm:p-3 ${colorClasses.bg.orange} ${colorClasses.text.white}`}>
                <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full mr-2 sm:mr-3 ${colorClasses.bg.white}`}></div>
                <span className="font-medium">{suggestion}</span>
              </li>
            ))}
            {suggestions.length === 0 && (
              <li className={`text-xs sm:text-sm italic p-2 sm:p-3 ${colorClasses.text.gray600}`}>
                Great job! Your profile is fully optimized
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Detailed Progress */}
      <div className="mb-4 sm:mb-6">
        <h4 className={`font-bold mb-2 sm:mb-3 ${colorClasses.text.gray800}`}>Detailed Progress</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
          <div className={`rounded-lg p-2 sm:p-3 text-center ${colorClasses.bg.blue} ${colorClasses.text.white}`}>
            <div className={`font-bold text-xs sm:text-sm mb-1 ${colorClasses.text.white}`}>Basic Info</div>
            <div className="font-medium">
              {completedFields.filter(f =>
                ['Name', 'Email', 'Profile Photo', 'Bio', 'Location', 'Phone', 'Date of Birth', 'Gender'].includes(f)
              ).length}/8
            </div>
          </div>
          <div className={`rounded-lg p-2 sm:p-3 text-center ${colorClasses.bg.teal} ${colorClasses.text.white}`}>
            <div className={`font-bold text-xs sm:text-sm mb-1 ${colorClasses.text.white}`}>Professional</div>
            <div className="font-medium">
              {completedFields.filter(f =>
                ['Professional Headline', 'Skills', 'Experience Level', 'Hourly Rate', 'Availability'].includes(f)
              ).length}/5
            </div>
          </div>
          <div className={`rounded-lg p-2 sm:p-3 text-center ${colorClasses.bg.darkNavy} ${colorClasses.text.white}`}>
            <div className={`font-bold text-xs sm:text-sm mb-1 ${colorClasses.text.white}`}>Portfolio</div>
            <div className="font-medium">
              {completedFields.includes('Portfolio') ? '1/1' : '0/1'}
            </div>
          </div>
          <div className={`rounded-lg p-2 sm:p-3 text-center ${colorClasses.bg.teal} ${colorClasses.text.white}`}>
            <div className={`font-bold text-xs sm:text-sm mb-1 ${colorClasses.text.white}`}>Certifications</div>
            <div className="font-medium">
              {completedFields.includes('Certifications') ? '1/1' : '0/1'}
            </div>
          </div>
        </div>
      </div>

      {/* Action Section */}
      {showActions && completionScore < 100 && (
        <div className={`border-t pt-3 sm:pt-4 ${colorClasses.border.gray400}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <p className={`text-xs sm:text-sm font-medium mb-1 ${colorClasses.text.gray800}`}>
                Complete your profile to increase visibility
              </p>
              <p className={`text-xs ${colorClasses.text.gray600}`}>
                {Math.max(0, 80 - completionScore)}% away from better visibility •
                Profiles with 80%+ completion get 3x more views
              </p>
            </div>
            {onImprove && (
              <button
                onClick={onImprove}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-semibold whitespace-nowrap w-full sm:w-auto ${colorClasses.text.white} bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700`}
              >
                Improve Profile
              </button>
            )}
          </div>
        </div>
      )}

      {completionScore === 100 && (
        <div className={`border-t pt-3 sm:pt-4 ${colorClasses.border.gray400}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <p className={`text-xs sm:text-sm font-medium mb-1 ${colorClasses.text.teal}`}>
                🎉 Profile Complete!
              </p>
              <p className={`text-xs ${colorClasses.text.gray600}`}>
                Your profile is fully optimized for maximum visibility
              </p>
            </div>
            <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold ${colorClasses.bg.teal} ${colorClasses.text.white}`}>
              100% Complete
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCompletion;