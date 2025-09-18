'use client';

import React, { useState } from 'react';
import { 
  DocumentTextIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface Proposal {
  id: string;
  jobTitle: string;
  company: string;
  proposedAmount: string;
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected';
  submitted: string;
  message: string;
  jobType: 'fixed' | 'hourly';
}

const FreelancerProposals: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');

  const proposals: Proposal[] = [
    {
      id: '1',
      jobTitle: 'Frontend React Developer',
      company: 'Tech Innovations Inc.',
      proposedAmount: '$60/hour',
      status: 'under_review',
      submitted: '2 days ago',
      message: 'I have 5+ years of experience with React and would love to work on this project. I\'ve built similar SaaS platforms before.',
      jobType: 'hourly'
    },
    {
      id: '2',
      jobTitle: 'Full Stack Node.js Application',
      company: 'StartupXYZ',
      proposedAmount: '$7,000',
      status: 'submitted',
      submitted: '1 week ago',
      message: 'I\'ve built similar MVPs before and can deliver within your timeline. My portfolio includes several successful Node.js projects.',
      jobType: 'fixed'
    },
    {
      id: '3',
      jobTitle: 'UI/UX Designer for Mobile App',
      company: 'Creative Minds',
      proposedAmount: '$50/hour',
      status: 'accepted',
      submitted: '3 weeks ago',
      message: 'I specialize in mobile app design and have worked on several successful applications. My design process focuses on user-centered solutions.',
      jobType: 'hourly'
    },
    {
      id: '4',
      jobTitle: 'WordPress E-commerce Site',
      company: 'Fashion Retail',
      proposedAmount: '$2,500',
      status: 'rejected',
      submitted: '1 month ago',
      message: 'I have extensive experience with WooCommerce and can create a fully functional e-commerce site within your budget.',
      jobType: 'fixed'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <DocumentTextIcon className="w-4 h-4" />;
      case 'under_review': return <ArrowPathIcon className="w-4 h-4" />;
      case 'accepted': return <CheckCircleIcon className="w-4 h-4" />;
      case 'rejected': return <XCircleIcon className="w-4 h-4" />;
      default: return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted': return 'Submitted';
      case 'under_review': return 'Under Review';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Not Selected';
      default: return status;
    }
  };

  const filteredProposals = selectedStatus === 'all' 
    ? proposals 
    : proposals.filter(proposal => proposal.status === selectedStatus);

  return (
  <DashboardLayout requiredRole="freelancer">
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Proposals</h1>
        <p className="text-gray-600">Track your job applications and proposals</p>
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Proposals
          </button>
          <button
            onClick={() => setSelectedStatus('submitted')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              selectedStatus === 'submitted'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <DocumentTextIcon className="w-4 h-4" />
            Submitted
          </button>
          <button
            onClick={() => setSelectedStatus('under_review')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              selectedStatus === 'under_review'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ArrowPathIcon className="w-4 h-4" />
            Under Review
          </button>
          <button
            onClick={() => setSelectedStatus('accepted')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              selectedStatus === 'accepted'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CheckCircleIcon className="w-4 h-4" />
            Accepted
          </button>
          <button
            onClick={() => setSelectedStatus('rejected')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              selectedStatus === 'rejected'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <XCircleIcon className="w-4 h-4" />
            Not Selected
          </button>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-6">
        {filteredProposals.map((proposal) => (
          <div key={proposal.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-800">{proposal.jobTitle}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${getStatusColor(proposal.status)}`}>
                    {getStatusIcon(proposal.status)}
                    {getStatusText(proposal.status)}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{proposal.company}</p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center">
                    <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                    {proposal.proposedAmount}
                  </span>
                  <span className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    {proposal.submitted}
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    {proposal.jobType === 'fixed' ? 'Fixed Price' : 'Hourly'}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 text-sm italic">`{proposal.message}`</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Proposal ID: {proposal.id}</span>
              <div className="flex gap-3">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  View Job
                </button>
                {proposal.status === 'submitted' && (
                  <button className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                    Withdraw
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredProposals.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <div className="w-24 h-24 mx-auto mb-6 text-gray-400">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 8h-2v2h2v-2zm0-4h-2v2h2V7zm-4 0H9v2h2V7zm-2 4h2v2H9v-2zm6 4h-2v2h2v-2zm-4 0H9v2h2v-2z"/>
              </svg>
            </div>
            <p className="text-gray-500 text-lg font-medium mb-2">No proposals found</p>
            <p className="text-gray-400 text-sm">
              {selectedStatus === 'all' 
                ? "You haven't submitted any proposals yet." 
                : `No proposals with status "${getStatusText(selectedStatus)}".`}
            </p>
          </div>
        )}
      </div>
    </div>
  </DashboardLayout>

  );
};

export default FreelancerProposals;