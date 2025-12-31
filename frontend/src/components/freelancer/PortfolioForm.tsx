/* eslint-disable @typescript-eslint/no-explicit-any */
// components/freelancer/PortfolioForm.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PortfolioItem, PortfolioFormData, freelancerService } from '@/services/freelancerService';
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
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { colorClasses } from '@/utils/color';

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
  }, [formData.mediaUrls]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(Array.from(files));
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    setUploadingFiles(true);
    setUploadError(null);
    
    try {
      const uploadedFiles = await freelancerService.uploadPortfolioFiles(files);
      const newUrls = uploadedFiles.map(file => file.url);
      
      handleInputChange('mediaUrls', [...formData.mediaUrls, ...newUrls]);
      setImageErrors(prev => [...prev, ...new Array(files.length).fill(false)]);
    } catch (error: any) {
      console.error('Failed to upload files:', error);
      setUploadError(error.message || 'Failed to upload files. Please try again.');
    } finally {
      setUploadingFiles(false);
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${colorClasses.text.darkNavy}`}>
                {item ? 'Edit Portfolio Project' : 'Add New Project'}
              </h2>
              <p className="text-gray-600 mt-1">
                Showcase your best work to attract potential clients
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/50 rounded-xl transition-all duration-200 hover:scale-105"
              disabled={isLoading}
              type="button"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Form Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl border border-amber-100 p-6">
              <h3 className={`text-lg font-semibold ${colorClasses.text.darkNavy} mb-4 flex items-center`}>
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-3"></div>
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder="E-commerce Website Development"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Client
                  </label>
                  <input
                    type="text"
                    value={formData.client}
                    onChange={(e) => handleInputChange('client', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder="Client name or company"
                    disabled={isLoading}
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Project Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Describe the project, your role, challenges faced, and the outcome..."
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="bg-white rounded-xl border border-amber-100 p-6">
              <h3 className={`text-lg font-semibold ${colorClasses.text.darkNavy} mb-4 flex items-center`}>
                <div className="w-3 h-3 bg-teal-500 rounded-full mr-3"></div>
                Project Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Budget
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <CurrencyDollarIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="number"
                        value={formData.budget || ''}
                        onChange={(e) => handleInputChange('budget', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="5000"
                        disabled={isLoading}
                        min="0"
                      />
                    </div>
                    <select
                      value={formData.budgetType}
                      onChange={(e) => handleInputChange('budgetType', e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent min-w-32"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duration
                  </label>
                  <div className="relative">
                    <ClockIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="3 months"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Completion Date
                  </label>
                  <div className="relative">
                    <CalendarIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      value={formatDateForInput(formData.completionDate || '')}
                      onChange={(e) => handleInputChange('completionDate', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Project URL
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      value={formData.projectUrl}
                      onChange={(e) => handleInputChange('projectUrl', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="https://live-project.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => handleInputChange('featured', e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                      disabled={isLoading}
                    />
                    <label htmlFor="featured" className="ml-2 text-sm font-semibold text-gray-700 flex items-center">
                      <StarIcon className="w-4 h-4 mr-1" />
                      Featured
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Technologies */}
            <div className="bg-white rounded-xl border border-amber-100 p-6">
              <h3 className={`text-lg font-semibold ${colorClasses.text.darkNavy} mb-4 flex items-center`}>
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                Technologies & Skills
              </h3>
              
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <TagIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={newTechnology}
                    onChange={(e) => setNewTechnology(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Add technology (React, Node.js, etc.)"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="button"
                  onClick={addTechnology}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center font-semibold disabled:opacity-50"
                  disabled={isLoading || !newTechnology.trim()}
                >
                  Add
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.technologies?.map((tech, index) => (
                  <span key={index} className="bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 px-3 py-2 rounded-lg text-sm font-semibold border border-purple-200 flex items-center group">
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTechnology(tech)}
                      className="ml-2 text-purple-500 hover:text-purple-700 transition-colors duration-200"
                      disabled={isLoading}
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Project Images */}
            <div className="bg-white rounded-xl border border-amber-100 p-6">
              <h3 className={`text-lg font-semibold ${colorClasses.text.darkNavy} mb-4 flex items-center`}>
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                Project Images *
              </h3>
              
              {uploadError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-3" />
                  <p className="text-red-700 text-sm font-medium">{uploadError}</p>
                </div>
              )}

              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer mb-6 ${
                  isDragging 
                    ? 'border-amber-500 bg-amber-50' 
                    : 'border-gray-300 hover:border-amber-400 bg-gray-50'
                } ${uploadingFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploadingFiles && document.getElementById('file-upload')?.click()}
              >
                {uploadingFiles ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-lg font-medium text-gray-700">Uploading files...</p>
                  </div>
                ) : (
                  <>
                    <CloudArrowUpIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Drag & drop your images here
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      or click to browse files
                    </p>
                    <p className="text-xs text-gray-400">
                      PNG, JPG, GIF up to 10MB each
                    </p>
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
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Image Previews ({formData.mediaUrls.length})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {formData.mediaUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                          {!imageErrors[index] ? (
                            <Image
                              src={url}
                              alt={`Project image ${index + 1}`}
                              width={200}
                              height={200}
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(index)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <PhotoIcon className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg hover:bg-red-600"
                          disabled={isLoading}
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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