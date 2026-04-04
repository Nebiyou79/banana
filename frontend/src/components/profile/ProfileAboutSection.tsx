import React, { useState } from 'react';
import { Card } from '@/components/social/ui/Card';
import { profileService, Profile, Language } from '@/services/profileService';
import { Skeleton } from '../ui/Skeleton';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/social/theme/RoleThemeProvider';
import { Briefcase, Sparkles, Building, Users, Shield, Calendar, ChevronUp, ChevronDown, Globe, Heart, MapPin, Mail, Phone, ExternalLink, Code, GraduationCap, Award } from 'lucide-react';

interface ProfileAboutSectionProps {
  profile: Profile;
  isLoading?: boolean;
}

// Role-based color configuration
const ROLE_COLORS = {
  candidate: {
    gradient: 'from-blue-500 to-cyan-500',
    lightBg: 'bg-blue-50',
    darkBg: 'dark:bg-blue-900/20',
    lightText: 'text-blue-700',
    darkText: 'dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    shadow: 'shadow-blue-500/20',
    icon: Briefcase,
    secondaryGradient: 'from-purple-500 to-pink-500'
  },
  freelancer: {
    gradient: 'from-amber-500 to-orange-500',
    lightBg: 'bg-amber-50',
    darkBg: 'dark:bg-amber-900/20',
    lightText: 'text-amber-700',
    darkText: 'dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    shadow: 'shadow-amber-500/20',
    icon: Sparkles,
    secondaryGradient: 'from-teal-500 to-emerald-500'
  },
  company: {
    gradient: 'from-teal-500 to-emerald-500',
    lightBg: 'bg-teal-50',
    darkBg: 'dark:bg-teal-900/20',
    lightText: 'text-teal-700',
    darkText: 'dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
    shadow: 'shadow-teal-500/20',
    icon: Building,
    secondaryGradient: 'from-blue-500 to-cyan-500'
  },
  organization: {
    gradient: 'from-indigo-500 to-purple-500',
    lightBg: 'bg-indigo-50',
    darkBg: 'dark:bg-indigo-900/20',
    lightText: 'text-indigo-700',
    darkText: 'dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    shadow: 'shadow-indigo-500/20',
    icon: Users,
    secondaryGradient: 'from-pink-500 to-rose-500'
  },
  admin: {
    gradient: 'from-purple-500 to-pink-500',
    lightBg: 'bg-purple-50',
    darkBg: 'dark:bg-purple-900/20',
    lightText: 'text-purple-700',
    darkText: 'dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    shadow: 'shadow-purple-500/20',
    icon: Shield,
    secondaryGradient: 'from-amber-500 to-orange-500'
  }
};

// Timeline Component for Experience/Education
const TimelineItem: React.FC<{
  title: string;
  subtitle: string;
  date: string;
  description?: string;
  icon: React.ReactNode;
  color: string;
  isLast?: boolean;
}> = ({ title, subtitle, date, description, icon, color, isLast = false }) => {
  const [expanded, setExpanded] = useState(false);
  const { mode } = useTheme();

  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      {/* Timeline Line */}
      {!isLast && (
        <div className={cn(
          "absolute left-3 top-8 bottom-0 w-0.5",
          mode === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
        )} />
      )}

      {/* Timeline Dot with Icon */}
      <div className={cn(
        "absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center",
        `bg-linear-to-r ${color}`,
        "shadow-lg"
      )}>
        {icon}
      </div>

      {/* Content */}
      <div className={cn(
        "rounded-xl p-4 transition-all duration-300",
        mode === 'dark' ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100',
        "border",
        mode === 'dark' ? 'border-gray-700' : 'border-gray-200',
        expanded && "shadow-lg"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">{title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">{date}</span>
          </div>
        </div>

        {description && (
          <>
            <p className={cn(
              "text-sm text-gray-600 dark:text-gray-400 transition-all",
              !expanded && "line-clamp-2"
            )}>
              {description}
            </p>
            {description.length > 150 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
              >
                {expanded ? (
                  <>Show less <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>Read more <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Skill Pill Component
const SkillPill: React.FC<{ skill: string; index: number }> = ({ skill, index }) => {
  const colors = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-amber-500 to-orange-500',
    'from-green-500 to-emerald-500',
    'from-indigo-500 to-purple-500',
    'from-teal-500 to-emerald-500',
    'from-rose-500 to-pink-500',
    'from-sky-500 to-blue-500'
  ];

  const colorIndex = index % colors.length;
  const gradient = colors[colorIndex];

  return (
    <div className={cn(
      "group relative px-4 py-2 rounded-xl text-sm font-medium",
      "bg-linear-to-r",
      gradient,
      "text-white",
      "shadow-md hover:shadow-xl",
      "transform hover:scale-105 transition-all duration-300",
      "cursor-default",
      "border border-white/20"
    )}>
      <span className="relative z-10">{skill}</span>
      <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
    </div>
  );
};

// Language Card Component
const LanguageCard: React.FC<{ language: Language }> = ({ language }) => {
  const proficiencyColors = {
    basic: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    conversational: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    professional: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    fluent: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    native: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'
  };

  const proficiencyLabels = {
    basic: 'Basic',
    conversational: 'Conversational',
    professional: 'Professional',
    fluent: 'Fluent',
    native: 'Native'
  };

  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-xl",
      "bg-white dark:bg-gray-800",
      "border border-gray-200 dark:border-gray-700",
      "hover:shadow-lg transition-all duration-300",
      "hover:scale-105 transform"
    )}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-linear-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{language.language}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{language.proficiency}</p>
        </div>
      </div>
      <span className={cn(
        "px-3 py-1 rounded-full text-xs font-medium",
        proficiencyColors[language.proficiency as keyof typeof proficiencyColors]
      )}>
        {proficiencyLabels[language.proficiency as keyof typeof proficiencyLabels]}
      </span>
    </div>
  );
};

// Interest Tag Component
const InterestTag: React.FC<{ interest: string; index: number }> = ({ interest, index }) => {
  const colors = [
    'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800',
    'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 border-teal-200 dark:border-teal-800'
  ];

  const colorIndex = index % colors.length;

  return (
    <span className={cn(
      "px-4 py-2 rounded-xl text-sm font-medium",
      "border",
      "hover:scale-105 transition-all duration-300",
      "cursor-default",
      "shadow-sm hover:shadow-md",
      colors[colorIndex]
    )}>
      {interest}
    </span>
  );
};

// Section Header Component
const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  count?: number;
  gradient: string;
}> = ({ icon, title, count, gradient }) => {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={cn(
        "p-3 rounded-xl bg-linear-to-r",
        gradient,
        "shadow-lg"
      )}>
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {title}
          {count !== undefined && count > 0 && (
            <span className={cn(
              "px-2 py-0.5 text-sm rounded-full",
              "bg-gray-100 dark:bg-gray-800",
              "text-gray-700 dark:text-gray-300"
            )}>
              {count}
            </span>
          )}
        </h3>
      </div>
    </div>
  );
};

export const ProfileAboutSection: React.FC<ProfileAboutSectionProps> = ({
  profile,
  isLoading = false,
}) => {
  const { mode, role } = useTheme();
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [showAllInterests, setShowAllInterests] = useState(false);

  // Get role-specific colors
  const roleColors = ROLE_COLORS[profile?.user?.role as keyof typeof ROLE_COLORS] || ROLE_COLORS.candidate;

  // Safely destructure with defaults
  const {
    roleSpecific = {
      skills: [],
      education: [],
      experience: [],
      certifications: [],
      portfolio: [],
      companyInfo: undefined
    },
    user = {
      _id: '',
      name: 'User',
      email: '',
      role: 'candidate',
      isActive: false,
      verificationStatus: 'pending'
    },
    languages = [],
    interests = [],
    bio,
    website,
    location,
    phone,
  } = profile || {};

  // Calculate experience years
  const experienceYears = roleSpecific?.experience ?
    profileService.getExperienceYears(roleSpecific.experience) : 0;

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Present';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  // Loading state skeleton
  if (isLoading || !profile) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <Skeleton className="h-8 w-32" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <div className="grid md:grid-cols-2 gap-4">
                  <Skeleton className="h-32 rounded-xl" />
                  <Skeleton className="h-32 rounded-xl" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bio Card */}
      {bio && (
        <Card className="border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all group">
          <div className="p-6">
            <SectionHeader
              icon={<Heart className="w-5 h-5 text-white" />}
              title="About"
              gradient={roleColors.gradient}
            />
            <div className={cn(
              "prose max-w-none",
              mode === 'dark' ? 'prose-invert' : ''
            )}>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {bio}
              </p>
            </div>

            {/* Contact Info Quick Links */}
            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              {location && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{location}</span>
                </div>
              )}
              {user.email && (
                <a
                  href={`mailto:${user.email}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">Email</span>
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">Call</span>
                </a>
              )}
              {website && (
                <a
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">Website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Skills Card */}
      {roleSpecific.skills && roleSpecific.skills.length > 0 && (
        <Card className="border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all group">
          <div className="p-6">
            <SectionHeader
              icon={<Code className="w-5 h-5 text-white" />}
              title="Skills & Expertise"
              count={roleSpecific.skills.length}
              gradient={roleColors.secondaryGradient || roleColors.gradient}
            />

            <div className="flex flex-wrap gap-2">
              {roleSpecific.skills
                .slice(0, showAllSkills ? undefined : 12)
                .map((skill, index) => (
                  <SkillPill key={index} skill={skill} index={index} />
                ))}
            </div>

            {roleSpecific.skills.length > 12 && (
              <button
                onClick={() => setShowAllSkills(!showAllSkills)}
                className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
              >
                {showAllSkills ? (
                  <>Show less <ChevronUp className="w-4 h-4" /></>
                ) : (
                  <>Show {roleSpecific.skills.length - 12} more skills <ChevronDown className="w-4 h-4" /></>
                )}
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Experience Timeline */}
      {roleSpecific.experience && roleSpecific.experience.length > 0 && (
        <Card className="border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all group">
          <div className="p-6">
            <SectionHeader
              icon={<Briefcase className="w-5 h-5 text-white" />}
              title="Work Experience"
              count={roleSpecific.experience.length}
              gradient={roleColors.gradient}
            />

            <div className="mt-4">
              {roleSpecific.experience.map((exp, index) => (
                <TimelineItem
                  key={index}
                  title={exp.position}
                  subtitle={exp.company}
                  date={`${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}`}
                  description={exp.description}
                  icon={<Briefcase className="w-3 h-3 text-white" />}
                  color={roleColors.gradient}
                  isLast={index === roleSpecific.experience.length - 1}
                />
              ))}
            </div>

            {experienceYears > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">{experienceYears} years</span> of professional experience
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Education Timeline */}
      {roleSpecific.education && roleSpecific.education.length > 0 && (
        <Card className="border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all group">
          <div className="p-6">
            <SectionHeader
              icon={<GraduationCap className="w-5 h-5 text-white" />}
              title="Education"
              count={roleSpecific.education.length}
              gradient="from-purple-500 to-pink-500"
            />

            <div className="mt-4">
              {roleSpecific.education.map((edu, index) => (
                <TimelineItem
                  key={index}
                  title={edu.degree}
                  subtitle={edu.institution}
                  date={`${formatDate(edu.startDate)} - ${edu.current ? 'Present' : formatDate(edu.endDate)}`}
                  description={edu.description}
                  icon={<GraduationCap className="w-3 h-3 text-white" />}
                  color="from-purple-500 to-pink-500"
                  isLast={index === roleSpecific.education.length - 1}
                />
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Certifications */}
      {roleSpecific.certifications && roleSpecific.certifications.length > 0 && (
        <Card className="border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all group">
          <div className="p-6">
            <SectionHeader
              icon={<Award className="w-5 h-5 text-white" />}
              title="Certifications"
              count={roleSpecific.certifications.length}
              gradient="from-amber-500 to-orange-500"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roleSpecific.certifications.map((cert, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-xl",
                    "bg-white dark:bg-gray-800",
                    "border border-gray-200 dark:border-gray-700",
                    "hover:shadow-lg transition-all duration-300",
                    "hover:scale-105 transform"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-linear-to-r from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{cert.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{cert.issuer}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Issued {formatDate(cert.issueDate)}
                        {cert.expiryDate && ` · Expires ${formatDate(cert.expiryDate)}`}
                      </p>
                      {cert.credentialUrl && (
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Credential
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Languages & Interests Grid */}
      {(languages.length > 0 || interests.length > 0) && (
        <Card className="border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all group">
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Languages */}
              {languages.length > 0 && (
                <div>
                  <SectionHeader
                    icon={<Globe className="w-5 h-5 text-white" />}
                    title="Languages"
                    count={languages.length}
                    gradient="from-teal-500 to-emerald-500"
                  />
                  <div className="space-y-3">
                    {languages.map((lang, index) => (
                      <LanguageCard key={index} language={lang} />
                    ))}
                  </div>
                </div>
              )}

              {/* Interests */}
              {interests.length > 0 && (
                <div>
                  <SectionHeader
                    icon={<Heart className="w-5 h-5 text-white" />}
                    title="Interests"
                    count={interests.length}
                    gradient="from-rose-500 to-pink-500"
                  />
                  <div className="flex flex-wrap gap-2">
                    {interests
                      .slice(0, showAllInterests ? undefined : 8)
                      .map((interest, index) => (
                        <InterestTag key={index} interest={interest} index={index} />
                      ))}
                  </div>
                  {interests.length > 8 && (
                    <button
                      onClick={() => setShowAllInterests(!showAllInterests)}
                      className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      {showAllInterests ? (
                        <>Show less <ChevronUp className="w-4 h-4" /></>
                      ) : (
                        <>Show {interests.length - 8} more interests <ChevronDown className="w-4 h-4" /></>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Company Info (for company/organization profiles) */}
      {(user.role === 'company' || user.role === 'organization') && roleSpecific.companyInfo && (
        <Card className="border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all group">
          <div className="p-6">
            <SectionHeader
              icon={<Building className="w-5 h-5 text-white" />}
              title="Company Information"
              gradient="from-teal-500 to-emerald-500"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {roleSpecific.companyInfo.industry && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {roleSpecific.companyInfo.industry}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Industry</div>
                </div>
              )}
              {roleSpecific.companyInfo.foundedYear && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {roleSpecific.companyInfo.foundedYear}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Founded</div>
                </div>
              )}
              {roleSpecific.companyInfo.size && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {roleSpecific.companyInfo.size}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Team Size</div>
                </div>
              )}
              {roleSpecific.companyInfo.companyType && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {roleSpecific.companyInfo.companyType.replace(/-/g, ' ')}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Type</div>
                </div>
              )}
            </div>

            {roleSpecific.companyInfo.mission && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Mission</h4>
                <p className="text-gray-700 dark:text-gray-300">{roleSpecific.companyInfo.mission}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};