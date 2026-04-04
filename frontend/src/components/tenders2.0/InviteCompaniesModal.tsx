// src/components/tender/professional/InviteCompaniesModal.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCompaniesForInvitation, useInviteCompanies } from '@/hooks/useProfessionalTender';
import profileService from '@/services/profileService';
import { colorClasses } from '@/utils/color';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface InviteCompaniesModalProps {
  tenderId: string;
  isOpen: boolean;
  onClose: () => void;
  alreadyInvitedIds: string[];
}

interface StagedCompany {
  _id: string;
  name: string;
  logo?: any;
  industry?: string;
  message: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const CompanyAvatar: React.FC<{ logo?: any; name: string; size?: 'sm' | 'md' }> = ({
  logo,
  name,
  size = 'md',
}) => {
  const dim = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  const avatarSize = size === 'sm' ? 'small' : 'medium';
  const src = logo ? profileService.getOptimizedAvatarUrl(logo, avatarSize) : null;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${dim} shrink-0 rounded-full object-cover ${colorClasses.bg.gray200}`}
      />
    );
  }

  return (
    <div
      className={`${dim} shrink-0 rounded-full flex items-center justify-center font-bold
        ${colorClasses.bg.darkNavy} ${colorClasses.text.inverse}`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const InviteCompaniesModal: React.FC<InviteCompaniesModalProps> = ({
  tenderId,
  isOpen,
  onClose,
  alreadyInvitedIds,
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [staged, setStaged] = useState<StagedCompany[]>([]);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isFetching } = useCompaniesForInvitation(debouncedSearch, page, 10, {
    enabled: isOpen,
  });

  const { mutate: sendInvites, isPending: isSending } = useInviteCompanies();

  // Accumulate results for pagination
  useEffect(() => {
    if (data?.companies) {
      setAllCompanies((prev) =>
        page === 1 ? data.companies : [...prev, ...data.companies]
      );
    }
  }, [data?.companies, page]);

  // Reset on search change
  useEffect(() => {
    setPage(1);
    setAllCompanies([]);
  }, [debouncedSearch]);

  const handleStage = (company: any) => {
    if (staged.find((s) => s._id === company._id)) return;
    setStaged((prev) => [...prev, { ...company, message: '' }]);
  };

  const handleRemoveStaged = (id: string) =>
    setStaged((prev) => prev.filter((s) => s._id !== id));

  const handleMessageChange = (id: string, message: string) =>
    setStaged((prev) => prev.map((s) => (s._id === id ? { ...s, message } : s)));

  const handleSend = () => {
    const companies = staged.map((s) => ({
      companyId: s._id,
      message: s.message || undefined,
    }));
    sendInvites(
      { id: tenderId, companies },
      {
        onSuccess: () => {
          setStaged([]);
          onClose();
        },
      }
    );
  };

  const hasMore = data?.pagination
    ? page < Math.ceil(data.pagination.total / data.pagination.limit)
    : false;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative z-10 flex w-full max-w-2xl flex-col rounded-2xl shadow-2xl
          ${colorClasses.bg.white} max-h-[90vh] overflow-hidden`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b px-6 py-4
            ${colorClasses.border.gray200}`}
        >
          <div>
            <h2 className={`text-lg font-bold ${colorClasses.text.primary}`}>
              Invite Companies
            </h2>
            <p className={`text-sm ${colorClasses.text.muted}`}>
              Search and invite companies to this tender
            </p>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-2 transition-colors hover:opacity-70 ${colorClasses.text.muted}`}
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-0 overflow-hidden md:flex-row">
          {/* Left — Search Panel */}
          <div
            className={`flex flex-col border-r w-full md:w-[55%] ${colorClasses.border.gray200}`}
          >
            {/* Search Input */}
            <div className={`border-b p-4 ${colorClasses.border.gray200}`}>
              <div className="relative">
                <span
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${colorClasses.text.muted}`}
                >
                  🔍
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search companies by name…"
                  className={`w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm outline-none transition-colors
                    focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]
                    ${colorClasses.border.gray300} ${colorClasses.bg.white} ${colorClasses.text.primary}`}
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && page === 1 ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#FFD700] border-t-transparent" />
                </div>
              ) : allCompanies.length === 0 ? (
                <div className={`py-10 text-center text-sm ${colorClasses.text.muted}`}>
                  {search ? 'No companies found' : 'Start typing to search companies'}
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {allCompanies.map((company) => {
                    const isAlreadyInvited = alreadyInvitedIds.includes(company._id);
                    const isStaged = staged.some((s) => s._id === company._id);

                    return (
                      <li
                        key={company._id}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors
                          ${isAlreadyInvited ? 'opacity-60' : 'hover:bg-gray-50 cursor-pointer'}`}
                        onClick={() => !isAlreadyInvited && !isStaged && handleStage(company)}
                      >
                        <CompanyAvatar logo={company.logo} name={company.name} size="sm" />

                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm font-semibold ${colorClasses.text.primary}`}>
                            {company.name}
                          </p>
                          <p className={`truncate text-xs ${colorClasses.text.muted}`}>
                            {[company.industry, company.location].filter(Boolean).join(' · ')}
                          </p>
                        </div>

                        {isAlreadyInvited ? (
                          <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            ✓ Invited
                          </span>
                        ) : isStaged ? (
                          <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            Queued
                          </span>
                        ) : (
                          <button
                            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80
                              ${colorClasses.bg.goldenMustard} ${colorClasses.text.darkNavy}`}
                          >
                            Invite
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center p-4">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isFetching}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-opacity hover:opacity-70 disabled:opacity-50
                      ${colorClasses.border.gray300} ${colorClasses.text.primary}`}
                  >
                    {isFetching ? 'Loading…' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right — Staging Area */}
          <div className="flex flex-col w-full md:w-[45%]">
            <div className={`border-b px-4 py-3 ${colorClasses.border.gray200}`}>
              <h3 className={`text-sm font-semibold ${colorClasses.text.primary}`}>
                Companies to Invite{' '}
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold
                    ${colorClasses.bg.goldenMustard} ${colorClasses.text.darkNavy}`}
                >
                  {staged.length}
                </span>
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto">
              {staged.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-10 text-center ${colorClasses.text.muted}`}>
                  <span className="mb-2 text-3xl">📬</span>
                  <p className="text-sm">
                    Click <strong>Invite</strong> on a company to queue them
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {staged.map((company) => (
                    <li key={company._id} className="px-4 py-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <CompanyAvatar logo={company.logo} name={company.name} size="sm" />
                        <p className={`flex-1 truncate text-sm font-semibold ${colorClasses.text.primary}`}>
                          {company.name}
                        </p>
                        <button
                          onClick={() => handleRemoveStaged(company._id)}
                          className={`shrink-0 text-sm ${colorClasses.text.error} hover:opacity-70`}
                        >
                          ✕
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={company.message}
                        onChange={(e) => handleMessageChange(company._id, e.target.value)}
                        placeholder="Add a personal note to this invitation (optional)"
                        className={`w-full resize-none rounded-md border px-2.5 py-2 text-xs outline-none transition-colors
                          focus:ring-1 focus:ring-[#FFD700] focus:border-[#FFD700]
                          ${colorClasses.border.gray300} ${colorClasses.bg.secondary} ${colorClasses.text.primary}`}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Send Button */}
            <div className={`border-t p-4 ${colorClasses.border.gray200}`}>
              <button
                onClick={handleSend}
                disabled={staged.length === 0 || isSending}
                className={`w-full rounded-lg py-2.5 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40
                  ${colorClasses.bg.darkNavy} ${colorClasses.text.inverse}`}
              >
                {isSending
                  ? 'Sending…'
                  : `Send ${staged.length} Invitation${staged.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteCompaniesModal;