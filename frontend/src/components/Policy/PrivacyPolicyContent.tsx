import { Lock, Eye, Database, UserCheck, Mail } from 'lucide-react';

export default function PrivacyPolicyContent() {
  return (
    <div className="prose max-w-none">
      <p className="text-gray-700 mb-6">
        At TalentHub, we respect your privacy and are committed to protecting your personal data. 
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
          Email: <span className="text-blue-600">privacy@talenthub.com</span>
        </p>
        <p className="text-gray-700">
          Address: TalentHub Inc., 123 Tech Park Drive, San Francisco, CA 94107, USA
        </p>
      </div>
    </div>
  );
}