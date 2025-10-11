// components/Proposal/ProposalForm.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreateProposalData } from '@/services/proposalService';
import { DollarSign, FileText, X, Upload, AlertCircle } from 'lucide-react';

interface Props {
  tenderId: string;
  tenderTitle: string;
  tenderBudget: number;
  initial?: Partial<CreateProposalData>;
  onSubmit: (data: CreateProposalData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const ProposalForm: React.FC<Props> = ({
  tenderId,
  tenderTitle,
  tenderBudget,
  initial = {},
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    bidAmount: initial.bidAmount || 0,
    proposalText: initial.proposalText || '',
    estimatedTimeline: initial.estimatedTimeline || '2-4 weeks',
    attachments: initial.attachments || [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newAttachment, setNewAttachment] = useState('');

  const timelineOptions = [
    '1-2 weeks',
    '2-4 weeks',
    '1-2 months',
    '2-3 months',
    '3+ months'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.bidAmount || formData.bidAmount <= 0) {
      newErrors.bidAmount = 'Bid amount must be greater than 0';
    } else if (formData.bidAmount > tenderBudget * 2) {
      newErrors.bidAmount = `Bid amount cannot exceed ${tenderBudget * 2}`;
    }

    if (!formData.proposalText.trim()) {
      newErrors.proposalText = 'Proposal text is required';
    } else if (formData.proposalText.length < 50) {
      newErrors.proposalText = 'Proposal text must be at least 50 characters';
    } else if (formData.proposalText.length > 5000) {
      newErrors.proposalText = 'Proposal text cannot exceed 5000 characters';
    }

    if (!formData.estimatedTimeline) {
      newErrors.estimatedTimeline = 'Please select an estimated timeline';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onSubmit({
        tenderId,
        ...formData
      });
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  const addAttachment = () => {
    if (newAttachment.trim() && /^https?:\/\/.+\..+$/.test(newAttachment)) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, newAttachment.trim()]
      }));
      setNewAttachment('');
      setErrors(prev => ({ ...prev, newAttachment: '' }));
    } else {
      setErrors(prev => ({ ...prev, newAttachment: 'Please enter a valid URL' }));
    }
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleAttachmentKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAttachment();
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-md rounded-2xl border border-white/10 p-6 space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Submit Proposal</h2>
        <p className="text-gray-400">For: {tenderTitle}</p>
        <p className="text-sm text-gray-400 mt-1">
          Budget: ${tenderBudget.toLocaleString()}
        </p>
      </div>

      {/* Bid Amount */}
      <div>
        <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-300 mb-2">
          Bid Amount (Birr) *
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <input
            id="bidAmount"
            type="number"
            min="0"
            step="0.01"
            className={`w-full p-3 pl-10 rounded-lg bg-white/5 border ${
              errors.bidAmount ? 'border-red-500' : 'border-white/10'
            } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Enter your bid amount"
            value={formData.bidAmount}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              bidAmount: Number(e.target.value)
            }))}
          />
        </div>
        {errors.bidAmount && (
          <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
            <AlertCircle size={14} />
            {errors.bidAmount}
          </p>
        )}
      </div>

      {/* Estimated Timeline */}
      <div>
        <label htmlFor="estimatedTimeline" className="block text-sm font-medium text-gray-300 mb-2">
          Estimated Timeline *
        </label>
        <select
          id="estimatedTimeline"
          className={`w-full p-3 rounded-lg bg-white/5 border ${
            errors.estimatedTimeline ? 'border-red-500' : 'border-white/10'
          } text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
          value={formData.estimatedTimeline}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            estimatedTimeline: e.target.value
          }))}
        >
          <option value="">Select timeline</option>
          {timelineOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.estimatedTimeline && (
          <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
            <AlertCircle size={14} />
            {errors.estimatedTimeline}
          </p>
        )}
      </div>

      {/* Proposal Text */}
      <div>
        <label htmlFor="proposalText" className="block text-sm font-medium text-gray-300 mb-2">
          Proposal Text *
        </label>
        <textarea
          id="proposalText"
          className={`w-full p-3 rounded-lg bg-white/5 border ${
            errors.proposalText ? 'border-red-500' : 'border-white/10'
          } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="Describe your approach, experience, and why you're the best fit for this project..."
          rows={8}
          value={formData.proposalText}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            proposalText: e.target.value
          }))}
        />
        <div className="flex justify-between mt-1">
          <div>
            {errors.proposalText && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.proposalText}
              </p>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {formData.proposalText.length}/5000 characters
          </p>
        </div>
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Attachments (Optional)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="url"
            className="flex-1 p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste attachment URL (Google Drive, Dropbox, etc.)"
            value={newAttachment}
            onChange={(e) => setNewAttachment(e.target.value)}
            onKeyPress={handleAttachmentKeyPress}
          />
          <button
            type="button"
            onClick={addAttachment}
            className="px-4 py-3 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition flex items-center gap-2"
          >
            <Upload size={16} />
            Add
          </button>
        </div>
        {errors.newAttachment && (
          <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
            <AlertCircle size={14} />
            {errors.newAttachment}
          </p>
        )}

        {formData.attachments.length > 0 && (
          <div className="space-y-2 mt-3">
            {formData.attachments.map((attachment, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-300 truncate flex-1 mr-2">
                  {attachment}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="p-1 text-red-400 hover:text-red-300 transition"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 transition disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-500 hover:to-purple-500 transition disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Submitting...
            </>
          ) : (
            <>
              <FileText size={18} />
              Submit Proposal
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
};

export default ProposalForm;