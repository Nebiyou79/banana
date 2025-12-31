// pages/tender/edit-coming-soon.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Calendar, 
  Clock, 
  FileText, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Shield, 
  Bell, 
  Mail, 
  Lock, 
  CheckCircle, 
  ArrowRight,
  Building2,
  Globe,
  Zap,
  Sparkles,
  ArrowLeft,
  Settings,
} from 'lucide-react';
import { Card } from '@/components/social/ui/Card';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/social/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Input } from '@/components/ui/Input';

const EditComingSoonPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [progress, setProgress] = useState(75);
  const [subscribers, setSubscribers] = useState(1287);

  useEffect(() => {
    // Simulate subscriber count animation
    const timer = setTimeout(() => {
      setSubscribers(prev => prev + Math.floor(Math.random() * 10));
    }, 5000);

    return () => clearTimeout(timer);
  }, [subscribers]);

  const handleNotifyMe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setIsSubmitted(true);
      // In a real app, you would send this to your backend
      console.log('Email submitted:', email);
      setEmail('');
      setTimeout(() => setIsSubmitted(false), 3000);
    }
  };

  const features = [
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Tender Creation',
      description: 'Create professional tender documents with templates',
      status: 'In Development',
      color: 'from-blue-500 to-cyan-500',
      eta: 'Q2 2024'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Bidder Management',
      description: 'Manage and communicate with multiple bidders',
      status: 'Planned',
      color: 'from-purple-500 to-pink-500',
      eta: 'Q3 2024'
    },
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: 'Budget Tracking',
      description: 'Track budgets and financial analytics',
      status: 'In Development',
      color: 'from-green-500 to-emerald-500',
      eta: 'Q2 2024'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Security & Compliance',
      description: 'Enterprise-grade security features',
      status: 'In Planning',
      color: 'from-amber-500 to-orange-500',
      eta: 'Q4 2024'
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: 'Real-time Notifications',
      description: 'Instant updates on tender activities',
      status: 'In Development',
      color: 'from-red-500 to-rose-500',
      eta: 'Q2 2024'
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Global Integration',
      description: 'Integrate with international tender systems',
      status: 'Planned',
      color: 'from-indigo-500 to-blue-500',
      eta: 'Q4 2024'
    },
  ];

  const milestones = [
    { date: 'Jan 2024', title: 'Research & Planning', status: 'completed' },
    { date: 'Mar 2024', title: 'UI/UX Design', status: 'completed' },
    { date: 'May 2024', title: 'Core Development', status: 'in-progress' },
    { date: 'Aug 2024', title: 'Beta Testing', status: 'upcoming' },
    { date: 'Oct 2024', title: 'Public Launch', status: 'upcoming' },
  ];

  return (
    <>
      <Head>
        <title>Tender Management Edit - Coming Soon | Banana Social</title>
        <meta name="description" content="We're building powerful tender management tools to help you create, manage, and track tenders efficiently." />
        <meta property="og:image" content="/api/og/tender-edit" />
      </Head>

      {/* Hero Section */}
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">Tender Management</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  <Clock className="h-3 w-3 mr-1" />
                  Coming Soon
                </Badge>
                <Button
                  variant="outline"
                  onClick={() => router.push('/tender')}
                  size="sm"
                >
                  View Public Tenders
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Card */}
          <Card className="backdrop-blur-xl bg-gradient-to-br from-white via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 md:p-12 mb-12 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                    <Sparkles className="h-3 w-3 mr-2" />
                    Under Active Development
                  </Badge>
                  
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                    Powerful Tender Management
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                      Edit Tools Coming Soon
                    </span>
                  </h1>
                  
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl">
                    We`re building comprehensive tender management tools that will revolutionize how organizations 
                    create, manage, and track tenders. Get ready for enterprise-grade features designed for modern procurement.
                  </p>

                  {/* Progress Section */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Development Progress</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Estimated completion: <span className="font-semibold">August 2024</span>
                    </p>
                  </div>

                  {/* Email Notification Form */}
                  <div className="max-w-md">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Get Notified When We Launch
                    </h3>
                    <form onSubmit={handleNotifyMe} className="flex gap-3">
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1"
                        required
                      />
                      <Button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                        {isSubmitted ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Notified!
                          </>
                        ) : (
                          <>
                            Notify Me
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </form>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                      Join <span className="font-bold text-blue-600 dark:text-blue-400">{subscribers.toLocaleString()}</span> others waiting for launch
                    </p>
                  </div>
                </div>

                {/* Feature Preview */}
                <div className="lg:w-2/5">
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                        <Settings className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Tender Editor Preview</h3>
                        <p className="text-gray-400 text-sm">Experience the future of tender management</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {[
                        'Create & Edit Tenders',
                        'Manage Multiple Versions',
                        'Collaborate with Team',
                        'Track Changes & History',
                        'Export Professional PDFs',
                        'Automated Compliance Checks'
                      ].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                        disabled
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Coming Soon - Join Waitlist
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Features Grid */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Powerful Features
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  Designed for Modern Procurement
                </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Our tender management system will include everything you need to streamline your procurement process
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card 
                  key={index}
                  className="backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {feature.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge 
                      className={`${
                        feature.status === 'In Development' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        feature.status === 'Planned' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                      }`}
                    >
                      {feature.status}
                    </Badge>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {feature.eta}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Development Timeline */}
          <Card className="backdrop-blur-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Development Timeline</h2>
                <p className="text-gray-600 dark:text-gray-400">Track our progress towards launch</p>
              </div>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-0 md:left-1/2 h-full w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 transform -translate-x-1/2" />
              
              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-4 ${
                      index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right md:pr-8' : 'md:pl-8'}`}>
                      <div className="mb-2">
                        <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white mb-2">
                          {milestone.date}
                        </Badge>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {milestone.title}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Timeline node */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full border-4 ${
                        milestone.status === 'completed' 
                          ? 'bg-green-500 border-green-500' 
                          : milestone.status === 'in-progress'
                          ? 'bg-blue-500 border-blue-500 animate-pulse'
                          : 'bg-gray-300 dark:bg-gray-700 border-gray-400 dark:border-gray-600'
                      }`} />
                    </div>
                    
                    <div className={`flex-1 ${index % 2 === 0 ? 'md:pl-8' : 'md:text-right md:pr-8'}`}>
                      <Badge 
                        className={`${
                          milestone.status === 'completed' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                            : milestone.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                        }`}
                      >
                        {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* CTA Section */}
          <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex p-4 rounded-2xl bg-white/20 backdrop-blur-sm mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Tender Management?
              </h2>
              
              <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                Join our exclusive waitlist to be among the first to access our powerful tender management tools
                and receive special early-bird benefits.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50"
                  onClick={() => router.push('/waitlist/tender')}
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Join Waitlist
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  onClick={() => router.push('/contact')}
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Request Demo
                </Button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6 text-blue-100">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span className="font-semibold">1,287+ Waiting</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <span className="font-semibold">89 Enterprise Requests</span>
                </div>
              </div>
            </div>
          </Card>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">Tender Management</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Part of Banana Social Enterprise Suite
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/blog/tender-updates')}
                  className="text-gray-600 dark:text-gray-400"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Updates
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/support')}
                  className="text-gray-600 dark:text-gray-400"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Support
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/contact')}
                  className="text-gray-600 dark:text-gray-400"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact
                </Button>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>© {new Date().getFullYear()} Banana Social. All rights reserved.</p>
              <p className="mt-2">Tender Management tools are currently in development. Launch expected Q4 2024.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default EditComingSoonPage;