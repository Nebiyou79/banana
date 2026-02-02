import Head from 'next/head';
import Link from 'next/link';
import { FileText, Scale, Shield, Users, BookOpen, Mail, ArrowLeft } from 'lucide-react';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { colorClasses } from '@/utils/color';

export default function TermsOfService() {
  useAuthRedirect();

  return (
    <>
      <Head>
        <title>Terms of Service | GetBananaLink</title>
        <meta name="description" content="GetBananaLink Terms of Service - Platform usage agreement" />
      </Head>

      <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 sm:py-6 md:py-8 ${colorClasses.text.darkNavy}`}>
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-center py-4 sm:py-6 mb-3 sm:mb-4">
            <Link href="/" className="flex items-center text-xl sm:text-2xl font-bold mb-3 sm:mb-0">
              <FileText className="mr-2" /> GetBananaLink
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
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Terms of Service</h1>
            <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">Last Updated: January 15, 2024</p>

            <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">
              Welcome to GetBananaLink! These Terms of Service govern your use of our platform and provide
              information about the GetBananaLink service, outlined below. When you create a GetBananaLink account
              or use GetBananaLink, you agree to these terms.
            </p>

            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
                <Scale className="mr-2" size={18} />
                1. The GetBananaLink Service
              </h2>
              <p className="text-gray-700 text-sm sm:text-base">
                We agree to provide you with the GetBananaLink Service. The Service includes all of the
                GetBananaLink products, features, applications, services, technologies, and software that
                we provide to advance GetBananaLink's mission: To connect professionals with opportunities
                in a professional and secure environment.
              </p>
            </div>

            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
                <Users className="mr-2" size={18} />
                2. Your Commitments
              </h2>
              <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">
                In return for our commitment to provide the Service, we require you to make the below
                commitments to us.
              </p>
              <p className="text-gray-700 mb-2 font-medium text-sm sm:text-base">Who Can Use GetBananaLink:</p>
              <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">
                We want our Service to be as open and inclusive as possible, but we also want it to be
                safe, secure, and in accordance with the law. So, we need you to commit to a few
                restrictions in order to be part of the GetBananaLink community.
              </p>
              <ul className="list-disc pl-5 sm:pl-6 text-gray-700 space-y-2 text-sm sm:text-base">
                <li>You must be at least 16 years old.</li>
                <li>You must not be prohibited from receiving any aspect of our Service under applicable laws.</li>
                <li>Your account must not have been previously disabled for violation of law or any of our policies.</li>
                <li>You must provide accurate and complete information when creating your account.</li>
              </ul>
            </div>

            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
                <Shield className="mr-2" size={18} />
                3. Permissions You Give to Us
              </h2>
              <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">
                As part of our agreement, you also give us permissions that we need to provide the Service.
              </p>
              <p className="text-gray-700 font-medium mb-2 text-sm sm:text-base">
                We do not claim ownership of your content, but you grant us a license to use it.
              </p>
              <p className="text-gray-700 text-sm sm:text-base">
                Specifically, when you share, post, or upload content that is covered by intellectual
                property rights, you grant us a non-exclusive, royalty-free, transferable, sub-licensable,
                worldwide license to host, use, distribute, modify, run, copy, publicly perform or display,
                translate, and create derivative works of your content.
              </p>
            </div>

            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
                <BookOpen className="mr-2" size={18} />
                4. Account Security
              </h2>
              <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">
                You are responsible for safeguarding the password that you use to access the Service and
                for any activities or actions under your password. We encourage you to use `strong` passwords
                (passwords that use a combination of upper and lower case letters, numbers and symbols) with
                your account.
              </p>
            </div>

            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
                5. Content Removal and Disabling or Terminating Your Account
              </h2>
              <p className="text-gray-700 text-sm sm:text-base">
                We can remove any content or information you share on the Service if we believe that it
                violates these Terms of Service. We can refuse to provide or stop providing all or part of
                the Service to you immediately to protect our community or services, or if you create risk
                or legal exposure for us, violate these Terms of Service.
              </p>
            </div>

            <div className={`bg-blue-50 p-4 sm:p-6 rounded-lg ${colorClasses.bg.blue} ${colorClasses.text.darkNavy}`}>
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
                <Mail className="mr-2" size={18} />
                Contact Us
              </h2>
              <p className="text-gray-700 mb-2 text-sm sm:text-base">
                If you have any questions about these Terms of Service, please contact us at:
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