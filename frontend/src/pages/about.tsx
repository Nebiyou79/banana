import React, { JSX, useState } from 'react';
import {
  Building2, Users, Briefcase, Globe, Handshake, Shield,
  Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram,
  ArrowRight, CheckCircle, Zap, Rocket, Star, Award, Target,
  Globe2, FileText, Users2, BuildingIcon, Network
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Button from '@/components/forms/Button';
import { Textarea } from '@/components/ui/textarea';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { colorClasses } from '@/utils/color';

export default function AboutUsPage(): JSX.Element {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    roles: false,
    phases: false,
    dataModels: false
  });

  const toggleSection = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors: { [k: string]: string } = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = 'Enter a valid email';
    if (!formData.subject.trim()) errors.subject = 'Subject is required';
    if (!formData.message.trim()) errors.message = 'Message is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    console.log('Contact submission:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitted(false);
    }, 1200);
  };

  const valuePoints = [
    { icon: Target, title: "Role-Based Access", desc: "Tailored experiences for every professional role" },
    { icon: Shield, title: "Verified & Secure", desc: "Trusted profiles and secure transactions" },
    { icon: Globe2, title: "Global Reach", desc: "Connect locally and internationally" },
    { icon: Handshake, title: "B2B Collaboration", desc: "Build professional partnerships seamlessly" },
    { icon: Zap, title: "Fast Matching", desc: "AI-powered opportunity discovery" },
    { icon: FileText, title: "Comprehensive Platform", desc: "Jobs, tenders, networking in one place" }
  ];

  const services = [
    {
      role: "Candidates & Job Seekers",
      icon: Users2,
      color: "from-blue-500 to-blue-600",
      points: [
        "Discover local and international job opportunities",
        "Create professional profile to showcase skills",
        "Direct connection with companies and recruiters",
        "Confident application for opportunities"
      ]
    },
    {
      role: "Freelancers & Independent Professionals",
      icon: Briefcase,
      color: "from-amber-500 to-amber-600",
      points: [
        "Find freelance projects and contracts",
        "Promote personal branding and services",
        "Connect with companies, NGOs, government",
        "Expand business internationally"
      ]
    },
    {
      role: "Companies & Businesses",
      icon: BuildingIcon,
      color: "from-teal-500 to-teal-600",
      points: [
        "Post job listings and hire talent",
        "Publish tenders and business opportunities",
        "Connect with professionals and organizations",
        "Build company brand and visibility"
      ]
    },
    {
      role: "NGOs & Government Offices",
      icon: Shield,
      color: "from-purple-500 to-purple-600",
      points: [
        "Publish official tenders and projects",
        "Reach verified professionals and volunteers",
        "Enable transparent collaboration",
        "Strengthen institutional outreach"
      ]
    },
    {
      role: "Organizations & Networks",
      icon: Network,
      color: "from-green-500 to-green-600",
      points: [
        "Collaborate with professionals worldwide",
        "Share opportunities and partnerships",
        "Build trusted professional relationships",
        "Support employment and economic growth"
      ]
    }
  ];

  return (
    <DashboardLayout>
      <div className={`min-h-screen bg-gradient-to-b from-slate-50 to-white ${colorClasses.text.darkNavy}`}>
        {/* Hero Section */}
        <header className="relative py-12 md:py-20 lg:py-24 bg-gradient-to-br from-navy-900 to-navy-800 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-yellow-500/10 rounded-full -translate-y-16 md:-translate-y-32 translate-x-8 md:translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 md:w-96 md:h-96 bg-amber-500/10 rounded-full -translate-x-16 md:-translate-x-64 translate-y-32 md:translate-y-64"></div>

          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 md:gap-3 mb-4 md:mb-6 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/10 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-xs md:text-sm font-medium">GetBananaLink Platform</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 md:mb-6 leading-tight">
                One Platform.<br />
                <span className="text-yellow-400">Global Opportunities.</span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-10 max-w-3xl mx-auto font-light leading-relaxed">
                Connecting professionals, companies, NGOs, and government offices worldwide
                through jobs, tenders, personal branding, and professional networking.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <Link href="/register">
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-navy-900 font-semibold px-6 md:px-8 py-3 md:py-4 rounded-xl text-base md:text-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl w-full sm:w-auto">
                    Join Platform <ArrowRight className="inline-block ml-2 w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </Link>
                <Link href="#platform-overview">
                  <Button variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-6 md:px-8 py-3 md:py-4 rounded-xl text-base md:text-lg w-full sm:w-auto">
                    Platform Overview
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Platform Overview */}
        <main className="container mx-auto px-4 sm:px-6 py-10 md:py-16 lg:py-20">
          <section id="platform-overview" className="max-w-6xl mx-auto mb-12 md:mb-20">
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg md:shadow-2xl p-6 md:p-8 lg:p-12">
              <div className="flex flex-col lg:flex-row items-start gap-6 md:gap-8">
                <div className="lg:w-1/3">
                  <div className="sticky top-6 md:top-8">
                    <div className={`p-4 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-100 mb-4 md:mb-6 ${colorClasses.text.darkNavy}`}>
                      <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                        <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-yellow-100">
                          <Star className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold">GetBananaLink</h2>
                      </div>
                      <p className="text-sm md:text-sm">
                        Professional digital platform for global opportunities and connections
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                      {[
                        { value: "100K+", label: "Professionals" },
                        { value: "50K+", label: "Opportunities" },
                        { value: "10K+", label: "Organizations" },
                        { value: "150+", label: "Countries" }
                      ].map((stat, index) => (
                        <div key={index} className={`p-3 md:p-4 rounded-lg md:rounded-xl bg-slate-50 ${colorClasses.text.darkNavy}`}>
                          <div className="text-lg md:text-xl lg:text-2xl font-bold">{stat.value}</div>
                          <div className="text-xs md:text-sm text-slate-600">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:w-2/3">
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Platform Vision & Mission</h3>

                  <div className="space-y-4 md:space-y-6">
                    <div className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-gradient-to-r from-blue-50 to-white border border-blue-100">
                      <h4 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                        Our Mission
                      </h4>
                      <p className="text-slate-700 leading-relaxed text-sm md:text-base">
                        To democratize access to professional opportunities by creating a unified platform
                        that connects talent with opportunities across borders, sectors, and professional needs.
                      </p>
                    </div>

                    <div className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-gradient-to-r from-amber-50 to-white border border-amber-100">
                      <h4 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                        Our Vision
                      </h4>
                      <p className="text-slate-700 leading-relaxed text-sm md:text-base">
                        A world where every professional can easily discover opportunities,
                        every organization can find the right talent, and global collaboration
                        is just a click away through one comprehensive platform.
                      </p>
                    </div>

                    <div className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-gradient-to-r from-slate-50 to-white border border-slate-200">
                      <h4 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Platform Value Statement</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        {valuePoints.map((item, index) => (
                          <div key={index} className="flex items-start gap-2 md:gap-3 p-3 rounded-lg bg-white">
                            <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${index === 0 ? 'bg-blue-100 text-blue-600' :
                                index === 1 ? 'bg-green-100 text-green-600' :
                                  index === 2 ? 'bg-purple-100 text-purple-600' :
                                    index === 3 ? 'bg-amber-100 text-amber-600' :
                                      index === 4 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                              }`}>
                              <item.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-800 text-sm md:text-base">{item.title}</div>
                              <div className="text-xs md:text-sm text-slate-600 mt-0.5">{item.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Role-Based Services */}
          <section className="max-w-6xl mx-auto mb-12 md:mb-20">
            <div className="text-center mb-8 md:mb-12">
              <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-amber-100 text-amber-700 mb-3 md:mb-4">
                <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm font-medium">Role-Based Services</span>
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Comprehensive Services for Every Professional Need
              </h2>
              <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
                GetBananaLink.com enables role-based professional connections for employment,
                tender opportunities, and business-to-business collaboration.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {services.map((service, index) => (
                <div key={index} className="group bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-200">
                  <div className={`p-4 md:p-6 rounded-t-xl md:rounded-t-2xl bg-gradient-to-r ${service.color} text-white`}>
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm">
                        <service.icon className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold">{service.role}</h3>
                    </div>
                  </div>

                  <div className="p-4 md:p-6">
                    <ul className="space-y-2 md:space-y-3">
                      {service.points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 md:gap-3 text-slate-700">
                          <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm md:text-base">{point}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs md:text-sm text-slate-500">Perfect for:</span>
                        <Link
                          href={`/register?type=${service.role.toLowerCase().includes('candidate') ? 'jobseeker' :
                              service.role.toLowerCase().includes('freelancer') ? 'freelancer' :
                                service.role.toLowerCase().includes('company') ? 'employer' :
                                  service.role.toLowerCase().includes('ngo') ? 'ngo' : 'organization'
                            }`}
                          className="text-xs md:text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1"
                        >
                          Join as this role
                          <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Platform Specifications */}
          <section className="max-w-6xl mx-auto mb-12 md:mb-20">
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-slate-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">Platform Specifications</h2>
                  <p className="text-slate-600 text-sm md:text-base">Technical overview and development roadmap</p>
                </div>
                <div className="px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-navy-900 text-white text-xs md:text-sm font-medium">
                  GetBananaLink v2.0
                </div>
              </div>

              {/* Accordion Sections */}
              <div className="space-y-3 md:space-y-4">
                {[
                  {
                    key: 'roles',
                    title: 'User Roles & Access Control',
                    description: 'Candidate, Freelancer, Company, NGO, Government, Organization, Admin',
                    content: (
                      <div className="space-y-3 md:space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          <div className="p-3 md:p-4 rounded-xl bg-white border border-slate-200">
                            <h4 className="font-semibold mb-2 text-sm md:text-base">Primary Roles</h4>
                            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-slate-700">
                              <li className="flex items-center gap-2"><Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" /> Candidates & Job Seekers</li>
                              <li className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" /> Freelancers & Professionals</li>
                              <li className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-teal-500" /> Companies & Businesses</li>
                              <li className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-500" /> NGOs & Government</li>
                              <li className="flex items-center gap-2"><Network className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" /> Organizations & Networks</li>
                              <li className="flex items-center gap-2"><Award className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" /> Platform Administrators</li>
                            </ul>
                          </div>
                          <div className="p-3 md:p-4 rounded-xl bg-white border border-slate-200">
                            <h4 className="font-semibold mb-2 text-sm md:text-base">Access Features</h4>
                            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-slate-700">
                              <li>• Role-based permissions and views</li>
                              <li>• Customized dashboards for each role</li>
                              <li>• Granular privacy controls</li>
                              <li>• Multi-level verification system</li>
                              <li>• Cross-role communication channels</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'phases',
                    title: 'Development Roadmap',
                    description: 'Phase-based feature rollout and enhancements',
                    content: (
                      <div className="space-y-4 md:space-y-6">
                        <div className="p-3 md:p-4 rounded-xl bg-gradient-to-r from-blue-50 to-white border border-blue-100">
                          <h4 className="font-semibold mb-2 text-blue-900 text-sm md:text-base">Phase 1 — Core Platform (Current)</h4>
                          <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-slate-700">
                            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" /> User registration and role-based profiles</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" /> Job and tender posting system</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" /> Professional networking features</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" /> Application and proposal management</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" /> Basic messaging and notifications</li>
                          </ul>
                        </div>
                        <div className="p-3 md:p-4 rounded-xl bg-gradient-to-r from-amber-50 to-white border border-amber-100">
                          <h4 className="font-semibold mb-2 text-amber-900 text-sm md:text-base">Phase 2 — Enhanced Features</h4>
                          <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-slate-700">
                            <li className="flex items-center gap-2"><Rocket className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" /> AI-powered matching algorithms</li>
                            <li className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" /> Mobile applications (iOS & Android)</li>
                            <li className="flex items-center gap-2"><Handshake className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" /> Advanced B2B collaboration tools</li>
                            <li className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" /> Multi-language support</li>
                            <li className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" /> Enhanced security and verification</li>
                          </ul>
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'dataModels',
                    title: 'Data Architecture',
                    description: 'Core data models and system relationships',
                    content: (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div>
                          <h4 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">Core Models</h4>
                          <ul className="space-y-2 md:space-y-3 text-xs md:text-sm">
                            <li className="p-2 md:p-3 rounded-lg bg-white border border-slate-200">
                              <div className="font-medium text-slate-800">User/Profile Model</div>
                              <div className="text-xs text-slate-600 mt-1">Role, verification, skills, preferences, privacy</div>
                            </li>
                            <li className="p-2 md:p-3 rounded-lg bg-white border border-slate-200">
                              <div className="font-medium text-slate-800">Opportunity Model</div>
                              <div className="text-xs text-slate-600 mt-1">Jobs, tenders, projects with categorization</div>
                            </li>
                            <li className="p-2 md:p-3 rounded-lg bg-white border border-slate-200">
                              <div className="font-medium text-slate-800">Application Model</div>
                              <div className="text-xs text-slate-600 mt-1">Status tracking, documents, communication</div>
                            </li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">System Features</h4>
                          <ul className="space-y-2 md:space-y-3 text-xs md:text-sm">
                            <li className="p-2 md:p-3 rounded-lg bg-white border border-slate-200">
                              <div className="font-medium text-slate-800">Search & Discovery</div>
                              <div className="text-xs text-slate-600 mt-1">AI-powered matching with filters</div>
                            </li>
                            <li className="p-2 md:p-3 rounded-lg bg-white border border-slate-200">
                              <div className="font-medium text-slate-800">Communication</div>
                              <div className="text-xs text-slate-600 mt-1">Real-time messaging and notifications</div>
                            </li>
                            <li className="p-2 md:p-3 rounded-lg bg-white border border-slate-200">
                              <div className="font-medium text-slate-800">Analytics</div>
                              <div className="text-xs text-slate-600 mt-1">Platform insights and user analytics</div>
                            </li>
                          </ul>
                        </div>
                      </div>
                    )
                  }
                ].map((section) => (
                  <div key={section.key} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSection(section.key)}
                      className="w-full text-left p-4 md:p-6 bg-white hover:bg-slate-50 transition-colors flex justify-between items-center"
                    >
                      <div>
                        <div className="text-base md:text-lg font-semibold">{section.title}</div>
                        <div className="text-xs md:text-sm text-slate-600 mt-1">{section.description}</div>
                      </div>
                      <div className="text-slate-500 text-lg md:text-xl">
                        {openSections[section.key] ? '−' : '+'}
                      </div>
                    </button>
                    {openSections[section.key] && (
                      <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200">
                        {section.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {/* Contact Information */}
              <div className="bg-gradient-to-br from-navy-900 to-navy-800 text-white rounded-2xl md:rounded-3xl p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Contact GetBananaLink</h2>
                <p className="text-slate-300 mb-6 md:mb-8 text-sm md:text-base">
                  Get in touch for partnerships, platform inquiries, or support.
                  We're here to help you connect with global opportunities.
                </p>

                <div className="space-y-4 md:space-y-6">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white/10 flex-shrink-0">
                      <Mail className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm md:text-base">Email</div>
                      <div className="text-slate-300 text-sm md:text-base">contact@getbananalink.com</div>
                      <div className="text-slate-300 text-sm md:text-base">support@getbananalink.com</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white/10 flex-shrink-0">
                      <Phone className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm md:text-base">Phone</div>
                      <div className="text-slate-300 text-sm md:text-base">+1 (234) 567-8900</div>
                      <div className="text-xs md:text-sm text-slate-400">Available 9AM-6PM GMT</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-white/10 flex-shrink-0">
                      <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm md:text-base">Global Headquarters</div>
                      <div className="text-slate-300 text-sm md:text-base">123 Innovation Drive</div>
                      <div className="text-slate-300 text-sm md:text-base">San Francisco, CA 94107</div>
                      <div className="text-slate-300 text-sm md:text-base">United States</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-white/20">
                  <div className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Connect With Us</div>
                  <div className="flex gap-2 md:gap-3">
                    {[
                      { icon: Linkedin, href: "#" },
                      { icon: Twitter, href: "#" },
                      { icon: Facebook, href: "#" },
                      { icon: Instagram, href: "#" }
                    ].map((social, index) => (
                      <a
                        key={index}
                        href={social.href}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        aria-label={social.icon.name}
                      >
                        <social.icon className="w-4 h-4 md:w-5 md:h-5" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-lg md:shadow-xl border border-slate-200">
                <h2 className="text-xl md:text-2xl font-bold mb-2">Send a Message</h2>
                <p className="text-slate-600 mb-4 md:mb-6 text-sm md:text-base">We'll respond within 24-48 hours.</p>

                <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                  <div>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                      className={`rounded-lg md:rounded-xl border-slate-300 ${colorClasses.border.gray400}`}
                    />
                    {formErrors.name && <div className="text-red-600 text-xs md:text-sm mt-1">{formErrors.name}</div>}
                  </div>

                  <div>
                    <Input
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Your email address"
                      className={`rounded-lg md:rounded-xl border-slate-300 ${colorClasses.border.gray400}`}
                    />
                    {formErrors.email && <div className="text-red-600 text-xs md:text-sm mt-1">{formErrors.email}</div>}
                  </div>

                  <div>
                    <Input
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Subject"
                      className={`rounded-lg md:rounded-xl border-slate-300 ${colorClasses.border.gray400}`}
                    />
                    {formErrors.subject && <div className="text-red-600 text-xs md:text-sm mt-1">{formErrors.subject}</div>}
                  </div>

                  <div>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Your message..."
                      rows={4}
                      className={`rounded-lg md:rounded-xl border-slate-300 ${colorClasses.border.gray400}`}
                    />
                    {formErrors.message && <div className="text-red-600 text-xs md:text-sm mt-1">{formErrors.message}</div>}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl font-semibold w-full sm:w-auto"
                    >
                      {submitted ? 'Sending...' : 'Send Message'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={`border-slate-300 text-slate-700 px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl w-full sm:w-auto ${colorClasses.border.gray400}`}
                      onClick={() => setFormData({ name: '', email: '', subject: '', message: '' })}
                    >
                      Clear Form
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </main>

        {/* Final CTA */}
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-amber-500 to-yellow-500">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 text-white">
              Join GetBananaLink Today
            </h2>
            <p className="text-base md:text-xl mb-6 md:mb-10 text-amber-100 max-w-2xl mx-auto">
              Create your profile. Share opportunities. Connect globally.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Link href="/register">
                <Button className="bg-white text-navy-900 hover:bg-slate-100 px-6 md:px-8 py-3 md:py-4 rounded-xl text-base md:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-6 md:px-8 py-3 md:py-4 rounded-xl text-base md:text-lg font-semibold w-full sm:w-auto">
                  Explore Platform
                </Button>
              </Link>
            </div>
            <p className="mt-6 md:mt-8 text-base md:text-lg font-medium text-white">
              GetBananaLink.com — Your gateway to global professional opportunities
            </p>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}