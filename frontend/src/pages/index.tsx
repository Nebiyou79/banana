// src/pages/index.tsx
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Briefcase, Users, Building, Award, Rocket, Target, Shield, Star } from 'lucide-react';
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
              Find Your Dream
              <span style={{ color: colors.goldenMustard }}> Job</span>
            </h1>
            <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto" style={{ color: colors.gray800 }}>
              Connect with top companies and talented professionals worldwide. 
              Whether you`re hiring or looking for work, we`ve got you covered.
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
                Find Jobs
              </Link>
              <Link 
                href="/register?type=employer" 
                className="border-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
                style={{ 
                  borderColor: colors.gray400,
                  color: colors.darkNavy
                }}
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
              <div style={{ color: colors.gray800 }}>Job Opportunities</div>
            </div>
            <div className="p-6">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: colors.teal + '20' }}
              >
                <Building className="w-8 h-8" style={{ color: colors.teal }} />
              </div>
              <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: colors.teal }}>10K+</div>
              <div style={{ color: colors.gray800 }}>Companies</div>
            </div>
            <div className="p-6">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: colors.blue + '20' }}
              >
                <Award className="w-8 h-8" style={{ color: colors.blue }} />
              </div>
              <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: colors.blue }}>95%</div>
              <div style={{ color: colors.gray800 }}>Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20" style={{ backgroundColor: colors.gray100 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: colors.darkNavy }}>
              Why Choose Banana Jobs?
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: colors.gray800 }}>
              Advanced features designed for professionals and businesses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ backgroundColor: colors.gold + '20' }}
              >
                <Rocket className="w-8 h-8" style={{ color: colors.gold }} />
              </div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: colors.darkNavy }}>AI-Powered Matching</h3>
              <p style={{ color: colors.gray800 }}>
                Advanced algorithms connect you with perfect opportunities based on skills, experience, and culture fit.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ backgroundColor: colors.goldenMustard + '20' }}
              >
                <Target className="w-8 h-8" style={{ color: colors.goldenMustard }} />
              </div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: colors.darkNavy }}>Precision Targeting</h3>
              <p style={{ color: colors.gray800 }}>
                Reach exactly the right candidates or opportunities with our sophisticated filtering and search capabilities.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ backgroundColor: colors.teal + '20' }}
              >
                <Shield className="w-8 h-8" style={{ color: colors.teal }} />
              </div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: colors.darkNavy }}>Enterprise Security</h3>
              <p style={{ color: colors.gray800 }}>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: colors.darkNavy }}>
              Trusted by Professionals
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: colors.gray800 }}>
              See what our community has to say
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl" style={{ backgroundColor: colors.gray100 }}>
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="italic mb-6" style={{ color: colors.gray800 }}>
                `Banana Jobs helped me find my dream job in just two weeks. The platform is incredibly intuitive and the matches were perfect!`
              </p>
              <div className="flex items-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: colors.goldenMustard }}
                >
                  S
                </div>
                <div className="ml-4">
                  <p className="font-semibold" style={{ color: colors.darkNavy }}>Sarah Johnson</p>
                  <p style={{ color: colors.gray800 }}>Software Engineer</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl" style={{ backgroundColor: colors.gray100 }}>
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="italic mb-6" style={{ color: colors.gray800 }}>
                `As a hiring manager, Banana Jobs has transformed our recruitment process. The quality of candidates is exceptional.`
              </p>
              <div className="flex items-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: colors.goldenMustard }}
                >
                  M
                </div>
                <div className="ml-4">
                  <p className="font-semibold" style={{ color: colors.darkNavy }}>Michael Chen</p>
                  <p style={{ color: colors.gray800 }}>HR Director</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl" style={{ backgroundColor: colors.gray100 }}>
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="italic mb-6" style={{ color: colors.gray800 }}>
                `The freelance opportunities on Banana Jobs are top-notch. I`ve doubled my income since joining the platform.`
              </p>
              <div className="flex items-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: colors.goldenMustard }}
                >
                  E
                </div>
                <div className="ml-4">
                  <p className="font-semibold" style={{ color: colors.darkNavy }}>Emily Rodriguez</p>
                  <p style={{ color: colors.gray800 }}>Freelance Designer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20" style={{ backgroundColor: colors.goldenMustard }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl mb-10" style={{ color: colors.darkNavy }}>
            Join thousands of professionals who found their perfect match through Banana Jobs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="bg-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              style={{ color: colors.goldenMustard }}
            >
              Get Started Free
            </Link>
            <Link 
              href="/contact" 
              className="border-2 border-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
              style={{ color: colors.white }}
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