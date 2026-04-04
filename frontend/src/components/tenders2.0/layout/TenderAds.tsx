// src/components/tender-dashboard/TenderAds.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Animated top + bottom ad banners for the Tender Dashboard.
// • Top banner  — animated dark-navy hero with ticker + 3 glassmorphism cards
// • Bottom banner — full-width showcase with industry-tailored cards
// • MobileAdStrip — compact rotating ad strip for mobile
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Shield,
  Zap,
  Star,
  Building2,
  Cpu,
  Banknote,
  HardHat,
  Leaf,
  Stethoscope,
  Truck,
  BookOpen,
  ArrowRight,
  Sparkles,
  Target,
  Award,
  BarChart3,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  X,
} from 'lucide-react';
import { colorClasses } from '@/utils/color';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CompanyIndustry =
  | 'construction'
  | 'it'
  | 'finance'
  | 'healthcare'
  | 'agriculture'
  | 'logistics'
  | 'education'
  | 'general';

interface AdCard {
  id: string;
  tag: string;
  tagColor: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  gradient: string;
  icon: React.ReactNode;
  highlight?: string;
  industries: CompanyIndustry[];
}

// ─── Ad definitions ───────────────────────────────────────────────────────────

const ALL_ADS: AdCard[] = [
  {
    id: 'legal-review',
    tag: 'Legal Partner',
    tagColor: '#3B82F6',
    title: 'Tender Legal Review',
    body: 'Get your tender documents reviewed by certified Ethiopian procurement lawyers before submission.',
    cta: 'Get Legal Review',
    href: '#',
    gradient: 'linear-gradient(135deg, #1E3A8A18, #3B82F618)',
    icon: <Shield className="w-5 h-5" />,
    highlight: '48h turnaround',
    industries: ['general', 'construction', 'it', 'healthcare', 'agriculture', 'logistics', 'education'],
  },
  {
    id: 'cpo-bonds',
    tag: 'Finance',
    tagColor: '#10B981',
    title: 'CPO & Bond Services',
    body: 'Fast CPO issuance and performance bonds for bid submissions. CBE and Dashen Bank certified.',
    cta: 'Apply Now',
    href: '#',
    gradient: 'linear-gradient(135deg, #06402818, #10B98118)',
    icon: <Banknote className="w-5 h-5" />,
    highlight: '24h approval',
    industries: ['general', 'construction', 'it', 'finance', 'logistics'],
  },
  {
    id: 'priority-listing',
    tag: 'Upgrade',
    tagColor: '#8B5CF6',
    title: 'Priority Listing',
    body: 'Feature your tender at the top of search results and reach 5× more qualified bidders.',
    cta: 'Upgrade Now',
    href: '#',
    gradient: 'linear-gradient(135deg, #4C1D9518, #8B5CF618)',
    icon: <Zap className="w-5 h-5" />,
    highlight: '5× more reach',
    industries: ['general', 'construction', 'it', 'finance', 'healthcare', 'logistics', 'education'],
  },
  {
    id: 'profile-complete',
    tag: 'Pro Tip',
    tagColor: '#F1BB03',
    title: 'Win More Tenders',
    body: 'Companies with complete profiles and verified documents receive 3× more bid invitations on average.',
    cta: 'Complete Profile',
    href: '/dashboard/company/profile',
    gradient: 'linear-gradient(135deg, #F1BB0318, #D9A80018)',
    icon: <Star className="w-5 h-5" />,
    highlight: '3× more wins',
    industries: ['general', 'construction', 'it', 'finance', 'healthcare', 'agriculture', 'logistics', 'education'],
  },
  {
    id: 'construction-safety',
    tag: 'Safety',
    tagColor: '#FF8C42',
    title: 'OSHA Compliance Kit',
    body: 'Comprehensive safety compliance documentation for construction tenders. Pre-approved by ECSC.',
    cta: 'Download Kit',
    href: '#',
    gradient: 'linear-gradient(135deg, #7B341E18, #FF8C4218)',
    icon: <HardHat className="w-5 h-5" />,
    highlight: 'ECSC approved',
    industries: ['construction'],
  },
  {
    id: 'construction-materials',
    tag: 'Supplier',
    tagColor: '#64748B',
    title: 'Verified Material Suppliers',
    body: 'Access our network of 200+ verified Ethiopian construction material suppliers with competitive pricing.',
    cta: 'Find Suppliers',
    href: '#',
    gradient: 'linear-gradient(135deg, #1E293B18, #64748B18)',
    icon: <Building2 className="w-5 h-5" />,
    highlight: '200+ suppliers',
    industries: ['construction'],
  },
  {
    id: 'it-cloud',
    tag: 'Technology',
    tagColor: '#06B6D4',
    title: 'Cloud Infrastructure Bids',
    body: 'Specialized bid preparation for cloud, SaaS and software tenders. ISO 27001 documentation included.',
    cta: 'Start Bid',
    href: '#',
    gradient: 'linear-gradient(135deg, #16425118, #06B6D418)',
    icon: <Cpu className="w-5 h-5" />,
    highlight: 'ISO 27001 ready',
    industries: ['it'],
  },
  {
    id: 'it-security',
    tag: 'Cybersecurity',
    tagColor: '#EF4444',
    title: 'Security Audit Reports',
    body: 'Fast-track security audit certificates required for government IT tenders in Ethiopia.',
    cta: 'Get Certified',
    href: '#',
    gradient: 'linear-gradient(135deg, #7F1D1D18, #EF444418)',
    icon: <Shield className="w-5 h-5" />,
    highlight: '3-day cert',
    industries: ['it'],
  },
  {
    id: 'finance-analytics',
    tag: 'Analytics',
    tagColor: '#6366F1',
    title: 'Tender ROI Analytics',
    body: 'AI-powered win probability scoring and ROI analysis for financial sector procurement bids.',
    cta: 'Try Free',
    href: '#',
    gradient: 'linear-gradient(135deg, #1E1B4B18, #6366F118)',
    icon: <BarChart3 className="w-5 h-5" />,
    highlight: '87% accuracy',
    industries: ['finance'],
  },
  {
    id: 'healthcare-regulatory',
    tag: 'Regulatory',
    tagColor: '#EC4899',
    title: 'EFDA Compliance Docs',
    body: 'Pre-compiled regulatory documentation for EFDA-mandated healthcare and pharmaceutical tenders.',
    cta: 'Get Documents',
    href: '#',
    gradient: 'linear-gradient(135deg, #83184318, #EC489918)',
    icon: <Stethoscope className="w-5 h-5" />,
    highlight: 'EFDA compliant',
    industries: ['healthcare'],
  },
  {
    id: 'agriculture-certification',
    tag: 'Certification',
    tagColor: '#22C55E',
    title: 'Organic Farm Certifications',
    body: 'EACC-recognized organic certifications and farmer cooperative verification for agri-tenders.',
    cta: 'Apply',
    href: '#',
    gradient: 'linear-gradient(135deg, #14532D18, #22C55E18)',
    icon: <Leaf className="w-5 h-5" />,
    highlight: 'EACC recognized',
    industries: ['agriculture'],
  },
  {
    id: 'logistics-insurance',
    tag: 'Insurance',
    tagColor: '#F59E0B',
    title: 'Cargo Bond Insurance',
    body: 'Comprehensive cargo bonds and transport insurance for logistics tender requirements in Ethiopia.',
    cta: 'Get Quote',
    href: '#',
    gradient: 'linear-gradient(135deg, #78350F18, #F59E0B18)',
    icon: <Truck className="w-5 h-5" />,
    highlight: 'Instant quote',
    industries: ['logistics'],
  },
  {
    id: 'education-accreditation',
    tag: 'Accreditation',
    tagColor: '#0EA5E9',
    title: 'MoE Accreditation Fast-track',
    body: 'Ministry of Education accreditation paperwork handled end-to-end for education sector tenders.',
    cta: 'Learn More',
    href: '#',
    gradient: 'linear-gradient(135deg, #0C4A6E18, #0EA5E918)',
    icon: <BookOpen className="w-5 h-5" />,
    highlight: 'MoE approved',
    industries: ['education'],
  },
];

const TICKER_MESSAGES = [
  '🏆 New construction tenders posted today — 14 active',
  '⚡ Fast CPO issuance now available — apply in minutes',
  '🌟 Top companies win 3× more with complete profiles',
  '📋 IT sector: 6 government cloud tenders closing soon',
  '🔒 Legal review now available for all tender documents',
  '💡 Priority listing: reach 5× more qualified bidders',
  '🏗️ Construction supply tenders — ETB 500M+ in value',
  '✅ Get verified today and unlock premium bid invitations',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAdsForIndustry(industry: CompanyIndustry, count: number): AdCard[] {
  const specific = ALL_ADS.filter(
    (a) => a.industries.includes(industry) && !a.industries.includes('general')
  );
  const general = ALL_ADS.filter((a) => a.industries.includes('general'));
  const combined = [...specific, ...general];
  const seen = new Set<string>();
  const deduped = combined.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
  return deduped.slice(0, count);
}

// ─── Ticker strip ─────────────────────────────────────────────────────────────

function TickerStrip() {
  const msgs = [...TICKER_MESSAGES, ...TICKER_MESSAGES];
  return (
    <div className="overflow-hidden whitespace-nowrap relative flex-1">
      <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, rgba(10,37,64,0.9) 0%, transparent 100%)' }}
      />
      <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(270deg, rgba(10,37,64,0.9) 0%, transparent 100%)' }}
      />
      <div className="inline-flex gap-10" style={{ animation: 'ticker 50s linear infinite' }}>
        {msgs.map((msg, i) => (
          <span key={i} className="text-[11px] font-semibold text-white/75 inline-flex items-center gap-2">
            {msg}
            <span className="text-[#F1BB03]/35 mx-2">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Top ad card (glassmorphism) ─────────────────────────────────────────────

function TopAdCard({ ad, index }: { ad: AdCard; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={ad.href}
      target={ad.href.startsWith('http') ? '_blank' : undefined}
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex-1 min-w-0 rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
        border: hovered ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.10)',
        backdropFilter: 'blur(16px)',
        transform: hovered ? 'translateY(-3px) scale(1.01)' : 'none',
        boxShadow: hovered ? `0 16px 32px rgba(0,0,0,0.3), 0 0 0 1px ${ad.tagColor}20` : '0 4px 12px rgba(0,0,0,0.15)',
        animationDelay: `${index * 0.1}s`,
        animation: `fadeInUp 0.4s ease-out ${index * 0.08}s both`,
      }}
    >
      {/* Accent top bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${ad.tagColor}, transparent)`, opacity: hovered ? 1 : 0.5 }}
      />

      {/* Glow blob */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl pointer-events-none transition-opacity duration-400"
        style={{ backgroundColor: ad.tagColor, opacity: hovered ? 0.25 : 0.10 }}
      />

      <div className="p-4 relative">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
            style={{
              background: `${ad.tagColor}22`,
              color: ad.tagColor,
              transform: hovered ? 'scale(1.12) rotate(3deg)' : 'none',
              boxShadow: hovered ? `0 4px 12px ${ad.tagColor}30` : 'none',
            }}
          >
            {ad.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span
                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: `${ad.tagColor}28`, color: ad.tagColor }}
              >
                {ad.tag}
              </span>
              {ad.highlight && (
                <span className="text-[9px] font-bold text-white/55 px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  ✦ {ad.highlight}
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold text-white leading-tight mb-1 truncate">{ad.title}</h4>
            <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2">{ad.body}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span
            className="text-[11px] font-bold flex items-center gap-1 transition-all duration-200"
            style={{ color: ad.tagColor, gap: hovered ? '6px' : '4px' }}
          >
            {ad.cta}
            <ArrowRight className="w-3 h-3" />
          </span>
          <ExternalLink className="w-3 h-3 text-white/20 transition-colors duration-200"
            style={{ color: hovered ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.15)' }}
          />
        </div>
      </div>
    </a>
  );
}

// ─── Bottom ad card ───────────────────────────────────────────────────────────

function BottomAdCard({ ad, index }: { ad: AdCard; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative rounded-2xl overflow-hidden ${colorClasses.bg.primary} cursor-pointer`}
      style={{
        border: hovered
          ? `1px solid ${ad.tagColor}40`
          : `1px solid rgba(0,0,0,0.08)`,
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? `0 20px 40px rgba(0,0,0,0.12), 0 0 0 1px ${ad.tagColor}15` : '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        animation: `fadeInUp 0.4s ease-out ${index * 0.08}s both`,
      }}
    >
      {/* Gradient header */}
      <div className="h-28 relative overflow-hidden" style={{ background: ad.gradient }}>
        {/* Animated blobs */}
        <div
          className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full pointer-events-none transition-transform duration-500"
          style={{
            backgroundColor: ad.tagColor,
            opacity: 0.15,
            transform: hovered ? 'scale(1.3)' : 'scale(1)',
          }}
        />
        <div
          className="absolute top-2 right-10 w-12 h-12 rounded-full pointer-events-none transition-transform duration-700"
          style={{
            backgroundColor: ad.tagColor,
            opacity: 0.08,
            transform: hovered ? 'scale(1.6)' : 'scale(1)',
          }}
        />

        {/* Icon */}
        <div className="absolute top-4 left-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300"
            style={{
              backgroundColor: ad.tagColor,
              transform: hovered ? 'scale(1.1) rotate(3deg)' : 'none',
              boxShadow: hovered ? `0 8px 20px ${ad.tagColor}50` : `0 4px 10px ${ad.tagColor}30`,
            }}
          >
            <div className="text-white [&>svg]:w-5 [&>svg]:h-5">{ad.icon}</div>
          </div>
        </div>

        {/* Tag */}
        <div className="absolute top-4 right-4">
          <span
            className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white/90"
            style={{ background: `${ad.tagColor}99` }}
          >
            {ad.tag}
          </span>
        </div>

        {/* Highlight pill */}
        {ad.highlight && (
          <div className="absolute bottom-3 left-4">
            <span
              className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full text-white shadow-md"
              style={{ background: ad.tagColor }}
            >
              <Sparkles className="w-2.5 h-2.5" />
              {ad.highlight}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h4 className={`text-sm font-black ${colorClasses.text.primary} mb-1.5 leading-snug`}>
          {ad.title}
        </h4>
        <p className={`text-xs ${colorClasses.text.muted} leading-relaxed mb-4`}>{ad.body}</p>

        {/* Trust badge */}
        <div
          className={`flex items-center gap-2.5 mb-4 py-2.5 px-3 rounded-xl ${colorClasses.bg.surface}`}
          style={{ border: `1px solid rgba(16,185,129,0.15)` }}
        >
          <CheckCircle className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
          <span className={`text-[11px] font-semibold ${colorClasses.text.secondary}`}>
            Trusted by 1,200+ companies
          </span>
        </div>

        {/* CTA */}
        <a
          href={ad.href}
          target={ad.href.startsWith('http') ? '_blank' : undefined}
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl font-bold text-xs text-[#0A2540] transition-all duration-200"
          style={{
            background: ad.tagColor,
            transform: hovered ? 'scale(1.02)' : 'none',
            boxShadow: hovered ? `0 6px 16px ${ad.tagColor}50` : 'none',
          }}
        >
          {ad.cta}
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200"
            style={{ transform: hovered ? 'translateX(2px)' : 'none' }}
          />
        </a>
      </div>
    </div>
  );
}

// ─── Top Banner ───────────────────────────────────────────────────────────────

interface TopAdBannerProps {
  industry?: CompanyIndustry;
}

export function TenderTopAdBanner({ industry = 'general' }: TopAdBannerProps) {
  const ads = getAdsForIndustry(industry, 3);
  const [visible, setVisible] = useState(true);
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setEntering(false), 600);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="relative rounded-2xl overflow-hidden mb-6"
      style={{
        background: 'linear-gradient(135deg, #0A2540 0%, #0D3060 45%, #0A2540 100%)',
        animation: 'fadeInDown 0.5s ease-out both',
      }}
    >
      {/* Animated mesh background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-16 -left-16 w-56 h-56 rounded-full opacity-10"
          style={{ background: '#F1BB03', animation: 'float1 8s ease-in-out infinite' }}
        />
        <div
          className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full opacity-8"
          style={{ background: '#3B82F6', animation: 'float2 11s ease-in-out infinite' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5"
          style={{ background: '#F1BB03', animation: 'float3 14s ease-in-out infinite' }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
      </div>

      {/* Ticker */}
      <div
        className="relative py-2.5 px-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.18)' }}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-[#F1BB03]" style={{ animation: 'pulse2 1.5s ease-in-out infinite' }} />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#F1BB03]">Live</span>
        </div>
        <TickerStrip />
      </div>

      {/* Main content */}
      <div className="relative p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Headline */}
          <div className="shrink-0 sm:pr-5" style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ background: '#F1BB03' }}
              >
                <Award className="w-4 h-4 text-[#0A2540]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#F1BB03]">
                Featured for You
              </span>
            </div>
            <h3 className="text-sm font-black text-white leading-snug max-w-[160px]">
              Tailored for{' '}
              <span className="text-[#F1BB03]">
                {industry === 'general' ? 'Your Business' : industry.charAt(0).toUpperCase() + industry.slice(1)}
              </span>{' '}
              Companies
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <TrendingUp className="w-3 h-3 text-[#10B981]" />
              <span className="text-[10px] font-semibold text-[#10B981]">Live opportunities</span>
            </div>
          </div>

          {/* Ad cards */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            {ads.map((ad, i) => (
              <TopAdCard key={ad.id} ad={ad} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setVisible(false)}
        className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        style={{ background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.5)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.20)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <style jsx>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(18px, 14px) scale(1.08); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-14px, -18px) scale(1.05); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.12); }
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes pulse2 {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Mobile Ad Strip ──────────────────────────────────────────────────────────

const MOBILE_ADS = [
  { color: '#F1BB03', emoji: '⭐', text: 'Complete your profile → 3× more bids', href: '/dashboard/company/profile' },
  { color: '#10B981', emoji: '💳', text: 'Fast CPO & bonds — apply in minutes', href: '#' },
  { color: '#8B5CF6', emoji: '⚡', text: 'Priority listing: reach 5× more bidders', href: '#' },
  { color: '#3B82F6', emoji: '📋', text: '14 new construction tenders today', href: '/dashboard/company/tenders/tenders' },
];

export function MobileAdStrip({ industry: _industry }: { industry: CompanyIndustry }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'visible' | 'fading'>('visible');

  useEffect(() => {
    const t = setInterval(() => {
      setPhase('fading');
      setTimeout(() => {
        setIdx((i) => (i + 1) % MOBILE_ADS.length);
        setPhase('visible');
      }, 250);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const ad = MOBILE_ADS[idx];

  return (
    <a
      href={ad.href}
      className="flex items-center gap-2.5 px-4 py-3 rounded-2xl mb-5 transition-all duration-200 active:scale-[0.98]"
      style={{
        background: `linear-gradient(135deg, ${ad.color}10, ${ad.color}05)`,
        border: `1px solid ${ad.color}22`,
        opacity: phase === 'fading' ? 0 : 1,
        transition: 'opacity 0.25s ease, transform 0.2s ease',
        boxShadow: `0 2px 12px ${ad.color}12`,
      }}
    >
      <span className="text-lg shrink-0">{ad.emoji}</span>
      <p className={`text-xs font-semibold flex-1 leading-snug ${colorClasses.text.primary}`}>{ad.text}</p>
      <span className="text-xs font-black shrink-0 transition-transform duration-200" style={{ color: ad.color }}>
        →
      </span>
      {/* Progress dots */}
      <div className="flex gap-1 shrink-0">
        {MOBILE_ADS.map((_, i) => (
          <button
            key={i}
            onClick={e => { e.preventDefault(); setIdx(i); }}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === idx ? 12 : 4,
              height: 4,
              background: i === idx ? ad.color : `${ad.color}30`,
            }}
          />
        ))}
      </div>
    </a>
  );
}

// ─── Bottom Banner ────────────────────────────────────────────────────────────

interface BottomAdBannerProps {
  industry?: CompanyIndustry;
  isMobileOverride?: boolean;
}

export function TenderBottomAdBanner({ industry = 'general', isMobileOverride }: BottomAdBannerProps) {
  const allForIndustry = getAdsForIndustry(industry, 6);
  const ads = allForIndustry.slice(3, 6);
  const displayAds = ads.length >= 3 ? ads : getAdsForIndustry(industry, 3);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobileInternal, setIsMobileInternal] = useState(false);

  useEffect(() => {
    if (isMobileOverride !== undefined) return;
    const check = () => setIsMobileInternal(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [isMobileOverride]);

  const isMobile = isMobileOverride !== undefined ? isMobileOverride : isMobileInternal;

  return (
    <div
      className={`mt-8 rounded-2xl overflow-hidden ${colorClasses.bg.secondary}`}
      style={{
        border: '1px solid rgba(0,0,0,0.07)',
        animation: 'fadeInUp 0.5s ease-out 0.2s both',
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #0A2540 0%, #112D4E 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: '#F1BB03' }}
          >
            <Target className="w-4.5 h-4.5 text-[#0A2540]" />
          </div>
          <div>
            <p className="text-xs font-black text-white leading-tight">Recommended Partners</p>
            <p className="text-[10px] text-white/45 font-medium mt-0.5">
              Curated for{' '}
              {industry === 'general'
                ? 'your business'
                : `${industry.charAt(0).toUpperCase() + industry.slice(1)} companies`}
            </p>
          </div>
        </div>

        {isMobile ? (
          <div className="flex items-center gap-1.5">
            {displayAds.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === currentSlide ? 18 : 6,
                  height: 6,
                  background: i === currentSlide ? '#F1BB03' : 'rgba(255,255,255,0.20)',
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/30 font-medium">Sponsored</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#F1BB03]/50" style={{ animation: 'pulse2 2s ease-in-out infinite' }} />
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="p-4 sm:p-5">
        {isMobile ? (
          <div>
            <BottomAdCard ad={displayAds[currentSlide]} index={currentSlide} />
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
                disabled={currentSlide === 0}
                className={`p-2.5 rounded-xl ${colorClasses.bg.primary} ${colorClasses.text.muted} disabled:opacity-30 transition-all hover:border-[#F1BB03]/40 hover:text-[#F1BB03]`}
                style={{ border: `1px solid rgba(0,0,0,0.08)` }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className={`text-xs font-medium ${colorClasses.text.muted}`}>
                {currentSlide + 1} / {displayAds.length}
              </span>
              <button
                onClick={() => setCurrentSlide((p) => Math.min(displayAds.length - 1, p + 1))}
                disabled={currentSlide === displayAds.length - 1}
                className={`p-2.5 rounded-xl ${colorClasses.bg.primary} ${colorClasses.text.muted} disabled:opacity-30 transition-all hover:border-[#F1BB03]/40 hover:text-[#F1BB03]`}
                style={{ border: `1px solid rgba(0,0,0,0.08)` }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {displayAds.map((ad, i) => (
              <BottomAdCard key={ad.id} ad={ad} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className={`px-5 py-3 flex items-center justify-between`}
        style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
      >
        <p className={`text-[10px] ${colorClasses.text.muted}`}>
          Ads personalized based on your company industry
        </p>
        <Link
          href="/dashboard/company/profile"
          className={`text-[10px] font-semibold ${colorClasses.text.muted} hover:text-[#F1BB03] transition-colors flex items-center gap-1`}
        >
          Update industry
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <style jsx>{`
        @keyframes pulse2 {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}