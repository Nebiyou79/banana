import React from 'react';
import { Card } from '@/components/social/ui/Card';
import profileService, { Profile } from '@/services/profileService';
import {
  Award,
  Globe,
  Code,
  Building,
  Calendar,
  Users,
  Target,
  Heart
} from 'lucide-react';

interface ProfileAboutSectionProps {
  profile: Profile;
}

export const ProfileAboutSection: React.FC<ProfileAboutSectionProps> = ({
  profile,
}) => {
  const { roleSpecific, user, languages = [], interests = [] } = profile;

  const renderRoleSpecificInfo = () => {
    const role = user.role;

    switch (role) {
      case 'candidate':
        return (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="backdrop-blur-lg bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 text-lg">Skills</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {roleSpecific.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 backdrop-blur-md bg-gray-100 text-gray-700 rounded-xl text-sm border border-gray-200 hover:border-blue-500 hover:scale-105 transition-all duration-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="backdrop-blur-lg bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 text-lg">Experience</h4>
              </div>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-gray-900">
                  {roleSpecific.experience.length}
                </div>
                <div className="text-sm text-gray-600">
                  Professional positions with {profileService.getExperienceYears(roleSpecific.experience)} years total
                </div>
              </div>
            </div>
          </div>
        );

      case 'freelancer':
        return (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="backdrop-blur-lg bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 text-lg">Skills</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {roleSpecific.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 backdrop-blur-md bg-gray-100 text-gray-700 rounded-xl text-sm border border-gray-200 hover:border-blue-500 hover:scale-105 transition-all duration-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="backdrop-blur-lg bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 text-lg">Portfolio</h4>
              </div>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-gray-900">
                  {roleSpecific.portfolio.length}
                </div>
                <div className="text-sm text-gray-600">
                  Successful projects delivered
                </div>
              </div>
            </div>
          </div>
        );

      case 'company':
      case 'organization':
        return (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roleSpecific.companyInfo?.industry && (
              <div className="backdrop-blur-lg bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg">Industry</h4>
                </div>
                <p className="text-gray-700 font-medium">{roleSpecific.companyInfo.industry}</p>
              </div>
            )}

            {roleSpecific.companyInfo?.foundedYear && (
              <div className="backdrop-blur-lg bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg">Founded</h4>
                </div>
                <p className="text-gray-700 font-medium">{roleSpecific.companyInfo.foundedYear}</p>
              </div>
            )}

            {roleSpecific.companyInfo?.size && (
              <div className="backdrop-blur-lg bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg">Team Size</h4>
                </div>
                <p className="text-gray-700 font-medium">{roleSpecific.companyInfo.size} employees</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 shadow-2xl rounded-3xl p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
          <Award className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          About
        </h3>
      </div>

      {/* Bio Section */}
      {profile.bio && (
        <div className="mb-8 backdrop-blur-lg bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-gray-900 text-lg">Bio</h4>
          </div>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {profile.bio}
          </p>
        </div>
      )}

      {/* Role-Specific Information */}
      <div className="mb-8">
        {renderRoleSpecificInfo()}
      </div>

      {/* Languages & Interests Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Languages */}
        {languages.length > 0 && (
          <div className="backdrop-blur-lg bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 text-lg">Languages</h4>
            </div>
            <div className="space-y-4">
              {languages.map((lang, index) => (
                <div key={index} className="flex justify-between items-center group hover:scale-105 transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <span className="text-lg">{'🌐'}</span>
                    </div>
                    <span className="text-gray-700 font-medium">{lang.language}</span>
                  </div>
                  <span className="px-3 py-1 text-sm bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full border border-blue-500">
                    {lang.proficiency.charAt(0).toUpperCase() + lang.proficiency.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {interests.length > 0 && (
          <div className="backdrop-blur-lg bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 text-lg">Interests</h4>
            </div>
            <div className="flex flex-wrap gap-3">
              {interests.map((interest, index) => (
                <span
                  key={index}
                  className="px-4 py-2 backdrop-blur-md bg-gray-100 text-gray-700 rounded-xl text-sm border border-gray-200 hover:border-purple-500 hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  <span className="text-purple-500">•</span>
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Website */}
      {profile.website && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 backdrop-blur-lg bg-white hover:bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-500 transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 group-hover:scale-110 transition-transform">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Website</div>
              <div className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
                {profile.website.replace(/^https?:\/\//, '')}
              </div>
            </div>
          </a>
        </div>
      )}
    </Card>
  );
};