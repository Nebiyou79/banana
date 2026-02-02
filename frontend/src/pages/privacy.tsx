import Head from 'next/head';
import Link from 'next/link';
import { Shield, Lock, Eye, Database, UserCheck, Mail, ArrowLeft } from 'lucide-react';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { colorClasses } from '@/utils/color';

export default function PrivacyPolicy() {
  useAuthRedirect();

  return (
    <>
      <Head>
        <title>Privacy Policy | GetBananaLink</title>
        <meta name="description" content="GetBananaLink Privacy Policy - Protecting your personal data" />
      </Head>

      <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 sm:py-6 md:py-8 ${colorClasses.text.darkNavy}`}>
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-center py-4 sm:py-6 mb-3 sm:mb-4">
            <Link href="/" className="flex items-center text-xl sm:text-2xl font-bold mb-3 sm:mb-0">
              <Shield className="mr-2" /> GetBananaLink
            </Link>
            <div className="flex space-x-3 sm:space-x-4">
              <Link href="/login" className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base font-medium ${colorClasses.text.blue} hover:${colorClasses.text.blue} hover:opacity-80`}>
                Log In
              </Link>
              <Link href="/register" className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium ${colorClasses.bg.blue} ${colorClasses.text.white} hover:opacity-90`}>
                Sign Up
              </Link>
            </div>
          </header>

          {/* Back button */}
          <div className="mb-4 sm:mb-6">
            <Link href="/register" className="inline-flex items-center text-sm sm:text-base hover:opacity-80">
              <ArrowLeft className="mr-2" size={14} />
              Back to Registration
            </Link>
          </div>

          {/* Content */}
          <div className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 ${colorClasses.bg.white}`}>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">Last Updated: January 15, 2024</p>

            <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">
              At GetBananaLink, we respect your privacy and are committed to protecting your personal data.
              This privacy policy will inform you about how we look after your personal data when you
              visit our platform and tell you about your privacy rights and how the law protects you.
            </p>

            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
                <Lock className="mr-2" size={18} />
                1. Information We Collect
              </h2>
              <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">
                We may collect, use, store, and transfer different kinds of personal data about you which
                we have grouped together as follows:
              </p>
              <ul className="list-disc pl-5 sm:pl-6 text-gray-700 space-y-2 text-sm sm:text-base">
                <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
                <li><strong>Technical Data</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location, and other technology on the devices you use.</li>
                <li><strong>Profile Data</strong> includes your username and password, purchases or orders made by you, your interests, preferences, feedback and survey responses.</li>
                <li><strong>Usage Data</strong> includes information about how you use our platform, products and services.</li>
              </ul>
            </div>

            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
                <Eye className="mr-2" size={18} />
                2. How We Use Your Information
              </h2>
              <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">
                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
              </p>
              <ul className="list-disc pl-5 sm:pl-6 text-gray-700 space-y-2 text-sm sm:text-base">
                <li>To register you as a new customer</li>
                <li>To process and deliver your requests</li>
                <li>To manage our relationship with you</li>
                <li>To enable you to participate in surveys</li>
                <li>To administer and protect our business and this platform</li>
                <li>To deliver relevant platform content and advertisements to you</li>
              </ul>
            </div>

            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
                <Database className="mr-2" size={18} />
                3. Data Security
              </h2>
              <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">
                We have put in place appropriate security measures to prevent your personal data from being
                accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition,
                we limit access to your personal data to those employees, agents, contractors and other third
                parties who have a business need to know.
              </p>
            </div>

            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
                <UserCheck className="mr-2" size={18} />
                4. Your Legal Rights
              </h2>
              <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">
                Under certain circumstances, you have rights under data protection laws in relation to your
                personal data including the right to:
              </p>
              <ul className="list-disc pl-5 sm:pl-6 text-gray-700 space-y-2 text-sm sm:text-base">
                <li>Request access to your personal data</li>
                <li>Request correction of your personal data</li>
                <li>Request erasure of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request restriction of processing your personal data</li>
                <li>Request transfer of your personal data</li>
                <li>Right to withdraw consent</li>
              </ul>
            </div>

            <div className={`bg-blue-50 p-4 sm:p-6 rounded-lg ${colorClasses.bg.blue} ${colorClasses.text.darkNavy}`}>
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
                <Mail className="mr-2" size={18} />
                Contact Us
              </h2>
              <p className="text-gray-700 mb-2 text-sm sm:text-base">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-gray-700 text-sm sm:text-base">
                Email: <span className="text-blue-600">getbananalink@gmail.com</span>
              </p>
              <p className="text-gray-700 text-sm sm:text-base">
                Address: 22 Meklit Bulding 1st Floor, AddisAbeba, Ethiopia
              </p>
            </div>
          </div>

          <footer className="text-center text-gray-500 text-xs sm:text-sm">
            <p>© 2024 GetBananaLink. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </>
  );
}