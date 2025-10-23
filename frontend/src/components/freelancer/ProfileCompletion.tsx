// components/freelancer/ProfileCompletion.tsx
'use client';

import React from 'react';
import { colorClasses } from '@/utils/color';
import { UserProfile } from '@/services/freelancerService';

interface ProfileCompletionProps {
  profile: UserProfile;
  showActions?: boolean;
  onImprove?: () => void;
}

const ProfileCompletion: React.FC<ProfileCompletionProps> = ({ 
  profile, 
  showActions = false,
  onImprove 
}) => {
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

  // Calculate completed sections for UI display only (not for score calculation)
  const getCompletedFields = () => {
    const fields = [];
    
    // Basic Info
    if (profile.name) fields.push('Name');
    if (profile.email) fields.push('Email');
    if (profile.avatar) fields.push('Profile Photo');
    if (profile.bio) fields.push('Bio');
    if (profile.location) fields.push('Location');
    if (profile.phone) fields.push('Phone');
    
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
    // Only include fields relevant to freelancers
    const allFields = [
      'Name', 'Email', 'Profile Photo', 'Bio', 'Location', 'Phone',
      'Professional Headline', 'Skills', 'Experience Level', 'Hourly Rate', 'Availability',
      'Portfolio', 'Certifications', // Only these two for freelancers
      'Website', 'Social Links', 'Timezone', 'English Proficiency'
    ];
    const completed = getCompletedFields();
    return allFields.filter(field => !completed.includes(field));
  };

  const getSuggestions = () => {
    const missing = getMissingFields();
    const suggestions = [];
    
    // Freelancer-specific suggestions
    if (missing.includes('Portfolio') && (!profile.portfolio?.length || profile.portfolio.length < 2)) {
      suggestions.push('Add at least 2 portfolio items to showcase your work');
    }
    if (missing.includes('Certifications') && !profile.certifications?.length) {
      suggestions.push('Add professional certifications to boost credibility');
    }
    if (missing.includes('Skills') || profile.skills?.length < 3) {
      suggestions.push('Add at least 3 skills to improve visibility');
    }
    if (missing.includes('Professional Headline')) {
      suggestions.push('Add a professional headline to stand out');
    }
    if (!profile.freelancerProfile?.hourlyRate || profile.freelancerProfile.hourlyRate <= 0) {
      suggestions.push('Set your hourly rate to attract clients');
    }
    if (!profile.bio) {
      suggestions.push('Write a compelling bio to describe your services');
    }
    
    return suggestions.slice(0, 3); // Show only top 3 most important suggestions
  };

  const completedFields = getCompletedFields();
  const missingFields = getMissingFields();
  const suggestions = getSuggestions();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-lg font-bold ${colorClasses.text.darkNavy} mb-1`}>
            Profile Strength - {statusInfo.status}
          </h3>
          <p className="text-sm text-gray-500">{statusInfo.description}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end mb-1">
            <span className="text-2xl mr-2">{statusInfo.icon}</span>
            <span className={`text-3xl font-bold ${colorClasses.text.darkNavy}`}>
              {completionScore}%
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {completedFields.length}/{completedFields.length + missingFields.length} completed
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
          <div 
            className={`h-3 rounded-full bg-gradient-to-r ${getProgressColor(completionScore)} transition-all duration-1000 ease-out`}
            style={{ width: `${completionScore}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Strengths */}
        <div>
          <h4 className="font-bold text-gray-900 mb-3 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Completed Sections ({completedFields.length})
          </h4>
          <ul className="space-y-2">
            {completedFields.slice(0, 5).map((field, index) => (
              <li key={index} className="flex items-center text-sm text-gray-700 bg-green-50 rounded-lg p-3">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-3"></div>
                <span className="font-medium">{field}</span>
              </li>
            ))}
            {completedFields.length === 0 && (
              <li className="text-sm text-gray-500 italic p-3">
                No sections completed yet
              </li>
            )}
            {completedFields.length > 5 && (
              <li className="text-sm text-gray-500 italic p-3">
                +{completedFields.length - 5} more sections completed
              </li>
            )}
          </ul>
        </div>

        {/* Suggestions */}
        <div>
          <h4 className="font-bold text-gray-900 mb-3 flex items-center">
            <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
            To Improve ({suggestions.length})
          </h4>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-center text-sm text-gray-700 bg-amber-50 rounded-lg p-3">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-3"></div>
                <span className="font-medium">{suggestion}</span>
              </li>
            ))}
            {suggestions.length === 0 && (
              <li className="text-sm text-gray-500 italic p-3">
                Great job! Your profile is fully optimized
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Detailed Progress - Simplified for Freelancers */}
      <div className="mb-6">
        <h4 className="font-bold text-gray-900 mb-3">Detailed Progress</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="font-bold text-blue-600">Basic Info</div>
            <div className="text-gray-600">
              {completedFields.filter(f => 
                ['Name', 'Email', 'Profile Photo', 'Bio', 'Location', 'Phone'].includes(f)
              ).length}/6
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="font-bold text-green-600">Professional</div>
            <div className="text-gray-600">
              {completedFields.filter(f => 
                ['Professional Headline', 'Skills', 'Experience Level', 'Hourly Rate', 'Availability'].includes(f)
              ).length}/5
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="font-bold text-purple-600">Portfolio</div>
            <div className="text-gray-600">
              {completedFields.filter(f => 
                ['Portfolio'].includes(f)
              ).length}/1
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <div className="font-bold text-orange-600">Certifications</div>
            <div className="text-gray-600">
              {completedFields.filter(f => 
                ['Certifications'].includes(f)
              ).length}/1
            </div>
          </div>
        </div>
      </div>

      {/* Action Section */}
      {showActions && completionScore < 100 && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium mb-1">
                Complete your profile to increase visibility
              </p>
              <p className="text-xs text-gray-500">
                {Math.max(0, 80 - completionScore)}% away from better visibility • 
                Profiles with 80%+ completion get 3x more views
              </p>
            </div>
            {onImprove && (
              <button
                onClick={onImprove}
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-200 text-sm font-semibold whitespace-nowrap"
              >
                Improve Profile
              </button>
            )}
          </div>
        </div>
      )}

      {completionScore === 100 && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium mb-1">
                🎉 Profile Complete!
              </p>
              <p className="text-xs text-gray-500">
                Your profile is fully optimized for maximum visibility
              </p>
            </div>
            <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
              100% Complete
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCompletion;