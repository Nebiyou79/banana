// src/pages/index.tsx
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Briefcase, Users, Building, Award, Rocket, Target, Shield } from 'lucide-react';
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
              Link To Success. Unlock Opportunities
              <span style={{ color: colors.goldenMustard }}> Shape Your Future</span>
            </h1>
            <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto" style={{ color: colors.gray800 }}>
              Discover endless opportunities to grow — connect, collaborate, and thrive in your career, business, and personal brand.
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
              Why Choose Banana?
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
                Discover the right people and opportunities faster with powerful, intelligent search and filters.
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
                Discover the right people and opportunities.
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
      {/* CTA Section */}
      <section className="py-20" style={{ backgroundColor: colors.goldenMustard }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl mb-10" style={{ color: colors.darkNavy }}>
            Join thousands of professionals who found their perfect match through Banana
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="bg-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              style={{ color: colors.goldenMustard }}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}