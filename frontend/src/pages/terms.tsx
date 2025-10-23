import Head from 'next/head';
import Link from 'next/link';
import { FileText, Scale, Shield, Users, BookOpen, Mail, ArrowLeft } from 'lucide-react';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function TermsOfService() {
  useAuthRedirect();

  return (
    <>
      <Head>
        <title>Terms of Service | Banana</title>
        <meta name="description" content="Banana Terms of Service" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <header className="flex justify-between items-center py-6 mb-4">
            <Link href="/" className="flex items-center text-2xl font-bold text-blue-700">
              <FileText className="mr-2" /> Banana
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-gray-500 mb-8">Last Updated: January 15, 2024</p>

            <p className="text-gray-700 mb-6">
              Welcome to Banana! These Terms of Service govern your use of our platform and provide 
              information about the Banana service, outlined below. When you create a Banana account 
              or use Banana, you agree to these terms.
            </p>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Scale className="mr-2 text-blue-600" size={20} />
                1. The Banana Service
              </h2>
              <p className="text-gray-700">
                We agree to provide you with the Banana Service. The Service includes all of the 
                Banana products, features, applications, services, technologies, and software that 
                we provide to advance Banana`s mission: To connect professionals with opportunities 
                in a professional and secure environment.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="mr-2 text-blue-600" size={20} />
                2. Your Commitments
              </h2>
              <p className="text-gray-700 mb-4">
                In return for our commitment to provide the Service, we require you to make the below 
                commitments to us.
              </p>
              <p className="text-gray-700 mb-2 font-medium">Who Can Use Banana:</p>
              <p className="text-gray-700 mb-4">
                We want our Service to be as open and inclusive as possible, but we also want it to be 
                safe, secure, and in accordance with the law. So, we need you to commit to a few 
                restrictions in order to be part of the Banana community.
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>You must be at least 16 years old.</li>
                <li>You must not be prohibited from receiving any aspect of our Service under applicable laws.</li>
                <li>Your account must not have been previously disabled for violation of law or any of our policies.</li>
                <li>You must provide accurate and complete information when creating your account.</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="mr-2 text-blue-600" size={20} />
                3. Permissions You Give to Us
              </h2>
              <p className="text-gray-700 mb-4">
                As part of our agreement, you also give us permissions that we need to provide the Service.
              </p>
              <p className="text-gray-700 font-medium mb-2">
                We do not claim ownership of your content, but you grant us a license to use it.
              </p>
              <p className="text-gray-700">
                Specifically, when you share, post, or upload content that is covered by intellectual 
                property rights, you grant us a non-exclusive, royalty-free, transferable, sub-licensable, 
                worldwide license to host, use, distribute, modify, run, copy, publicly perform or display, 
                translate, and create derivative works of your content.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="mr-2 text-blue-600" size={20} />
                4. Account Security
              </h2>
              <p className="text-gray-700 mb-4">
                You are responsible for safeguarding the password that you use to access the Service and 
                for any activities or actions under your password. We encourage you to use `strong` passwords 
                (passwords that use a combination of upper and lower case letters, numbers and symbols) with 
                your account.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                5. Content Removal and Disabling or Terminating Your Account
              </h2>
              <p className="text-gray-700">
                We can remove any content or information you share on the Service if we believe that it 
                violates these Terms of Service. We can refuse to provide or stop providing all or part of 
                the Service to you immediately to protect our community or services, or if you create risk 
                or legal exposure for us, violate these Terms of Service.
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="mr-2 text-blue-600" size={20} />
                Contact Us
              </h2>
              <p className="text-gray-700 mb-2">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-gray-700">
                Email: <span className="text-blue-600">terms@Banana.com</span>
              </p>
              <p className="text-gray-700">
                Address: Banana Inc., 123 Tech Park Drive, San Francisco, CA 94107, USA
              </p>
            </div>
          </div>

          <footer className="text-center text-gray-500 text-sm">
            <p>© 2024 Banana. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </>
  );
}