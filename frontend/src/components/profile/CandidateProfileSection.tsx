// components/profile/CandidateProfileDisplay.tsx
import React from 'react';
import {
    Briefcase,
    GraduationCap,
    Award,
    FileText,
    Calendar,
    MapPin,
    Users,
    Globe,
    Star,
    ExternalLink
} from 'lucide-react';
import { CandidateProfile, Education, Experience, Certification, CV } from '@/services/candidateService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface CandidateProfileDisplayProps {
    profile: CandidateProfile;
    showCVs?: boolean;
    showCertifications?: boolean;
    showExperience?: boolean;
    showEducation?: boolean;
    showSkills?: boolean;
    showPortfolio?: boolean;
    showContact?: boolean;
}

export const CandidateProfileDisplay: React.FC<CandidateProfileDisplayProps> = ({
    profile,
    showCVs = true,
    showCertifications = true,
    showExperience = true,
    showEducation = true,
    showSkills = true,
    showPortfolio = true,
    showContact = true,
}) => {
    // Format date function with null check
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Present';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
            });
        } catch (error) {
            return 'Present';
        }
    };

    // Calculate duration with null checks
    const calculateDuration = (startDate?: string, endDate?: string, current?: boolean) => {
        if (!startDate) return '';

        const start = new Date(startDate);
        const end = current || !endDate ? new Date() : new Date(endDate);

        const years = end.getFullYear() - start.getFullYear();
        const months = end.getMonth() - start.getMonth();

        let duration = '';
        if (years > 0) duration += `${years} yr${years > 1 ? 's' : ''} `;
        if (months > 0 || years === 0) duration += `${months} mo${months > 1 ? 's' : ''}`;

        return duration.trim();
    };

    // Get CV file size with null check
    const getCVFileSize = (cv: CV): string => {
        if (!cv?.size) return 'Unknown size';

        const bytes = cv.size;
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Safe access to arrays with defaults
    const skills = profile?.skills || [];
    const experience = profile?.experience || [];
    const education = profile?.education || [];
    const certifications = profile?.certifications || [];
    const cvs = profile?.cvs || [];
    const portfolio = profile?.portfolio || [];
    const socialLinks = profile?.socialLinks || {};

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <h1 className="text-3xl font-bold text-gray-900">{profile?.name || 'Unnamed Profile'}</h1>
                            {profile?.verificationStatus === 'full' && (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                    Verified
                                </Badge>
                            )}
                        </div>

                        {profile?.bio && (
                            <p className="text-gray-600 mb-6">{profile.bio}</p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            {profile?.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>{profile.location}</span>
                                </div>
                            )}

                            {skills.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>{skills.length} skills</span>
                                </div>
                            )}

                            {experience.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" />
                                    <span>{experience.length} experiences</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {skills.length > 0 && showSkills && (
                        <div className="md:w-1/3">
                            <h3 className="font-semibold text-gray-700 mb-3">Top Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {skills.slice(0, 8).map((skill, index) => (
                                    <Badge key={index} variant="secondary" className="px-3 py-1">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Experience Section */}
            {showExperience && experience.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Briefcase className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>Work Experience</CardTitle>
                                <CardDescription>
                                    {experience.length} position{experience.length !== 1 ? 's' : ''}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {experience.map((exp, index) => (
                                <div key={index} className="pb-6 border-b last:border-0 last:pb-0">
                                    <div className="space-y-3">
                                        <div>
                                            <h4 className="font-bold text-lg">{exp.position}</h4>
                                            <p className="text-gray-700 font-medium">{exp.company}</p>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>
                                                    {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                                                </span>
                                            </div>
                                            <span>•</span>
                                            <span>{calculateDuration(exp.startDate, exp.endDate, exp.current)}</span>
                                        </div>

                                        {exp.description && (
                                            <p className="text-gray-700">{exp.description}</p>
                                        )}

                                        {(exp.skills || []).length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {(exp.skills || []).map((skill, skillIndex) => (
                                                    <Badge key={skillIndex} variant="outline" className="text-xs">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Education Section */}
            {showEducation && education.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <GraduationCap className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <CardTitle>Education</CardTitle>
                                <CardDescription>
                                    {education.length} degree{education.length !== 1 ? 's' : ''}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {education.map((edu, index) => (
                                <div key={index} className="pb-6 border-b last:border-0 last:pb-0">
                                    <div className="space-y-3">
                                        <div>
                                            <h4 className="font-bold text-lg">{edu.degree}</h4>
                                            <p className="text-gray-700">
                                                {edu.institution} • {edu.field}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>
                                                    {formatDate(edu.startDate)} - {edu.current ? 'Present' : formatDate(edu.endDate)}
                                                </span>
                                            </div>
                                            <span>•</span>
                                            <span>{calculateDuration(edu.startDate, edu.endDate, edu.current)}</span>
                                        </div>

                                        {edu.description && (
                                            <p className="text-gray-700">{edu.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Certifications Section */}
            {showCertifications && certifications.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Award className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <CardTitle>Certifications</CardTitle>
                                <CardDescription>
                                    {certifications.length} certification{certifications.length !== 1 ? 's' : ''}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {certifications.map((cert, index) => (
                                <div key={index} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-amber-50 rounded-lg">
                                            <Award className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold">{cert.name}</h4>
                                            <p className="text-sm text-gray-600 mt-1">{cert.issuer}</p>

                                            <div className="space-y-1 mt-2 text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>Issued: {formatDate(cert.issueDate)}</span>
                                                </div>

                                                {cert.expiryDate && (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>Expires: {formatDate(cert.expiryDate)}</span>
                                                    </div>
                                                )}

                                                {cert.credentialId && (
                                                    <div>
                                                        <span className="font-medium">ID:</span> {cert.credentialId}
                                                    </div>
                                                )}
                                            </div>

                                            {cert.credentialUrl && (
                                                <div className="mt-3">
                                                    <a
                                                        href={cert.credentialUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                                                    >
                                                        View Credential
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* CV Section */}
            {showCVs && cvs.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <FileText className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <CardTitle>Curriculum Vitae</CardTitle>
                                <CardDescription>
                                    {cvs.length} CV{cvs.length !== 1 ? 's' : ''}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {cvs.map((cv, index) => (
                                <div key={index} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-purple-50 rounded-lg">
                                            <FileText className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium">{cv.originalName}</h4>
                                                {cv.isPrimary && (
                                                    <Badge variant="success" className="text-xs">
                                                        Primary
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="text-sm text-gray-600 space-y-1">
                                                <div>Size: {getCVFileSize(cv)}</div>
                                                <div>Uploaded: {new Date(cv.uploadedAt).toLocaleDateString()}</div>
                                                {cv.mimetype && (
                                                    <div>Format: {cv.mimetype.split('/')[1].toUpperCase()}</div>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                const url = cv.url || `/uploads/cv/${cv.filename}`;
                                                window.open(url, '_blank');
                                            }}
                                        >
                                            <ExternalLink className="w-4 h-4 mr-1" />
                                            View
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Portfolio Section */}
            {showPortfolio && portfolio.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-100 rounded-lg">
                                <Star className="w-6 h-6 text-teal-600" />
                            </div>
                            <div>
                                <CardTitle>Portfolio</CardTitle>
                                <CardDescription>
                                    {portfolio.length} project{portfolio.length !== 1 ? 's' : ''}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {portfolio.map((project, index) => (
                                <div key={index} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                    {project.image && (
                                        <div className="h-40 overflow-hidden">
                                            <img
                                                src={project.image}
                                                alt={project.title}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <h4 className="font-bold">{project.title}</h4>
                                        {project.description && (
                                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                {project.description}
                                            </p>
                                        )}

                                        {(project.skills || []).length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-3">
                                                {(project.skills || []).map((skill, skillIndex) => (
                                                    <Badge key={skillIndex} variant="secondary" className="text-xs">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        {project.url && (
                                            <div className="mt-3">
                                                <a
                                                    href={project.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                                                >
                                                    View Project
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Contact & Social Links */}
            {showContact && (
                <Card>
                    <CardHeader>
                        <CardTitle>Contact & Social Links</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                {profile?.email && (
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-1">Email</h4>
                                        <p className="text-gray-900">{profile.email}</p>
                                    </div>
                                )}

                                {profile?.phone && (
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-1">Phone</h4>
                                        <p className="text-gray-900">{profile.phone}</p>
                                    </div>
                                )}

                                {profile?.location && (
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-1">Location</h4>
                                        <p className="text-gray-900">{profile.location}</p>
                                    </div>
                                )}

                                {profile?.website && (
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-1">Website</h4>
                                        <a
                                            href={profile.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                                        >
                                            {profile.website.replace(/^https?:\/\//, '')}
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                )}
                            </div>

                            {(socialLinks.linkedin || socialLinks.github || socialLinks.twitter) && (
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-3">Social Profiles</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {socialLinks.linkedin && (
                                            <a
                                                href={socialLinks.linkedin}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                                </svg>
                                                <span className="text-sm">LinkedIn</span>
                                            </a>
                                        )}

                                        {socialLinks.github && (
                                            <a
                                                href={socialLinks.github}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                                </svg>
                                                <span className="text-sm">GitHub</span>
                                            </a>
                                        )}

                                        {socialLinks.twitter && (
                                            <a
                                                href={socialLinks.twitter}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.213c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                                </svg>
                                                <span className="text-sm">Twitter</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Skills Section */}
            {showSkills && skills.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Skills & Expertise</CardTitle>
                        <CardDescription>
                            {skills.length} skill{skills.length !== 1 ? 's' : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill, index) => (
                                <Badge key={index} variant="secondary" className="px-3 py-1.5 text-sm">
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default CandidateProfileDisplay;