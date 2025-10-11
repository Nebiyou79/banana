// /src/components/tenders/ProposalForm.tsx
import React, { useState } from 'react';
import { CreateProposalData } from '@/services/proposalService';

interface ProposalFormProps {
  tenderId: string;
  tenderTitle: string;
  tenderBudget: number;
  onSubmit: (data: CreateProposalData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<CreateProposalData>;
}

const TIMELINE_OPTIONS = [
  '1-2 weeks',
  '2-4 weeks',
  '1-2 months',
  '2-3 months',
  '3+ months'
];

export const ProposalForm: React.FC<ProposalFormProps> = ({
  tenderId,
  tenderTitle,
  tenderBudget,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData = {}
}) => {
  const [formData, setFormData] = useState<CreateProposalData>({
    tenderId,
    bidAmount: initialData.bidAmount || 0,
    proposalText: initialData.proposalText || '',
    estimatedTimeline: initialData.estimatedTimeline || TIMELINE_OPTIONS[0],
    attachments: initialData.attachments || []
  });

  const [newAttachment, setNewAttachment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addAttachment = () => {
    if (newAttachment.trim()) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments!, newAttachment.trim()]
      }));
      setNewAttachment('');
    }
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments!.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Submit Proposal for: {tenderTitle}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bid Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bid Amount (ETB)
          </label>
          <input
            type="number"
            value={formData.bidAmount}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              bidAmount: Number(e.target.value)
            }))}
            min="0"
            max={tenderBudget * 2}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum allowed: {tenderBudget * 2} ETB
          </p>
        </div>

        {/* Estimated Timeline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Timeline
          </label>
          <select
            value={formData.estimatedTimeline}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              estimatedTimeline: e.target.value
            }))}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TIMELINE_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Proposal Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proposal Details
          </label>
          <textarea
            value={formData.proposalText}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              proposalText: e.target.value
            }))}
            rows={6}
            minLength={50}
            maxLength={5000}
            required
            placeholder="Describe your approach, experience, and why you're the best fit for this tender..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.proposalText.length}/5000 characters
          </p>
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attachments (URLs)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="url"
              value={newAttachment}
              onChange={(e) => setNewAttachment(e.target.value)}
              placeholder="https://example.com/document.pdf"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addAttachment}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Add
            </button>
          </div>
          
          {formData.attachments && formData.attachments.length > 0 && (
            <div className="space-y-1">
              {formData.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm text-blue-600 truncate">{attachment}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Submitting...' : 'Submit Proposal'}
          </button>
        </div>
      </form>
    </div>
  );
};