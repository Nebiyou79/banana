/* eslint-disable @typescript-eslint/no-explicit-any */
// components/Proposal/ProposalList.tsx
import React, { useState } from 'react';
import { Proposal } from '@/services/proposalService';
import ProposalCard from './ProposalCard';
import { Grid, List, Search, ArrowUpDown } from 'lucide-react';

interface Props {
  proposals: Proposal[];
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onSendMessage?: (freelancerId: string) => void;
  showActions?: boolean;
  showTenderInfo?: boolean;
  title?: string;
  emptyMessage?: string;
  loading?: boolean;
}

const ProposalList: React.FC<Props> = ({
  proposals,
  onAccept,
  onReject,
  onView,
  onEdit,
  showActions = true,
  showTenderInfo = false,
  title = 'Proposals',
  emptyMessage = 'No proposals found',
  loading = false
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'timeline'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort proposals
  const filteredProposals = proposals
    .filter(proposal => {
      const matchesSearch = searchTerm === '' || 
        proposal.freelancerId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.proposalText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (proposal.tenderId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      
      const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'amount':
          aValue = a.bidAmount;
          bValue = b.bidAmount;
          break;
        case 'timeline':
          // Convert timeline to days for sorting
          const timelineOrder = ['1-2 weeks', '2-4 weeks', '1-2 months', '2-3 months', '3+ months'];
          aValue = timelineOrder.indexOf(a.estimatedTimeline);
          bValue = timelineOrder.indexOf(b.estimatedTimeline);
          break;
        case 'date':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const sortOptions = [
    { value: 'date', label: 'Date' },
    { value: 'amount', label: 'Bid Amount' },
    { value: 'timeline', label: 'Timeline' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <div className="h-10 w-32 bg-white/5 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-white/10 rounded mb-4"></div>
              <div className="h-4 bg-white/10 rounded mb-2"></div>
              <div className="h-4 bg-white/10 rounded w-3/4 mb-6"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-white/10 rounded w-1/3"></div>
                <div className="h-4 bg-white/10 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">{title} ({filteredProposals.length})</h2>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <List size={18} />
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="pl-10 pr-8 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  Sort by {option.label}
                </option>
              ))}
            </select>
            <ArrowUpDown size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="absolute right-2 top-2.5 text-gray-400 hover:text-white"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search proposals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      {filteredProposals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">{emptyMessage}</div>
          <p className="text-gray-500">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredProposals.map((proposal) => (
            <ProposalCard
              key={proposal._id}
              proposal={proposal}
              onAccept={onAccept}
              onReject={onReject}
              onView={onView}
              onEdit={onEdit}
              compact={viewMode === 'list'}
              showActions={showActions}
              showTenderInfo={showTenderInfo}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProposalList;