/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    User,
    Briefcase,
    GraduationCap,
    Award,
    Mail,
    Phone,
    MapPin,
    Save,
    Loader2,
    FileText,
    Sparkles,
    Building,
    Calendar,
    Globe,
    Link,
    Plus,
    Trash2,
    Upload,
    Download,
    Eye,
    Check,
    X,
    ShieldCheck,
    AlertCircle,
    Clock,
    Image
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Services
import { candidateService, type CandidateProfile, type CV } from '@/services/candidateService';
import { profileService, type CloudinaryImage } from '@/services/profileService';

// Components
import { AvatarUploader } from '@/components/profile/AvatarUploader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Switch } from '@/components/ui/Switch';
import { useTheme } from '@/components/social/theme/RoleThemeProvider';
import { colorClasses } from '@/utils/color';

// Validation schemas
const basicInfoSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    role: z.string().optional(),
    bio: z.string().max(2000, 'Bio must be less than 2000 characters').optional(),
    location: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']).optional(),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

const experienceSchema = z.object({
    experience: z.array(z.object({
        _id: z.string().optional(),
        company: z.string().min(1, 'Company name required'),
        position: z.string().min(1, 'Position required'),
        startDate: z.string(),
        endDate: z.string().optional(),
        current: z.boolean(),
        description: z.string().optional(),
        skills: z.array(z.string())
    }))
});

type ExperienceFormData = z.infer<typeof experienceSchema>;

const educationSchema = z.object({
    education: z.array(z.object({
        _id: z.string().optional(),
        institution: z.string().min(1, 'Institution name required'),
        degree: z.string().min(1, 'Degree required'),
        field: z.string().min(1, 'Field of study required'),
        startDate: z.string(),
        endDate: z.string().optional(),
        current: z.boolean(),
        description: z.string().optional()
    }))
});

type EducationFormData = z.infer<typeof educationSchema>;

const skillsSchema = z.object({
    skills: z.array(z.string()).min(1, 'Add at least one skill')
});

type SkillsFormData = z.infer<typeof skillsSchema>;

const certificationsSchema = z.object({
    certifications: z.array(z.object({
        _id: z.string().optional(),
        name: z.string().min(1, 'Certification name required'),
        issuer: z.string().min(1, 'Issuer required'),
        issueDate: z.string(),
        expiryDate: z.string().optional(),
        credentialId: z.string().optional(),
        credentialUrl: z.string().url().optional().or(z.literal('')),
        description: z.string().optional()
    }))
});

type CertificationsFormData = z.infer<typeof certificationsSchema>;

// Helper function to format date for input fields
const formatDateForInput = (dateString?: string): string => {
    if (!dateString) return '';

    try {
        // Handle ISO format (2025-10-01T00:00:00.000Z)
        if (dateString.includes('T')) {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        }

        // Already in yyyy-MM-dd format
        return dateString;
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
};

// Verification Badge Component
const VerificationBadge: React.FC<{ status?: string }> = ({ status = 'none' }) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'full':
                return {
                    label: 'Verified',
                    icon: <ShieldCheck className="w-4 h-4" />,
                    color: 'text-green-600 dark:text-green-400',
                    bgColor: 'bg-green-50 dark:bg-green-900/20',
                    borderColor: 'border-green-200 dark:border-green-800'
                };
            case 'partial':
                return {
                    label: 'Partially Verified',
                    icon: <Clock className="w-4 h-4" />,
                    color: 'text-amber-600 dark:text-amber-400',
                    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
                    borderColor: 'border-amber-200 dark:border-amber-800'
                };
            default:
                return {
                    label: 'Not Verified',
                    icon: <AlertCircle className="w-4 h-4" />,
                    color: 'text-gray-600 dark:text-gray-400',
                    bgColor: 'bg-gray-50 dark:bg-gray-800',
                    borderColor: 'border-gray-200 dark:border-gray-700'
                };
        }
    };

    const config = getStatusConfig();

    return (
        <div className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${config.bgColor} ${config.color}`}>
                    {config.icon}
                </div>
                <div className="flex-1">
                    <h4 className={`font-medium ${config.color}`}>{config.label}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {status === 'full'
                            ? 'Your profile is fully verified'
                            : status === 'partial'
                                ? 'Complete verification for full benefits'
                                : 'Verify your profile to build trust'
                        }
                    </p>
                </div>
                {status !== 'full' && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = '/verify'}
                    >
                        Verify Now
                    </Button>
                )}
            </div>
        </div>
    );
};

// Section Components
const CandidateBasicInfoSection = ({ form, loading }: { form: any, loading: boolean }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} disabled={loading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                                <div className="flex items-center">
                                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                    <Input placeholder="john@example.com" {...field} disabled={loading} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                                <div className="flex items-center">
                                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                                    <Input placeholder="City, Country" {...field} disabled={loading} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                                <div className="flex items-center">
                                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                                    <Input placeholder="+1 (555) 123-4567" {...field} disabled={loading} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Personal Website</FormLabel>
                            <FormControl>
                                <div className="flex items-center">
                                    <Globe className="w-4 h-4 text-gray-400 mr-2" />
                                    <Input placeholder="https://example.com" {...field} disabled={loading} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                                <Input
                                    type="date"
                                    {...field}
                                    value={formatDateForInput(field.value)}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    disabled={loading}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>About Me</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Tell us about yourself, your experience, and your goals..."
                                className="min-h-[120px]"
                                {...field}
                                disabled={loading}
                            />
                        </FormControl>
                        <FormDescription>
                            Write a compelling bio that highlights your experience and skills
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};

const CandidateExperienceSection = ({ form, loading }: { form: any, loading: boolean }) => {
    const experiences = form.watch('experience') || [];

    const addExperience = () => {
        const currentExperiences = form.getValues('experience') || [];
        form.setValue('experience', [...currentExperiences, {
            company: '',
            position: '',
            startDate: '',
            endDate: '',
            current: false,
            description: '',
            skills: []
        }]);
    };

    const removeExperience = (index: number) => {
        const currentExperiences = form.getValues('experience') || [];
        const newExperiences = currentExperiences.filter((_: any, i: number) => i !== index);
        form.setValue('experience', newExperiences);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Work Experience</h3>
                    <p className="text-sm text-gray-500">Your professional work history</p>
                </div>
                <Button type="button" onClick={addExperience} variant="outline" disabled={loading}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Experience
                </Button>
            </div>

            {experiences.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">No work experience added yet</h4>
                    <p className="text-sm text-gray-500 mb-4">
                        Add your professional experience to showcase your career journey
                    </p>
                    <Button type="button" onClick={addExperience} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Experience
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {experiences.map((exp: any, index: number) => (
                        <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Building className="w-4 h-4 text-gray-400" />
                                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{exp.company || 'New Company'}</h4>
                                    </div>
                                    <p className="text-sm text-gray-500">{exp.position || 'Position'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-500">
                                            {exp.startDate || 'Start date'} - {exp.current ? 'Present' : exp.endDate || 'End date'}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={() => removeExperience(index)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    disabled={loading}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name={`experience.${index}.company`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Company *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Company name" {...field} disabled={loading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`experience.${index}.position`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Position *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Job title" {...field} disabled={loading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`experience.${index}.startDate`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Start Date *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    {...field}
                                                    value={formatDateForInput(field.value)}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                    disabled={loading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex items-center gap-4">
                                    <FormField
                                        control={form.control}
                                        name={`experience.${index}.current`}
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        disabled={loading}
                                                    />
                                                </FormControl>
                                                <FormLabel className="text-xs cursor-pointer">Currently working here</FormLabel>
                                            </FormItem>
                                        )}
                                    />

                                    {!form.watch(`experience.${index}.current`) && (
                                        <FormField
                                            control={form.control}
                                            name={`experience.${index}.endDate`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel className="text-xs">End Date</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            {...field}
                                                            value={formatDateForInput(field.value)}
                                                            onChange={(e) => field.onChange(e.target.value)}
                                                            disabled={loading}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="mt-4">
                                <FormField
                                    control={form.control}
                                    name={`experience.${index}.description`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Describe your responsibilities and achievements..."
                                                    className="min-h-[80px]"
                                                    {...field}
                                                    disabled={loading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CandidateEducationSection = ({ form, loading }: { form: any, loading: boolean }) => {
    const education = form.watch('education') || [];

    const addEducation = () => {
        const currentEducation = form.getValues('education') || [];
        form.setValue('education', [...currentEducation, {
            institution: '',
            degree: '',
            field: '',
            startDate: '',
            endDate: '',
            current: false,
            description: ''
        }]);
    };

    const removeEducation = (index: number) => {
        const currentEducation = form.getValues('education') || [];
        const newEducation = currentEducation.filter((_: any, i: number) => i !== index);
        form.setValue('education', newEducation);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Education</h3>
                    <p className="text-sm text-gray-500">Your educational background</p>
                </div>
                <Button type="button" onClick={addEducation} variant="outline" disabled={loading}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Education
                </Button>
            </div>

            {education.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <GraduationCap className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">No education added yet</h4>
                    <p className="text-sm text-gray-500 mb-4">
                        Add your educational background to showcase your qualifications
                    </p>
                    <Button type="button" onClick={addEducation} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Education
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {education.map((edu: any, index: number) => (
                        <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Building className="w-4 h-4 text-gray-400" />
                                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{edu.institution || 'New Institution'}</h4>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {edu.degree || 'Degree'} in {edu.field || 'Field of study'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-500">
                                            {edu.startDate || 'Start date'} - {edu.current ? 'Present' : edu.endDate || 'End date'}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={() => removeEducation(index)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    disabled={loading}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name={`education.${index}.institution`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Institution *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="University name" {...field} disabled={loading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`education.${index}.degree`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Degree *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Bachelor's, Master's, etc." {...field} disabled={loading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`education.${index}.field`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Field of Study *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Computer Science, Business, etc." {...field} disabled={loading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`education.${index}.startDate`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Start Date *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    {...field}
                                                    value={formatDateForInput(field.value)}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                    disabled={loading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex items-center gap-4">
                                    <FormField
                                        control={form.control}
                                        name={`education.${index}.current`}
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        disabled={loading}
                                                    />
                                                </FormControl>
                                                <FormLabel className="text-xs cursor-pointer">Currently studying</FormLabel>
                                            </FormItem>
                                        )}
                                    />

                                    {!form.watch(`education.${index}.current`) && (
                                        <FormField
                                            control={form.control}
                                            name={`education.${index}.endDate`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel className="text-xs">End Date</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            {...field}
                                                            value={formatDateForInput(field.value)}
                                                            onChange={(e) => field.onChange(e.target.value)}
                                                            disabled={loading}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CandidateSkillsSection = ({ form, loading }: { form: any, loading: boolean }) => {
    const [newSkill, setNewSkill] = useState('');
    const skills = form.watch('skills') || [];

    const addSkill = () => {
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            form.setValue('skills', [...skills, newSkill.trim()]);
            setNewSkill('');
        }
    };

    const removeSkill = (skillToRemove: string) => {
        form.setValue('skills', skills.filter((skill: string) => skill !== skillToRemove));
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Skills</h3>
                <p className="text-sm text-gray-500">Add your professional skills and expertise</p>
            </div>

            <div className="flex gap-2">
                <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addSkill();
                        }
                    }}
                    placeholder="Type a skill and press Enter"
                    className="flex-1"
                    disabled={loading}
                />
                <Button type="button" onClick={addSkill} variant="outline" disabled={loading}>
                    Add
                </Button>
            </div>

            {skills.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Sparkles className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">No skills added yet</h4>
                    <p className="text-sm text-gray-500">
                        Add your skills to showcase your expertise
                    </p>
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1.5">
                            {skill}
                            <button
                                type="button"
                                onClick={() => removeSkill(skill)}
                                className="ml-2 hover:text-red-600"
                                disabled={loading}
                            >
                                ×
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
};

const CandidateCertificationsSection = ({ form, loading }: { form: any, loading: boolean }) => {
    const certifications = form.watch('certifications') || [];

    const addCertification = () => {
        const currentCerts = form.getValues('certifications') || [];
        form.setValue('certifications', [...currentCerts, {
            name: '',
            issuer: '',
            issueDate: '',
            expiryDate: '',
            credentialId: '',
            credentialUrl: '',
            description: ''
        }]);
    };

    const removeCertification = (index: number) => {
        const currentCerts = form.getValues('certifications') || [];
        const newCerts = currentCerts.filter((_: any, i: number) => i !== index);
        form.setValue('certifications', newCerts);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Certifications</h3>
                    <p className="text-sm text-gray-500">Your professional certifications and licenses</p>
                </div>
                <Button type="button" onClick={addCertification} variant="outline" disabled={loading}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Certification
                </Button>
            </div>

            {certifications.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Award className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">No certifications added yet</h4>
                    <p className="text-sm text-gray-500 mb-4">
                        Add your certifications to showcase your qualifications
                    </p>
                    <Button type="button" onClick={addCertification} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Certification
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {certifications.map((cert: any, index: number) => (
                        <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{cert.name || 'New Certification'}</h4>
                                    <p className="text-sm text-gray-500">{cert.issuer || 'Issuer'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-500">
                                            Issued: {cert.issueDate || 'Date'} • Expires: {cert.expiryDate || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={() => removeCertification(index)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    disabled={loading}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name={`certifications.${index}.name`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Certification Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., AWS Certified Solutions Architect" {...field} disabled={loading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`certifications.${index}.issuer`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Issuing Organization *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Amazon Web Services" {...field} disabled={loading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`certifications.${index}.issueDate`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Issue Date *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    {...field}
                                                    value={formatDateForInput(field.value)}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                    disabled={loading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`certifications.${index}.expiryDate`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Expiry Date</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    {...field}
                                                    value={formatDateForInput(field.value)}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                    disabled={loading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`certifications.${index}.credentialId`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Credential ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="License or certificate number" {...field} disabled={loading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`certifications.${index}.credentialUrl`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Credential URL</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center">
                                                    <Link className="w-4 h-4 text-gray-400 mr-2" />
                                                    <Input placeholder="https://verify.example.com/cert" {...field} disabled={loading} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CandidateCVSection = ({ loading, profile }: { loading: boolean, profile: CandidateProfile | null }) => {
    const [uploadingCV, setUploadingCV] = useState(false);
    const [cvs, setCVs] = useState<CV[]>([]);
    const [primaryCV, setPrimaryCV] = useState<CV | null>(null);

    useEffect(() => {
        if (profile?.cvs) {
            setCVs(profile.cvs);
            const primary = profile.cvs.find(cv => cv.isPrimary);
            if (primary) setPrimaryCV(primary);
        }
    }, [profile]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validation = candidateService.validateCVFiles([file]);
        if (!validation.valid) {
            toast.error(validation.errors.join(', '));
            return;
        }

        try {
            setUploadingCV(true);
            const uploadedCV = await candidateService.uploadSingleCV(file);
            setCVs(prev => [uploadedCV, ...prev]);
            toast.success('CV uploaded successfully');
            event.target.value = '';
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload CV');
        } finally {
            setUploadingCV(false);
        }
    };

    const handleSetPrimary = async (cvId: string) => {
        try {
            await candidateService.setPrimaryCV(cvId);
            setCVs(prev => prev.map(cv => ({
                ...cv,
                isPrimary: cv._id === cvId
            })));
            const cv = cvs.find(c => c._id === cvId);
            if (cv) setPrimaryCV(cv);
            toast.success('Primary CV updated');
        } catch (error: any) {
            toast.error(error.message || 'Failed to set primary CV');
        }
    };

    const handleDeleteCV = async (cvId: string) => {
        if (!confirm('Are you sure you want to delete this CV?')) return;

        try {
            await candidateService.deleteCV(cvId);
            setCVs(prev => prev.filter(cv => cv._id !== cvId));
            if (primaryCV?._id === cvId) {
                setPrimaryCV(null);
            }
            toast.success('CV deleted successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete CV');
        }
    };

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <div className="p-6 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                <Upload className="w-12 h-12 mx-auto text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Upload Your CV</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Supported formats: PDF, DOC, DOCX, TXT, RTF • Max 100MB
                </p>
                <input
                    type="file"
                    id="cv-upload"
                    accept=".pdf,.doc,.docx,.txt,.rtf,.odt"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={loading || uploadingCV}
                />
                <label htmlFor="cv-upload">
                    <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer"
                        disabled={loading || uploadingCV}
                    >
                        {uploadingCV ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Choose File
                            </>
                        )}
                    </Button>
                </label>
            </div>

            {/* CV List */}
            {cvs.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Your CVs ({cvs.length})</h3>
                    <div className="space-y-3">
                        {cvs.map((cv) => (
                            <div key={cv._id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium text-gray-900 dark:text-gray-100">{cv.originalName}</h4>
                                            {cv.isPrimary && (
                                                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                    Primary
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                            <span>{candidateService.getCVFileExtension(cv)}</span>
                                            <span>•</span>
                                            <span>{candidateService.getCVFileSize(cv)}</span>
                                            <span>•</span>
                                            <span>Uploaded: {format(new Date(cv.uploadedAt), 'MMM d, yyyy')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => candidateService.viewCV(cv._id)}
                                            disabled={loading}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => candidateService.downloadCV(cv._id)}
                                            disabled={loading}
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                        {!cv.isPrimary && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSetPrimary(cv._id)}
                                                disabled={loading}
                                            >
                                                <Check className="w-4 h-4 mr-1" />
                                                Set Primary
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => handleDeleteCV(cv._id)}
                                            disabled={loading || cv.isPrimary}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {cvs.length === 0 && !uploadingCV && (
                <div className="p-6 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">No CVs uploaded yet</h4>
                    <p className="text-sm text-gray-500">
                        Upload your first CV to apply for jobs
                    </p>
                </div>
            )}
        </div>
    );
};

const CandidatePortfolioSection = ({ loading, profile }: { loading: boolean, profile: CandidateProfile | null }) => {
    const portfolio = profile?.portfolio || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Portfolio</h3>
                    <p className="text-sm text-gray-500">Showcase your projects and work samples</p>
                </div>
                <Button type="button" variant="outline" disabled={loading}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                </Button>
            </div>

            {portfolio.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">No portfolio projects yet</h4>
                    <p className="text-sm text-gray-500 mb-4">
                        Add your projects to showcase your work
                    </p>
                    <Button type="button" variant="outline" disabled={loading}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Project
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {portfolio.map((project, index) => (
                        <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{project.title}</h4>
                            {project.description && (
                                <p className="text-sm text-gray-500 mb-3">{project.description}</p>
                            )}
                            {project.skills && project.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {project.skills.map((skill, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            {project.url && (
                                <Button type="button" variant="outline" size="sm">
                                    <a href={project.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                        <Link className="w-3 h-3 mr-1" />
                                        View Project
                                    </a>
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const CandidateProfileEditForm: React.FC = () => {
    const { role, mode, getCardStyle } = useTheme();
    const [activeTab, setActiveTab] = useState('basic');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<CandidateProfile | null>(null);
    const [avatar, setAvatar] = useState<string | CloudinaryImage | null>(null);
    const [cover, setCover] = useState<string | CloudinaryImage | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);

    // Forms
    const basicInfoForm = useForm<BasicInfoFormData>({
        resolver: zodResolver(basicInfoSchema),
        defaultValues: {
            name: '',
            email: '',
            role: '',
            bio: '',
            location: '',
            phone: '',
            website: '',
            dateOfBirth: '',
            gender: undefined
        }
    });

    const experienceForm = useForm<ExperienceFormData>({
        resolver: zodResolver(experienceSchema),
        defaultValues: {
            experience: []
        }
    });

    const educationForm = useForm<EducationFormData>({
        resolver: zodResolver(educationSchema),
        defaultValues: {
            education: []
        }
    });

    const skillsForm = useForm<SkillsFormData>({
        resolver: zodResolver(skillsSchema),
        defaultValues: {
            skills: []
        }
    });

    const certificationsForm = useForm<CertificationsFormData>({
        resolver: zodResolver(certificationsSchema),
        defaultValues: {
            certifications: []
        }
    });

    // Load candidate data
    useEffect(() => {
        loadCandidateData();
    }, []);

    const loadCandidateData = async () => {
        try {
            setLoading(true);

            // Load candidate data
            const candidateData = await candidateService.getProfile();
            setProfile(candidateData);

            // Load user profile for avatar/cover
            const userData = await profileService.getProfile();
            setUserProfile(userData);

            // Handle undefined values by providing defaults
            setAvatar(userData.avatar || null);
            setCover(userData.cover || null);

            // Populate all forms with candidate data
            basicInfoForm.reset({
                name: candidateData.name,
                email: candidateData.email,
                role: candidateData.role,
                bio: candidateData.bio || '',
                location: candidateData.location || '',
                phone: candidateData.phone || '',
                website: candidateData.website || '',
                dateOfBirth: candidateData.dateOfBirth || '',
                gender: candidateData.gender
            });

            experienceForm.reset({
                experience: candidateData.experience || []
            });

            educationForm.reset({
                education: candidateData.education || []
            });

            skillsForm.reset({
                skills: candidateData.skills || []
            });

            certificationsForm.reset({
                certifications: candidateData.certifications || []
            });

        } catch (error) {
            toast.error('Failed to load profile data');
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    // Avatar/Cover handlers
    const handleAvatarComplete = async (cloudinaryImage: CloudinaryImage, thumbnailUrl?: string) => {
        try {
            // Refresh user profile to get the new avatar
            const updatedProfile = await profileService.getProfile();
            setUserProfile(updatedProfile);
            setAvatar(cloudinaryImage);
            toast.success('Profile picture updated successfully!');
        } catch (error) {
            console.error('Failed to refresh profile data:', error);
        }
    };

    const handleCoverComplete = async (cloudinaryImage: CloudinaryImage, thumbnailUrl?: string) => {
        try {
            // Refresh user profile to get the new cover
            const updatedProfile = await profileService.getProfile();
            setUserProfile(updatedProfile);
            setCover(cloudinaryImage);
            toast.success('Cover photo updated successfully!');
        } catch (error) {
            console.error('Failed to refresh profile data:', error);
        }
    };

    const handleAvatarDelete = async () => {
        try {
            // Refresh user profile after deletion
            const updatedProfile = await profileService.getProfile();
            setUserProfile(updatedProfile);
            setAvatar(null);
            toast.success('Profile picture removed');
        } catch (error) {
            console.error('Failed to refresh profile data:', error);
        }
    };

    const handleCoverDelete = async () => {
        try {
            // Refresh user profile after deletion
            const updatedProfile = await profileService.getProfile();
            setUserProfile(updatedProfile);
            setCover(null);
            toast.success('Cover photo removed');
        } catch (error) {
            console.error('Failed to refresh profile data:', error);
        }
    };

    const handleAvatarError = (type: 'avatar' | 'cover', error: any) => {
        console.error(`Avatar uploader error for ${type}:`, error);
        toast.error(`Failed to upload ${type === 'avatar' ? 'profile picture' : 'cover photo'}`);
    };

    const handleSaveSection = async (section: string, data: any) => {
        try {
            setSaving(true);
            await candidateService.updateProfile(data);
            toast.success(`${section} updated successfully`);
            // Refresh data after save
            setTimeout(() => loadCandidateData(), 500);
        } catch (error: any) {
            console.error(`${section} update error:`, error);
            toast.error(`Failed to update ${section}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-gray-500">Loading your profile...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Verification Status */}
            <Card style={getCardStyle()}>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">{profile?.name}</h1>
                            <p className="text-muted-foreground">{profile?.role}</p>
                        </div>
                        <div className="w-full sm:w-auto">
                            <VerificationBadge status={profile?.verificationStatus} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Form Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid grid-cols-4 w-full p-1 bg-muted rounded-lg">
                    <TabsTrigger value="basic" className="flex items-center gap-2 justify-center px-3 py-2 text-sm">
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">Basic</span>
                        <span className="sm:hidden">Basic</span>
                    </TabsTrigger>
                    <TabsTrigger value="education" className="flex items-center gap-2 justify-center px-3 py-2 text-sm">
                        <GraduationCap className="w-4 h-4" />
                        <span className="hidden sm:inline">Education & Experience</span>
                        <span className="sm:hidden">Edu & Exp</span>
                    </TabsTrigger>
                    <TabsTrigger value="skills" className="flex items-center gap-2 justify-center px-3 py-2 text-sm">
                        <Sparkles className="w-4 h-4" />
                        <span>Skills</span>
                    </TabsTrigger>
                    <TabsTrigger value="portfolio" className="flex items-center gap-2 justify-center px-3 py-2 text-sm">
                        <FileText className="w-4 h-4" />
                        <span className="hidden sm:inline">CV & Portfolio</span>
                        <span className="sm:hidden">CV</span>
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Basic Info + Avatar Uploader */}
                <TabsContent value="basic" className="space-y-6">
                    {/* Avatar Uploader Card */}
                    <Card style={getCardStyle()}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Image className="w-5 h-5" />
                                Profile Media
                            </CardTitle>
                            <CardDescription>
                                Upload your profile photo and optional cover image.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AvatarUploader
                                currentAvatar={avatar as any}
                                currentCover={cover as any}
                                onAvatarComplete={handleAvatarComplete}
                                onCoverComplete={handleCoverComplete}
                                onAvatarDelete={handleAvatarDelete}
                                onCoverDelete={handleCoverDelete}
                                onError={handleAvatarError}
                                type="both"
                                size="lg"
                                showHelperText={true}
                                showDeleteButtons={true}
                                maxFileSize={{ avatar: 5, cover: 10 }}
                                allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
                                aspectRatio={{ avatar: '1:1', cover: '16:9' }}
                                className="max-w-4xl"
                            />
                        </CardContent>
                    </Card>

                    {/* Basic Information Card */}
                    <Card style={getCardStyle()}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Basic Information
                            </CardTitle>
                            <CardDescription>
                                Your personal details and contact information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...basicInfoForm}>
                                <form onSubmit={basicInfoForm.handleSubmit((data) => handleSaveSection('Basic Information', data))} className="space-y-6">
                                    <CandidateBasicInfoSection form={basicInfoForm} loading={loading} />
                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" disabled={saving || loading}>
                                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Basic Information
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 2: Education & Experience */}
                <TabsContent value="education" className="space-y-6">
                    {/* Education Card */}
                    <Card style={getCardStyle()}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GraduationCap className="w-5 h-5" />
                                Education
                            </CardTitle>
                            <CardDescription>
                                Your educational background and qualifications
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...educationForm}>
                                <form onSubmit={educationForm.handleSubmit((data) => handleSaveSection('Education', data))} className="space-y-6">
                                    <CandidateEducationSection form={educationForm} loading={loading} />
                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" disabled={saving || loading}>
                                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Education
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    {/* Experience Card */}
                    <Card style={getCardStyle()}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5" />
                                Work Experience
                            </CardTitle>
                            <CardDescription>
                                Your professional work history and career journey
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...experienceForm}>
                                <form onSubmit={experienceForm.handleSubmit((data) => handleSaveSection('Experience', data))} className="space-y-6">
                                    <CandidateExperienceSection form={experienceForm} loading={loading} />
                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" disabled={saving || loading}>
                                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Experience
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 3: Skills & Certifications */}
                <TabsContent value="skills" className="space-y-6">
                    {/* Skills Card */}
                    <Card style={getCardStyle()}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                Skills
                            </CardTitle>
                            <CardDescription>
                                Your professional skills and expertise areas
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...skillsForm}>
                                <form onSubmit={skillsForm.handleSubmit((data) => handleSaveSection('Skills', data))} className="space-y-6">
                                    <CandidateSkillsSection form={skillsForm} loading={loading} />
                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" disabled={saving || loading}>
                                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Skills
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    {/* Certifications Card */}
                    <Card style={getCardStyle()}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="w-5 h-5" />
                                Certifications
                            </CardTitle>
                            <CardDescription>
                                Your professional certifications and licenses
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...certificationsForm}>
                                <form onSubmit={certificationsForm.handleSubmit((data) => handleSaveSection('Certifications', data))} className="space-y-6">
                                    <CandidateCertificationsSection form={certificationsForm} loading={loading} />
                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" disabled={saving || loading}>
                                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Certifications
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 4: CV & Portfolio */}
                <TabsContent value="portfolio" className="space-y-6">
                    {/* CV Management Card */}
                    <Card style={getCardStyle()}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                CV Management
                            </CardTitle>
                            <CardDescription>
                                Upload and manage your CVs for job applications
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CandidateCVSection loading={loading} profile={profile} />
                        </CardContent>
                    </Card>

                    {/* Portfolio Card */}
                    <Card style={getCardStyle()}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5" />
                                Portfolio
                            </CardTitle>
                            <CardDescription>
                                Showcase your projects and work samples
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CandidatePortfolioSection loading={loading} profile={profile} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default CandidateProfileEditForm;