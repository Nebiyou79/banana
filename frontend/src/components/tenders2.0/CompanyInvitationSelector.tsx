/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/tenders2.0/CompanyInvitationSelector.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Mail, Building2, Check, ChevronDown, Loader2, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useCompaniesForInvitation } from '@/hooks/useProfessionalTender';
import profileService from '@/services/profileService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StagedInvitation {
  type: 'company' | 'email';
  /** Set when type === 'company' */
  companyId?: string;
  /** Set when type === 'company', for display only */
  companyName?: string;
  /** Set when type === 'company', for display only */
  companyLogo?: any;
  /** Set when type === 'email' */
  email?: string;
  /** Optional personalised message for either type */
  message: string;
}

interface CompanyInvitationSelectorProps {
  /** IDs of companies already invited (from saved tender data — prevents re-inviting) */
  alreadyInvitedIds?: string[];
  /** Current staged list — controlled by parent */
  value: StagedInvitation[];
  onChange: (invitations: StagedInvitation[]) => void;
  disabled?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const CompanyAvatar: React.FC<{ logo?: any; name: string; size?: 'xs' | 'sm' }> = ({
  logo, name, size = 'sm',
}) => {
  const dim = size === 'xs' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs';
  const src = logo ? profileService.getOptimizedAvatarUrl(logo, 'small') : null;
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(dim, 'rounded-full object-cover shrink-0', colorClasses.bg.gray200)}
      />
    );
  }
  return (
    <div className={cn(
      dim, 'rounded-full flex items-center justify-center font-bold shrink-0',
      'bg-[#0A2540] text-white dark:bg-white dark:text-[#0A2540]'
    )}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CompanyInvitationSelector: React.FC<CompanyInvitationSelectorProps> = ({
  alreadyInvitedIds = [],
  value,
  onChange,
  disabled = false,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [page, setPage] = useState(1);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());

  const debouncedQuery = useDebounce(query, 300);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching } = useCompaniesForInvitation(debouncedQuery, page, 8, {
    enabled: searchOpen && debouncedQuery.length > 0,
  });

  // Accumulate results for pagination
  useEffect(() => {
    if (data?.companies) {
      setAllCompanies(prev => page === 1 ? data.companies : [...prev, ...data.companies]);
    }
  }, [data?.companies, page]);

  // Reset on query change
  useEffect(() => {
    setPage(1);
    setAllCompanies([]);
  }, [debouncedQuery]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const stagedCompanyIds = new Set(value.filter(v => v.type === 'company').map(v => v.companyId));
  const stagedEmails = new Set(value.filter(v => v.type === 'email').map(v => v.email));

  const handleAddCompany = useCallback((company: any) => {
    if (stagedCompanyIds.has(company._id) || alreadyInvitedIds.includes(company._id)) return;
    onChange([...value, {
      type: 'company',
      companyId: company._id,
      companyName: company.name,
      companyLogo: company.logo,
      message: '',
    }]);
  }, [value, onChange, stagedCompanyIds, alreadyInvitedIds]);

  const handleAddEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (stagedEmails.has(email)) {
      setEmailError('This email is already queued');
      return;
    }
    onChange([...value, { type: 'email', email, message: '' }]);
    setEmailInput('');
    setEmailError('');
  };

  const handleRemove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
    setExpandedMessages(prev => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
  };

  const handleMessageChange = (idx: number, message: string) => {
    onChange(value.map((inv, i) => i === idx ? { ...inv, message } : inv));
  };

  const toggleMessage = (idx: number) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const hasMore = data?.pagination
    ? page < Math.ceil(data.pagination.total / data.pagination.limit)
    : false;

  return (
    <div className="space-y-4">
      {/* ── Search box ── */}
      <div ref={searchRef} className="relative">
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-lg border px-3 h-11 transition-all cursor-text',
            colorClasses.bg.white,
            searchOpen
              ? 'border-[#F1BB03] ring-2 ring-[#F1BB03]/20'
              : cn(colorClasses.border.gray300, 'hover:border-[#F1BB03]/50'),
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={() => !disabled && setSearchOpen(true)}
        >
          <Search className={cn('h-4 w-4 shrink-0', colorClasses.text.muted)} />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search companies by name…"
            disabled={disabled}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100"
          />
          {query && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setQuery(''); setAllCompanies([]); }}
              className={cn('shrink-0', colorClasses.text.muted, 'hover:text-gray-600')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {searchOpen && query.length > 0 && (
          <div className={cn(
            'absolute z-30 left-0 right-0 mt-1 rounded-xl border shadow-xl overflow-hidden',
            colorClasses.bg.white, colorClasses.border.gray200
          )}>
            {(isLoading && page === 1) ? (
              <div className="flex items-center justify-center py-8 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#F1BB03]" />
                <span className={cn('text-sm', colorClasses.text.muted)}>Searching…</span>
              </div>
            ) : allCompanies.length === 0 ? (
              <div className={cn('py-8 text-center text-sm', colorClasses.text.muted)}>
                No companies found for "{query}"
              </div>
            ) : (
              <>
                <ul className="max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-[#2D3748]">
                  {allCompanies.map(company => {
                    const isAlready = alreadyInvitedIds.includes(company._id);
                    const isStaged = stagedCompanyIds.has(company._id);
                    const unavailable = isAlready || isStaged;

                    return (
                      <li
                        key={company._id}
                        onClick={() => !unavailable && handleAddCompany(company)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 transition-colors',
                          unavailable
                            ? 'opacity-50 cursor-default'
                            : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2D3748]'
                        )}
                      >
                        <CompanyAvatar logo={company.logo} name={company.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className={cn('text-sm font-semibold truncate', colorClasses.text.primary)}>
                            {company.name}
                          </p>
                          {company.industry && (
                            <p className={cn('text-xs truncate', colorClasses.text.muted)}>
                              {company.industry}
                            </p>
                          )}
                        </div>
                        {isAlready ? (
                          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            Invited
                          </span>
                        ) : isStaged ? (
                          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            Queued
                          </span>
                        ) : (
                          <span className={cn(
                            'shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full',
                            'bg-[#F1BB03]/15 text-[#B45309] dark:text-[#F1BB03]'
                          )}>
                            + Add
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {hasMore && (
                  <div className={cn('flex justify-center py-2 border-t', colorClasses.border.gray200)}>
                    <button
                      type="button"
                      onClick={() => setPage(p => p + 1)}
                      disabled={isFetching}
                      className={cn('text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
                        colorClasses.text.muted, 'hover:text-gray-700 dark:hover:text-gray-300',
                        'disabled:opacity-50')}
                    >
                      {isFetching ? 'Loading…' : 'Load more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Email add ── */}
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <div className={cn(
            'flex items-center gap-2.5 flex-1 rounded-lg border px-3 h-11 transition-all',
            colorClasses.bg.white,
            emailError
              ? 'border-red-400 ring-2 ring-red-400/20'
              : cn(colorClasses.border.gray300, 'focus-within:border-[#F1BB03] focus-within:ring-2 focus-within:ring-[#F1BB03]/20'),
            disabled && 'opacity-50'
          )}>
            <Mail className={cn('h-4 w-4 shrink-0', colorClasses.text.muted)} />
            <input
              type="email"
              value={emailInput}
              onChange={e => { setEmailInput(e.target.value); setEmailError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddEmail(); } }}
              placeholder="Invite by email address…"
              disabled={disabled}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            type="button"
            onClick={handleAddEmail}
            disabled={disabled || !emailInput.trim()}
            className={cn(
              'shrink-0 h-11 px-4 rounded-lg text-sm font-semibold transition-all',
              'bg-[#0A2540] dark:bg-white text-white dark:text-[#0A2540]',
              'hover:bg-[#0A2540]/90 dark:hover:bg-white/90',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            <UserPlus className="h-4 w-4" />
          </button>
        </div>
        {emailError && (
          <p className="text-xs text-red-500">{emailError}</p>
        )}
      </div>

      {/* ── Staged list ── */}
      {value.length > 0 && (
        <div className={cn(
          'rounded-xl border overflow-hidden',
          colorClasses.border.gray200
        )}>
          <div className={cn(
            'flex items-center justify-between px-3 py-2 border-b',
            colorClasses.border.gray200,
            colorClasses.bg.secondary
          )}>
            <span className={cn('text-xs font-semibold uppercase tracking-wide', colorClasses.text.muted)}>
              Queued Invitations
            </span>
            <span className={cn(
              'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold',
              'bg-[#F1BB03] text-[#0A2540]'
            )}>
              {value.length}
            </span>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-[#2D3748]">
            {value.map((inv, idx) => {
              const msgExpanded = expandedMessages.has(idx);
              return (
                <li key={idx} className="px-3 py-2.5 space-y-2">
                  <div className="flex items-center gap-2.5">
                    {inv.type === 'company' ? (
                      <CompanyAvatar logo={inv.companyLogo} name={inv.companyName || '?'} size="xs" />
                    ) : (
                      <div className={cn(
                        'h-6 w-6 rounded-full flex items-center justify-center shrink-0',
                        'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300'
                      )}>
                        <Mail className="h-3 w-3" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium truncate', colorClasses.text.primary)}>
                        {inv.type === 'company' ? inv.companyName : inv.email}
                      </p>
                      <p className={cn('text-[10px]', colorClasses.text.muted)}>
                        {inv.type === 'company' ? 'Company' : 'Email invitation'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleMessage(idx)}
                      className={cn(
                        'shrink-0 flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-1 rounded transition-colors',
                        colorClasses.text.muted, 'hover:text-gray-700 dark:hover:text-gray-300'
                      )}
                    >
                      Note
                      <ChevronDown className={cn('h-3 w-3 transition-transform', msgExpanded && 'rotate-180')} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className={cn('shrink-0 p-1 rounded transition-colors', colorClasses.text.muted, 'hover:text-red-500')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {msgExpanded && (
                    <textarea
                      rows={2}
                      value={inv.message}
                      onChange={e => handleMessageChange(idx, e.target.value)}
                      placeholder="Add a personal note to this invitation (optional)…"
                      disabled={disabled}
                      className={cn(
                        'w-full resize-none rounded-lg border px-2.5 py-2 text-xs outline-none transition-all',
                        colorClasses.bg.white, colorClasses.border.gray300, colorClasses.text.primary,
                        'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                        'focus:border-[#F1BB03] focus:ring-1 focus:ring-[#F1BB03]/30'
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {value.length === 0 && (
        <div className={cn(
          'flex flex-col items-center gap-2 py-6 rounded-xl border border-dashed text-center',
          colorClasses.border.gray300, colorClasses.text.muted
        )}>
          <Building2 className="h-7 w-7 opacity-30" />
          <p className="text-xs">
            Search for companies above or add by email to queue invitations
          </p>
        </div>
      )}
    </div>
  );
};

export default CompanyInvitationSelector;