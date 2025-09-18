import Head from 'next/head';
import Link from 'next/link';
import { Shield, Lock, Eye, Database, UserCheck, Mail, ArrowLeft } from 'lucide-react';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function PrivacyPolicy() {
  useAuthRedirect();

  return (
    <>
      <Head>
        <title>Privacy Policy | Banana Jobs</title>
        <meta name="description" content="Banana Jobs Privacy Policy" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <header className="flex justify-between items-center py-6 mb-4">
            <Link href="/" className="flex items-center text-2xl font-bold text-blue-700">
              <Shield className="mr-2" /> Banana Jobs
            </Link>
            <div className="flex space-x-4">
              <Link href="/login" className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium">
                Log In
              </Link>
              <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Sign Up
              </Link>
            </div>
          </header>

          {/* Back button */}
          <div className="mb-6">
            <Link href="/register" className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="mr-2" size={16} />
              Back to Registration
            </Link>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-500 mb-8">Last Updated: January 15, 2024</p>

            <p className="text-gray-700 mb-6">
              At Banana Jobs, we respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we look after your personal data when you 
              visit our platform and tell you about your privacy rights and how the law protects you.
            </p>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="mr-2 text-blue-600" size={20} />
                1. Information We Collect
              </h2>
              <p className="text-gray-700 mb-4">
                We may collect, use, store, and transfer different kinds of personal data about you which 
                we have grouped together as follows:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
                <li><strong>Technical Data</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location, and other technology on the devices you use.</li>
                <li><strong>Profile Data</strong> includes your username and password, purchases or orders made by you, your interests, preferences, feedback and survey responses.</li>
                <li><strong>Usage Data</strong> includes information about how you use our platform, products and services.</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="mr-2 text-blue-600" size={20} />
                2. How We Use Your Information
              </h2>
              <p className="text-gray-700 mb-4">
                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>To register you as a new customer</li>
                <li>To process and deliver your requests</li>
                <li>To manage our relationship with you</li>
                <li>To enable you to participate in surveys</li>
                <li>To administer and protect our business and this platform</li>
                <li>To deliver relevant platform content and advertisements to you</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Database className="mr-2 text-blue-600" size={20} />
                3. Data Security
              </h2>
              <p className="text-gray-700 mb-4">
                We have put in place appropriate security measures to prevent your personal data from being 
                accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, 
                we limit access to your personal data to those employees, agents, contractors and other third 
                parties who have a business need to know.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <UserCheck className="mr-2 text-blue-600" size={20} />
                4. Your Legal Rights
              </h2>
              <p className="text-gray-700 mb-4">
                Under certain circumstances, you have rights under data protection laws in relation to your 
                personal data including the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Request access to your personal data</li>
                <li>Request correction of your personal data</li>
                <li>Request erasure of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request restriction of processing your personal data</li>
                <li>Request transfer of your personal data</li>
                <li>Right to withdraw consent</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="mr-2 text-blue-600" size={20} />
                Contact Us
              </h2>
              <p className="text-gray-700 mb-2">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-gray-700">
                Email: <span className="text-blue-600">privacy@Banana Jobs.com</span>
              </p>
              <p className="text-gray-700">
                Address: Banana Jobs Inc., 123 Tech Park Drive, San Francisco, CA 94107, USA
              </p>
            </div>
          </div>

          <footer className="text-center text-gray-500 text-sm">
            <p>© 2024 Banana Jobs. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </>
  );
}