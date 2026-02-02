/* eslint-disable @typescript-eslint/no-explicit-any */
// components/freelancer/PortfolioForm.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PortfolioItem, PortfolioFormData } from '@/services/freelancerService';
import { colorClasses, getTheme } from '@/utils/color';
import { 
  XMarkIcon, 
  PhotoIcon, 
  CloudArrowUpIcon,
  LinkIcon,
  TagIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  StarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CloudIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET_MEDIA = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_MEDIA;
const CLOUDINARY_BASE_URL = process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL;

interface PortfolioFormProps {
  item?: PortfolioItem | null;
  onSubmit: (data: PortfolioFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const PortfolioForm: React.FC<PortfolioFormProps> = ({ item, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState<PortfolioFormData>({
    title: '',
    description: '',
    mediaUrls: [],
    projectUrl: '',
    category: '',
    technologies: [],
    budget: undefined,
    budgetType: 'fixed',
    duration: '',
    client: '',
    completionDate: '',
    featured: false,
    visibility: 'public'
  });

  const [imageErrors, setImageErrors] = useState<boolean[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [newTechnology, setNewTechnology] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  useEffect(() => {
    // Check for dark mode preference
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);
    
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        mediaUrls: item.mediaUrls || [],
        projectUrl: item.projectUrl || '',
        category: item.category || '',
        technologies: item.technologies || [],
        budget: item.budget,
        budgetType: item.budgetType || 'fixed',
        duration: item.duration || '',
        client: item.client || '',
        completionDate: item.completionDate || '',
        featured: item.featured || false,
        visibility: item.visibility || 'public'
      });
      setImageErrors(new Array(item.mediaUrls?.length || 0).fill(false));
    }
  }, [item]);

  const theme = getTheme(isDarkMode ? 'dark' : 'light');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to submit form:', error);
    }
  };

  const handleInputChange = (field: keyof PortfolioFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError(null);
    
    const files = Array.from(e.dataTransfer.files);
    await handleFileUpload(files);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(Array.from(files));
    }
  };

  // NEW: Direct Cloudinary upload function
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET_MEDIA!);
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME!);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    setUploadingFiles(true);
    setUploadError(null);
    setUploadProgress(0);
    
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size (20MB max for images)
        if (file.size > 20 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 20MB.`);
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`File ${file.name} has invalid type. Only images are allowed.`);
        }
        
        // Upload to Cloudinary
        const url = await uploadToCloudinary(file);
        uploadedUrls.push(url);
        
        // Update progress
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }
      
      handleInputChange('mediaUrls', [...formData.mediaUrls, ...uploadedUrls]);
      setImageErrors(prev => [...prev, ...new Array(files.length).fill(false)]);
      setUploadProgress(0);
    } catch (error: any) {
      console.error('Failed to upload files:', error);
      setUploadError(error.message || 'Failed to upload files. Please try again.');
    } finally {
      setUploadingFiles(false);
      setUploadProgress(0);
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const removeImage = (index: number) => {
    const newUrls = formData.mediaUrls.filter((_, i) => i !== index);
    handleInputChange('mediaUrls', newUrls);
    setImageErrors(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageError = (index: number) => {
    setImageErrors(prev => {
      const newErrors = [...prev];
      newErrors[index] = true;
      return newErrors;
    });
  };

  const addTechnology = () => {
    if (newTechnology.trim() && !formData.technologies?.includes(newTechnology.trim())) {
      handleInputChange('technologies', [...(formData.technologies || []), newTechnology.trim()]);
      setNewTechnology('');
    }
  };

  const removeTechnology = (tech: string) => {
    handleInputChange('technologies', formData.technologies?.filter(t => t !== tech) || []);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTechnology();
    }
  };

  const categories = [
    'Web Development',
    'Mobile App',
    'UI/UX Design',
    'E-commerce',
    'API Development',
    'DevOps',
    'Consulting',
    'Data Science',
    'Machine Learning',
    'Blockchain'
  ];

  const isFormValid = formData.title.trim() && 
                     formData.description.trim() && 
                     formData.mediaUrls.length > 0;

  // NEW: Get optimized Cloudinary URL
  const getOptimizedImageUrl = (url: string, width = 400, height = 300) => {
    if (!url) return '';
    
    // If it's already a Cloudinary URL, add optimization parameters
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        return `${parts[0]}/upload/w_${width},h_${height},c_fill,q_auto,f_auto/${parts[1]}`;
      }
    }
    
    return url;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto py-8">
      <div className={`rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col border ${colorClasses.border.gray400}`}
           style={{ backgroundColor: theme.bg.primary }}>
        {/* Header */}
        <div className={`p-6 border-b rounded-t-2xl shrink-0 ${
          isDarkMode 
            ? 'bg-linear-to-r from-gray-800 to-gray-900 border-gray-700' 
            : 'bg-linear-to-r from-amber-50 to-orange-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-linear-to-r from-amber-900/30 to-amber-800/30' 
                  : 'bg-linear-to-r from-amber-100 to-amber-50'
              }`}>
                <CloudIcon className={`w-6 h-6 ${colorClasses.text.goldenMustard}`} />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${colorClasses.text.darkNavy}`}>
                  {item ? 'Edit Portfolio Project' : 'Add New Project'}
                </h2>
                <p className={`mt-1 text-sm flex items-center ${colorClasses.text.gray600}`}>
                  <CloudArrowUpIcon className="w-4 h-4 mr-1" />
                  Files upload directly to Cloudinary (20MB max per image)
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className={`p-2 rounded-xl transition-all duration-200 hover:scale-105 ${
                isDarkMode 
                  ? 'hover:bg-gray-700/50' 
                  : 'hover:bg-white/50'
              }`}
              disabled={isLoading}
              type="button"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Form Content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Basic Information */}
            <div className={`rounded-xl border p-4 md:p-6 ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white border-amber-100'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${colorClasses.text.darkNavy}`}>
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-3"></div>
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${colorClasses.text.gray800}`}>
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-3 md:px-4 py-2 md:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-sm md:text-base ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-700 text-white' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                    placeholder="E-commerce Website Development"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${colorClasses.text.gray800}`}>
                    Client
                  </label>
                  <input
                    type="text"
                    value={formData.client}
                    onChange={(e) => handleInputChange('client', e.target.value)}
                    className={`w-full px-3 md:px-4 py-2 md:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-sm md:text-base ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-700 text-white' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                    placeholder="Client name or company"
                    disabled={isLoading}
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className={`block text-sm font-semibold mb-2 ${colorClasses.text.gray800}`}>
                    Project Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className={`w-full px-3 md:px-4 py-2 md:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 resize-none text-sm md:text-base ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-700 text-white' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                    placeholder="Describe the project, your role, challenges faced, and the outcome..."
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className={`rounded-xl border p-4 md:p-6 ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white border-amber-100'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${colorClasses.text.darkNavy}`}>
                <div className="w-3 h-3 bg-teal-500 rounded-full mr-3"></div>
                Project Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${colorClasses.text.gray800}`}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`w-full px-3 md:px-4 py-2 md:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm md:text-base ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-700 text-white' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                    disabled={isLoading}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat.toLowerCase().replace(' ', '-')}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <label className={`block text-sm font-semibold mb-2 ${colorClasses.text.gray800}`}>
                    Budget
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                      <CurrencyDollarIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="number"
                        value={formData.budget || ''}
                        onChange={(e) => handleInputChange('budget', e.target.value ? Number(e.target.value) : undefined)}
                        className={`w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm md:text-base ${
                          isDarkMode 
                            ? 'bg-gray-900 border-gray-700 text-white' 
                            : 'border-gray-300 text-gray-900'
                        }`}
                        placeholder="5000"
                        disabled={isLoading}
                        min="0"
                      />
                    </div>
                    <select
                      value={formData.budgetType}
                      onChange={(e) => handleInputChange('budgetType', e.target.value)}
                      className={`px-3 md:px-4 py-2 md:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm md:text-base min-w-28 md:min-w-32 ${
                        isDarkMode 
                          ? 'bg-gray-900 border-gray-700 text-white' 
                          : 'border-gray-300 text-gray-900'
                      }`}
                      disabled={isLoading}
                    >
                      <option value="fixed">Fixed</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${colorClasses.text.gray800}`}>
                    Duration
                  </label>
                  <div className="relative">
                    <ClockIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      className={`w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm md:text-base ${
                        isDarkMode 
                          ? 'bg-gray-900 border-gray-700 text-white' 
                          : 'border-gray-300 text-gray-900'
                      }`}
                      placeholder="3 months"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${colorClasses.text.gray800}`}>
                    Completion Date
                  </label>
                  <div className="relative">
                    <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      value={formatDateForInput(formData.completionDate || '')}
                      onChange={(e) => handleInputChange('completionDate', e.target.value)}
                      className={`w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm md:text-base ${
                        isDarkMode 
                          ? 'bg-gray-900 border-gray-700 text-white' 
                          : 'border-gray-300 text-gray-900'
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <label className={`block text-sm font-semibold mb-2 ${colorClasses.text.gray800}`}>
                    Project URL
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      value={formData.projectUrl}
                      onChange={(e) => handleInputChange('projectUrl', e.target.value)}
                      className={`w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm md:text-base ${
                        isDarkMode 
                          ? 'bg-gray-900 border-gray-700 text-white' 
                          : 'border-gray-300 text-gray-900'
                      }`}
                      placeholder="https://live-project.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4 col-span-full">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => handleInputChange('featured', e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                      disabled={isLoading}
                    />
                    <label htmlFor="featured" className={`ml-2 text-sm font-semibold flex items-center ${colorClasses.text.gray800}`}>
                      <StarIcon className="w-4 h-4 mr-1" />
                      Featured Project
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Technologies */}
            <div className={`rounded-xl border p-4 md:p-6 ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white border-amber-100'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${colorClasses.text.darkNavy}`}>
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                Technologies & Skills
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <TagIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={newTechnology}
                    onChange={(e) => setNewTechnology(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm md:text-base ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-700 text-white' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                    placeholder="Add technology (React, Node.js, etc.)"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="button"
                  onClick={addTechnology}
                  className="px-4 md:px-6 py-2 md:py-3 bg-linear-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center justify-center font-semibold disabled:opacity-50 text-sm md:text-base"
                  disabled={isLoading || !newTechnology.trim()}
                >
                  Add
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.technologies?.map((tech, index) => (
                  <span key={index} className={`px-2 md:px-3 py-1 md:py-2 rounded-lg text-xs md:text-sm font-semibold border flex items-center group ${
                    isDarkMode 
                      ? 'bg-purple-900/30 text-purple-300 border-purple-700/50' 
                      : 'bg-linear-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200'
                  }`}>
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTechnology(tech)}
                      className="ml-1 md:ml-2 transition-colors duration-200"
                      disabled={isLoading}
                    >
                      <XMarkIcon className={`w-3 h-3 md:w-4 md:h-4 ${
                        isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-500 hover:text-purple-700'
                      }`} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Project Images */}
            <div className={`rounded-xl border p-4 md:p-6 ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white border-amber-100'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${colorClasses.text.darkNavy}`}>
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                Project Images *
              </h3>
              
              {uploadError && (
                <div className={`mb-4 p-3 md:p-4 rounded-xl flex items-center ${
                  isDarkMode 
                    ? 'bg-red-900/30 border-red-800' 
                    : 'bg-red-50 border-red-200'
                } border`}>
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-3" />
                  <p className={`text-sm font-medium ${
                    isDarkMode ? 'text-red-300' : 'text-red-700'
                  }`}>{uploadError}</p>
                </div>
              )}

              {/* Upload Progress */}
              {uploadingFiles && uploadProgress > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className={`font-medium ${colorClasses.text.gray800}`}>Uploading to Cloudinary...</span>
                    <span className={`font-bold ${colorClasses.text.goldenMustard}`}>{uploadProgress}%</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div 
                      className="h-full bg-linear-to-r from-amber-500 to-orange-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div
                className={`border-2 border-dashed rounded-2xl p-4 md:p-8 text-center transition-all duration-200 cursor-pointer mb-4 md:mb-6 ${
                  isDragging 
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' 
                    : isDarkMode
                    ? 'border-gray-600 hover:border-amber-500 bg-gray-900/50'
                    : 'border-gray-300 hover:border-amber-400 bg-gray-50'
                } ${uploadingFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploadingFiles && document.getElementById('file-upload')?.click()}
              >
                {uploadingFiles ? (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3 md:mb-4"></div>
                    <p className={`text-sm md:text-lg font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Uploading to Cloudinary...</p>
                  </div>
                ) : (
                  <>
                    <CloudArrowUpIcon className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                    <p className={`text-base md:text-lg font-medium mb-1 md:mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Drag & drop images here
                    </p>
                    <p className={`text-xs md:text-sm mb-3 md:mb-4 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      or click to browse files
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-xs md:text-sm">
                      <span className={`px-2 py-1 rounded-lg ${
                        isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>JPG, PNG, WebP</span>
                      <span className={`px-2 py-1 rounded-lg ${
                        isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>Max 20MB</span>
                      <span className={`px-2 py-1 rounded-lg ${
                        isDarkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-600'
                      }`}>
                        <CloudIcon className="w-3 h-3 inline mr-1" />
                        Cloudinary
                      </span>
                    </div>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  multiple
                  disabled={uploadingFiles}
                />
              </div>

              {/* Image Previews */}
              {formData.mediaUrls.length > 0 && (
                <div>
                  <p className={`text-sm font-semibold mb-3 ${colorClasses.text.gray800}`}>
                    Uploaded Images ({formData.mediaUrls.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                    {formData.mediaUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className={`aspect-square rounded-xl overflow-hidden border ${
                          isDarkMode 
                            ? 'border-gray-700 bg-gray-800' 
                            : 'border-gray-200 bg-gray-100'
                        }`}>
                          {!imageErrors[index] ? (
                            <Image
                              src={getOptimizedImageUrl(url, 200, 200)}
                              alt={`Project image ${index + 1}`}
                              width={200}
                              height={200}
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(index)}
                              unoptimized // Cloudinary handles optimization
                            />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                              <PhotoIcon className="w-6 h-6 md:w-8 md:h-8" />
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg hover:bg-red-600"
                          disabled={isLoading}
                        >
                          <XMarkIcon className="w-3 h-3 md:w-3 md:h-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          Cloudinary
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className={`p-4 md:p-6 border-t rounded-b-2xl shrink-0 ${
          isDarkMode 
            ? 'border-gray-700 bg-gray-800/50' 
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 md:gap-4">
            <button
              type="button"
              onClick={onCancel}
              className={`px-4 md:px-8 py-2 md:py-3 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 w-full sm:w-auto ${
                isDarkMode 
                  ? 'text-gray-300 bg-gray-700 border border-gray-600 hover:bg-gray-600' 
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-4 md:px-8 py-2 md:py-3 text-sm font-semibold text-white bg-linear-to-r from-amber-500 to-amber-600 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full sm:w-auto"
              disabled={isLoading || !isFormValid || uploadingFiles}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {item ? 'Updating...' : 'Adding...'}
                </div>
              ) : (
                <div className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  {item ? 'Update Project' : 'Add Project'}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioForm;