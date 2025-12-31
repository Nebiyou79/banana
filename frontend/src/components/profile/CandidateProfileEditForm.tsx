/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    User,
    Briefcase,
    GraduationCap,
    Award,
    Globe,
    Mail,
    Phone,
    MapPin,
    Upload,
    Save,
    Loader2,
    Shield,
    Bell,
    Link as LinkIcon,
    FileText,
    Building,
    Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

// Services
import { profileService, type Profile, type PrivacySettings, type NotificationPreferences } from '@/services/profileService';
import { candidateService, type CandidateProfile } from '@/services/candidateService';
import { roleProfileService, type UpdateCandidateProfileData } from '@/services/roleProfileService';

// Components
import AvatarUploader from '@/components/profile/AvatarUploader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Separator } from '@/components/ui/Separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';

// Validation schemas
const profileSchema = z.object({
    // Basic Info
    name: z.string().min(2, 'Name must be at least 2 characters'),
    headline: z.string().min(5, 'Headline must be at least 5 characters').optional(),
    bio: z.string().max(2000, 'Bio must be less than 2000 characters').optional(),
    location: z.string().optional(),
    phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number').optional(),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),

    // Personal Info
    dateOfBirth: z.string().optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']).optional(),

    // Social Links
    socialLinks: z.object({
        linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
        github: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
        twitter: z.string().url('Invalid Twitter URL').optional().or(z.literal(''))
    }).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const professionalSchema = z.object({
    skills: z.array(z.string()).min(1, 'Add at least one skill'),
    experience: z.array(z.object({
        company: z.string().min(1, 'Company name required'),
        position: z.string().min(1, 'Position required'),
        startDate: z.string(),
        endDate: z.string().optional(),
        current: z.boolean().default(false),
        description: z.string().optional(),
        skills: z.array(z.string())
    })),
    education: z.array(z.object({
        institution: z.string().min(1, 'Institution name required'),
        degree: z.string().min(1, 'Degree required'),
        field: z.string().min(1, 'Field of study required'),
        startDate: z.string(),
        endDate: z.string().optional(),
        current: z.boolean().default(false),
        description: z.string().optional()
    })),
    certifications: z.array(z.object({
        name: z.string().min(1, 'Certification name required'),
        issuer: z.string().min(1, 'Issuer required'),
        issueDate: z.string(),
        expiryDate: z.string().optional(),
        credentialId: z.string().optional(),
        credentialUrl: z.string().url().optional()
    }))
});

type ProfessionalFormData = z.infer<typeof professionalSchema>;

export const CandidateProfileForm: React.FC = () => {
    const [activeTab, setActiveTab] = useState('basic');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
    const [professionalData, setProfessionalData] = useState<any>(null);
    const [profileCompletion, setProfileCompletion] = useState(0);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [coverUrl, setCoverUrl] = useState('');

    // Forms
    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            socialLinks: {}
        }
    });

    const professionalForm = useForm<ProfessionalFormData>({
        resolver: zodResolver(professionalSchema) as Resolver<ProfessionalFormData, any>,
        defaultValues: {
            skills: [],
            experience: [],
            education: [],
            certifications: []
        }
    });

    // Load profile data
    useEffect(() => {
        loadProfileData();
    }, []);

    const loadProfileData = async () => {
        try {
            setLoading(true);

            // Load main profile
            const mainProfile = await profileService.getProfile();
            setProfile(mainProfile);
            setAvatarUrl(mainProfile.user.avatar || '');
            setCoverUrl(mainProfile.coverPhoto || '');

            // Load candidate-specific profile
            const candidateData = await candidateService.getProfile();
            setCandidateProfile(candidateData);

            // Load professional data
            const roleProfileData = await roleProfileService.getCandidateProfile();
            setProfessionalData(roleProfileData);

            // Load profile completion
            const completion = await profileService.getProfileCompletion();
            setProfileCompletion(completion.percentage);

            // Populate forms
            profileForm.reset({
                name: mainProfile.user.name,
                headline: mainProfile.headline,
                bio: mainProfile.bio,
                location: mainProfile.location,
                phone: mainProfile.phone,
                website: mainProfile.website,
                dateOfBirth: candidateData.dateOfBirth,
                gender: candidateData.gender,
                socialLinks: mainProfile.socialLinks || {}
            });

            professionalForm.reset({
                skills: roleProfileData.skills || [],
                experience: roleProfileData.experience || [],
                education: roleProfileData.education || [],
                certifications: roleProfileData.certifications || []
            });

        } catch (error) {
            toast.error('Failed to load profile data');
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (url: string) => {
        setAvatarUrl(url);
        try {
            await profileService.updateProfile({ avatar: url });
            toast.success('Profile picture updated');
        } catch (error) {
            toast.error('Failed to update profile picture');
        }
    };

    const handleCoverUpload = async (url: string) => {
        setCoverUrl(url);
        try {
            await profileService.updateProfile({ coverPhoto: url });
            toast.success('Cover photo updated');
        } catch (error) {
            toast.error('Failed to update cover photo');
        }
    };

    const handleProfileSubmit = async (data: ProfileFormData) => {
        try {
            setSaving(true);

            // Update main profile
            await profileService.updateProfile({
                headline: data.headline,
                bio: data.bio,
                location: data.location,
                phone: data.phone,
                website: data.website,
                socialLinks: data.socialLinks
            });

            // Update candidate profile with personal info
            await candidateService.updateProfile({
                dateOfBirth: data.dateOfBirth,
                gender: data.gender
            });

            // Refresh profile completion
            const completion = await profileService.getProfileCompletion();
            setProfileCompletion(completion.percentage);

            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error('Failed to update profile');
            console.error('Profile update error:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleProfessionalSubmit = async (data: ProfessionalFormData) => {
        try {
            setSaving(true);

            const updateData: UpdateCandidateProfileData = {
                skills: data.skills,
                // experience: data.experience,
                education: data.education,
                certifications: data.certifications
            };

            await roleProfileService.updateCandidateProfile(updateData);

            // Also update through profile service for consistency
            await profileService.updateProfessionalInfo({
                skills: data.skills,
                education: data.education,
                // experience: data.experience,
                certifications: data.certifications
            });

            toast.success('Professional information updated successfully');
        } catch (error) {
            toast.error('Failed to update professional information');
            console.error('Professional update error:', error);
        } finally {
            setSaving(false);
        }
    };

    const handlePrivacySettings = async (settings: Partial<PrivacySettings>) => {
        try {
            await profileService.updatePrivacySettings(settings);
            toast.success('Privacy settings updated');
        } catch (error) {
            toast.error('Failed to update privacy settings');
        }
    };

    const handleNotificationSettings = async (preferences: Partial<NotificationPreferences>) => {
        try {
            await profileService.updateNotificationPreferences(preferences);
            toast.success('Notification preferences updated');
        } catch (error) {
            toast.error('Failed to update notification preferences');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5" />
                <div className="relative p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-4 border-white bg-gradient-to-br from-blue-100 to-indigo-100 shadow-lg overflow-hidden">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-10 h-10 text-blue-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full shadow-lg">
                                    <Upload className="w-3 h-3" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {profile?.user.name}
                                </h1>
                                <p className="text-gray-600">{profile?.headline}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        Candidate
                                    </Badge>
                                    <Badge variant={profile?.isVerified ? "default" : "outline"}>
                                        {profile?.isVerified ? 'Verified' : 'Not Verified'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 mb-2">
                                <Progress value={profileCompletion} className="w-32 h-2" />
                                <span className="text-sm font-medium text-gray-700">
                                    {profileCompletion}%
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">Profile Completion</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Form */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="basic" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Basic Info
                    </TabsTrigger>
                    <TabsTrigger value="professional" className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Professional
                    </TabsTrigger>
                    <TabsTrigger value="cv" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        CV & Portfolio
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Privacy
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Notifications
                    </TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Basic Information
                            </CardTitle>
                            <CardDescription>
                                Update your personal information and social links
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...profileForm}>
                                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                                    {/* Media Upload */}
                                    <div className="p-4 border rounded-lg bg-gradient-to-br from-gray-50 to-white">
                                        <AvatarUploader
                                            currentAvatar={avatarUrl}
                                            currentCover={coverUrl}
                                            onAvatarComplete={handleAvatarUpload}
                                            onCoverComplete={handleCoverUpload}
                                            type="both"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Personal Information */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                Personal Information
                                            </h3>

                                            <FormField
                                                control={profileForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Full Name *</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="John Doe" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={profileForm.control}
                                                name="headline"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Professional Headline</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Senior Software Engineer" {...field} />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Your professional tagline (appears below your name)
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={profileForm.control}
                                                name="dateOfBirth"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Date of Birth</FormLabel>
                                                        <FormControl>
                                                            <Input type="date" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={profileForm.control}
                                                name="gender"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Gender</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                                        {/* Contact Information */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                Contact Information
                                            </h3>

                                            <FormField
                                                control={profileForm.control}
                                                name="location"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Location</FormLabel>
                                                        <FormControl>
                                                            <div className="flex items-center">
                                                                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                                                                <Input placeholder="City, Country" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={profileForm.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Phone Number</FormLabel>
                                                        <FormControl>
                                                            <div className="flex items-center">
                                                                <Phone className="w-4 h-4 text-gray-400 mr-2" />
                                                                <Input placeholder="+1 (555) 123-4567" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={profileForm.control}
                                                name="website"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Personal Website</FormLabel>
                                                        <FormControl>
                                                            <div className="flex items-center">
                                                                <Globe className="w-4 h-4 text-gray-400 mr-2" />
                                                                <Input placeholder="https://example.com" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    <div>
                                        <FormField
                                            control={profileForm.control}
                                            name="bio"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>About Me</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Tell us about yourself, your experience, and your goals..."
                                                            className="min-h-[120px]"
                                                            {...field}
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

                                    {/* Social Links */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                            <LinkIcon className="w-4 h-4" />
                                            Social Links
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormField
                                                control={profileForm.control}
                                                name="socialLinks.linkedin"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>LinkedIn</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="https://linkedin.com/in/username" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={profileForm.control}
                                                name="socialLinks.github"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>GitHub</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="https://github.com/username" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={profileForm.control}
                                                name="socialLinks.twitter"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Twitter</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="https://twitter.com/username" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t">
                                        <Button type="submit" disabled={saving}>
                                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Professional Tab */}
                <TabsContent value="professional" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5" />
                                Professional Information
                            </CardTitle>
                            <CardDescription>
                                Your work experience, education, and skills
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...professionalForm}>
                                <form onSubmit={professionalForm.handleSubmit(handleProfessionalSubmit)} className="space-y-6">
                                    {/* Skills Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" />
                                                Skills
                                            </h3>
                                            <Badge variant="outline">
                                                {professionalData?.skills?.length || 0} skills
                                            </Badge>
                                        </div>
                                        <FormField
                                            control={professionalForm.control}
                                            name="skills"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Add your skills</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Type a skill and press Enter"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                                    e.preventDefault();
                                                                    field.onChange([...field.value, e.currentTarget.value.trim()]);
                                                                    e.currentTarget.value = '';
                                                                }
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Press Enter to add each skill
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            {professionalForm.watch('skills').map((skill, index) => (
                                                <Badge key={index} variant="secondary" className="px-3 py-1">
                                                    {skill}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newSkills = professionalForm.getValues('skills').filter((_, i) => i !== index);
                                                            professionalForm.setValue('skills', newSkills);
                                                        }}
                                                        className="ml-2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        ×
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Experience Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                            <Building className="w-4 h-4" />
                                            Work Experience
                                        </h3>
                                        {/* Experience fields would go here - simplified for brevity */}
                                        <div className="text-sm text-gray-500">
                                            Experience management UI would be implemented here
                                        </div>
                                    </div>

                                    {/* Education Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                            <GraduationCap className="w-4 h-4" />
                                            Education
                                        </h3>
                                        {/* Education fields would go here */}
                                    </div>

                                    {/* Certifications Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                            <Award className="w-4 h-4" />
                                            Certifications
                                        </h3>
                                        {/* Certification fields would go here */}
                                    </div>

                                    <div className="flex justify-end pt-4 border-t">
                                        <Button type="submit" disabled={saving}>
                                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Professional Information
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CV & Portfolio Tab */}
                <TabsContent value="cv">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                CV & Portfolio
                            </CardTitle>
                            <CardDescription>
                                Upload your CV and showcase your portfolio projects
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* CV Management */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-900">CV Management</h3>
                                <div className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="font-medium">Upload your CV</p>
                                            <p className="text-sm text-gray-500">PDF, DOC, DOCX • Max 5MB</p>
                                        </div>
                                        <Button onClick={() => {/* Implement CV upload */ }}>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Upload CV
                                        </Button>
                                    </div>
                                    {/* CV list would go here */}
                                </div>
                            </div>

                            <Separator className="my-6" />

                            {/* Portfolio */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-900">Portfolio Projects</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Portfolio items would go here */}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Privacy Tab */}
                <TabsContent value="privacy">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Privacy Settings
                            </CardTitle>
                            <CardDescription>
                                Control who can see your information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Privacy settings controls would go here */}
                                <div className="text-center text-gray-500">
                                    Privacy settings UI would be implemented here
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                Notification Preferences
                            </CardTitle>
                            <CardDescription>
                                Manage how and when you receive notifications
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Notification settings controls would go here */}
                                <div className="text-center text-gray-500">
                                    Notification settings UI would be implemented here
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default CandidateProfileForm;