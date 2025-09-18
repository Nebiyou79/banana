// components/Tender/TenderForm.tsx
import React, { useState } from 'react';
import { Tender } from '@/services/tenderService';
import { X, Upload, Calendar, DollarSign, MapPin, Tag } from 'lucide-react';

interface Props {
  initial?: Partial<Tender>;
  onSubmit: (payload: {
    title: string;
    description: string;
    budget: number;
    deadline: string;
    category: string;
    location?: string;
    attachments?: string[];
  }) => Promise<void> | void;
  submitLabel?: string;
  disabled?: boolean;
  onCancel?: () => void;
}

const TenderForm: React.FC<Props> = ({ 
  initial = {}, 
  onSubmit, 
  submitLabel = 'Create Tender', 
  disabled = false,
  onCancel 
}) => {
  const [title, setTitle] = useState(initial.title ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [budget, setBudget] = useState<number | ''>(initial.budget ?? '');
  const [deadline, setDeadline] = useState(
    initial.deadline ? new Date(initial.deadline).toISOString().split('T')[0] : ''
  );
  const [category, setCategory] = useState(initial.category ?? 'other');
  const [location, setLocation] = useState(initial.location ?? '');
  const [attachments, setAttachments] = useState<string[]>(initial.attachments ?? []);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!budget || budget <= 0) newErrors.budget = 'Valid budget is required';
    if (!deadline) newErrors.deadline = 'Deadline is required';
    if (deadline && new Date(deadline) <= new Date()) {
      newErrors.deadline = 'Deadline must be in the future';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await onSubmit({
        title,
        description,
        budget: Number(budget),
        deadline,
        category,
        location: location || undefined,
        attachments
      });
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Simulate file upload - in real app, you'd upload to your server
    const files = e.target.files;
    if (files && files.length > 0) {
      const newAttachments = [...attachments];
      for (let i = 0; i < files.length; i++) {
        // This would be replaced with actual file upload logic
        const fakeUrl = `https://example.com/uploads/${Date.now()}-${files[i].name}`;
        newAttachments.push(fakeUrl);
      }
      setAttachments(newAttachments);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const categories = [
    { value: 'construction', label: 'Construction' },
    { value: 'IT', label: 'IT Services' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'supplies', label: 'Supplies' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-md p-6 rounded-2xl border border-white/10">
      {onCancel && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{submitLabel}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            <X size={24} />
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Tender Title *
            </label>
            <input
              id="title"
              className={`w-full p-3 rounded-lg bg-white/5 border ${
                errors.title ? 'border-rose-500' : 'border-white/10'
              } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Enter tender title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={disabled || loading}
            />
            {errors.title && <p className="mt-1 text-sm text-rose-400">{errors.title}</p>}
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
              Category *
            </label>
            <div className="relative">
              <Tag size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <select
                id="category"
                className="w-full p-3 pl-10 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={disabled || loading}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-300 mb-2">
              Budget (USD) *
            </label>
            <div className="relative">
              <DollarSign size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                id="budget"
                type="number"
                min="0"
                step="0.01"
                className={`w-full p-3 pl-10 rounded-lg bg-white/5 border ${
                  errors.budget ? 'border-rose-500' : 'border-white/10'
                } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter budget amount"
                value={budget}
                onChange={(e) => setBudget(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={disabled || loading}
              />
            </div>
            {errors.budget && <p className="mt-1 text-sm text-rose-400">{errors.budget}</p>}
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-300 mb-2">
              Deadline *
            </label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                id="deadline"
                type="date"
                className={`w-full p-3 pl-10 rounded-lg bg-white/5 border ${
                  errors.deadline ? 'border-rose-500' : 'border-white/10'
                } text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={disabled || loading}
              />
            </div>
            {errors.deadline && <p className="mt-1 text-sm text-rose-400">{errors.deadline}</p>}
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
              Location
            </label>
            <div className="relative">
              <MapPin size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                id="location"
                className="w-full p-3 pl-10 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Remote, New York, etc."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={disabled || loading}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Attachments
            </label>
            <label className="flex items-center justify-center p-3 rounded-lg bg-white/5 border border-white/10 border-dashed cursor-pointer hover:bg-white/10 transition">
              <Upload size={18} className="mr-2 text-gray-400" />
              <span className="text-gray-400">Upload files</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleAttachmentUpload}
                disabled={disabled || loading}
              />
            </label>
            
            {attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <span className="text-sm text-gray-300 truncate">
                      {attachment.split('/').pop()}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
          Description *
        </label>
        <textarea
          id="description"
          className={`w-full p-3 rounded-lg bg-white/5 border ${
            errors.description ? 'border-rose-500' : 'border-white/10'
          } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="Describe the tender requirements, scope, and evaluation criteria..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          disabled={disabled || loading}
        />
        {errors.description && <p className="mt-1 text-sm text-rose-400">{errors.description}</p>}
      </div>
      
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-white/5 text-white font-medium hover:bg-white/10 transition disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={disabled || loading}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-500 hover:to-purple-500 transition disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
};

export default TenderForm;