// /src/components/layouts/Footer.tsx
import Link from 'next/link';
import { Briefcase, Mail, Phone, MapPin, Navigation, Facebook, Youtube, MessageCircle, Send } from 'lucide-react';
import { colors } from '@/utils/color';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export default function Footer() {
  const { user } = useAuth();

  // Get role-based links for Quick Links section
  const getRoleBasedLinks = () => {
    if (!user) {
      return [
        { href: "/signup", label: "Find Jobs", icon: "💼" },
        { href: "/signup", label: "Find Tenders", icon: "📋" },
        { href: "/signup", label: "For Companies", icon: "🏢" },
        { href: "/signup", label: "For Organizations", icon: "🏛️" }
      ];
    }

    switch (user.role) {
      case "candidate":
        return [
          { href: "/dashboard/candidate/jobs", label: "Find Jobs", icon: "💼" },
          { href: "/dashboard/candidate", label: "Dashboard", icon: "📊" },
          { href: "/dashboard/candidate/profile", label: "Profile", icon: "👤" },
          { href: "/dashboard/candidate/social", label: "Social Feed", icon: "💬" },
        ];
      case "freelancer":
        return [
          { href: "/dashboard/freelancer/tenders", label: "Browse Tenders", icon: "📋" },
          { href: "/dashboard/freelancer", label: "Dashboard", icon: "📊" },
          { href: "/dashboard/freelancer/profile", label: "Profile", icon: "👤" },
          { href: "/dashboard/freelancer/social", label: "Social Feed", icon: "💬" },
        ];
      case "company":
        return [
          { href: "/dashboard/company/jobs", label: "Manage Jobs", icon: "💼" },
          { href: "/tenders", label: "Browse Tenders", icon: "📋" },
          { href: "/dashboard/company", label: "Dashboard", icon: "📊" },
          { href: "/dashboard/company/social", label: "Social Feed", icon: "💬" },
        ];
      case "organization":
        return [
          { href: "/dashboard/organization/tenders", label: "My Tenders", icon: "📋" },
          { href: "/dashboard/organization", label: "Dashboard", icon: "📊" },
          { href: "/dashboard/organization/profile", label: "Profile", icon: "👤" },
          { href: "/dashboard/organization/social", label: "Social Feed", icon: "💬" },
        ];
      case "admin":
        return [
          { href: "/dashboard/admin/users", label: "User Management", icon: "👥" },
          { href: "/dashboard/admin/jobs", label: "Job Management", icon: "📊" },
          { href: "/dashboard/admin", label: "Dashboard", icon: "🛡️" },
        ];
      default:
        return [];
    }
  };

  const roleBasedLinks = getRoleBasedLinks();

  return (
    <footer className="relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 z-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundColor: colors.darkNavy
        }}
      />

      {/* Main Content */}
      <div className="relative z-10" style={{ backgroundColor: colors.white, color: colors.darkNavy }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {/* Company Info */}
            <div className="space-y-6">
              {/* Logo - Bigger size */}
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden">
                    <Image
                      src="/logo.png"
                      alt="Banana"
                      width={108}
                      height={108}
                    />
                  </div>
                </div>
                <span className="text-2xl font-bold text-gray-900">Banana</span>
              </Link>

              <p className="text-lg leading-relaxed max-w-md" style={{ color: colors.darkNavy }}>
                Connecting exceptional talent with world-class opportunities. Your career journey starts here.
              </p>

              <div className="flex space-x-4 pt-4">
                <a href="https://www.facebook.com/jobonbanana" className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg" style={{ backgroundColor: colors.gray800, color: colors.white }}>
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg" style={{ backgroundColor: colors.gray800, color: colors.white }}>
                  <Youtube className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg" style={{ backgroundColor: colors.gray800, color: colors.white }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg" style={{ backgroundColor: colors.gray800, color: colors.white }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.4-1.08.39-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-semibold mb-8 flex items-center pb-3 border-b" style={{ borderColor: colors.gray800 }}>
                <Send className="w-5 h-5 mr-3" style={{ color: colors.gold }} />
                Quick Navigation
              </h3>
              <div className="space-y-4">
                {roleBasedLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 hover:bg-gray-800/50 hover:pl-4 group"
                    style={{ color: colors.darkNavy }}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium group-hover:text-white transition-colors">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-xl font-semibold mb-8 flex items-center pb-3 border-b" style={{ borderColor: colors.gray800 }}>
                <MapPin className="w-5 h-5 mr-3" style={{ color: colors.gold }} />
                Contact & Location
              </h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.darkNavy }}>
                    <Mail className="w-5 h-5" style={{ color: colors.gold }} />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-wider font-semibold mb-1" style={{ color: colors.darkNavy }}>
                      Email
                    </p>
                    <a
                      href="mailto:getbananalink@gmail.com"
                      className="text-lg font-medium hover:text-gold transition-colors"
                      style={{ color: colors.darkNavy }}
                    >
                      getbananalink@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.darkNavy }}>
                    <Phone className="w-5 h-5" style={{ color: colors.gold }} />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-wider font-semibold mb-1" style={{ color: colors.darkNavy }}>
                      Phone
                    </p>
                    <a
                      href="tel:0926123457"
                      className="text-lg font-medium hover:text-gold transition-colors"
                      style={{ color: colors.darkNavy }}
                    >
                      0926123457
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.darkNavy }}>
                    <Navigation className="w-5 h-5" style={{ color: colors.gold }} />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-wider font-semibold mb-1" style={{ color: colors.darkNavy }}>
                      Office Location
                    </p>
                    <a
                      href="https://maps.app.goo.gl/4fkiJhGe12EG8y7V8"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-medium hover:text-gold transition-colors group"
                      style={{ color: colors.white }}
                    >
                      <span className="flex items-center">
                        22 Meklit Building, 1st Floor
                        <svg
                          className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </span>
                    </a>
                    <p className="text-sm mt-1" style={{ color: colors.darkNavy }}>
                      View on Google Maps →
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: `1px solid ${colors.gray800}` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-sm" style={{ color: colors.gray400 }}>
                © {new Date().getFullYear()} Banana Jobs. All rights reserved. Made with ❤️ for the global workforce.
              </p>
              <div className="flex items-center space-x-6">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                  <Link
                    key={item}
                    href={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-sm font-medium hover:text-gold transition-colors"
                    style={{ color: colors.gray400 }}
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}