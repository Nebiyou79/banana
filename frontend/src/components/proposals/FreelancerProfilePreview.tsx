// components/proposals/owner/FreelancerProfilePreview.tsx
import React from 'react';
import type { ProposalFreelancerProfile, ProposalUser } from '@/services/proposalService';

interface Props {
  freelancerProfile: ProposalFreelancerProfile;
  user: ProposalUser;
}

const StarRating = ({ avg, count }: { avg: number; count: number }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg
        key={s}
        className={`h-4 w-4 ${s <= Math.round(avg) ? 'text-amber-400' : 'text-slate-200'}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
    <span className="ml-1 text-xs text-slate-500">({count})</span>
  </div>
);

const StatPill = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className={`rounded-lg px-3 py-2 text-center ${color}`}>
    <p className="text-sm font-bold">{value}</p>
    <p className="text-xs font-medium opacity-75">{label}</p>
  </div>
);

export function FreelancerProfilePreview({ freelancerProfile, user }: Props) {
  const ratings = freelancerProfile.ratings;
  const skills  = user.skills ?? [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">

      {/* Header row */}
      <div className="flex items-start gap-4">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="h-14 w-14 rounded-full object-cover shrink-0" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-xl font-bold text-white">
            {user.name?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-slate-800">{user.name}</p>
          {freelancerProfile.headline && (
            <p className="text-sm text-slate-500 truncate">{freelancerProfile.headline}</p>
          )}
          {user.location && (
            <p className="text-xs text-slate-400 mt-0.5">📍 {user.location}</p>
          )}
          {ratings && ratings.count > 0 && (
            <div className="mt-1.5">
              <StarRating avg={ratings.average} count={ratings.count} />
            </div>
          )}
        </div>
        {freelancerProfile.hourlyRate != null && (
          <div className="shrink-0 text-right">
            <p className="text-lg font-bold text-slate-800">{freelancerProfile.hourlyRate}</p>
            <p className="text-xs text-slate-400">ETB/hr</p>
          </div>
        )}
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {skills.slice(0, 8).map((s) => (
              <span key={s} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {s}
              </span>
            ))}
            {skills.length > 8 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-400">
                +{skills.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {freelancerProfile.successRate != null && (
          <StatPill label="Success" value={`${freelancerProfile.successRate}%`} color="bg-emerald-50 text-emerald-700" />
        )}
        {freelancerProfile.onTimeDelivery != null && (
          <StatPill label="On-Time" value={`${freelancerProfile.onTimeDelivery}%`} color="bg-blue-50 text-blue-700" />
        )}
        {freelancerProfile.responseRate != null && (
          <StatPill label="Response" value={`${freelancerProfile.responseRate}%`} color="bg-purple-50 text-purple-700" />
        )}
      </div>

      {/* Portfolio links */}
      {freelancerProfile.socialLinks && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Portfolio</p>
          <div className="space-y-1">
            {Object.entries(freelancerProfile.socialLinks)
              .filter(([, v]) => !!v)
              .slice(0, 3)
              .map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-indigo-600 hover:underline"
                >
                  <span className="capitalize">{platform}</span>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
          </div>
        </div>
      )}

      {/* View full profile */}
      <a
        href={`/freelancers/${freelancerProfile._id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded-xl border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
      >
        View Full Profile →
      </a>
    </div>
  );
}
