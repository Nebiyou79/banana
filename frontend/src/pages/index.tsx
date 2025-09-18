import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Briefcase, Users, Building, Award, Rocket, Target, Shield, Star, ArrowRight, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-24 bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Find Your Dream
              <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent"> Job</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Connect with top companies and talented professionals worldwide. 
              Whether you`re hiring or looking for work, we`ve got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/register?type=jobseeker" 
                className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Find Jobs
              </Link>
              <Link 
                href="/register?type=employer" 
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-orange-500 hover:text-orange-600 transition-all duration-300"
              >
                Hire Talent
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">100K+</div>
              <div className="text-gray-600">Active Professionals</div>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-yellow-600 mb-2">50K+</div>
              <div className="text-gray-600">Job Opportunities</div>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-amber-600" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-amber-600 mb-2">10K+</div>
              <div className="text-gray-600">Companies</div>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Banana Jobs?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Advanced features designed for professionals and businesses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6">
                <Rocket className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI-Powered Matching</h3>
              <p className="text-gray-600">
                Advanced algorithms connect you with perfect opportunities based on skills, experience, and culture fit.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Precision Targeting</h3>
              <p className="text-gray-600">
                Reach exactly the right candidates or opportunities with our sophisticated filtering and search capabilities.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Enterprise Security</h3>
              <p className="text-gray-600">
                Your data is protected with military-grade encryption and comprehensive privacy controls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Professionals
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what our community has to say
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 italic mb-6">
                `Banana Jobs helped me find my dream job in just two weeks. The platform is incredibly intuitive and the matches were perfect!``
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-semibold">
                  S
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">Sarah Johnson</p>
                  <p className="text-gray-500">Software Engineer</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 italic mb-6">
                `As a hiring manager, Banana Jobs has transformed our recruitment process. The quality of candidates is exceptional.``
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-semibold">
                  M
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">Michael Chen</p>
                  <p className="text-gray-500">HR Director</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 italic mb-6">
                `The freelance opportunities on Banana Jobs are top-notch. I`ve doubled my income since joining the platform.`
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-semibold">
                  E
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">Emily Rodriguez</p>
                  <p className="text-gray-500">Freelance Designer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-yellow-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-orange-100 mb-10">
            Join thousands of professionals who found their perfect match through Banana Jobs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="bg-white text-orange-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Get Started Free
            </Link>
            <Link 
              href="/contact" 
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-orange-600 transition-all duration-300"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}