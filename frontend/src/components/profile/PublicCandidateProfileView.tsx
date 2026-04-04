/* eslint-disable @typescript-eslint/no-explicit-any */
// components/profile/PublicCandidateProfileView.tsx
import React, { useState } from 'react';
import {
  Briefcase,
  GraduationCap,
  Award,
  Calendar,
  MapPin,
  Mail,
  Globe,
  ExternalLink,
  Star,
  BookOpen,
  Linkedin,
  Github,
  Twitter,
  ChevronDown,
  ChevronUp,
  Phone
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface PublicCandidateProfileViewProps {
  profile?: any;
  themeMode?: 'light' | 'dark';
}
// Format date helper
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Present';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Present';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  } catch {
    return 'Present';
  }
};

// Calculate duration
const calculateDuration = (startDate?: string, endDate?: string, current?: boolean): string => {
  if (!startDate) return '';

  const start = new Date(startDate);
  const end = current || !endDate ? new Date() : new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';

  const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const parts = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} mo${months > 1 ? 's' : ''}`);
  if (parts.length === 0) return '0 mos';

  return parts.join(' ');
};

// Section Header Component
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; count?: number }> = ({ 
  icon, title, count 
}) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="p-3 rounded-xl bg-linear-to-r from-blue-500 to-cyan-500 shadow-lg">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
      {title}
      {count !== undefined && count > 0 && (
        <span className="px-2 py-0.5 text-sm rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          {count}
        </span>
      )}
    </h3>
  </div>
);

// Timeline Item Component
const TimelineItem: React.FC<{
  title: string;
  subtitle: string;
  date: string;
  description?: string;
  skills?: string[];
  isLast?: boolean;
}> = ({ title, subtitle, date, description, skills, isLast = false }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
      )}

      {/* Timeline Dot */}
      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-linear-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
        <Briefcase className="w-3 h-3 text-white" />
      </div>

      {/* Content */}
      <div className="rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
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
            <p className={`text-sm text-gray-600 dark:text-gray-400 transition-all ${
              !expanded ? 'line-clamp-2' : ''
            }`}>
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

        {skills && skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {skills.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {skills.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{skills.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const PublicCandidateProfileView: React.FC<PublicCandidateProfileViewProps> = ({
  profile,
  themeMode = 'light'
}) => {
  if (!profile) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Briefcase className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Profile Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This candidate hasn`t added any profile information yet.
        </p>
      </div>
    );
  }

  const {
    email,
    location,
    phone,
    website,
    bio,
    skills = [],
    experience = [],
    education = [],
    certifications = [],
    portfolio = [],
    socialLinks = {}
  } = profile;

  const hasSocialLinks = socialLinks.linkedin || socialLinks.github || socialLinks.twitter;

  return (
    <div className="space-y-6">
      {/* Bio Section */}
      {bio && (
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-6">
            <SectionHeader icon={<Star className="w-5 h-5 text-white" />} title="About" />
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {bio}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Skills Section */}
      {skills.length > 0 && (
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-6">
            <SectionHeader icon={<Award className="w-5 h-5 text-white" />} title="Skills" count={skills.length} />
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string, index: number) => (
                <span
                  key={index}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experience Section */}
      {experience.length > 0 && (
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-6">
            <SectionHeader icon={<Briefcase className="w-5 h-5 text-white" />} title="Experience" count={experience.length} />
            <div className="mt-4">
              {experience.map((exp: any, index: number) => (
                <TimelineItem
                  key={index}
                  title={exp.position}
                  subtitle={exp.company}
                  date={`${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}`}
                  description={exp.description}
                  skills={exp.skills}
                  isLast={index === experience.length - 1}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education Section */}
      {education.length > 0 && (
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-6">
            <SectionHeader icon={<GraduationCap className="w-5 h-5 text-white" />} title="Education" count={education.length} />
            <div className="space-y-4">
              {education.map((edu: any, index: number) => (
                <div key={index} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{edu.degree}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{edu.institution}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {formatDate(edu.startDate)} - {edu.current ? 'Present' : formatDate(edu.endDate)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certifications Section */}
      {certifications.length > 0 && (
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-6">
            <SectionHeader icon={<Award className="w-5 h-5 text-white" />} title="Certifications" count={certifications.length} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certifications.map((cert: any, index: number) => (
                <div key={index} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Section */}
      {portfolio.length > 0 && (
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-6">
            <SectionHeader icon={<BookOpen className="w-5 h-5 text-white" />} title="Portfolio" count={portfolio.length} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolio.slice(0, 4).map((project: any, index: number) => (
                <div key={index} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{project.title}</h4>
                  {project.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  {project.skills && project.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.skills.slice(0, 3).map((skill: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Project
                    </a>
                  )}
                </div>
              ))}
              {portfolio.length > 4 && (
                <div className="col-span-full text-center mt-4">
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                    View all {portfolio.length} projects
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Links */}
      {hasSocialLinks && (
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Social Links</h3>
            <div className="flex flex-wrap gap-3">
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A66C2]/10 text-[#0A66C2] rounded-lg hover:bg-[#0A66C2]/20 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  <span className="text-sm font-medium">LinkedIn</span>
                </a>
              )}
              {socialLinks.github && (
                <a
                  href={socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Github className="w-4 h-4" />
                  <span className="text-sm font-medium">GitHub</span>
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1DA1F2]/10 text-[#1DA1F2] rounded-lg hover:bg-[#1DA1F2]/20 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                  <span className="text-sm font-medium">Twitter</span>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Info */}
      {(email || phone || website || location) && (
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Contact Information</h3>
            <div className="space-y-3">
              {location && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{location}</span>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${email}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                    {email}
                  </a>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${phone}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                    {phone}
                  </a>
                </div>
              )}
              {website && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Globe className="w-4 h-4" />
                  <a
                    href={website.startsWith('http') ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                  >
                    {website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PublicCandidateProfileView;