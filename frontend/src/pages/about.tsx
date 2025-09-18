// pages/about.tsx  (or components/AboutUsPage.tsx)
import React, { JSX, useState } from 'react';
import {
  Building2, Users, Briefcase, Globe,
  Mail, Phone, MapPin, Facebook, Twitter, Linkedin,
  Instagram, ArrowRight, CheckCircle, Shield, Zap,
  Rocket, Star, Award,
  LinkedinIcon
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Button from '@/components/forms/Button';
import { Textarea } from '@/components/ui/textarea';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

/**
 * AboutUsPage
 *
 * Full About page for Banana Jobs including:
 * - Detailed company description
 * - Services breakdown for Candidates, Freelancers, Companies, Organizations (and Admin)
 * - Project Design & Specification Outline (roles, phases, data models)
 * - Contact section with social links and contact form
 *
 * Copy / paste into your codebase. Update imports as necessary.
 */
export default function AboutUsPage(): JSX.Element {
  // Contact form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);

  // Simple accordion state for spec sections
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
    // rudimentary email check
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = 'Enter a valid email';
    if (!formData.subject.trim()) errors.subject = 'Subject is required';
    if (!formData.message.trim()) errors.message = 'Message is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    // Replace with real submit logic (API call) as needed
    console.log('Contact submission:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitted(false);
    }, 1200);
  };

  return (
    <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
      {/* HERO */}
      <header className="relative py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-extrabold mb-4">Banana Jobs</h1>
            <p className="text-xl mb-8">
              Democratizing access to meaningful work — connecting candidates, freelancers, companies and organizations
              through intelligent matching, powerful tools, and exceptional service.
            </p>
            <div className="flex justify-center gap-4">
              <Button className="bg-white text-blue-600 hover:bg-white/90 px-5 py-3">
                Explore Services <ArrowRight className="inline-block ml-2 w-4 h-4" />
              </Button>
              <Button variant="outline" className="text-white border-white hover:bg-white/10 px-5 py-3">
                Contact Us
              </Button>
            </div>
            <div className="mt-8 flex justify-center gap-6 text-sm text-white/80">
              <div className="flex items-center gap-2"><Zap className="w-4 h-4" /> AI Matching</div>
              <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Secure</div>
              <div className="flex items-center gap-2"><Rocket className="w-4 h-4" /> Scalable</div>
            </div>
          </div>
        </div>
      </header>

      {/* 1. DETAILED DESCRIPTION */}
      <main className="container mx-auto px-6 py-16">
        <section className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8 mb-10">
          <div className="flex items-start gap-6">
            <div className="p-4 rounded-full bg-yellow-100">
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Who we are — Banana Jobs</h2>
              <p className="text-gray-700 mb-4">
                Banana Jobs is a talent technology platform founded to make hiring fairer, faster, and more transparent.
                We serve four primary user groups — Candidates, Freelancers, Companies, and Organizations — while the Admin
                role enables platform governance. Our platform pairs machine learning matching with human-centered UX and
                enterprise-grade controls to deliver measurable outcomes: faster hires, higher retention, and stronger
                candidate experiences.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">50K+</div>
                  <div className="text-sm text-gray-500">Active Users</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">10K+</div>
                  <div className="text-sm text-gray-500">Companies</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">75K+</div>
                  <div className="text-sm text-gray-500">Jobs Posted</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">95%</div>
                  <div className="text-sm text-gray-500">Success Rate</div>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-2">Mission & Vision</h3>
              <p className="text-gray-700 mb-2">
                <strong>Mission:</strong> Democratize employment by connecting talent and opportunity with fairness and speed.
              </p>
              <p className="text-gray-700">
                <strong>Vision:</strong> A world where everyone can access meaningful work and organizations can discover the best talent.
              </p>
            </div>
          </div>
        </section>

        {/* 2. SERVICES - Detailed for each role */}
        <section className="max-w-6xl mx-auto mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">Services — Detailed</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mt-2">
              Full-featured services tailored to each user role: Candidates, Freelancers, Companies, and Organizations.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Candidates */}
            <article className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-lg bg-blue-50"><Users className="w-6 h-6 text-blue-600" /></div>
                <h3 className="text-xl font-semibold">For Candidates</h3>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  <div>
                    <strong>Advanced Job Search & Filters:</strong> location, skills, salary, remote, contract type, company size.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  <div>
                    <strong>Resume Builder & Templates:</strong> guided CV sections, export to PDF, and versioned resumes for applications.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  <div>
                    <strong>Application Tracking:</strong> application history, status updates, interview invites and calendar sync.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  <div>
                    <strong>Personalized Recommendations:</strong> AI matching based on skills, experience, and culture fit.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  <div>
                    <strong>Career Resources:</strong> interview prep, salary guides, and upskilling suggestions.
                  </div>
                </li>
              </ul>
            </article>

            {/* Freelancers */}
            <article className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-lg bg-purple-50"><Briefcase className="w-6 h-6 text-purple-600" /></div>
                <h3 className="text-xl font-semibold">For Freelancers</h3>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  <div>
                    <strong>Project/Gig Listings:</strong> curated project feeds, bidding and proposal workflows.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  <div>
                    <strong>Portfolio & Case Studies:</strong> showcase work, attach files, link to external demos.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  <div>
                    <strong>Secure Payments:</strong> milestone payments, invoices, dispute resolution (Phase 2 enhancements possible).
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  <div>
                    <strong>Proposal Templates:</strong> editable proposals, saved templates and client review flows.
                  </div>
                </li>
              </ul>
            </article>

            {/* Companies */}
            <article className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-lg bg-green-50"><Building2 className="w-6 h-6 text-green-600" /></div>
                <h3 className="text-xl font-semibold">For Companies</h3>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  <div>
                    <strong>Job & Project Management:</strong> create, edit, and promote postings with analytics.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  <div>
                    <strong>Candidate Screening Tools:</strong> questions, skill filters, pre-screening assessments.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  <div>
                    <strong>Applicant Tracking:</strong> pipeline stages, notes, interview scheduling and bulk actions.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  <div>
                    <strong>Employer Branding:</strong> company pages, reviews, and featured employer packages.
                  </div>
                </li>
              </ul>
            </article>

            {/* Organizations */}
            <article className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-lg bg-orange-50"><Globe className="w-6 h-6 text-orange-600" /></div>
                <h3 className="text-xl font-semibold">For Organizations</h3>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  <div>
                    <strong>Bulk Hiring Solutions:</strong> campus drives, graduate hiring and volume recruitment workflows.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  <div>
                    <strong>Pipeline Development:</strong> talent pools, outreach, and nurture campaigns.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  <div>
                    <strong>Custom Workflows & Integrations:</strong> ATS integrations, SSO, and custom fields.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  <div>
                    <strong>Diversity & Inclusion Programs:</strong> anonymized screening, diversity reporting, bias controls.
                  </div>
                </li>
              </ul>
            </article>

            {/* Admin note */}
            <div className="lg:col-span-2 mt-4 p-6 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-3 mb-2"><Award className="w-5 h-5 text-yellow-600" /><h4 className="font-semibold">Admin & Platform Governance</h4></div>
              <p className="text-gray-700">
                Admins manage user roles, verification, categories, content moderation, and platform metrics.
                They control role-based permissions (who can post, who can message, who can approve), and oversee compliance and data integrity.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Project Design & Specification Outline (Roles, Phases, Data Models) */}
        <section className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow-sm mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Project Design & Specification Outline</h2>
            <div className="text-sm text-gray-500">High-level spec for devs & stakeholders</div>
          </div>

          {/* Roles & Responsibilities accordion */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('roles')}
              className="w-full text-left p-4 bg-slate-50 rounded-lg flex justify-between items-center"
            >
              <div>
                <div className="text-base font-semibold">User Roles & Responsibilities</div>
                <div className="text-sm text-gray-500">Candidate, Freelancer, Company, Organization, Admin</div>
              </div>
              <div className="text-gray-600">{openSections.roles ? '−' : '+'}</div>
            </button>

            {openSections.roles && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Roles (summary)</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li><strong>Candidate:</strong> search, apply, manage profile, receive messages.</li>
                  <li><strong>Freelancer:</strong> browse projects, submit proposals, manage portfolio.</li>
                  <li><strong>Company:</strong> post jobs, screen applicants, interview, hire.</li>
                  <li><strong>Organization:</strong> run bulk hiring, campus programs, build talent pipelines.</li>
                  <li><strong>Admin:</strong> user management, moderation, role configuration, metrics.</li>
                </ul>

                <div className="mt-3">
                  <h5 className="font-semibold">Feature-specific tasks</h5>
                  <p className="text-gray-700 text-sm">
                    Document who can post jobs, who can apply, messaging permissions (e.g. company ↔ candidate), and moderation flows.
                  </p>
                </div>
              </div>
            )}

            {/* Phase breakdown */}
            <button
              onClick={() => toggleSection('phases')}
              className="w-full text-left p-4 bg-slate-50 rounded-lg flex justify-between items-center"
            >
              <div>
                <div className="text-base font-semibold">Feature Breakdown by Phase</div>
                <div className="text-sm text-gray-500">Phase 1 (MVP web) & Phase 2 (Mobile & Monetization)</div>
              </div>
              <div className="text-gray-600">{openSections.phases ? '−' : '+'}</div>
            </button>

            {openSections.phases && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Phase 1 — Web Application (MVP)</h4>
                <ul className="list-disc list-inside text-gray-700">
                  <li>Jobs/Opportunities: create/edit/list, search with filters</li>
                  <li>Profiles & CVs: edit, upload resume, templates</li>
                  <li>Applications tracking: apply, status updates, history</li>
                  <li>Messaging & Notifications: in-app messages and email notifications</li>
                  <li>Admin Dashboard: user/role management and metrics</li>
                </ul>

                <h4 className="font-semibold mt-3 mb-1">Phase 2 — Mobile & Premium Features</h4>
                <ul className="list-disc list-inside text-gray-700">
                  <li>Mobile apps (iOS/Android) with push notifications</li>
                  <li>Payments & Subscriptions (Stripe/PayPal), featured postings</li>
                  <li>Third-party integrations (calendar, SSO, analytics)</li>
                </ul>
              </div>
            )}

            {/* Data models */}
            <button
              onClick={() => toggleSection('dataModels')}
              className="w-full text-left p-4 bg-slate-50 rounded-lg flex justify-between items-center"
            >
              <div>
                <div className="text-base font-semibold">Data Models & Backend Logic</div>
                <div className="text-sm text-gray-500">Schemas & relationships</div>
              </div>
              <div className="text-gray-600">{openSections.dataModels ? '−' : '+'}</div>
            </button>

            {openSections.dataModels && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Core Schemas (high level)</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li><strong>User/Profile:</strong> name, email, role, bio, skills, resume(s), privacy settings.</li>
                  <li><strong>Company/Organization:</strong> companyName, description, industry, location, verification.</li>
                  <li><strong>Job Posting:</strong> jobId, companyId, title, description, requirements, salary, location, status.</li>
                  <li><strong>Application:</strong> applicationId, jobId, applicantId, coverLetter, resumeSnapshot, status, timestamps.</li>
                  <li><strong>Messaging:</strong> messageId, threadId, senderId, receiverId, content, sentAt, readFlag.</li>
                  <li><strong>Notifications:</strong> notificationId, userId, type, relatedId, createdAt, seenFlag.</li>
                  <li><strong>Payments/Subscriptions (Phase 2):</strong> planId, userId, status, start/end dates, transactions.</li>
                </ul>

                <h5 className="font-semibold mt-3">Backend responsibilities</h5>
                <p className="text-gray-700 text-sm">
                  Build REST/GraphQL endpoints for CRUD operations, authorization with role-based access control,
                  background workers for notifications and billing webhooks, and secure storage for resume files.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: contact info */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-2xl font-bold mb-3">Contact Us</h3>
            <p className="text-gray-700 mb-4">
              Have questions, partnerships, or want to book a demo? Reach out — we respond to inquiries within 48 hours.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-blue-50"><Mail className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <div className="font-semibold">Email</div>
                  <div className="text-gray-600">info@bananajobs.com</div>
                  <div className="text-gray-600">support@bananajobs.com</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-blue-50"><Phone className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <div className="font-semibold">Phone</div>
                  <div className="text-gray-600">+1 (555) 123-4567</div>
                  <div className="text-gray-600">+1 (555) 987-6543 (support)</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-blue-50"><MapPin className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <div className="font-semibold">Address</div>
                  <div className="text-gray-600">123 Innovation Drive, Tech City, TC 12345</div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="font-semibold mb-2">Follow us</div>
              <div className="flex gap-3">
                <a aria-label="Facebook" href="#" className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Facebook className="w-4 h-4" />
                </a>
                <a aria-label="Twitter" href="#" className="w-10 h-10 rounded-full bg-blue-400 text-white flex items-center justify-center">
                  <Twitter className="w-4 h-4" />
                </a>
                <a aria-label="LinkedIn" href="#" className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center">
                  <LinkedinIcon className="w-4 h-4" />
                </a>
                <a aria-label="Instagram" href="#" className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center">
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <div className="font-semibold mb-1">Quick links</div>
              <div className="text-sm text-gray-600">Privacy Policy · Terms · Developer Docs · API</div>
            </div>
          </div>

          {/* Right: contact form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-2xl font-bold mb-3">Send us a message</h3>
            <p className="text-gray-600 mb-4">Fill the form and we`ll get back to you.</p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your name"
                />
                {formErrors.name && <div className="text-sm text-red-600 mt-1">{formErrors.name}</div>}
              </div>

              <div>
                <Input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Your email"
                />
                {formErrors.email && <div className="text-sm text-red-600 mt-1">{formErrors.email}</div>}
              </div>

              <div>
                <Input
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Subject"
                />
                {formErrors.subject && <div className="text-sm text-red-600 mt-1">{formErrors.subject}</div>}
              </div>

              <div>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Your message"
                  rows={5}
                />
                {formErrors.message && <div className="text-sm text-red-600 mt-1">{formErrors.message}</div>}
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" className="bg-blue-600 text-white px-5 py-2">
                  {submitted ? 'Sending...' : 'Send Message'}
                </Button>
                <Button type="button" variant="outline" className="px-4 py-2" onClick={() => setFormData({ name: '', email: '', subject: '', message: '' })}>
                  Reset
                </Button>
              </div>

              <div className="text-xs text-gray-500 pt-2">
                By submitting you agree to our Terms. We may reply by email.
              </div>
            </form>
          </div>
        </section>

        {/* Optional: Short spec download (text displayed; implement real file endpoint later) */}
        <section className="max-w-6xl mx-auto mb-16">
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h4 className="font-semibold mb-2">Specification Summary</h4>
            <p className="text-gray-700 mb-3">
              This page doubles as a readable spec. For developer handoff you can export this content as
              Markdown or PDF; add an endpoint (e.g. /spec/banana-jobs-spec.pdf) to serve the downloadable file.
            </p>
            <div className="flex gap-3">
              <Button className="bg-blue-600 text-white px-4 py-2">Request Full Spec (Email)</Button>
              <Button variant="outline" className="px-4 py-2">Export to PDF</Button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-200 py-6">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-xl font-bold">Banana Jobs</div>
            <div className="text-sm text-slate-400">© {new Date().getFullYear()}</div>
          </div>
          <div className="text-sm text-slate-400">
            Built with care • Privacy-first approach • Designed for scale
          </div>
          <div className="flex gap-2">
            <a href="#" className="text-slate-400 hover:text-white text-sm">Terms</a>
            <a href="#" className="text-slate-400 hover:text-white text-sm">Privacy</a>
            <a href="#" className="text-slate-400 hover:text-white text-sm">Contact</a>
          </div>
        </div>
      </footer>
    </div>
    </DashboardLayout>

  );
}
