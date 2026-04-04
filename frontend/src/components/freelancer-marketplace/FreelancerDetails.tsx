/* eslint-disable @typescript-eslint/no-explicit-any */
// components/company/marketplace/FreelancerDetails.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import {
  Briefcase, GraduationCap, Award, Star, Code2, Calendar, ExternalLink,
  X, ChevronLeft, ChevronRight, Image as ImageIcon, Clock, Send, Loader2,
  CheckCircle2, Building2, User2, MessageSquare, LayoutGrid, Package,
  ThumbsUp, Eye, Tag, Maximize2, Trophy, ScrollText, TrendingUp, Banknote,
  CalendarCheck,
} from 'lucide-react';
import { colorClasses } from '@/utils/color';
import { cn } from '@/lib/utils';
import {
  FreelancerPublicProfile,
  FreelancerReview,
  ReviewSubmission,
  PortfolioItem,
} from '@/services/freelancerMarketplaceService';
import { useFreelancerReviews, useSubmitReview } from '@/hooks/useFreelancerMarketplace';
import { useMyProposals } from '@/hooks/useProposal';

type Tab = 'overview' | 'portfolio' | 'services' | 'work-history' | 'reviews';
interface FreelancerDetailsProps { profile: FreelancerPublicProfile; }

// ── CRASH FIX: safe accessor so nothing crashes if profile.user is undefined ──
const safeUser = (p: FreelancerPublicProfile) => ({
  _id:        p?.user?._id        ?? '',
  name:       p?.user?.name       ?? '',
  email:      p?.user?.email      ?? '',
  phone:      p?.user?.phone      ?? null,
  avatar:     p?.user?.avatar     ?? null,
  location:   p?.user?.location   ?? null,
  website:    p?.user?.website    ?? null,
  skills:     p?.user?.skills     ?? [],
  socialLinks:p?.user?.socialLinks ?? {},
  portfolio:  p?.user?.portfolio  ?? [],
  experience: p?.user?.experience ?? [],
  education:  p?.user?.education  ?? [],
});

// ── helpers ───────────────────────────────────────────────────────────────────
const SectionHeading: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className={cn('p-1.5 rounded-lg', colorClasses.bg.secondary)}>{icon}</div>
    <h3 className={cn('text-sm font-semibold', colorClasses.text.primary)}>{title}</h3>
  </div>
);

const EmptyState: React.FC<{ icon?: React.ReactNode; message: string; sub?: string }> = ({ icon, message, sub }) => (
  <div className={cn('flex flex-col items-center justify-center py-12 rounded-xl gap-3', colorClasses.bg.secondary)}>
    {icon && <div className="opacity-40 text-gray-400">{icon}</div>}
    <p className={cn('text-sm font-medium', colorClasses.text.muted)}>{message}</p>
    {sub && <p className={cn('text-xs text-center max-w-xs', colorClasses.text.muted)}>{sub}</p>}
  </div>
);

const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

// ── StarRater ─────────────────────────────────────────────────────────────────
const StarRater: React.FC<{ value: number; onChange: (v: number) => void; label: string }> = ({ value, onChange, label }) => (
  <div className="flex items-center gap-2">
    <span className={cn('text-xs w-28', colorClasses.text.muted)}>{label}</span>
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} className="hover:scale-110 transition-transform">
          <Star className={cn('w-4 h-4', n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600')} />
        </button>
      ))}
    </div>
  </div>
);

// ── ReviewCard ────────────────────────────────────────────────────────────────
const ReviewCard: React.FC<{ review: FreelancerReview }> = ({ review }) => {
  const [imgErr, setImgErr] = useState(false);
  const co = review?.companyId ?? { _id: '', name: 'Unknown' };
  return (
    <div className={cn('p-4 rounded-xl border', colorClasses.bg.primary, colorClasses.border.gray100)}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center shrink-0">
          {(co as any).logo && !imgErr
            ? <Image src={(co as any).logo} alt={co.name} width={32} height={32} className="object-cover" onError={() => setImgErr(true)} />
            : <Building2 className="w-4 h-4 text-gray-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className={cn('text-xs font-semibold', colorClasses.text.primary)}>{co.name}</span>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(n => <Star key={n} className={cn('w-3 h-3', n <= (review.rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700')} />)}
              <span className={cn('text-xs ml-1', colorClasses.text.muted)}>{fmt(review.createdAt)}</span>
            </div>
          </div>
          {review.comment && <p className={cn('text-xs mt-1.5 leading-relaxed', colorClasses.text.secondary)}>{review.comment}</p>}
          {review.subRatings && Object.values(review.subRatings).some(v => v != null) && (
            <div className="grid grid-cols-2 gap-1 mt-2">
              {Object.entries(review.subRatings).map(([k, v]) => v != null ? (
                <div key={k} className="flex items-center gap-1">
                  <span className={cn('text-[10px] capitalize w-24', colorClasses.text.muted)}>{k}</span>
                  <div className="flex gap-px">{[1,2,3,4,5].map(n => <div key={n} className={cn('w-1.5 h-1.5 rounded-full', n <= v ? 'bg-amber-400' : 'bg-gray-200 dark:bg-gray-700')} />)}</div>
                </div>
              ) : null)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── SubmitReviewForm ──────────────────────────────────────────────────────────
const SubmitReviewForm: React.FC<{ freelancerId: string; onSuccess: () => void }> = ({ freelancerId, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sub, setSub] = useState({ communication: 0, quality: 0, deadlines: 0, professionalism: 0 });
  const [done, setDone] = useState(false);
  const { mutate, isPending } = useSubmitReview(freelancerId);

  if (done) return (
    <div className={cn('flex flex-col items-center gap-2 py-6 rounded-xl', colorClasses.bg.secondary)}>
      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      <p className={cn('text-sm font-medium', colorClasses.text.primary)}>Review submitted!</p>
    </div>
  );

  return (
    <form onSubmit={e => { e.preventDefault(); if (!rating) return; mutate({ rating, comment: comment.trim() || undefined, subRatings: Object.fromEntries(Object.entries(sub).filter(([,v]) => v > 0)) as any }, { onSuccess: () => { setDone(true); onSuccess(); } }); }} className={cn('p-4 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray100)}>
      <p className={cn('text-sm font-semibold mb-3', colorClasses.text.primary)}>Write a Review</p>
      <div className="mb-3">
        <p className={cn('text-xs font-medium mb-1.5', colorClasses.text.muted)}>Overall Rating *</p>
        <div className="flex gap-1">{[1,2,3,4,5].map(n => <button key={n} type="button" onClick={() => setRating(n)} className="hover:scale-110 transition-transform"><Star className={cn('w-6 h-6', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600')} /></button>)}</div>
      </div>
      <div className="space-y-1.5 mb-3">
        {(['communication','quality','deadlines','professionalism'] as const).map(k => <StarRater key={k} label={k.charAt(0).toUpperCase()+k.slice(1)} value={sub[k]} onChange={v => setSub(p => ({...p,[k]:v}))} />)}
      </div>
      <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience... (optional)" maxLength={2000} rows={3} className={cn('w-full rounded-lg px-3 py-2 text-xs border resize-none outline-none focus:ring-1 focus:ring-amber-400', colorClasses.bg.primary, colorClasses.border.gray100, colorClasses.text.primary)} />
      <div className={cn('text-right text-[10px] mb-2', colorClasses.text.muted)}>{comment.length}/2000</div>
      <button type="submit" disabled={!rating || isPending} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 transition-all">
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        {isPending ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
};

// ── OverviewTab ───────────────────────────────────────────────────────────────
const OverviewTab: React.FC<{ profile: FreelancerPublicProfile }> = ({ profile }) => {
  const user = safeUser(profile);
  return (
    <div className="space-y-6">
      {profile.profession && (
        <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray100)}>
          <Briefcase className="w-3.5 h-3.5 text-amber-500" />
          <span className={cn('text-xs font-semibold', colorClasses.text.primary)}>{profile.profession}</span>
        </div>
      )}
      {profile.bio && <div><SectionHeading icon={<User2 className={cn('w-3.5 h-3.5', colorClasses.text.amber)} />} title="About" /><p className={cn('text-sm leading-relaxed whitespace-pre-line', colorClasses.text.secondary)}>{profile.bio}</p></div>}
      {user.skills.length > 0 && (
        <div><SectionHeading icon={<Code2 className={cn('w-3.5 h-3.5', colorClasses.text.amber)} />} title="Skills" />
        <div className="flex flex-wrap gap-1.5">{user.skills.map(s => <span key={s} className={cn('text-xs px-2.5 py-1 rounded-full font-medium border', colorClasses.bg.secondary, colorClasses.text.secondary, colorClasses.border.gray100)}>{s}</span>)}</div></div>
      )}
      {(profile.specialization ?? []).length > 0 && (
        <div><SectionHeading icon={<ThumbsUp className={cn('w-3.5 h-3.5', colorClasses.text.amber)} />} title="Specializations" />
        <div className="flex flex-wrap gap-1.5">{profile.specialization.map(s => <span key={s} className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800">{s}</span>)}</div></div>
      )}
      {user.experience.length > 0 && (
        <div><SectionHeading icon={<Briefcase className={cn('w-3.5 h-3.5', colorClasses.text.amber)} />} title="Experience" />
        <div className="space-y-3">{user.experience.map((e: any) => (
          <div key={e._id} className={cn('p-3 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray100)}>
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div><p className={cn('text-sm font-semibold', colorClasses.text.primary)}>{e.position}</p><p className={cn('text-xs', colorClasses.text.secondary)}>{e.company}</p></div>
              <p className={cn('text-xs shrink-0', colorClasses.text.muted)}>{fmt(e.startDate)} – {e.current ? 'Present' : fmt(e.endDate)}</p>
            </div>
            {e.description && <p className={cn('text-xs mt-1.5 leading-relaxed', colorClasses.text.muted)}>{e.description}</p>}
          </div>
        ))}</div></div>
      )}
      {user.education.length > 0 && (
        <div><SectionHeading icon={<GraduationCap className={cn('w-3.5 h-3.5', colorClasses.text.amber)} />} title="Education" />
        <div className="space-y-3">{user.education.map((e: any) => (
          <div key={e._id} className={cn('p-3 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray100)}>
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div><p className={cn('text-sm font-semibold', colorClasses.text.primary)}>{e.degree}{e.field ? `, ${e.field}` : ''}</p><p className={cn('text-xs', colorClasses.text.secondary)}>{e.institution}</p></div>
              <p className={cn('text-xs shrink-0', colorClasses.text.muted)}>{fmt(e.startDate)} – {e.current ? 'Present' : fmt(e.endDate)}</p>
            </div>
          </div>
        ))}</div></div>
      )}
      {(profile.certifications ?? []).length > 0 && (
        <div><SectionHeading icon={<Award className={cn('w-3.5 h-3.5', colorClasses.text.amber)} />} title="Certifications" />
        <div className="space-y-2">{profile.certifications.map(c => (
          <div key={c._id} className={cn('p-3 rounded-xl border flex items-start gap-3', colorClasses.bg.secondary, colorClasses.border.gray100)}>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0"><Award className="w-4 h-4 text-amber-600 dark:text-amber-400" /></div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-xs font-semibold', colorClasses.text.primary)}>{c.name}</p>
              <p className={cn('text-xs', colorClasses.text.muted)}>{c.issuer}</p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className={cn('text-[10px]', colorClasses.text.muted)}>{fmt(c.issueDate)}{c.expiryDate && ` – ${fmt(c.expiryDate)}`}</span>
                {c.credentialUrl && <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 hover:underline">Verify <ExternalLink className="w-2.5 h-2.5" /></a>}
              </div>
            </div>
          </div>
        ))}</div></div>
      )}
      <div><SectionHeading icon={<MessageSquare className={cn('w-3.5 h-3.5', colorClasses.text.amber)} />} title="Contact" />
        <div className={cn('p-3 rounded-xl border space-y-2', colorClasses.bg.secondary, colorClasses.border.gray100)}>
          {user.email ? <a href={`mailto:${user.email}`} className={cn('flex items-center gap-2 text-xs hover:text-amber-600 transition-colors', colorClasses.text.secondary)}><MessageSquare className="w-3.5 h-3.5 shrink-0" />{user.email}</a> : null}
          {user.phone ? <a href={`tel:${user.phone}`} className={cn('flex items-center gap-2 text-xs hover:text-amber-600 transition-colors', colorClasses.text.secondary)}><MessageSquare className="w-3.5 h-3.5 shrink-0" />{user.phone}</a> : null}
          {!user.email && !user.phone && <p className={cn('text-xs', colorClasses.text.muted)}>No contact details available.</p>}
        </div>
      </div>
    </div>
  );
};

// ── PortfolioItemDetail ───────────────────────────────────────────────────────
const PortfolioItemDetail: React.FC<{ item: PortfolioItem; onBack: () => void }> = ({ item, onBack }) => {
  const [idx, setIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [errs, setErrs] = useState<Record<number,boolean>>({});
  const imgs = (item?.mediaUrls ?? []).filter(u => u?.includes('cloudinary.com'));
  const multi = imgs.length > 1;
  const opt = (u: string) => { try { return u.replace('/upload/', '/upload/w_900,h_506,c_fill,g_auto,q_auto,f_auto/'); } catch { return u; } };
  const prev = useCallback(() => setIdx(i => (i-1+imgs.length)%imgs.length), [imgs.length]);
  const next = useCallback(() => setIdx(i => (i+1)%imgs.length), [imgs.length]);
  useEffect(() => { const h = (e:KeyboardEvent) => { if (!fullscreen) return; if (e.key==='ArrowLeft') prev(); if (e.key==='ArrowRight') next(); if (e.key==='Escape') setFullscreen(false); }; window.addEventListener('keydown',h); return () => window.removeEventListener('keydown',h); }, [fullscreen,prev,next]);

  return (
    <div className="space-y-4">
      <button onClick={onBack} className={cn('flex items-center gap-1.5 text-xs font-medium transition-colors', colorClasses.text.muted,'hover:text-amber-600 dark:hover:text-amber-400')}><ChevronLeft className="w-3.5 h-3.5" />Back to Portfolio</button>
      {imgs.length > 0 ? (
        <div className={cn('rounded-2xl border overflow-hidden', colorClasses.bg.primary, colorClasses.border.gray100)}>
          <div className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-800 group">
            {!errs[idx] ? <Image src={opt(imgs[idx])} alt={item.title} fill className="object-cover" priority onError={() => setErrs(p=>({...p,[idx]:true}))} /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-10 h-10 text-gray-400" /></div>}
            <button onClick={() => setFullscreen(true)} className="absolute top-3 right-3 p-2 rounded-xl bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 className="w-4 h-4" /></button>
            {multi && (<><button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="w-5 h-5" /></button><button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="w-5 h-5" /></button><div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">{imgs.map((_,i)=><button key={i} onClick={()=>setIdx(i)} className={cn('w-1.5 h-1.5 rounded-full transition-all',i===idx?'bg-white scale-125':'bg-white/50')} />)}</div></>)}
          </div>
          {imgs.length>1&&<div className="flex gap-2 p-3 overflow-x-auto">{imgs.map((u,i)=><button key={i} onClick={()=>setIdx(i)} className={cn('relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all',i===idx?'border-amber-500':'border-transparent opacity-60 hover:opacity-100')}><Image src={u.replace('/upload/','/upload/w_64,h_48,c_fill/')} alt="" fill className="object-cover" /></button>)}</div>}
        </div>
      ) : (
        <div className={cn('rounded-2xl border aspect-[16/9] flex items-center justify-center', colorClasses.bg.secondary, colorClasses.border.gray100)}><ImageIcon className={cn('w-12 h-12', colorClasses.text.muted)} /></div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-4">
          <div>
            <div className="flex items-start gap-2 flex-wrap">
              <h2 className={cn('text-base font-bold flex-1', colorClasses.text.primary)}>{item.title}</h2>
              {item.featured && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Featured</span>}
            </div>
            {item.description && <p className={cn('text-sm mt-2 leading-relaxed', colorClasses.text.secondary)}>{item.description}</p>}
          </div>
          {(item.technologies??[]).length>0&&<div>
            <p className={cn('text-xs font-semibold mb-2 flex items-center gap-1', colorClasses.text.muted)}><Code2 className="w-3 h-3" /> Technologies</p>
            <div className="flex flex-wrap gap-1.5">{item.technologies.map((t,i)=>{const c=['bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400','bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400','bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400','bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'];return <span key={i} className={cn('text-xs px-2.5 py-1 rounded-full font-medium',c[i%c.length])}>{t}</span>;})}</div>
          </div>}
          {item.projectUrl&&<a href={item.projectUrl} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors', colorClasses.bg.secondary, colorClasses.border.gray100, colorClasses.text.amber,'hover:border-amber-400')}><ExternalLink className="w-3.5 h-3.5" />View Live Project</a>}
        </div>
        <div className="space-y-3">
          {item.client&&<div className={cn('p-3 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray100)}><p className={cn('text-[10px] font-semibold uppercase tracking-wide mb-1', colorClasses.text.muted)}>Client</p><p className={cn('text-xs font-medium', colorClasses.text.primary)}>{item.client}</p></div>}
          {item.category&&<div className={cn('p-3 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray100)}><p className={cn('text-[10px] font-semibold uppercase tracking-wide mb-1', colorClasses.text.muted)}>Category</p><p className={cn('text-xs font-medium capitalize', colorClasses.text.primary)}>{item.category.replace(/-/g,' ')}</p></div>}
          <div className={cn('p-3 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray100)}><p className={cn('text-[10px] font-semibold uppercase tracking-wide mb-1', colorClasses.text.muted)}>Added</p><p className={cn('text-xs font-medium', colorClasses.text.primary)}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}) : '—'}</p></div>
        </div>
      </div>
      {fullscreen && imgs.length>0&&<div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={()=>setFullscreen(false)}><button onClick={()=>setFullscreen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white p-2"><X className="w-6 h-6" /></button><div className="relative max-w-5xl w-full h-[85vh]" onClick={e=>e.stopPropagation()}><Image src={imgs[idx]} alt={item.title} fill className="object-contain" priority />{multi&&<><button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"><ChevronLeft className="w-6 h-6" /></button><button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"><ChevronRight className="w-6 h-6" /></button></>}</div></div>}
    </div>
  );
};

const MpCard: React.FC<{ item: PortfolioItem; onSelect: (i: PortfolioItem) => void }> = ({ item, onSelect }) => {
  const [err,setErr] = useState(false);
  const imgs = (item?.mediaUrls??[]).filter(u=>u?.includes('cloudinary.com'));
  const first = imgs[0];
  return (
    <div onClick={()=>onSelect(item)} className={cn('group rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5', colorClasses.bg.primary, colorClasses.border.gray100)}>
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {first&&!err ? <Image src={first.replace('/upload/','/upload/w_400,h_300,c_fill,g_auto,q_auto,f_auto/')} alt={item.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" onError={()=>setErr(true)} /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-400" /></div>}
        {item.featured&&<div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">Featured</div>}
        {imgs.length>1&&<div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/50 text-white text-[10px] rounded-full">{imgs.length} photos</div>}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><div className="bg-white dark:bg-gray-900 rounded-full p-2 shadow-lg"><Eye className="w-4 h-4 text-gray-700 dark:text-gray-300" /></div></div>
      </div>
      <div className="p-3">
        <h3 className={cn('text-sm font-semibold truncate', colorClasses.text.primary)}>{item.title}</h3>
        {item.description&&<p className={cn('text-xs mt-1 line-clamp-2', colorClasses.text.secondary)}>{item.description}</p>}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {item.client&&<span className={cn('flex items-center gap-1 text-[10px]', colorClasses.text.muted)}><Building2 className="w-3 h-3" />{item.client}</span>}
          {item.category&&<span className={cn('flex items-center gap-1 text-[10px]', colorClasses.text.muted)}><Tag className="w-3 h-3" />{item.category.replace(/-/g,' ')}</span>}
        </div>
        {(item.technologies??[]).length>0&&<div className="flex flex-wrap gap-1 mt-2">{item.technologies.slice(0,3).map((t,i)=><span key={i} className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">{t}</span>)}{item.technologies.length>3&&<span className={cn('text-[10px] px-1.5 py-0.5 rounded', colorClasses.bg.secondary, colorClasses.text.muted)}>+{item.technologies.length-3}</span>}</div>}
      </div>
    </div>
  );
};

const PortfolioTab: React.FC<{ profile: FreelancerPublicProfile }> = ({ profile }) => {
  const [sel, setSel] = useState<PortfolioItem|null>(null);
  const items = profile?.user?.portfolio ?? [];
  if (!items.length) return <EmptyState icon={<LayoutGrid className="w-8 h-8" />} message="No portfolio items yet." />;
  if (sel) return <PortfolioItemDetail item={sel} onBack={()=>setSel(null)} />;
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{items.map(i=><MpCard key={i._id} item={i} onSelect={setSel} />)}</div>;
};

// ── ServicesTab ───────────────────────────────────────────────────────────────
const ServicesTab: React.FC<{ profile: FreelancerPublicProfile }> = ({ profile }) => {
  const svcs = profile.services ?? [];
  if (!svcs.length) return <EmptyState icon={<Package className="w-8 h-8" />} message="No services listed yet." />;
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{svcs.map(s => (
    <div key={s._id} className={cn('p-4 rounded-xl border transition-shadow hover:shadow-md', colorClasses.bg.primary, colorClasses.border.gray100)}>
      <div className="flex items-start justify-between gap-2"><h4 className={cn('text-sm font-semibold', colorClasses.text.primary)}>{s.title}</h4>{s.price!=null&&<span className={cn('text-sm font-bold shrink-0', colorClasses.text.amber)}>${s.price}</span>}</div>
      {s.description&&<p className={cn('text-xs mt-1.5 leading-relaxed line-clamp-3', colorClasses.text.secondary)}>{s.description}</p>}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {s.deliveryTime!=null&&<div className={cn('flex items-center gap-1 text-xs', colorClasses.text.muted)}><Clock className="w-3 h-3" />{s.deliveryTime}d delivery</div>}
        {s.category&&<span className={cn('text-xs px-2 py-0.5 rounded-full', colorClasses.bg.secondary, colorClasses.text.muted)}>{s.category}</span>}
      </div>
    </div>
  ))}</div>;
};

// ── WorkHistoryTab ────────────────────────────────────────────────────────────
const statusCfg: Record<string,{label:string;cls:string}> = {
  awarded:             {label:'Awarded',     cls:'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'},
  submitted:           {label:'Applied',     cls:'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'},
  under_review:        {label:'Under Review',cls:'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'},
  shortlisted:         {label:'Shortlisted', cls:'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'},
  interview_scheduled: {label:'Interview',   cls:'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'},
  rejected:            {label:'Rejected',    cls:'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'},
  withdrawn:           {label:'Withdrawn',   cls:'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'},
};

const WorkHistoryTab: React.FC<{ profile: FreelancerPublicProfile }> = ({ profile }) => {
  const [filter, setFilter] = useState<'awarded'|'all'>('awarded');
  const { data, isLoading, isError } = useMyProposals(
    { status: filter==='awarded' ? 'awarded' : undefined, limit: 20 },
    { retry: false }
  );
  const proposals = data?.proposals ?? [];
  const stats = [
    {label:'Success Rate',   value:`${profile?.successRate??0}%`,  icon:<TrendingUp className="w-4 h-4 text-emerald-500" />},
    {label:'On-Time Rate',   value:`${profile?.onTimeDelivery??0}%`,icon:<CalendarCheck className="w-4 h-4 text-blue-500" />},
    {label:'Total Earnings', value:(profile?.totalEarnings??0)>0?`$${(profile.totalEarnings/1000).toFixed(1)}k`:'—',icon:<Banknote className="w-4 h-4 text-amber-500" />},
    {label:'Reviews',        value:String(profile?.ratings?.count??0),icon:<Star className="w-4 h-4 text-amber-400" />},
  ];
  return (
    <div className="space-y-5">
      <div><SectionHeading icon={<TrendingUp className={cn('w-3.5 h-3.5', colorClasses.text.amber)} />} title="Performance Overview" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{stats.map(s=><div key={s.label} className={cn('rounded-xl p-3 border', colorClasses.bg.secondary, colorClasses.border.gray100)}><div className="mb-1">{s.icon}</div><p className={cn('text-lg font-bold', colorClasses.text.primary)}>{s.value}</p><p className={cn('text-[10px] mt-0.5', colorClasses.text.muted)}>{s.label}</p></div>)}</div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <SectionHeading icon={<ScrollText className={cn('w-3.5 h-3.5', colorClasses.text.amber)} />} title="Tender Participation" />
          <div className={cn('flex rounded-lg border p-0.5 text-xs', colorClasses.border.gray100, colorClasses.bg.secondary)}>
            {(['awarded','all'] as const).map(f=><button key={f} onClick={()=>setFilter(f)} className={cn('px-2.5 py-1 rounded-md font-medium transition-all capitalize', filter===f?'bg-amber-500 text-white shadow-sm':cn(colorClasses.text.muted,'hover:text-amber-600'))}>{f==='awarded'?'🏆 Awarded':'All Bids'}</button>)}
          </div>
        </div>
        {isLoading&&<div className="flex justify-center py-8"><Loader2 className={cn('w-6 h-6 animate-spin', colorClasses.text.muted)} /></div>}
        {(isError||(!isLoading&&proposals.length===0))&&(
          <div className={cn('rounded-xl border p-6 text-center space-y-2', colorClasses.bg.secondary, colorClasses.border.gray100)}>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mx-auto"><Trophy className="w-6 h-6 text-amber-500" /></div>
            <p className={cn('text-sm font-medium', colorClasses.text.primary)}>{filter==='awarded'?'Awarded project history':'No bids found'}</p>
            <p className={cn('text-xs leading-relaxed max-w-xs mx-auto', colorClasses.text.muted)}>{isError?'Full tender history requires GET /freelancers/:id/work-history on the backend.':filter==='awarded'?'No awarded tenders yet. Switch to "All Bids" to see proposals.':'No proposals found.'}</p>
          </div>
        )}
        {!isLoading&&!isError&&proposals.length>0&&(
          <div className="space-y-3">{proposals.map(p=>{
            const sc=statusCfg[p.status]??{label:p.status,cls:'bg-gray-100 text-gray-500'};
            const t=p.tender;
            return (
              <div key={p._id} className={cn('p-4 rounded-xl border transition-shadow hover:shadow-sm', colorClasses.bg.primary, colorClasses.border.gray100)}>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={cn('text-sm font-semibold truncate', colorClasses.text.primary)}>{typeof t==='object'&&t?t.title:'Untitled Tender'}</h4>
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full',sc.cls)}>{sc.label}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <span className={cn('flex items-center gap-1 text-xs font-semibold', colorClasses.text.amber)}>${p.proposedAmount.toLocaleString()} {p.currency}</span>
                      <span className={cn('flex items-center gap-1 text-xs', colorClasses.text.muted)}><Clock className="w-3 h-3" />{p.deliveryTime.value} {p.deliveryTime.unit}</span>
                      {p.submittedAt&&<span className={cn('flex items-center gap-1 text-xs', colorClasses.text.muted)}><Calendar className="w-3 h-3" />{fmt(p.submittedAt)}</span>}
                    </div>
                  </div>
                  {p.status==='awarded'&&<div className="shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center"><Trophy className="w-4 h-4 text-amber-500" /></div>}
                </div>
              </div>
            );
          })}</div>
        )}
      </div>
      {(profile?.recentReviews??[]).length>0&&<div><SectionHeading icon={<Star className={cn('w-3.5 h-3.5', colorClasses.text.amber)} />} title="Recent Client Feedback" /><div className="space-y-3">{profile.recentReviews.slice(0,3).map(r=><ReviewCard key={r._id} review={r} />)}</div></div>}
    </div>
  );
};

// ── ReviewsTab ────────────────────────────────────────────────────────────────
const ReviewsTab: React.FC<{ profile: FreelancerPublicProfile }> = ({ profile }) => {
  const [page,setPage] = useState(1);
  const [form,setForm] = useState(false);
  const {data,isLoading,isError} = useFreelancerReviews(profile._id, page);
  const summary = data?.summary ?? profile?.ratings ?? {average:0,count:0,breakdown:{communication:0,quality:0,deadlines:0,professionalism:0}};
  const reviews = data?.reviews ?? profile?.recentReviews ?? [];
  const pg = data?.pagination;
  return (
    <div className="space-y-4">
      <div className={cn('p-4 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray100)}>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className={cn('text-4xl font-bold', colorClasses.text.primary)}>{(summary.average??0)>0?summary.average.toFixed(1):'—'}</p>
            <div className="flex justify-center gap-0.5 mt-1">{[1,2,3,4,5].map(n=><Star key={n} className={cn('w-3.5 h-3.5',n<=Math.round(summary.average??0)?'fill-amber-400 text-amber-400':'text-gray-200 dark:text-gray-700')} />)}</div>
            <p className={cn('text-xs mt-1', colorClasses.text.muted)}>{summary.count??0} review{(summary.count??0)!==1?'s':''}</p>
          </div>
          {(summary.count??0)>0&&summary.breakdown&&<div className="flex-1 space-y-1">{Object.entries(summary.breakdown).map(([k,v])=>(
            <div key={k} className="flex items-center gap-2">
              <span className={cn('text-[10px] w-24 capitalize', colorClasses.text.muted)}>{k}</span>
              <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700"><div className="h-1.5 rounded-full bg-amber-400 transition-all" style={{width:`${(v??0)>0?((v as number)/5)*100:0}%`}} /></div>
              <span className={cn('text-[10px] w-5 text-right', colorClasses.text.muted)}>{(v??0)>0?(v as number).toFixed(1):'—'}</span>
            </div>
          ))}</div>}
        </div>
      </div>
      <button onClick={()=>setForm(p=>!p)} className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors',form?'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800':cn(colorClasses.bg.secondary,colorClasses.text.secondary,colorClasses.border.gray100,'hover:border-amber-300'))}>
        <Star className="w-3.5 h-3.5" />{form?'Cancel':'Write a Review'}
      </button>
      {form&&<SubmitReviewForm freelancerId={profile._id} onSuccess={()=>setForm(false)} />}
      {isLoading&&<div className="flex justify-center py-8"><Loader2 className={cn('w-6 h-6 animate-spin', colorClasses.text.muted)} /></div>}
      {isError&&<EmptyState message="Failed to load reviews." />}
      {!isLoading&&!isError&&(
        <>
          {reviews.length===0?<EmptyState icon={<Star className="w-8 h-8" />} message="No reviews yet." sub="Be the first to review this freelancer!" />:
           <div className="space-y-3">{reviews.map(r=><ReviewCard key={r._id} review={r} />)}</div>}
          {pg&&pg.totalPages>1&&<div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className={cn('p-1.5 rounded-lg border transition-colors disabled:opacity-40', colorClasses.bg.secondary, colorClasses.border.gray100)}><ChevronLeft className={cn('w-4 h-4', colorClasses.text.muted)} /></button>
            <span className={cn('text-xs', colorClasses.text.muted)}>{page} / {pg.totalPages}</span>
            <button onClick={()=>setPage(p=>Math.min(pg.totalPages,p+1))} disabled={page===pg.totalPages} className={cn('p-1.5 rounded-lg border transition-colors disabled:opacity-40', colorClasses.bg.secondary, colorClasses.border.gray100)}><ChevronRight className={cn('w-4 h-4', colorClasses.text.muted)} /></button>
          </div>}
        </>
      )}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const TABS: {id:Tab;label:string;icon:React.ReactNode}[] = [
  {id:'overview',     label:'Overview',     icon:<User2 className="w-3.5 h-3.5" />},
  {id:'portfolio',    label:'Portfolio',    icon:<LayoutGrid className="w-3.5 h-3.5" />},
  {id:'services',     label:'Services',     icon:<Package className="w-3.5 h-3.5" />},
  {id:'work-history', label:'Work History', icon:<Trophy className="w-3.5 h-3.5" />},
  {id:'reviews',      label:'Reviews',      icon:<Star className="w-3.5 h-3.5" />},
];

const FreelancerDetails: React.FC<FreelancerDetailsProps> = ({ profile }) => {
  const [active, setActive] = useState<Tab>('overview');

  // CRASH FIX: render a safe fallback if profile is undefined or user is missing
  if (!profile) return (
    <div className={cn('rounded-2xl border p-10 text-center', colorClasses.bg.primary, colorClasses.border.gray100)}>
      <p className={cn('text-sm', colorClasses.text.muted)}>Profile data unavailable.</p>
    </div>
  );

  const portCount  = profile?.user?.portfolio?.length ?? 0;
  const svcCount   = profile?.services?.length ?? 0;
  const revCount   = profile?.ratings?.count ?? 0;

  return (
    <div className={cn('rounded-2xl border overflow-hidden', colorClasses.bg.primary, colorClasses.border.gray100)}>
      <div className={cn('flex border-b overflow-x-auto', colorClasses.border.gray100)}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActive(t.id)} className={cn('flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors duration-150', active===t.id?'border-amber-500 text-amber-600 dark:text-amber-400':cn('border-transparent', colorClasses.text.muted,'hover:text-amber-500'))}>
            {t.icon}{t.label}
            {t.id==='reviews'&&revCount>0&&<span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">{revCount}</span>}
            {t.id==='portfolio'&&portCount>0&&<span className={cn('ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full', colorClasses.bg.secondary, colorClasses.text.muted)}>{portCount}</span>}
            {t.id==='services'&&svcCount>0&&<span className={cn('ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full', colorClasses.bg.secondary, colorClasses.text.muted)}>{svcCount}</span>}
          </button>
        ))}
      </div>
      <div className="p-5">
        {active==='overview'     && <OverviewTab     profile={profile} />}
        {active==='portfolio'    && <PortfolioTab    profile={profile} />}
        {active==='services'     && <ServicesTab     profile={profile} />}
        {active==='work-history' && <WorkHistoryTab  profile={profile} />}
        {active==='reviews'      && <ReviewsTab      profile={profile} />}
      </div>
    </div>
  );
};

export default FreelancerDetails;