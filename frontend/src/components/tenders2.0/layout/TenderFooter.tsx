// src/components/tender-dashboard/TenderFooter.tsx
import Link from 'next/link';
import { Award, Mail, Phone, Navigation, Facebook, Youtube, Send, MapPin, Sparkles, Zap, ArrowUpRight } from 'lucide-react';
import { colorClasses } from '@/utils/color';
import Image from 'next/image';
import { useState } from 'react';

const tenderLinks = [
  { href: '/dashboard/company/tenders', label: 'Tender Overview', emoji: '📊' },
  { href: '/dashboard/company/tenders/my-tenders', label: 'My Tenders', emoji: '📋' },
  { href: '/dashboard/company/tenders/my-tenders/create', label: 'Create Tender', emoji: '➕' },
  { href: '/dashboard/company/tenders/tenders', label: 'Browse Tenders', emoji: '🔍' },
  { href: '/dashboard/company/tenders/bids', label: 'Incoming Bids', emoji: '📥' },
  { href: '/dashboard/company/tenders/my-bids', label: 'My Bids', emoji: '💼' },
];

const resourceLinks = [
  { href: '/dashboard/company/profile', label: 'Company Profile', emoji: '🏢' },
  { href: '/dashboard/company', label: 'Main Dashboard', emoji: '🏠' },
  { href: '/dashboard/company/jobs', label: 'Job Postings', emoji: '💼' },
  { href: '/dashboard/company/social', label: 'Social Feed', emoji: '💬' },
];

const contactItems = [
  {
    icon: Mail,
    label: 'Email',
    value: 'getbananalink@gmail.com',
    href: 'mailto:getbananalink@gmail.com',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '0926 123 457',
    href: 'tel:0926123457',
  },
  {
    icon: Navigation,
    label: 'Office',
    value: '22 Meklit Building, 1st Floor',
    href: 'https://maps.app.goo.gl/4fkiJhGe12EG8y7V8',
    external: true,
  },
];

function FooterLinkGroup({
  title,
  icon: Icon,
  links,
}: {
  title: string;
  icon: React.ElementType;
  links: { href: string; label: string; emoji?: string }[];
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div>
      <h3 className={`text-[11px] font-black uppercase tracking-[0.14em] mb-5 flex items-center gap-2 ${colorClasses.text.primary}`}>
        <div
          className={`w-6 h-6 rounded-lg ${colorClasses.bg.surface} flex items-center justify-center`}
          style={{ border: '1px solid rgba(241,187,3,0.15)' }}
        >
          <Icon className="w-3.5 h-3.5 text-[#F1BB03]" />
        </div>
        {title}
      </h3>
      <div className="space-y-0.5">
        {links.map((item, i) => (
          <Link
            key={item.label}
            href={item.href}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="flex items-center gap-2.5 py-2 px-2.5 rounded-xl transition-all duration-200 group"
            style={{
              background: hoveredIdx === i ? 'rgba(241,187,3,0.06)' : 'transparent',
              paddingLeft: hoveredIdx === i ? '14px' : '10px',
            }}
          >
            {item.emoji && (
              <span className="text-sm shrink-0 transition-transform duration-200"
                style={{ transform: hoveredIdx === i ? 'scale(1.15)' : 'scale(1)' }}
              >
                {item.emoji}
              </span>
            )}
            <span
              className={`text-xs font-medium ${colorClasses.text.muted} transition-colors duration-150`}
              style={{ color: hoveredIdx === i ? '#F1BB03' : undefined }}
            >
              {item.label}
            </span>
            {hoveredIdx === i && (
              <ArrowUpRight className="w-3 h-3 text-[#F1BB03] ml-auto opacity-60" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function TenderFooter() {
  return (
    <footer
      className={`relative ${colorClasses.bg.primary} transition-colors duration-300`}
      style={{ borderTop: '1px solid rgba(241,187,3,0.10)' }}
    >
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, #F1BB03 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Gold accent top bar */}
      <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, #F1BB03 30%, #F1BB03 70%, transparent)' }} />

      <div className="relative z-10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

            {/* ── Brand column ── */}
            <div className="space-y-5 lg:col-span-1">
              <Link href="/dashboard/company/tenders" className="flex items-center gap-3 group">
                <div className="relative">
                  {/* Logo glow */}
                  <div
                    className="absolute -inset-1.5 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, #F1BB03, #D9A800)' }}
                  />
                  <div
                    className="relative w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #F1BB03 0%, #D9A800 100%)' }}
                  >
                    <Image src="/logo.png" alt="Banana" width={42} height={42} className="object-contain filter brightness-0" />
                  </div>
                  <div
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md flex items-center justify-center shadow-md"
                    style={{ background: '#0A2540' }}
                  >
                    <Award className="w-3 h-3 text-[#F1BB03]" />
                  </div>
                </div>
                <div className="leading-none">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-black text-[#F1BB03] tracking-widest uppercase">Banana</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-[#F1BB03]/50" />
                    <span className={`text-[10px] font-bold tracking-[0.18em] uppercase ${colorClasses.text.muted}`}>
                      Tender Center
                    </span>
                  </div>
                </div>
              </Link>

              <p className={`text-xs leading-relaxed ${colorClasses.text.muted}`}>
                Ethiopia&apos;s premier procurement platform connecting companies, freelancers, and organizations for transparent and efficient tender processes.
              </p>

              {/* Social links */}
              <div className="flex items-center gap-2 pt-1">
                {[
                  { href: 'https://www.facebook.com/jobonbanana', icon: <Facebook className="w-3.5 h-3.5" /> },
                  { href: '#', icon: <Youtube className="w-3.5 h-3.5" /> },
                  {
                    href: '#',
                    icon: (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                      </svg>
                    ),
                  },
                ].map((s, i) => (
                  <a
                    key={i}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg"
                    style={{ background: '#F1BB03', color: '#0A2540' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#D9A800'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#F1BB03'; }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>

              {/* Live stat pill */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)', color: '#10B981' }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                Platform online · 1,200+ companies
              </div>
            </div>

            {/* ── Tender links ── */}
            <FooterLinkGroup title="Tender" icon={Award} links={tenderLinks} />

            {/* ── Quick links ── */}
            <FooterLinkGroup title="Quick Links" icon={Send} links={resourceLinks} />

            {/* ── Contact ── */}
            <div>
              <h3 className={`text-[11px] font-black uppercase tracking-[0.14em] mb-5 flex items-center gap-2 ${colorClasses.text.primary}`}>
                <div
                  className={`w-6 h-6 rounded-lg ${colorClasses.bg.surface} flex items-center justify-center`}
                  style={{ border: '1px solid rgba(241,187,3,0.15)' }}
                >
                  <MapPin className="w-3.5 h-3.5 text-[#F1BB03]" />
                </div>
                Contact
              </h3>
              <div className="space-y-3">
                {contactItems.map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <a
                      key={i}
                      href={c.href}
                      target={c.external ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 group py-1"
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-md"
                        style={{
                          background: 'rgba(241,187,3,0.10)',
                          color: '#F1BB03',
                          border: '1px solid rgba(241,187,3,0.15)',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = '#F1BB03';
                          (e.currentTarget as HTMLElement).style.color = '#0A2540';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(241,187,3,0.10)';
                          (e.currentTarget as HTMLElement).style.color = '#F1BB03';
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className={`text-[10px] uppercase tracking-wider font-bold ${colorClasses.text.muted} mb-0.5`}>
                          {c.label}
                        </p>
                        <p className={`text-xs font-medium ${colorClasses.text.secondary} group-hover:text-[#F1BB03] transition-colors duration-150`}>
                          {c.value}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div
          className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
          style={{ borderTop: '1px solid rgba(241,187,3,0.08)' }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-[#F1BB03]/50" />
              <p className={`text-[11px] ${colorClasses.text.muted}`}>
                © {new Date().getFullYear()} Banana Tender Center. All rights reserved.
              </p>
            </div>
            <div className="flex items-center gap-5">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`text-[11px] font-medium ${colorClasses.text.muted} hover:text-[#F1BB03] transition-colors duration-150`}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </footer>
  );
}