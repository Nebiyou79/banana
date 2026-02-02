import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Briefcase, Users, Building, Globe, Shield, Handshake, Target } from 'lucide-react';
import { colors } from '@/utils/color';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-24" style={{ backgroundColor: colors.gray100 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6" style={{ color: colors.darkNavy }}>
              One Platform. Global Opportunities.
            </h1>
            <p className="text-xl md:text-2xl mb-4" style={{ color: colors.goldenMustard, fontWeight: '600' }}>
              Jobs • Tenders • Personal Branding • Professional Networking
            </p>
            <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto" style={{ color: colors.gray800 }}>
              GetBananaLink is a professional digital platform connecting candidates, companies, NGOs,
              government offices, freelancers, and organizations to discover job opportunities, post tenders,
              build trusted partnerships, and collaborate locally and internationally.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/register?type=jobseeker"
                className="px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                style={{
                  backgroundColor: colors.goldenMustard,
                  color: colors.darkNavy
                }}
              >
                Find Opportunities
              </Link>
              <Link
                href="/register?type=employer"
                className="border-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-lg"
                style={{
                  borderColor: colors.goldenMustard,
                  backgroundColor: 'white',
                  color: colors.darkNavy
                }}
              >
                Post Opportunities
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
              style={{ backgroundColor: colors.goldenMustard + '20' }}>
              <Globe className="w-8 h-8" style={{ color: colors.goldenMustard }} />
            </div>
            <p className="text-xl md:text-2xl leading-relaxed" style={{ color: colors.gray800 }}>
              GetBananaLink.com enables role-based professional connections for employment,
              tender opportunities, and business-to-business collaboration. Our platform is
              designed to help users post, discover, and connect through verified profiles,
              making professional opportunities accessible across borders.
            </p>
          </div>
        </div>
      </section>

      {/* Role-Based Services Section */}
      <section className="py-20" style={{ backgroundColor: colors.gray100 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: colors.darkNavy }}>
              Role-Based Professional Services
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: colors.gray800 }}>
              Tailored solutions for every professional need
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Candidates & Job Seekers */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: colors.blue + '15' }}>
                  <Users className="w-7 h-7" style={{ color: colors.blue }} />
                </div>
                <h3 className="text-xl font-semibold" style={{ color: colors.darkNavy }}>
                  Candidates & Job Seekers
                </h3>
              </div>
              <ul className="space-y-3" style={{ color: colors.gray800 }}>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.blue }}></div>
                  <span>Discover local and international job opportunities</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.blue }}></div>
                  <span>Create a professional profile to showcase skills and experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.blue }}></div>
                  <span>Connect directly with companies, organizations, and recruiters</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.blue }}></div>
                  <span>Apply for jobs and professional opportunities with confidence</span>
                </li>
              </ul>
            </div>

            {/* Freelancers & Independent Professionals */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: colors.goldenMustard + '15' }}>
                  <Briefcase className="w-7 h-7" style={{ color: colors.goldenMustard }} />
                </div>
                <h3 className="text-xl font-semibold" style={{ color: colors.darkNavy }}>
                  Freelancers & Independent Professionals
                </h3>
              </div>
              <ul className="space-y-3" style={{ color: colors.gray800 }}>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.goldenMustard }}></div>
                  <span>Find freelance projects, contracts, and tenders</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.goldenMustard }}></div>
                  <span>Promote personal branding and professional services</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.goldenMustard }}></div>
                  <span>Connect with companies, NGOs, and government entities</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.goldenMustard }}></div>
                  <span>Expand business opportunities internationally</span>
                </li>
              </ul>
            </div>

            {/* Companies & Businesses */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: colors.teal + '15' }}>
                  <Building className="w-7 h-7" style={{ color: colors.teal }} />
                </div>
                <h3 className="text-xl font-semibold" style={{ color: colors.darkNavy }}>
                  Companies & Businesses
                </h3>
              </div>
              <ul className="space-y-3" style={{ color: colors.gray800 }}>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.teal }}></div>
                  <span>Post job listings and hire qualified candidates</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.teal }}></div>
                  <span>Publish tenders and business opportunities</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.teal }}></div>
                  <span>Connect with freelancers, professionals, and organizations</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.teal }}></div>
                  <span>Build your company`s professional brand and visibility</span>
                </li>
              </ul>
            </div>

            {/* NGOs & Government Offices */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: colors.teal + '15' }}>
                  <Shield className="w-7 h-7" style={{ color: colors.teal }} />
                </div>
                <h3 className="text-xl font-semibold" style={{ color: colors.darkNavy }}>
                  NGOs & Government Offices
                </h3>
              </div>
              <ul className="space-y-3" style={{ color: colors.gray800 }}>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.teal }}></div>
                  <span>Publish official tenders and project opportunities</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.teal }}></div>
                  <span>Reach verified professionals, companies, and volunteers</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.teal }}></div>
                  <span>Enable transparent and professional collaboration</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.teal }}></div>
                  <span>Strengthen institutional outreach</span>
                </li>
              </ul>
            </div>

            {/* Organizations & Business Networks */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: colors.gold + '15' }}>
                  <Handshake className="w-7 h-7" style={{ color: colors.gold }} />
                </div>
                <h3 className="text-xl font-semibold" style={{ color: colors.darkNavy }}>
                  Organizations & Business Networks
                </h3>
              </div>
              <ul className="space-y-3" style={{ color: colors.gray800 }}>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.gold }}></div>
                  <span>Collaborate with companies and professionals worldwide</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.gold }}></div>
                  <span>Share opportunities, partnerships, and tenders</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.gold }}></div>
                  <span>Build trusted professional relationships</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.gold }}></div>
                  <span>Support employment and economic growth</span>
                </li>
              </ul>
            </div>

            {/* Why Choose Us Card */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2"
              style={{ borderColor: colors.goldenMustard }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: colors.goldenMustard + '15' }}>
                  <Target className="w-7 h-7" style={{ color: colors.goldenMustard }} />
                </div>
                <h3 className="text-xl font-semibold" style={{ color: colors.darkNavy }}>
                  Why Choose GetBananaLink
                </h3>
              </div>
              <ul className="space-y-3" style={{ color: colors.gray800 }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: colors.goldenMustard, fontWeight: '600' }}>✔</span>
                  <span>Role-based professional access</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: colors.goldenMustard, fontWeight: '600' }}>✔</span>
                  <span>Secure and transparent opportunity sharing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: colors.goldenMustard, fontWeight: '600' }}>✔</span>
                  <span>Local and international reach</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: colors.goldenMustard, fontWeight: '600' }}>✔</span>
                  <span>Designed for jobs, tenders, and B2B collaboration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: colors.goldenMustard, fontWeight: '600' }}>✔</span>
                  <span>One platform for all professional needs</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: colors.darkNavy }}>
              Global Impact in Numbers
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: colors.gray800 }}>
              Connecting professionals and organizations worldwide
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: colors.gold + '20' }}
              >
                <Users className="w-8 h-8" style={{ color: colors.gold }} />
              </div>
              <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: colors.gold }}>100K+</div>
              <div style={{ color: colors.gray800 }}>Active Professionals</div>
            </div>
            <div className="p-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: colors.goldenMustard + '20' }}
              >
                <Briefcase className="w-8 h-8" style={{ color: colors.goldenMustard }} />
              </div>
              <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: colors.goldenMustard }}>50K+</div>
              <div style={{ color: colors.gray800 }}>Opportunities Posted</div>
            </div>
            <div className="p-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: colors.teal + '20' }}
              >
                <Building className="w-8 h-8" style={{ color: colors.teal }} />
              </div>
              <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: colors.teal }}>10K+</div>
              <div style={{ color: colors.gray800 }}>Organizations</div>
            </div>
            <div className="p-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: colors.blue + '20' }}
              >
                <Globe className="w-8 h-8" style={{ color: colors.blue }} />
              </div>
              <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: colors.blue }}>150+</div>
              <div style={{ color: colors.gray800 }}>Countries Reached</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20" style={{ backgroundColor: colors.darkNavy }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Join GetBananaLink Today
          </h2>
          <p className="text-xl mb-10" style={{ color: colors.gray400 }}>
            Create your profile. Share opportunities. Connect globally.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              style={{
                backgroundColor: colors.goldenMustard,
                color: colors.darkNavy
              }}
            >
              Get Started Free
            </Link>
            <Link
              href="/about"
              className="border-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-lg"
              style={{
                borderColor: colors.goldenMustard,
                backgroundColor: 'transparent',
                color: colors.goldenMustard
              }}
            >
              Learn More
            </Link>
          </div>
          <p className="mt-8 text-lg" style={{ color: colors.goldenMustard }}>
            GetBananaLink.com
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}